# QuIDE — IBM Quantum Platform API Proxy
# python/services/ibm_proxy.py

from typing import List, Optional, Dict, Any
import httpx
from pydantic import BaseModel
from services.ibm_auth import ibm_auth

class IBMBackendInfo(BaseModel):
    """IBM Quantum Backend Information"""
    name: str
    num_qubits: int
    status: str  # "online", "offline", "maintenance"
    is_free_tier: bool
    coupling_map: Optional[List[List[int]]] = None
    basis_gates: Optional[List[str]] = None
    t1: Optional[float] = None  # T1 decoherence time (microseconds)
    t2: Optional[float] = None  # T2 decoherence time (microseconds)
    queue_length: Optional[int] = None

class IBMProxyService:
    """
    Proxy for IBM Quantum Platform API.

    Handles:
    - CORS (proxies requests from frontend)
    - Authentication (bearer token + Instance CRN)
    - Backend listing
    - Connection validation

    Base URL: https://quantum.cloud.ibm.com/api/v1/
    """

    IBM_API_BASE_URL = "https://quantum.cloud.ibm.com/api/v1"

    async def list_backends(
        self,
        api_key: str,
        region: str = "us-east",
        instance_crn: Optional[str] = None,
    ) -> List[IBMBackendInfo]:
        """
        List available IBM Quantum backends for user's account.

        Args:
            api_key: IBM API key
            region: IBM region ("us-east" or "eu-de")
            instance_crn: IBM Cloud Instance CRN (optional, auto-detected if not provided)

        Returns:
            List of available backends with metadata

        Raises:
            ValueError: If API call fails
        """
        # Get IAM token
        token = await ibm_auth.get_token(api_key)

        # Build headers
        headers = {
            "Authorization": f"Bearer {token.access_token}",
            "Content-Type": "application/json",
        }

        if instance_crn:
            headers["IBM-Cloud-CRN"] = instance_crn

        # Call IBM API
        url = f"{self.IBM_API_BASE_URL}/backends"

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(url, headers=headers)

                if response.status_code != 200:
                    error_text = response.text
                    raise ValueError(f"IBM API error (status {response.status_code}): {error_text}")

                data = response.json()

                # Parse backends
                backends = []
                backends_list = data.get("backends", [])

                # Free tier backends (as of 2026)
                FREE_TIER_BACKENDS = {"ibm_kingston"}

                for backend_data in backends_list:
                    backend_name = backend_data.get("name", backend_data.get("backend_name", ""))
                    if not backend_name:
                        continue

                    # Extract backend info
                    config = backend_data.get("configuration", {})
                    props = backend_data.get("properties", {})

                    backends.append(IBMBackendInfo(
                        name=backend_name,
                        num_qubits=config.get("n_qubits", 0),
                        status=backend_data.get("status", "unknown"),
                        is_free_tier=backend_name in FREE_TIER_BACKENDS,
                        coupling_map=config.get("coupling_map"),
                        basis_gates=config.get("basis_gates"),
                        t1=props.get("t1"),
                        t2=props.get("t2"),
                        queue_length=backend_data.get("pending_jobs", 0),
                    ))

                return backends

        except httpx.RequestError as e:
            raise ValueError(f"Failed to connect to IBM Quantum API: {str(e)}")

    async def validate_connection(
        self,
        api_key: str,
        region: str = "us-east",
    ) -> Dict[str, Any]:
        """
        Validate IBM API key and connection.

        Args:
            api_key: IBM API key
            region: IBM region

        Returns:
            Dict with validation result:
            - valid: bool
            - backend_count: int (if valid)
            - error: str (if invalid)
        """
        try:
            backends = await self.list_backends(api_key, region)
            return {
                "valid": True,
                "backend_count": len(backends),
                "region": region,
            }
        except Exception as e:
            return {
                "valid": False,
                "error": str(e),
            }


# Global singleton instance
ibm_proxy = IBMProxyService()

# QuIDE — IBM Quantum Platform API Proxy
# python/services/ibm_proxy.py

from typing import List, Optional, Dict, Any
from pydantic import BaseModel
from qiskit_ibm_runtime import QiskitRuntimeService

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
    - Authentication via QiskitRuntimeService
    - Backend listing
    - Connection validation

    Uses qiskit-ibm-runtime SDK for all IBM Quantum operations.
    """

    async def list_backends(
        self,
        api_key: str,
        region: str = "us-east",
        instance_crn: Optional[str] = None,
    ) -> List[IBMBackendInfo]:
        """
        List available IBM Quantum backends using QiskitRuntimeService.

        Args:
            api_key: IBM Cloud API key
            region: IBM region ("us-east" or "eu-de")
            instance_crn: IBM Cloud Instance CRN (optional)

        Returns:
            List of available backends with metadata

        Raises:
            ValueError: If API call fails
        """
        try:
            # Initialize QiskitRuntimeService with IBM Cloud credentials
            service = QiskitRuntimeService(
                channel="ibm_cloud",
                token=api_key,
                instance=instance_crn,
            )

            # Get all backends available to this user
            backends_list = service.backends()

            # Free tier backends (as of 2026 - check IBM Quantum Platform for latest)
            FREE_TIER_BACKENDS = {"ibm_kyiv", "ibm_sherbrooke"}

            backends = []
            for backend in backends_list:
                try:
                    # Get backend configuration
                    config = backend.configuration()

                    # Get status
                    status_obj = backend.status()

                    # Extract coupling map and basis gates
                    coupling_map = list(config.coupling_map) if hasattr(config, 'coupling_map') and config.coupling_map else None
                    basis_gates = list(config.basis_gates) if hasattr(config, 'basis_gates') else None

                    # Get qubit properties (T1/T2) - average across all qubits
                    avg_t1 = None
                    avg_t2 = None
                    try:
                        props = backend.properties()
                        if props:
                            t1_values = [props.t1(i) * 1e6 for i in range(config.n_qubits) if props.t1(i) is not None]  # Convert to microseconds
                            t2_values = [props.t2(i) * 1e6 for i in range(config.n_qubits) if props.t2(i) is not None]
                            avg_t1 = sum(t1_values) / len(t1_values) if t1_values else None
                            avg_t2 = sum(t2_values) / len(t2_values) if t2_values else None
                    except:
                        pass  # Properties not available for all backends

                    backends.append(IBMBackendInfo(
                        name=backend.name,
                        num_qubits=config.n_qubits,
                        status="online" if status_obj.operational else "offline",
                        is_free_tier=backend.name in FREE_TIER_BACKENDS,
                        coupling_map=coupling_map,
                        basis_gates=basis_gates,
                        t1=avg_t1,
                        t2=avg_t2,
                        queue_length=status_obj.pending_jobs,
                    ))
                except Exception as e:
                    # Skip backends that fail to load
                    print(f"Warning: Failed to load backend {backend.name}: {e}")
                    continue

            if not backends:
                raise ValueError(
                    "No IBM Quantum backends available. "
                    "Please verify:\n"
                    "1. You have an IBM Quantum account at quantum.cloud.ibm.com\n"
                    "2. You've joined the IBM Quantum Open Plan (free) or have a paid plan\n"
                    "3. Your IBM Cloud API key has access to IBM Quantum services"
                )

            return backends

        except ValueError:
            # Re-raise ValueError with helpful message
            raise
        except Exception as e:
            error_msg = str(e)

            # Provide helpful error messages for common issues
            if "No instances" in error_msg or "not authorized" in error_msg.lower():
                raise ValueError(
                    "IBM Quantum access denied. Please:\n"
                    "1. Visit quantum.cloud.ibm.com and create an account\n"
                    "2. Join the IBM Quantum Open Plan (free tier) or upgrade to a paid plan\n"
                    "3. Ensure your IBM Cloud API key has IBM Quantum permissions\n\n"
                    f"Original error: {error_msg}"
                )

            raise ValueError(f"Failed to list IBM backends: {error_msg}")

    async def validate_connection(
        self,
        api_key: str,
        region: str = "us-east",
    ) -> Dict[str, Any]:
        """
        Validate IBM API key and connection.

        Args:
            api_key: IBM Cloud API key
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

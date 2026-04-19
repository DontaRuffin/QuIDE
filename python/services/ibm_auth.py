# QuIDE — IBM Cloud IAM Authentication Service
# python/services/ibm_auth.py

from typing import Optional
from datetime import datetime, timedelta
import httpx
from cachetools import TTLCache
from pydantic import BaseModel
import hashlib
import time

class IAMToken(BaseModel):
    """IBM Cloud IAM Token"""
    access_token: str
    refresh_token: Optional[str] = None
    expires_at: float  # Unix timestamp
    token_type: str = "Bearer"

class IBMAuthService:
    """
    Handles IBM Cloud IAM token exchange and caching.

    Flow:
    1. User provides 44-character IBM API key
    2. Exchange with IBM IAM for short-lived bearer token (<1 hour)
    3. Cache token with 50-minute TTL (safe margin)
    4. Reuse cached token for subsequent requests

    IBM IAM Endpoint: https://iam.cloud.ibm.com/identity/token
    """

    IBM_IAM_URL = "https://iam.cloud.ibm.com/identity/token"

    def __init__(self):
        # Cache tokens by API key hash (maxsize=100, TTL=50 minutes)
        self.token_cache = TTLCache(maxsize=100, ttl=3000)  # 3000 seconds = 50 minutes

    def _hash_key(self, api_key: str) -> str:
        """Hash API key for secure cache key"""
        return hashlib.sha256(api_key.encode()).hexdigest()

    async def get_token(self, api_key: str) -> IAMToken:
        """
        Get IAM token for IBM API key.
        Returns cached token if valid, otherwise exchanges with IBM IAM.

        Args:
            api_key: IBM API key (44 characters, starts with 'apikey-')

        Returns:
            IAMToken with access_token and expiration

        Raises:
            ValueError: If authentication fails
        """
        # Check cache first
        cache_key = self._hash_key(api_key)
        if cache_key in self.token_cache:
            cached_token = self.token_cache[cache_key]
            # Verify token hasn't expired
            if cached_token.expires_at > time.time():
                return cached_token

        # Exchange API key for IAM token
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    self.IBM_IAM_URL,
                    headers={
                        "Content-Type": "application/x-www-form-urlencoded",
                        "Accept": "application/json",
                    },
                    data={
                        "grant_type": "urn:ibm:params:oauth:grant-type:apikey",
                        "apikey": api_key,
                    },
                )

                if response.status_code != 200:
                    error_detail = response.text

                    # Provide helpful error messages
                    if response.status_code == 400:
                        if "could not be found" in error_detail.lower():
                            raise ValueError(
                                "Invalid IBM API key. Please verify:\n"
                                "1. Your API key is from quantum.cloud.ibm.com (not the old platform)\n"
                                "2. The key is 44 characters long\n"
                                "3. No extra spaces when copying"
                            )

                    raise ValueError(f"IBM IAM authentication failed (status {response.status_code}): {error_detail}")

                data = response.json()

                # Parse response
                access_token = data.get("access_token")
                refresh_token = data.get("refresh_token")
                expires_in = data.get("expires_in", 3600)  # Default 1 hour
                expiration = data.get("expiration")  # Unix timestamp

                if not access_token:
                    raise ValueError("IBM IAM response missing access_token")

                # Calculate expiration time
                if expiration:
                    expires_at = float(expiration)
                else:
                    expires_at = time.time() + float(expires_in)

                token = IAMToken(
                    access_token=access_token,
                    refresh_token=refresh_token,
                    expires_at=expires_at,
                )

                # Cache token
                self.token_cache[cache_key] = token

                return token

        except httpx.RequestError as e:
            raise ValueError(f"Failed to connect to IBM IAM: {str(e)}")
        except Exception as e:
            if isinstance(e, ValueError):
                raise
            raise ValueError(f"IBM IAM authentication error: {str(e)}")

    def clear_cache(self, api_key: Optional[str] = None):
        """Clear token cache (optionally for specific API key)"""
        if api_key:
            cache_key = self._hash_key(api_key)
            self.token_cache.pop(cache_key, None)
        else:
            self.token_cache.clear()


# Global singleton instance
ibm_auth = IBMAuthService()

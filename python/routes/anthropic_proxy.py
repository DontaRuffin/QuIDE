# QuIDE — Anthropic API Proxy
# python/routes/anthropic_proxy.py

from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
from typing import Optional, AsyncIterator
import httpx
from fastapi.responses import StreamingResponse
import json

router = APIRouter()

ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages"

class AnthropicRequest(BaseModel):
    """Request to proxy to Anthropic API"""
    model: str
    max_tokens: int
    messages: list
    system: Optional[str] = None
    stream: Optional[bool] = False


@router.post("/chat")
async def proxy_anthropic_chat(
    req: AnthropicRequest,
    x_api_key: str = Header(..., alias="x-api-key")
):
    """
    Proxy requests to Anthropic API to avoid CORS issues.
    User's API key is passed in header and forwarded to Anthropic.
    """

    if not x_api_key or not x_api_key.startswith("sk-ant-"):
        raise HTTPException(status_code=400, detail="Invalid Anthropic API key format")

    headers = {
        "Content-Type": "application/json",
        "x-api-key": x_api_key,
        "anthropic-version": "2023-06-01",
    }

    body = {
        "model": req.model,
        "max_tokens": req.max_tokens,
        "messages": req.messages,
    }

    if req.system:
        body["system"] = req.system

    if req.stream:
        body["stream"] = True

    try:
        if req.stream:
            # Streaming response
            async def stream_anthropic():
                async with httpx.AsyncClient(timeout=60.0) as client:
                    async with client.stream(
                        "POST",
                        ANTHROPIC_API_URL,
                        headers=headers,
                        json=body,
                    ) as response:
                        if response.status_code != 200:
                            error_text = await response.aread()
                            raise HTTPException(
                                status_code=response.status_code,
                                detail=f"Anthropic API error: {error_text.decode()}"
                            )

                        async for chunk in response.aiter_bytes():
                            yield chunk

            return StreamingResponse(
                stream_anthropic(),
                media_type="text/event-stream",
            )
        else:
            # Non-streaming response
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    ANTHROPIC_API_URL,
                    headers=headers,
                    json=body,
                )

                if response.status_code != 200:
                    raise HTTPException(
                        status_code=response.status_code,
                        detail=f"Anthropic API error: {response.text}"
                    )

                return response.json()

    except httpx.RequestError as e:
        raise HTTPException(
            status_code=503,
            detail=f"Failed to connect to Anthropic API: {str(e)}"
        )

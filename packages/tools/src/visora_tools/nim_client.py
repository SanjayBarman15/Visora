import os
import httpx
import logging

logger = logging.getLogger("uvicorn")

async def call_nim_model(
    model_name: str,
    messages: list,
    temperature: float = 0.7,
    max_tokens: int = 1024
) -> str:
    """
    Calls an NVIDIA NIM model using the OpenAI-compatible Chat Completions API.
    """
    api_key = os.getenv("NVIDIA_NIM_API_KEY")
    base_url = os.getenv("NVIDIA_NIM_BASE_URL", "https://integrate.api.nvidia.com/v1").rstrip("/")
    
    if not api_key:
        raise ValueError("NVIDIA_NIM_API_KEY environment variable is not set")
        
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "model": model_name,
        "messages": messages,
        "temperature": temperature,
        "max_tokens": max_tokens
    }
    
    url = f"{base_url}/chat/completions"
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            response = await client.post(url, headers=headers, json=payload)
            if response.status_code != 200:
                logger.error(f"NVIDIA NIM API error: Status {response.status_code}, Body: {response.text}")
                response.raise_for_status()
                
            res_data = response.json()
            return res_data["choices"][0]["message"]["content"]
            
        except httpx.HTTPStatusError as e:
            logger.error(f"HTTP Status Error calling NIM API: {str(e)}")
            raise
        except Exception as e:
            logger.error(f"Unexpected error calling NIM API: {str(e)}")
            raise

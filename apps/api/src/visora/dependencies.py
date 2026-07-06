import os
from fastapi import Request, HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from visora_db import get_supabase_client

security = HTTPBearer(auto_error=False)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Security(security)):
    # Local development fallback/mocking
    # If APP_ENV is development and a special header or mock user ID is provided, use that.
    # Otherwise, require a valid Supabase JWT.
    
    # 1. Check for authorization credentials
    if not credentials:
        # Check if we have a DEV_MOCK_USER_ID env variable or similar to use as fallback in dev
        dev_mock_id = os.getenv("DEV_MOCK_USER_ID")
        if os.getenv("APP_ENV", "development").lower() == "development" and dev_mock_id:
            return {"id": dev_mock_id, "email": "mock@visora.ai"}
        raise HTTPException(status_code=401, detail="Missing authorization credentials")
        
    token = credentials.credentials
    
    try:
        supabase = get_supabase_client()
        # Verify the user token against Supabase auth server
        user_response = supabase.auth.get_user(token)
        if not user_response or not user_response.user:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        user = user_response.user
        return {
            "id": user.id,
            "email": user.email,
            "user_metadata": user.user_metadata
        }
    except Exception as e:
        # Check dev fallback again if verification fails
        dev_mock_id = os.getenv("DEV_MOCK_USER_ID")
        if os.getenv("APP_ENV", "development").lower() == "development" and dev_mock_id:
            return {"id": dev_mock_id, "email": "mock@visora.ai"}
            
        raise HTTPException(status_code=401, detail=f"Authentication failed: {str(e)}")

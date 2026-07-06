from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime
from uuid import UUID

class MessageBase(BaseModel):
    raw_prompt: str

class MessageCreate(MessageBase):
    project_id: UUID
    session_id: Optional[str] = None

class MessageOut(BaseModel):
    id: UUID
    project_id: UUID
    user_id: UUID
    session_id: Optional[str] = None
    raw_prompt: str
    enriched_prompt: Optional[str] = None
    elicitation_turns: List[Dict[str, Any]] = []
    requirements: Optional[Dict[str, Any]] = None
    created_at: datetime

    class Config:
        from_attributes = True

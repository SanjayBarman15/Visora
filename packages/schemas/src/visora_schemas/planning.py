from pydantic import BaseModel, Field
from typing import List

class ScenePlan(BaseModel):
    """Orion's contract for a single scene plan."""
    title: str
    description: str
    duration_seconds: float = Field(gt=0, description="The target duration of the scene in seconds.")
    key_visuals: List[str] = Field(default_factory=list, description="A list of descriptions of key visual elements.")

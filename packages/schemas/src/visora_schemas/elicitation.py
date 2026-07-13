from pydantic import BaseModel, Field
from typing import Optional, List

class ElicitationRequirements(BaseModel):
    """The structured requirement fields that Scout collects from the user."""
    audience_level: Optional[str] = Field(
        None, 
        description="The educational level of the target audience (e.g., beginner, intermediate, advanced)."
    )
    duration_target: Optional[float] = Field(
        None, 
        description="The target duration of the animation in seconds."
    )
    style_preference: Optional[str] = Field(
        None, 
        description="Visual style preferences, color schemes, or themes."
    )
    math_inclusion_flag: Optional[bool] = Field(
        None, 
        description="Whether mathematical formulas/equations should be explicitly included in the animation."
    )
    required_concepts: List[str] = Field(
        default_factory=list, 
        description="Key concepts or topics that must be covered in the animation."
    )
    excluded_concepts: List[str] = Field(
        default_factory=list, 
        description="Topics or jargon that should be avoided."
    )
    voiceover_tone_preference: Optional[str] = Field(
        None, 
        description="The desired tone for the narrator (e.g., professional, enthusiastic, academic)."
    )
    is_complete: bool = Field(
        False, 
        description="True if all critical elicitation fields are filled and we have enough info to generate a plan."
    )

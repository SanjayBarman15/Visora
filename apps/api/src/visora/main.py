import os
from typing import List, Dict, Any
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

# Load env variables (like NIM API Keys)
load_dotenv()

from visora_schemas import ElicitationRequirements, ScenePlan
from visora_agents import run_scout_turn, run_orion_planner

app = FastAPI(title="Visora Backend API", version="0.1.0")

# Setup CORS middleware to allow communication from frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ElicitationRequest(BaseModel):
    messages: List[Dict[str, str]]
    requirements: ElicitationRequirements

class ElicitationResponse(BaseModel):
    response_text: str
    requirements: ElicitationRequirements

class PlanningRequest(BaseModel):
    messages: List[Dict[str, str]]

@app.get("/health")
def health_check():
    return {"status": "ok", "app": "Visora API"}

@app.post("/api/elicitation/turn", response_model=ElicitationResponse)
def elicitation_turn(payload: ElicitationRequest):
    try:
        response_text, updated_requirements = run_scout_turn(
            messages=payload.messages,
            current_requirements=payload.requirements
        )
        return ElicitationResponse(
            response_text=response_text,
            requirements=updated_requirements
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/planning/generate", response_model=ScenePlan)
def planning_generate(payload: PlanningRequest):
    try:
        scene_plan = run_orion_planner(messages=payload.messages)
        return scene_plan
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("visora.main:app", host="127.0.0.1", port=8000, reload=True)

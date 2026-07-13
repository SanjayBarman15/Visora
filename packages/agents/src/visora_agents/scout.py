import os
import json
from typing import List, Dict, Tuple
from openai import OpenAI
from visora_schemas import ElicitationRequirements

def get_scout_client() -> Tuple[OpenAI, str]:
    """Returns the OpenAI client pointing to NVIDIA NIM and the Scout model name."""
    base_url = os.environ.get("NVIDIA_NIM_BASE_URL", "https://integrate.api.nvidia.com/v1")
    api_key = os.environ.get("NVIDIA_NIM_SCOUT_API_KEY")
    model = os.environ.get("NVIDIA_MODEL_SCOUT", "meta/llama-3.1-8b-instruct")
    
    if not api_key:
        raise ValueError("Missing NVIDIA NIM API key in environment variables (NVIDIA_NIM_SCOUT_API_KEY or NVIDIA_NIM_COMMON_API_KEY)")
        
    client = OpenAI(base_url=base_url, api_key=api_key)
    return client, model

def run_scout_turn(
    messages: List[Dict[str, str]], 
    current_requirements: ElicitationRequirements
) -> Tuple[str, ElicitationRequirements]:
    """
    Runs a single conversational turn with Scout.
    
    Args:
        messages: A list of message dicts (e.g. [{"role": "user", "content": "..."}]) representing conversation history.
        current_requirements: The current requirements state.
        
    Returns:
        A tuple of (assistant_response, updated_requirements)
    """
    client, model = get_scout_client()
    
    # 1. Generate conversational response
    system_prompt = (
        "You are Scout, a chatbot that gathers requirements for an educational animation. "
        "Your goal is to conversationally collect the following parameters: "
        "1. Audience level (e.g., beginner, intermediate, advanced) "
        "2. Duration target (approximate length of the animation in seconds) "
        "3. Style preference (visual style, color themes) "
        "4. Math inclusion flag (whether to explicitly show math formulas/equations) "
        "5. Required concepts (topics that must be covered) "
        "6. Excluded concepts (topics to avoid) "
        "7. Voiceover tone preference (tone of narration)\n\n"
        "Ask short, clarifying questions. Keep your replies brief. Do not ask for multiple things at once. "
        "If you already have enough information for a field, do not ask about it again. "
        f"Current state of collected fields: {current_requirements.model_dump_json()}"
    )
    
    formatted_messages = [{"role": "system", "content": system_prompt}] + messages
    
    chat_completion = client.chat.completions.create(
        model=model,
        messages=formatted_messages,
        temperature=0.4,
        max_tokens=512
    )
    
    response_text = chat_completion.choices[0].message.content or ""
    
    # 2. Extract structured updates from the new conversation state
    extraction_prompt = (
        "Based on the conversation history below, extract and update the elicitation requirements. "
        "You must return a valid JSON object matching this schema:\n"
        "{\n"
        '  "audience_level": "beginner" | "intermediate" | "advanced" | null,\n'
        '  "duration_target": number | null,\n'
        '  "style_preference": string | null,\n'
        '  "math_inclusion_flag": boolean | null,\n'
        '  "required_concepts": [string],\n'
        '  "excluded_concepts": [string],\n'
        '  "voiceover_tone_preference": string | null,\n'
        '  "is_complete": boolean\n'
        "}\n\n"
        "Set 'is_complete' to true only if you have gathered at least: audience_level, duration_target, style_preference, math_inclusion_flag, required_concepts, and voiceover_tone_preference.\n"
        "Return ONLY the JSON object. Do not include any markdown code fences, comments, or extra text.\n\n"
        f"Previous requirements: {current_requirements.model_dump_json()}\n\n"
        "Conversation History:\n" + 
        "\n".join(f"{m['role']}: {m['content']}" for m in messages)
    )
    
    extract_completion = client.chat.completions.create(
        model=model,
        messages=[{"role": "user", "content": extraction_prompt}],
        temperature=0.1,
        max_tokens=512
    )
    
    raw_json = extract_completion.choices[0].message.content or "{}"
    
    # Clean output to ensure we parse JSON correctly (sometimes model wraps in ```json ... ```)
    raw_json = raw_json.strip()
    if raw_json.startswith("```"):
        # strip fences
        lines = raw_json.split("\n")
        if lines[0].startswith("```"):
            lines = lines[1:]
        if lines[-1].startswith("```"):
            lines = lines[:-1]
        raw_json = "\n".join(lines).strip()
        
    try:
        updated_data = json.loads(raw_json)
        # Handle simple validation / coercion
        updated_requirements = ElicitationRequirements.model_validate(updated_data)
    except Exception as e:
        # Fallback: keep existing requirements if model output fails to parse
        updated_requirements = current_requirements
        
    return response_text, updated_requirements

"""
Shared output contracts + parsing for every Visora model role.

Design principle: every role declares WHAT SHAPE its output must be
(plain text / JSON schema / fenced code), and there is exactly ONE parser
per shape, used by every role that needs it. No per-role bespoke parsing
scattered across the codebase — that's what caused the original bugs.

Rule that must never be violated: `reasoning_content` and `content` are
NEVER merged. reasoning_content is for logs/debugging only. Every parser
in this file operates on `content` alone.
"""

from __future__ import annotations
import json
import re
from enum import Enum
from typing import Optional, Any
from pydantic import BaseModel, Field, ValidationError


# ---------------------------------------------------------------------------
# 1. Output shape declarations — one per role
# ---------------------------------------------------------------------------

class OutputShape(str, Enum):
    PLAIN_TEXT = "plain_text"   # Scout, Narrator (conversational/prose)
    JSON = "json"                # Orion, Guardian, Arbiter (structured decisions)
    CODE = "code"                 # Forge (fenced Manim/Python)


class ScenePlan(BaseModel):
    """Orion's contract for a single scene."""
    title: str
    description: str
    duration_seconds: float = Field(gt=0)
    key_visuals: list[str] = Field(default_factory=list)


class GuardianVerdict(BaseModel):
    """Guardian's contract for a safety check."""
    safe: bool
    categories: list[str] = Field(default_factory=list)
    reason: Optional[str] = None


class ForgeCode(BaseModel):
    """Forge's contract — validated python string, not just raw text."""
    code: str
    scene_class_name: str = "GeneratedScene"


# Central registry: role name -> (output shape, schema or None)
ROLE_CONTRACTS: dict[str, tuple[OutputShape, Optional[type[BaseModel]]]] = {
    "scout":    (OutputShape.PLAIN_TEXT, None),
    "orion":    (OutputShape.JSON, ScenePlan),
    "forge":    (OutputShape.CODE, ForgeCode),
    "narrator": (OutputShape.PLAIN_TEXT, None),
    "guardian": (OutputShape.JSON, GuardianVerdict),
    # reranker / lens_text / lens_code / arbiter: add here as you wire them,
    # same pattern — declare the shape once, get parsing for free.
}


# ---------------------------------------------------------------------------
# 2. Raw model response wrapper — what every NIM call returns
# ---------------------------------------------------------------------------

class RawModelResponse(BaseModel):
    """
    What the NIM client wrapper hands back from EVERY call, before any
    role-specific parsing happens. reasoning_content is kept for logging
    only and must never be fed into a parser.
    """
    content: str
    reasoning_content: Optional[str] = None
    finish_reason: str
    model: str


class ParseResult(BaseModel):
    """Result of running a role's parser against a RawModelResponse."""
    ok: bool
    data: Optional[Any] = None       # populated parsed object, or plain str for text roles
    error: Optional[str] = None
    truncated: bool = False


# ---------------------------------------------------------------------------
# 3. The three shape parsers — used by every role via ROLE_CONTRACTS
# ---------------------------------------------------------------------------

def _extract_json_block(text: str) -> Optional[dict]:
    """
    Try increasingly forgiving strategies to pull a JSON object out of text
    that may be clean JSON, fenced JSON, or JSON with stray prose around it.
    """
    text = text.strip()

    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    fence_match = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", text, re.DOTALL)
    if fence_match:
        try:
            return json.loads(fence_match.group(1))
        except json.JSONDecodeError:
            pass

    start, end = text.find("{"), text.rfind("}")
    if start != -1 and end != -1 and end > start:
        try:
            return json.loads(text[start:end + 1])
        except json.JSONDecodeError:
            pass

    return None


def _extract_code_block(text: str) -> Optional[str]:
    """Pull python code out of a fenced block; fall back to whole text."""
    fence_match = re.search(r"```python\s*(.*?)```", text, re.DOTALL)
    if fence_match:
        return fence_match.group(1).strip()

    fence_match = re.search(r"```\s*(.*?)```", text, re.DOTALL)
    if fence_match:
        return fence_match.group(1).strip()

    stripped = text.strip()
    return stripped if stripped else None


def parse_response(role: str, raw: RawModelResponse) -> ParseResult:
    """
    Single entry point every caller should use. Looks up the role's
    contract, applies the right shape parser, validates against the
    Pydantic schema if one exists, and returns a uniform ParseResult.
    """
    if role not in ROLE_CONTRACTS:
        return ParseResult(ok=False, error=f"Unknown role '{role}' — add it to ROLE_CONTRACTS.")

    shape, schema = ROLE_CONTRACTS[role]
    truncated = raw.finish_reason == "length"

    if shape == OutputShape.PLAIN_TEXT:
        text = raw.content.strip()
        if not text:
            return ParseResult(ok=False, error="Empty content field.", truncated=truncated)
        return ParseResult(ok=True, data=text, truncated=truncated)

    if shape == OutputShape.JSON:
        obj = _extract_json_block(raw.content)
        if obj is None:
            return ParseResult(ok=False, error="Could not extract JSON from content.", truncated=truncated)
        if schema is None:
            return ParseResult(ok=True, data=obj, truncated=truncated)
        try:
            validated = schema.model_validate(obj)
        except ValidationError as e:
            return ParseResult(ok=False, error=f"JSON extracted but failed schema validation: {e}",
                                truncated=truncated)
        return ParseResult(ok=True, data=validated, truncated=truncated)

    if shape == OutputShape.CODE:
        code = _extract_code_block(raw.content)
        if not code:
            return ParseResult(ok=False, error="Could not extract code from content.", truncated=truncated)
        if schema is ForgeCode:
            class_match = re.search(r"class\s+(\w+)\s*\(", code)
            class_name = class_match.group(1) if class_match else "GeneratedScene"
            return ParseResult(ok=True, data=ForgeCode(code=code, scene_class_name=class_name),
                                truncated=truncated)
        return ParseResult(ok=True, data=code, truncated=truncated)

    return ParseResult(ok=False, error=f"Unhandled output shape: {shape}")


# ---------------------------------------------------------------------------
# 4. Regression tests — built from the ACTUAL captured Orion/Forge output
#    from the real test run. If you ever change the parser, run this file
#    directly and these must still pass.
# ---------------------------------------------------------------------------

def _run_regression_tests():
    # Real Orion output captured from the working test run.
    orion_raw = RawModelResponse(
        finish_reason="stop",
        model="nvidia/nemotron-3-ultra-550b-a55b",
        reasoning_content="The user wants a scene plan JSON object based on the conversation...",
        content="""{
  "title": "Red Circle to Blue Square Transformation",
  "description": "A simple test animation showing a red circle morphing into a blue square over 5 seconds.",
  "duration_seconds": 5,
  "key_visuals": [
    "Red circle at center of frame",
    "Circle begins to morph, edges sharpening",
    "Intermediate shape blending circle and square characteristics",
    "Blue square fully formed at center"
  ]
}""",
    )
    result = parse_response("orion", orion_raw)
    assert result.ok, f"Orion regression failed: {result.error}"
    assert isinstance(result.data, ScenePlan)
    assert result.data.title == "Red Circle to Blue Square Transformation"
    assert result.data.duration_seconds == 5
    print("[PASS] Orion regression test")

    # Real Forge output captured from the working test run.
    forge_raw = RawModelResponse(
        finish_reason="stop",
        model="deepseek-ai/deepseek-v4-flash",
        reasoning_content="We need to write a Manim script for a scene that transforms...",
        content="""```python
from manim import *

class GeneratedScene(Scene):
    def construct(self):
        circle = Circle(color=RED, fill_opacity=1)
        square = Square(color=BLUE, fill_opacity=1)
        self.add(circle)
        self.play(Transform(circle, square), run_time=5)
        self.wait(1)
```""",
    )
    result = parse_response("forge", forge_raw)
    assert result.ok, f"Forge regression failed: {result.error}"
    assert isinstance(result.data, ForgeCode)
    assert result.data.scene_class_name == "GeneratedScene"
    assert "from manim import *" in result.data.code
    print("[PASS] Forge regression test")

    # Truncation detection test.
    truncated_raw = RawModelResponse(
        finish_reason="length",
        model="test",
        content='{"title": "cut off mid-strin',
    )
    result = parse_response("orion", truncated_raw)
    assert not result.ok
    assert result.truncated
    print("[PASS] Truncation detection test")

    # Plain-text role (Scout) test.
    scout_raw = RawModelResponse(
        finish_reason="stop",
        model="meta/llama-3.1-8b-instruct",
        content="Before we begin, can you tell me the main concept?",
    )
    result = parse_response("scout", scout_raw)
    assert result.ok
    assert result.data == "Before we begin, can you tell me the main concept?"
    print("[PASS] Scout plain-text test")

    print("\nAll regression tests passed.")


if __name__ == "__main__":
    _run_regression_tests()
import json
import uuid

import pytest
from pydantic import ValidationError

from app.schemas.ai import AICopilotRequest
from app.services.ai_service import normalize_tool_calls


def valid_request(**overrides):
    data = {
        "hackathon_id": uuid.uuid4(),
        "system": "You are a design assistant.",
        "messages": [{"role": "user", "content": "Add a hero section"}],
        "tools": [{
            "name": "createSection",
            "description": "Create a section",
            "parameters": {"type": "object", "properties": {}},
        }],
    }
    data.update(overrides)
    return AICopilotRequest(**data)


def test_ai_request_rejects_oversized_context():
    with pytest.raises(ValidationError):
        valid_request(messages=[{"role": "user", "content": "x" * 8_001}])


def test_ai_request_rejects_invalid_tool_name():
    with pytest.raises(ValidationError):
        valid_request(tools=[{
            "name": "../unsafe",
            "description": "Invalid",
            "parameters": {},
        }])


def test_ai_tool_calls_are_allowlisted_and_limited():
    calls = [
        {
            "id": str(index),
            "function": {
                "name": "createSection" if index < 9 else "unknownTool",
                "arguments": json.dumps({"type": "hero"}),
            },
        }
        for index in range(12)
    ]

    normalized = normalize_tool_calls(calls, {"createSection"})

    assert len(normalized) == 8
    assert all(call.name == "createSection" for call in normalized)


def test_upstream_error_blames_the_primary_provider_not_the_fallback():
    """Groq fails, Gemini's quota 429 follows -- the user must hear about Groq."""
    import httpx

    from app.services.ai_service import _upstream_error

    groq = httpx.Response(
        400,
        json={"error": {"message": "tool_use_failed", "type": "invalid_request_error"}},
        request=httpx.Request("POST", "https://api.groq.com/"),
    )
    gemini = httpx.Response(
        429,
        json={"error": {"message": "You exceeded your current quota"}},
        request=httpx.Request("POST", "https://generativelanguage.googleapis.com/"),
    )

    error = _upstream_error("groq", groq, attempts=[("groq", groq), ("gemini", gemini)])

    assert error.status_code == 502
    assert "groq" in error.detail
    assert "tool_use_failed" in error.detail
    assert "gemini 429" in error.detail  # the fallback is context, not the headline


def test_upstream_429_passes_retry_after_through():
    import httpx

    from app.services.ai_service import _upstream_error

    limited = httpx.Response(
        429,
        headers={"retry-after": "33"},
        json={"error": {"message": "Rate limit reached"}},
        request=httpx.Request("POST", "https://api.groq.com/"),
    )

    error = _upstream_error("groq", limited, attempts=[("groq", limited)])

    assert error.status_code == 429
    assert error.headers["Retry-After"] == "33"

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

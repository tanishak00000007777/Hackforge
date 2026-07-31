import asyncio
import json
import uuid
from types import SimpleNamespace

import pytest
from fastapi import HTTPException
from pydantic import ValidationError

from app.routers import ai as ai_router
from app.schemas.ai import AICopilotRequest, CanvasGenerateRequest
from app.services import ai_service
from app.services.ai_service import create_canvas_fallback, normalize_canvas_output, normalize_tool_calls


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


def test_canvas_request_and_output_are_strict():
    with pytest.raises(ValidationError):
        CanvasGenerateRequest(
            hackathon_id=uuid.uuid4(),
            prompt="   ",
            unexpected="secret",
        )

    with pytest.raises(ValidationError):
        normalize_canvas_output({
            "isFullWebsite": True,
            "components": [{
                "type": "script",
                "title": "Unsafe",
                "suggestedGrid": {"w": 99, "h": 1},
                "props": {},
            }],
        })

    with pytest.raises(ValidationError):
        normalize_canvas_output({
            "isFullWebsite": True,
            "components": [{
                "type": "navbar",
                "title": "Unsafe links",
                "suggestedGrid": {"w": 12, "h": 2},
                "props": {"links": [{"text": "Docs", "href": "/docs"}]},
            }],
        })


def test_canvas_fallback_matches_lovable_branches():
    portfolio = create_canvas_fallback("Build a developer portfolio")
    store = create_canvas_fallback("Create a product store")
    default = create_canvas_fallback("Build Nimbus")

    assert [component.type for component in portfolio.components] == [
        "navbar", "hero", "features", "stats", "testimonials", "contact",
    ]
    assert portfolio.components[0].props["brandName"] == "A Developer Portfolio Portfolio"
    assert [component.type for component in store.components] == [
        "navbar", "hero", "features", "testimonials", "faq",
    ]
    assert store.components[0].props["showSearch"] is True
    assert len(default.components) == 7
    assert default.components[1].props["title"] == "Empower Your Workflow with Nimbus"


def test_single_component_fallback_matches_requested_type():
    project = create_canvas_fallback(
        "Refine existing button component with a stronger label",
        is_full_website=False,
    )

    assert project.isFullWebsite is False
    assert len(project.components) == 1
    assert project.components[0].type == "button"


def test_single_component_ai_response_keeps_only_requested_type(monkeypatch):
    async def generated(_data):
        return SimpleNamespace(message=json.dumps({
            "isFullWebsite": True,
            "components": [
                {
                    "type": "navbar",
                    "title": "Navigation",
                    "suggestedGrid": {"w": 12, "h": 2},
                    "props": {"links": ["Docs"]},
                },
                {
                    "type": "hero",
                    "title": "Refined hero",
                    "suggestedGrid": {"w": 12, "h": 6},
                    "props": {"title": "Updated"},
                },
            ],
        }))

    monkeypatch.setattr(ai_service, "request_ai_completion", generated)
    request = CanvasGenerateRequest(
        hackathon_id=uuid.uuid4(),
        prompt="Refine existing hero component",
        isFullWebsite=False,
    )

    response = asyncio.run(ai_service.generate_canvas_layout(request))

    assert response.provider == "AI"
    assert response.data.isFullWebsite is False
    assert [component.type for component in response.data.components] == ["hero"]


def test_renderer_unsafe_ai_props_trigger_fallback(monkeypatch):
    async def generated(_data):
        return SimpleNamespace(message=json.dumps({
            "isFullWebsite": True,
            "components": [{
                "type": "navbar",
                "title": "Navigation",
                "suggestedGrid": {"w": 12, "h": 2},
                "props": {"links": [{"text": "Docs", "href": "/docs"}]},
            }],
        }))

    monkeypatch.setattr(ai_service, "request_ai_completion", generated)
    response = asyncio.run(ai_service.generate_canvas_layout(CanvasGenerateRequest(
        hackathon_id=uuid.uuid4(),
        prompt="Build Nimbus",
    )))

    assert response.provider == "Fallback Engine"
    assert all(
        isinstance(link, str)
        for link in response.data.components[0].props["links"]
    )


def test_canvas_generation_falls_back_when_ai_is_unavailable(monkeypatch):
    async def unavailable(_data):
        raise HTTPException(status_code=503, detail="not configured")

    monkeypatch.setattr(ai_service, "request_ai_completion", unavailable)
    request = CanvasGenerateRequest(
        hackathon_id=uuid.uuid4(),
        prompt="A portfolio for a designer",
    )

    response = asyncio.run(ai_service.generate_canvas_layout(request))

    assert response.provider == "Fallback Engine"
    assert response.data.components[1].title == "Portfolio Hero"


def test_canvas_generation_falls_back_on_malformed_provider_envelope(monkeypatch):
    settings = SimpleNamespace(
        ai_groq_api_key="test-key",
        ai_gemini_api_key="",
        ai_request_timeout_seconds=1,
    )

    class MalformedResponse:
        is_success = True
        status_code = 200

        @staticmethod
        def json():
            return {"choices": {"not": "a list"}}

    async def malformed_provider(*_args):
        return MalformedResponse()

    monkeypatch.setattr(ai_service, "get_settings", lambda: settings)
    monkeypatch.setattr(ai_service, "_request_groq", malformed_provider)

    response = asyncio.run(ai_service.generate_canvas_layout(CanvasGenerateRequest(
        hackathon_id=uuid.uuid4(),
        prompt="Build Nimbus",
    )))

    assert response.provider == "Fallback Engine"
    assert response.data.components


def test_canvas_route_checks_owner_then_rate_limit(monkeypatch):
    events = []

    async def owner_check(*_args):
        events.append("owner")

    async def rate_check(*_args):
        events.append("rate")

    async def generate(data):
        events.append("generate")
        return {"success": True, "provider": "Fallback Engine", "data": create_canvas_fallback(data.prompt)}

    monkeypatch.setattr(ai_router, "get_owned_hackathon", owner_check)
    monkeypatch.setattr(ai_router, "enforce_ai_rate_limit", rate_check)
    monkeypatch.setattr(ai_router, "generate_canvas_layout", generate)

    asyncio.run(ai_router.canvas_generate(
        CanvasGenerateRequest(hackathon_id=uuid.uuid4(), prompt="Build Nimbus"),
        SimpleNamespace(id=uuid.uuid4()),
        object(),
    ))

    assert events == ["owner", "rate", "generate"]

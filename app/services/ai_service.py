import asyncio
import json
import time
from collections import defaultdict, deque

import httpx
from fastapi import HTTPException, status

from app.config.settings import get_settings
from app.schemas.ai import AICopilotRequest, AICopilotResponse, AIToolCall


_request_times: dict[str, deque[float]] = defaultdict(deque)
_rate_limit_lock = asyncio.Lock()


async def enforce_ai_rate_limit(user_id: str) -> None:
    settings = get_settings()
    now = time.monotonic()
    cutoff = now - 60
    async with _rate_limit_lock:
        requests = _request_times[user_id]
        while requests and requests[0] < cutoff:
            requests.popleft()
        if len(requests) >= settings.ai_requests_per_minute:
            retry_after = max(1, int(60 - (now - requests[0])))
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="AI request limit reached. Please wait a moment.",
                headers={"Retry-After": str(retry_after)},
            )
        requests.append(now)


def normalize_tool_calls(raw_calls: list, allowed_names: set[str]) -> list[AIToolCall]:
    calls = []
    for raw_call in raw_calls[:8]:
        function = raw_call.get("function") or {}
        name = function.get("name")
        if name not in allowed_names:
            continue
        try:
            arguments = json.loads(function.get("arguments") or "{}")
        except (TypeError, json.JSONDecodeError):
            continue
        if isinstance(arguments, dict):
            calls.append(AIToolCall(id=raw_call.get("id"), name=name, arguments=arguments))
    return calls


def _gemini_schema(schema):
    if not isinstance(schema, dict):
        return None
    converted = {}
    if schema.get("type"):
        converted["type"] = str(schema["type"]).upper()
    if schema.get("description"):
        converted["description"] = schema["description"]
    if schema.get("enum"):
        converted["enum"] = [str(value) for value in schema["enum"]]
    properties = {
        key: value
        for key, child in (schema.get("properties") or {}).items()
        if (value := _gemini_schema(child))
    }
    if properties:
        converted["properties"] = properties
    if schema.get("items"):
        converted["items"] = _gemini_schema(schema["items"])
    if schema.get("required"):
        converted["required"] = schema["required"]
    return converted


async def _request_groq(client, data, tools, settings):
    payload = {
        "model": settings.ai_groq_model,
        "messages": [
            {"role": "system", "content": data.system},
            *[message.model_dump() for message in data.messages],
        ],
        "temperature": 0.1,
        "max_tokens": settings.ai_max_tokens,
    }
    if tools:
        payload["tools"] = tools
        payload["tool_choice"] = "auto"
    return await client.post(
        "https://api.groq.com/openai/v1/chat/completions",
        headers={"Authorization": f"Bearer {settings.ai_groq_api_key}"},
        json=payload,
    )


async def _request_gemini(client, data, settings):
    declarations = []
    for tool in data.tools:
        declaration = {"name": tool.name, "description": tool.description}
        parameters = _gemini_schema(tool.parameters)
        if parameters and parameters.get("properties"):
            declaration["parameters"] = parameters
        declarations.append(declaration)

    payload = {
        "systemInstruction": {"parts": [{"text": data.system}]},
        "contents": [
            {
                "role": "model" if message.role == "assistant" else "user",
                "parts": [{"text": message.content}],
            }
            for message in data.messages
        ],
        "generationConfig": {"temperature": 0.1, "maxOutputTokens": settings.ai_max_tokens},
    }
    if declarations:
        payload["tools"] = [{"functionDeclarations": declarations}]
    return await client.post(
        f"https://generativelanguage.googleapis.com/v1beta/models/{settings.ai_gemini_model}:generateContent",
        headers={"x-goog-api-key": settings.ai_gemini_api_key},
        json=payload,
    )


def _provider_message(response) -> str:
    """The upstream error text, so the UI can say what actually went wrong."""
    try:
        body = response.json()
    except ValueError:
        return response.text[:200].strip()
    error = body.get("error") if isinstance(body, dict) else None
    if isinstance(error, dict):
        return str(error.get("message") or error.get("status") or error.get("type") or "")[:300]
    return str(error or body)[:200]


def _upstream_error(provider: str, response, attempts) -> HTTPException:
    tried = ", ".join(f"{name} {result.status_code}" for name, result in attempts)
    reason = _provider_message(response) or f"HTTP {response.status_code}"

    if response.status_code == 429:
        retry_after = response.headers.get("retry-after")
        return HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"{provider} is rate limited or out of quota: {reason} (tried: {tried})",
            headers={"Retry-After": retry_after} if retry_after else None,
        )
    if response.status_code in {401, 403}:
        return HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"{provider} rejected the API key: {reason} (tried: {tried})",
        )
    return HTTPException(
        status_code=status.HTTP_502_BAD_GATEWAY,
        detail=f"{provider} could not complete the request: {reason} (tried: {tried})",
    )


async def request_ai_completion(data: AICopilotRequest) -> AICopilotResponse:
    settings = get_settings()
    allowed_names = {tool.name for tool in data.tools}
    tools = [
        {
            "type": "function",
            "function": {
                "name": tool.name,
                "description": tool.description,
                "parameters": tool.parameters,
            },
        }
        for tool in data.tools
    ]

    if not settings.ai_groq_api_key and not settings.ai_gemini_api_key:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI service is not configured.",
        )

    try:
        async with httpx.AsyncClient(timeout=settings.ai_request_timeout_seconds) as client:
            responses = []
            if settings.ai_groq_api_key:
                responses.append(("groq", await _request_groq(client, data, tools, settings)))
            if not any(result.is_success for _, result in responses) and settings.ai_gemini_api_key:
                responses.append(("gemini", await _request_gemini(client, data, settings)))
            response = next((result for _, result in responses if result.is_success), None)
    except httpx.TimeoutException as exc:
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail="AI service timed out. Please try again.",
        ) from exc
    except httpx.HTTPError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="AI service is temporarily unavailable.",
        ) from exc

    if response is None:
        # Report the PRIMARY provider's failure, not the fallback's. Blaming the
        # last response made a broken Groq call read as "Gemini is busy", which
        # sends everyone off replacing keys that were never the problem.
        raise _upstream_error(*responses[0], attempts=responses)

    body = response.json()
    if "choices" in body:
        choice = (body.get("choices") or [{}])[0].get("message") or {}
        return AICopilotResponse(
            message=choice.get("content") or "",
            tool_calls=normalize_tool_calls(choice.get("tool_calls") or [], allowed_names),
        )

    parts = (((body.get("candidates") or [{}])[0].get("content") or {}).get("parts") or [])
    message = "".join(part.get("text", "") for part in parts).strip()
    calls = []
    for index, part in enumerate(parts[:8]):
        function = part.get("functionCall") or {}
        if function.get("name") in allowed_names and isinstance(function.get("args", {}), dict):
            calls.append(AIToolCall(
                id=f"gemini_{index}",
                name=function["name"],
                arguments=function.get("args") or {},
            ))
    return AICopilotResponse(message=message, tool_calls=calls)

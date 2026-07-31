import asyncio
import json
import re
import time
from collections import defaultdict, deque
from typing import get_args

import httpx
from fastapi import HTTPException, status
from pydantic import ValidationError

from app.config.settings import get_settings
from app.schemas.ai import (
    AICopilotRequest,
    AICopilotResponse,
    AIToolCall,
    CanvasComponent,
    CanvasComponentType,
    CanvasGenerateRequest,
    CanvasGenerateResponse,
    CanvasProject,
)


_request_times: dict[str, deque[float]] = defaultdict(deque)
_rate_limit_lock = asyncio.Lock()


CANVAS_SYSTEM_PROMPT = """You are an expert AI web application & website architect for Lovable Canvas.
Generate a structured JSON configuration for a web application layout based on the user prompt.

Available component types:
- 'navbar': Top navigation bar (brandName, links array, ctaText, showSearch)
- 'hero': Main hero section (title, subtitle, badge, primaryCta, secondaryCta, showGlow)
- 'button': Standalone call-to-action button (label)
- 'features': Multi-column feature grid (sectionTitle, items array with title/desc)
- 'stats': Metrics/stats counter section (title, items array with label/value)
- 'pricing': Pricing plans section (title, plans array with name/price/desc/popular)
- 'testimonials': Customer review section (title, items array with name/role/quote)
- 'faq': FAQ accordion section (title, items array with q/a)
- 'contact': Contact/lead signup form (title, subtitle, ctaText)
- 'image_card': Showcase feature card with image
- 'heading': Section text title/headline
- 'ai_container': Interactive live dashboard or metric widget

Strictly format the JSON response with an "isFullWebsite" boolean and a "components" array. Each component must contain only:
- "type": one of the available component types
- "title": a non-empty string
- "suggestedGrid": { "w": integer 1-12, "h": integer 1-24 }
- "props": a JSON object

OUTPUT REQUIREMENTS:
- Output strictly pure valid JSON only.
- Do NOT wrap in markdown code blocks.
- No explanation text before or after JSON."""


def _requested_canvas_type(prompt: str) -> CanvasComponentType | None:
    for component_type in get_args(CanvasComponentType):
        pattern = re.escape(component_type).replace("_", r"[\s_-]+")
        if re.search(rf"\b{pattern}\b", prompt, flags=re.IGNORECASE):
            return component_type
    return None


def _canvas_system_prompt(data: CanvasGenerateRequest) -> str:
    if data.isFullWebsite:
        mode = (
            "Generate 4-7 component sections that form one complete full-page "
            "website in top-to-bottom order. Set isFullWebsite to true."
        )
    else:
        requested_type = _requested_canvas_type(data.prompt)
        requested = f" of type '{requested_type}'" if requested_type else ""
        mode = (
            f"Generate exactly one component{requested}. "
            "Set isFullWebsite to false."
        )
    return f"{CANVAS_SYSTEM_PROMPT}\n\nMODE:\n{mode}"


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
    if not isinstance(raw_calls, list):
        return calls
    for raw_call in raw_calls[:8]:
        if not isinstance(raw_call, dict):
            continue
        function = raw_call.get("function") or {}
        if not isinstance(function, dict):
            continue
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


def _groq_message(message):
    """OpenAI-compatible chat message shape for one AIMessage."""
    out = {"role": message.role, "content": message.content}
    if message.role == "assistant" and message.tool_calls:
        out["tool_calls"] = [
            {
                "id": call.id or f"call_{index}",
                "type": "function",
                "function": {"name": call.name, "arguments": json.dumps(call.arguments)},
            }
            for index, call in enumerate(message.tool_calls)
        ]
    if message.role == "tool":
        out["tool_call_id"] = message.tool_call_id
        if message.name:
            out["name"] = message.name
    return out


async def _request_groq(client, data, tools, settings):
    payload = {
        "model": settings.ai_groq_model,
        "messages": [
            {"role": "system", "content": data.system},
            *[_groq_message(message) for message in data.messages],
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


def _gemini_content(message):
    """Gemini `contents` entry for one AIMessage — branches on role/shape
    since Gemini's multi-turn function-calling format differs from OpenAI's:
    an assistant tool call is a `model` turn with `functionCall` parts (no
    text needed), and a tool result is a `function` turn with a
    `functionResponse` part, rather than a generic user/assistant text turn.
    """
    if message.role == "tool":
        try:
            response_payload = json.loads(message.content) if message.content else {}
        except json.JSONDecodeError:
            response_payload = {"result": message.content}
        if not isinstance(response_payload, dict):
            response_payload = {"result": response_payload}
        return {
            "role": "user",
            "parts": [{
                "functionResponse": {
                    "name": message.name or "tool",
                    "response": response_payload,
                },
            }],
        }

    if message.role == "assistant" and message.tool_calls:
        parts = []

        for call in message.tool_calls:
            part = {
                "functionCall": {
                    "name": call.name,
                    "args": call.arguments,
                }
            }

            if call.thought_signature:
                part["thoughtSignature"] = call.thought_signature

            parts.append(part)

        return {
            "role": "model",
            "parts": parts,
        }

    return {
        "role": "model" if message.role == "assistant" else "user",
        "parts": [{"text": message.content}],
    }


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
        "contents": [_gemini_content(message) for message in data.messages],
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

    try:
        body = response.json()
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="AI service returned an invalid response.",
        ) from exc
    if not isinstance(body, dict):
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="AI service returned an invalid response.",
        )

    # A response cut off at the token ceiling loses its tool calls, so the UI
    # would show half a sentence and silently do nothing. Say so instead.
    truncated_detail = (
        "The AI ran out of room before it finished that edit. "
        "Try a more specific request, or raise AI_MAX_TOKENS."
    )

    if "choices" in body:
        choices = body.get("choices")
        if not isinstance(choices, list) or not choices or not isinstance(choices[0], dict):
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="AI service returned an invalid response.",
            )
        first = choices[0]
        choice = first.get("message") or {}
        if not isinstance(choice, dict):
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="AI service returned an invalid response.",
            )
        calls = normalize_tool_calls(choice.get("tool_calls") or [], allowed_names)
        if first.get("finish_reason") == "length" and not calls:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=truncated_detail,
            )
        return AICopilotResponse(message=choice.get("content") or "", tool_calls=calls)

    candidates = body.get("candidates")
    if not isinstance(candidates, list) or not candidates or not isinstance(candidates[0], dict):
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="AI service returned an invalid response.",
        )
    candidate = candidates[0]
    content = candidate.get("content") or {}
    parts = content.get("parts") if isinstance(content, dict) else None
    if not isinstance(parts, list) or any(not isinstance(part, dict) for part in parts):
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="AI service returned an invalid response.",
        )
    message = "".join(
        text for part in parts if isinstance((text := part.get("text")), str)
    ).strip()
    calls = []
    for index, part in enumerate(parts[:8]):
        function = part.get("functionCall") or {}
        if not isinstance(function, dict):
            continue
        if function.get("name") in allowed_names and isinstance(function.get("args", {}), dict):
            calls.append(AIToolCall(
                id=f"gemini_{index}",
                name=function["name"],
                arguments=function.get("args") or {},
                thought_signature=part.get("thoughtSignature"),
            ))
    if candidate.get("finishReason") == "MAX_TOKENS" and not calls:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=truncated_detail,
        )
    return AICopilotResponse(message=message, tool_calls=calls)


def normalize_canvas_output(raw: object) -> CanvasProject:
    """Accept the two shapes the canvas understands, then validate every field."""
    if isinstance(raw, list):
        raw = {"isFullWebsite": True, "components": raw}
    elif isinstance(raw, dict) and "components" not in raw:
        raw = {"isFullWebsite": False, "components": [raw]}
    return CanvasProject.model_validate(raw)


def _parse_canvas_message(message: str) -> CanvasProject:
    cleaned = re.sub(r"^```json\s*", "", message.strip(), flags=re.IGNORECASE)
    cleaned = re.sub(r"^```\s*", "", cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r"\s*```$", "", cleaned, flags=re.IGNORECASE).strip()
    return normalize_canvas_output(json.loads(cleaned))


def _canvas_title(prompt: str) -> str:
    title = re.sub(
        r"^(make|build|create|a|an|the|full|whole|website|page|for)\s+",
        "",
        prompt.strip(),
        count=1,
        flags=re.IGNORECASE,
    )
    return " ".join(word[:1].upper() + word[1:] for word in title.split(" ")) or "Modern App"


def create_canvas_fallback(
    prompt: str,
    is_full_website: bool = True,
) -> CanvasProject:
    """The Lovable Canvas deterministic portfolio/store/default generator."""
    lower = prompt.lower()
    capitalized = _canvas_title(prompt)

    if any(word in lower for word in ("portfolio", "developer", "designer", "resume")):
        project = {
            "isFullWebsite": True,
            "components": [
                {
                    "type": "navbar",
                    "title": "Header Navigation",
                    "suggestedGrid": {"w": 12, "h": 2},
                    "props": {
                        "brandName": f"{capitalized} Portfolio",
                        "links": ["About", "Projects", "Skills", "Contact"],
                        "ctaText": "Hire Me",
                    },
                },
                {
                    "type": "hero",
                    "title": "Portfolio Hero",
                    "suggestedGrid": {"w": 12, "h": 6},
                    "props": {
                        "badge": "Available for Work",
                        "title": "Crafting High-Performance Digital Experiences",
                        "subtitle": "Senior Fullstack Engineer & UI Architect specializing in modern Web & Mobile applications.",
                        "primaryCta": "View Projects",
                        "secondaryCta": "Download CV",
                        "showGlow": True,
                    },
                },
                {
                    "type": "features",
                    "title": "Core Skills & Stack",
                    "suggestedGrid": {"w": 12, "h": 5},
                    "props": {
                        "sectionTitle": "Technical Expertise",
                        "items": [
                            {"icon": "Zap", "title": "Frontend Systems", "desc": "React 18, TypeScript, Tailwind CSS, Vite"},
                            {"icon": "Shield", "title": "Backend & Cloud", "desc": "Node.js, Express, PostgreSQL, Cloud Run"},
                            {"icon": "Sparkles", "title": "AI Integration", "desc": "LLMs, Gemini APIs, Fine-tuning, Vector DBs"},
                        ],
                    },
                },
                {
                    "type": "stats",
                    "title": "Key Statistics",
                    "suggestedGrid": {"w": 12, "h": 4},
                    "props": {
                        "title": "Impact in Numbers",
                        "items": [
                            {"label": "Projects Built", "value": "45+"},
                            {"label": "GitHub Stars", "value": "1.2k"},
                            {"label": "Client Satisfaction", "value": "99%"},
                            {"label": "Years Exp", "value": "7+"},
                        ],
                    },
                },
                {
                    "type": "testimonials",
                    "title": "Endorsements",
                    "suggestedGrid": {"w": 12, "h": 4},
                    "props": {
                        "title": "Recommendations & Reviews",
                        "items": [
                            {"name": "Sarah Jenkins", "role": "VP of Engineering", "quote": "Delivered our design system ahead of deadline with zero bugs."},
                            {"name": "David Miller", "role": "Startup Founder", "quote": "Transformed our MVP into a scale-ready product effortlessly."},
                        ],
                    },
                },
                {
                    "type": "contact",
                    "title": "Get in Touch",
                    "suggestedGrid": {"w": 12, "h": 4},
                    "props": {
                        "title": "Let's Work Together",
                        "subtitle": "Have a project in mind or want to talk shop? Drop a line below.",
                        "ctaText": "Send Inquiry",
                    },
                },
            ],
        }
    elif any(word in lower for word in ("e-commerce", "store", "shop", "product")):
        project = {
            "isFullWebsite": True,
            "components": [
                {
                    "type": "navbar",
                    "title": "Storefront Navigation",
                    "suggestedGrid": {"w": 12, "h": 2},
                    "props": {
                        "brandName": f"{capitalized} Store",
                        "links": ["New Arrivals", "Best Sellers", "Collections", "Deals"],
                        "ctaText": "Cart (2)",
                        "showSearch": True,
                    },
                },
                {
                    "type": "hero",
                    "title": "Storefront Showcase",
                    "suggestedGrid": {"w": 12, "h": 6},
                    "props": {
                        "badge": "Summer Collection 2026",
                        "title": "Premium Goods Crafted for Modern Living",
                        "subtitle": "Discover engineered essentials designed for minimalist comfort and daily endurance.",
                        "primaryCta": "Shop New Arrivals",
                        "secondaryCta": "Explore Catalog",
                        "showGlow": True,
                    },
                },
                {
                    "type": "features",
                    "title": "Product Highlights",
                    "suggestedGrid": {"w": 12, "h": 5},
                    "props": {
                        "sectionTitle": "Why Choose Our Products",
                        "items": [
                            {"icon": "Shield", "title": "Sustainable Materials", "desc": "100% recycled eco-conscious manufacturing."},
                            {"icon": "Zap", "title": "Express Delivery", "desc": "Free 2-day global shipping on orders over $50."},
                            {"icon": "Check", "title": "Lifetime Warranty", "desc": "Guaranteed satisfaction with hassle-free returns."},
                        ],
                    },
                },
                {
                    "type": "testimonials",
                    "title": "Customer Reviews",
                    "suggestedGrid": {"w": 12, "h": 4},
                    "props": {
                        "title": "Loved by Thousands",
                        "items": [
                            {"name": "Alex Vance", "role": "Verified Buyer", "quote": "The quality surpassed my expectations. Will definitely reorder."},
                            {"name": "Maria Gomez", "role": "Designer", "quote": "Sleek packaging and top tier craftsmanship."},
                        ],
                    },
                },
                {
                    "type": "faq",
                    "title": "Store FAQ",
                    "suggestedGrid": {"w": 12, "h": 4},
                    "props": {
                        "title": "Frequent Questions",
                        "items": [
                            {"q": "How long does shipping take?", "a": "Standard orders arrive within 2-4 business days."},
                            {"q": "What is your return policy?", "a": "We offer 30-day money back guarantee with free return labels."},
                        ],
                    },
                },
            ],
        }
    else:
        project = {
            "isFullWebsite": True,
            "components": [
                {
                    "type": "navbar",
                    "title": "Top Navigation",
                    "suggestedGrid": {"w": 12, "h": 2},
                    "props": {
                        "brandName": capitalized,
                        "links": ["Features", "Metrics", "Pricing", "Testimonials", "FAQ"],
                        "ctaText": "Get Started Free",
                    },
                },
                {
                    "type": "hero",
                    "title": "Hero Section",
                    "suggestedGrid": {"w": 12, "h": 6},
                    "props": {
                        "badge": "Next Generation Platform",
                        "title": f"Empower Your Workflow with {capitalized}",
                        "subtitle": "The intelligent web platform designed to accelerate production, streamline workflows, and scale effortlessly.",
                        "primaryCta": "Start Free Trial",
                        "secondaryCta": "Watch Demo",
                        "showGlow": True,
                    },
                },
                {
                    "type": "features",
                    "title": "Features Section",
                    "suggestedGrid": {"w": 12, "h": 5},
                    "props": {
                        "sectionTitle": "Everything You Need to Succeed",
                        "items": [
                            {"icon": "Zap", "title": "Lightning Speed", "desc": "Sub-millisecond response times powered by global edge servers."},
                            {"icon": "Shield", "title": "Enterprise Security", "desc": "End-to-end encryption, SOC2 compliance, and automated backups."},
                            {"icon": "Sparkles", "title": "AI Driven Insights", "desc": "Automated workflow optimization and real-time smart predictions."},
                        ],
                    },
                },
                {
                    "type": "stats",
                    "title": "Platform Stats",
                    "suggestedGrid": {"w": 12, "h": 4},
                    "props": {
                        "title": "Scale & Performance Metrics",
                        "items": [
                            {"label": "Uptime SLA", "value": "99.99%"},
                            {"label": "Active Users", "value": "250K+"},
                            {"label": "Latency", "value": "12ms"},
                            {"label": "CSAT Score", "value": "4.9/5"},
                        ],
                    },
                },
                {
                    "type": "pricing",
                    "title": "Pricing Plans",
                    "suggestedGrid": {"w": 12, "h": 6},
                    "props": {
                        "title": "Simple, Transparent Pricing",
                        "plans": [
                            {"name": "Starter", "price": "$0", "desc": "Free forever for individuals"},
                            {"name": "Pro Plan", "price": "$29", "desc": "Everything you need to grow", "popular": True},
                            {"name": "Enterprise", "price": "$99", "desc": "Dedicated support & custom SLAs"},
                        ],
                    },
                },
                {
                    "type": "testimonials",
                    "title": "Customer Reviews",
                    "suggestedGrid": {"w": 12, "h": 4},
                    "props": {
                        "title": "What Leaders Are Saying",
                        "items": [
                            {"name": "Elena Rostova", "role": "Head of Product", "quote": "This transformed our development velocity overnight."},
                            {"name": "Marcus Chen", "role": "Engineering Lead", "quote": "The cleanest interface and fastest build times we have experienced."},
                        ],
                    },
                },
                {
                    "type": "faq",
                    "title": "FAQ Accordion",
                    "suggestedGrid": {"w": 12, "h": 4},
                    "props": {
                        "title": "Frequently Asked Questions",
                        "items": [
                            {"q": "Can I change my plan later?", "a": "Yes, upgrade or downgrade anytime with 1 click."},
                            {"q": "Is there a free trial?", "a": "Enjoy a 14-day full feature free trial with no credit card required."},
                        ],
                    },
                },
            ],
        }

    validated = CanvasProject.model_validate(project)
    if is_full_website:
        return validated
    return _single_fallback_project(validated, prompt)


def _single_fallback_project(project: CanvasProject, prompt: str) -> CanvasProject:
    requested_type = _requested_canvas_type(prompt) or project.components[0].type
    component = next(
        (item for item in project.components if item.type == requested_type),
        None,
    )

    if component is None:
        canonical = create_canvas_fallback("Modern SaaS", is_full_website=True)
        component = next(
            (item for item in canonical.components if item.type == requested_type),
            None,
        )

    if component is None:
        title = _canvas_title(prompt)
        extras = {
            "button": {
                "type": "button",
                "title": "Action Button",
                "suggestedGrid": {"w": 4, "h": 2},
                "props": {"label": "Get Started"},
            },
            "heading": {
                "type": "heading",
                "title": "Section Heading",
                "suggestedGrid": {"w": 6, "h": 3},
                "props": {"tag": "H2", "title": title, "subtitle": prompt},
            },
            "image_card": {
                "type": "image_card",
                "title": "Showcase Card",
                "suggestedGrid": {"w": 4, "h": 5},
                "props": {
                    "title": title,
                    "description": "A polished visual highlight for this website.",
                    "actionText": "Learn More",
                },
            },
            "ai_container": {
                "type": "ai_container",
                "title": "Smart Widget",
                "suggestedGrid": {"w": 6, "h": 4},
                "props": {
                    "title": title,
                    "statusText": "AI Engine Active",
                    "metrics": [
                        {"label": "Performance", "value": "99%", "change": "Optimal"},
                        {"label": "Users", "value": "10K+", "change": "+12%"},
                        {"label": "Uptime", "value": "99.9%", "change": "Stable"},
                    ],
                    "aiPromptUsed": prompt,
                },
            },
            "contact": {
                "type": "contact",
                "title": "Contact Section",
                "suggestedGrid": {"w": 12, "h": 4},
                "props": {
                    "title": "Get in Touch",
                    "subtitle": "Tell us how we can help.",
                    "ctaText": "Send Message",
                },
            },
        }
        component_data = extras.get(requested_type)
        if component_data is None:
            raise ValueError(f"No fallback for canvas component '{requested_type}'")
        component = CanvasComponent.model_validate(component_data)

    return CanvasProject(isFullWebsite=False, components=[component])


def _project_for_request(
    project: CanvasProject,
    data: CanvasGenerateRequest,
) -> CanvasProject:
    if data.isFullWebsite:
        return project.model_copy(update={"isFullWebsite": True})

    requested_type = _requested_canvas_type(data.prompt)
    component = next(
        (
            item
            for item in project.components
            if requested_type is None or item.type == requested_type
        ),
        None,
    )
    if component is None:
        raise ValueError("AI did not return the requested canvas component type")
    return CanvasProject(isFullWebsite=False, components=[component])


async def generate_canvas_layout(data: CanvasGenerateRequest) -> CanvasGenerateResponse:
    request = AICopilotRequest(
        hackathon_id=data.hackathon_id,
        system=_canvas_system_prompt(data),
        messages=[{"role": "user", "content": data.prompt}],
    )
    try:
        response = await request_ai_completion(request)
        project = _project_for_request(_parse_canvas_message(response.message), data)
        return CanvasGenerateResponse(provider="AI", data=project)
    except (HTTPException, json.JSONDecodeError, ValidationError, TypeError, ValueError):
        return CanvasGenerateResponse(
            provider="Fallback Engine",
            data=create_canvas_fallback(data.prompt, data.isFullWebsite),
        )

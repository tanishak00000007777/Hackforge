import json
import uuid
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, JsonValue, field_validator, model_validator


class AIMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(min_length=1, max_length=8_000)


class AIToolSchema(BaseModel):
    name: str = Field(pattern=r"^[A-Za-z][A-Za-z0-9_]{0,63}$")
    description: str = Field(min_length=1, max_length=1_000)
    parameters: dict = Field(default_factory=dict)


class AICopilotRequest(BaseModel):
    hackathon_id: uuid.UUID
    system: str = Field(min_length=1, max_length=20_000)
    messages: list[AIMessage] = Field(min_length=1, max_length=20)
    tools: list[AIToolSchema] = Field(default_factory=list, max_length=24)

    @model_validator(mode="after")
    def enforce_payload_budget(self):
        message_chars = sum(len(message.content) for message in self.messages)
        tool_chars = len(json.dumps([tool.model_dump() for tool in self.tools]))
        if message_chars + tool_chars > 60_000:
            raise ValueError("AI request context is too large")
        return self


class AIToolCall(BaseModel):
    id: str | None = None
    name: str
    arguments: dict = Field(default_factory=dict)


class AICopilotResponse(BaseModel):
    message: str = ""
    tool_calls: list[AIToolCall] = Field(default_factory=list)


class CanvasGenerateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    hackathon_id: uuid.UUID
    prompt: str = Field(min_length=1, max_length=8_000)
    isFullWebsite: bool = True

    @field_validator("prompt")
    @classmethod
    def normalize_prompt(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Prompt cannot be blank")
        return value


CanvasComponentType = Literal[
    "navbar",
    "hero",
    "button",
    "features",
    "stats",
    "pricing",
    "testimonials",
    "faq",
    "contact",
    "image_card",
    "heading",
    "ai_container",
]


_RENDERED_STRING_PROPS = {
    "navbar": {"brandName", "ctaText"},
    "hero": {"badge", "title", "subtitle", "primaryCta", "secondaryCta"},
    "button": {"label"},
    "heading": {"tag", "title", "subtitle"},
    "image_card": {"imageUrl", "tag", "title", "description", "actionText"},
    "ai_container": {"title", "statusText", "aiPromptUsed"},
    "features": {"sectionTitle"},
    "stats": {"title"},
    "pricing": {"title"},
    "testimonials": {"title"},
    "faq": {"title"},
    "contact": {"title", "subtitle", "ctaText"},
}

_RENDERED_BOOL_PROPS = {
    "navbar": {"showSearch"},
    "hero": {"showGlow"},
    "heading": {"showDivider"},
}

_RENDERED_ITEM_LISTS = {
    "features": ("items", {"icon", "title", "desc"}),
    "stats": ("items", {"label", "value"}),
    "pricing": ("plans", {"name", "price", "desc"}),
    "testimonials": ("items", {"name", "role", "quote", "avatar"}),
    "faq": ("items", {"q", "a"}),
    "ai_container": ("metrics", {"label", "value", "change"}),
}


class CanvasSuggestedGrid(BaseModel):
    model_config = ConfigDict(extra="forbid", strict=True)

    w: int = Field(ge=1, le=12)
    h: int = Field(ge=1, le=24)


class CanvasComponent(BaseModel):
    model_config = ConfigDict(extra="forbid", strict=True)

    type: CanvasComponentType
    title: str = Field(min_length=1, max_length=120)
    suggestedGrid: CanvasSuggestedGrid
    props: dict[str, JsonValue] = Field(default_factory=dict)

    @model_validator(mode="after")
    def validate_renderer_props(self):
        def require_short_strings(values: dict, keys: set[str]) -> None:
            for key in keys:
                value = values.get(key)
                if value is not None and (
                    not isinstance(value, str) or len(value) > 4_000
                ):
                    raise ValueError(f"{self.type}.{key} must be a string")

        require_short_strings(self.props, _RENDERED_STRING_PROPS.get(self.type, set()))

        for key in _RENDERED_BOOL_PROPS.get(self.type, set()):
            value = self.props.get(key)
            if value is not None and not isinstance(value, bool):
                raise ValueError(f"{self.type}.{key} must be a boolean")

        links = self.props.get("links") if self.type == "navbar" else None
        if links is not None:
            if not isinstance(links, list) or len(links) > 12:
                raise ValueError("navbar.links must be a list of at most 12 strings")
            if any(not isinstance(link, str) or len(link) > 200 for link in links):
                raise ValueError("navbar.links must contain only short strings")

        list_spec = _RENDERED_ITEM_LISTS.get(self.type)
        if list_spec:
            key, string_fields = list_spec
            items = self.props.get(key)
            if items is not None:
                if not isinstance(items, list) or len(items) > 12:
                    raise ValueError(f"{self.type}.{key} must be a list of at most 12 items")
                for item in items:
                    if not isinstance(item, dict):
                        raise ValueError(f"{self.type}.{key} entries must be objects")
                    require_short_strings(item, string_fields)
                    if self.type == "pricing" and item.get("popular") is not None:
                        if not isinstance(item["popular"], bool):
                            raise ValueError("pricing.plans.popular must be a boolean")
                    if self.type == "testimonials" and item.get("rating") is not None:
                        rating = item["rating"]
                        if type(rating) is not int or not 1 <= rating <= 5:
                            raise ValueError("testimonials.items.rating must be an integer from 1 to 5")

        return self


class CanvasProject(BaseModel):
    model_config = ConfigDict(extra="forbid", strict=True)

    isFullWebsite: bool
    components: list[CanvasComponent] = Field(min_length=1, max_length=7)


class CanvasGenerateResponse(BaseModel):
    success: Literal[True] = True
    provider: Literal["AI", "Fallback Engine"]
    data: CanvasProject

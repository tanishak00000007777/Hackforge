import json
import uuid
from typing import Literal

from pydantic import BaseModel, Field, model_validator


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

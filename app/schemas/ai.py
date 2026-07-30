import json
import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field, model_validator


class AIToolCallRef(BaseModel):
    thought_signature: str | None = None
    id: str | None = None
    name: str = Field(pattern=r"^[A-Za-z][A-Za-z0-9_]{0,63}$")
    arguments: dict = Field(default_factory=dict)


class AIMessage(BaseModel):
    role: Literal["user", "assistant", "tool"]
    content: str = Field(default="", max_length=8_000)
    tool_calls: list[AIToolCallRef] | None = None
    tool_call_id: str | None = None
    name: str | None = None

    @model_validator(mode="after")
    def enforce_role_shape(self):
        if self.role == "user" and not self.content.strip():
            raise ValueError("user messages must have content")
        if self.role == "tool" and not self.tool_call_id:
            raise ValueError("tool messages must include tool_call_id")
        if self.role == "assistant" and not self.content.strip() and not self.tool_calls:
            raise ValueError("assistant messages must have content or tool_calls")
        return self


class AIToolSchema(BaseModel):
    name: str = Field(pattern=r"^[A-Za-z][A-Za-z0-9_]{0,63}$")
    description: str = Field(min_length=1, max_length=1_000)
    parameters: dict = Field(default_factory=dict)


class AICopilotRequest(BaseModel):
    hackathon_id: uuid.UUID
    system: str = Field(min_length=1, max_length=20_000)
    # A multi-round agent turn appends an assistant + N tool-result message per
    # round (see ConversationManager's loop), so this needs real headroom above
    # a single user/assistant exchange — not just the original 20-message cap.
    messages: list[AIMessage] = Field(min_length=1, max_length=200)
    tools: list[AIToolSchema] = Field(default_factory=list, max_length=24)

    @model_validator(mode="after")
    def enforce_payload_budget(self):
        message_chars = sum(
            len(message.content)
            + (len(json.dumps([tc.model_dump() for tc in message.tool_calls])) if message.tool_calls else 0)
            for message in self.messages
        )
        tool_chars = len(json.dumps([tool.model_dump() for tool in self.tools]))
        if message_chars + tool_chars > 60_000:
            raise ValueError("AI request context is too large")
        return self


class AIToolCall(BaseModel):
    thought_signature: str | None = None
    id: str | None = None
    name: str
    arguments: dict = Field(default_factory=dict)


class AICopilotResponse(BaseModel):
    message: str = ""
    tool_calls: list[AIToolCall] = Field(default_factory=list)


class AIConversationMessageCreate(BaseModel):
    role: Literal["user", "assistant", "tool"]
    content: str = Field(default="", max_length=8_000)
    tool_calls: list[AIToolCallRef] | None = None
    tool_call_id: str | None = None


class AIConversationMessageResponse(BaseModel):
    id: uuid.UUID
    role: str
    content: str
    tool_calls: list[AIToolCallRef] | None = None
    tool_call_id: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}

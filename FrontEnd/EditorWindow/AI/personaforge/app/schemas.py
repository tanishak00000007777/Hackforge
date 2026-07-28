from typing import Literal, Optional
from pydantic import BaseModel, Field, field_validator

# --- Section 7: structured intent ---

class RequestedChange(BaseModel):
    type: str
    scope: str
    instruction: str
    priority: int = 3


class Intent(BaseModel):
    goal: str
    audience: str = ""
    tone: str = ""
    requested_changes: list[RequestedChange] = Field(default_factory=list)
    hard_constraints: list[str] = Field(default_factory=list)
    inferred_preferences: list[str] = Field(default_factory=list)
    ambiguities: list[str] = Field(default_factory=list)
    allow_javascript_changes: bool = False


# --- Section 9: edit plan ---

class PlannedChange(BaseModel):
    file_path: str
    component_key: Optional[str] = None
    operation: str
    selectors: list[str] = Field(default_factory=list)
    reason: str
    risk_level: Literal["low", "medium", "high"] = "low"


class EditPlan(BaseModel):
    summary: str
    changes: list[PlannedChange] = Field(default_factory=list)
    files_to_preserve: list[str] = Field(default_factory=list)
    protected_identifiers: list[str] = Field(default_factory=list)
    warnings: list[str] = Field(default_factory=list)


# --- Section 10: structured edit operations ---

OPERATION_TYPES = {
    "set_text", "set_inner_html", "set_attribute", "remove_attribute",
    "add_class", "remove_class", "insert_before", "insert_after",
    "append_child", "remove_element", "move_element",
    "update_css_property", "create_css_rule", "update_css_variable", "create_file",
}


class EditOperation(BaseModel):
    operation_id: str
    file_path: str
    operation: str
    selector: Optional[str] = None
    target_selector: Optional[str] = None
    attribute: Optional[str] = None
    property: Optional[str] = None
    old_value: Optional[str] = None
    new_value: Optional[str] = None
    content: Optional[str] = None
    reason: str = ""
    confidence: float = 0.8

    @field_validator("operation")
    @classmethod
    def _must_be_appliable(cls, value: str) -> str:
        """Reject invented operations here rather than letting edit_apply drop
        them silently -- the retry loop re-prompts with this message."""
        if value not in OPERATION_TYPES:
            raise ValueError(
                f"unsupported operation '{value}'. Use exactly one of: {', '.join(sorted(OPERATION_TYPES))}"
            )
        return value


class EditOperationBatch(BaseModel):
    operations: list[EditOperation] = Field(default_factory=list)

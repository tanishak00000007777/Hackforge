import json
import time

from pydantic import ValidationError

from .. import config
from ..schemas import Intent, EditPlan, EditOperationBatch
from .provider import LLMProvider, LLMError, LLMRateLimited, LLMUnavailable
from . import prompts


def _call_with_retry(provider: LLMProvider, system_prompt: str, user_prompt: str, schema_cls):
    last_error = None
    corrective_prompt = user_prompt
    attempts = 0
    waits = 0

    while attempts <= config.LLM_MAX_RETRIES:
        try:
            raw = provider.complete_json(system_prompt, corrective_prompt)
            return schema_cls.model_validate(raw)
        except LLMUnavailable:
            raise  # the endpoint is down or refusing us; re-prompting cannot help
        except LLMRateLimited as exc:
            # Throttling is not a bad answer: wait out the window rather than
            # burning a schema retry. Hosted tiers throttle on tokens/minute.
            # A per-minute throttle is worth waiting out; a per-day quota is
            # not -- blocking the job for a window we cannot outlast is worse
            # than telling the user their key is spent.
            if exc.retry_after > config.LLM_MAX_BACKOFF_SECONDS:
                raise LLMError(
                    f"The AI model's quota is exhausted (it asked to wait {exc.retry_after:.0f}s). "
                    "Switch model or key via PERSONAFORGE_LLM_MODEL / PERSONAFORGE_LLM_API_KEY, "
                    f"or retry later. {exc}"
                ) from exc
            if waits >= config.LLM_RATE_LIMIT_RETRIES:
                raise LLMError(f"The AI model stayed rate limited after {waits} waits. {exc}") from exc
            waits += 1
            time.sleep(min(exc.retry_after, config.LLM_MAX_BACKOFF_SECONDS))
            continue
        except (LLMError, ValidationError) as exc:
            last_error = exc
            attempts += 1
            # Only a malformed answer is worth correcting; transport faults are not.
            if isinstance(exc, ValidationError) or "valid JSON" in str(exc):
                corrective_prompt = (
                    f"{user_prompt}\n\nYour previous response was invalid ({exc}). "
                    "Return valid JSON matching the schema exactly."
                )

    raise LLMError(f"LLM failed to produce a schema-valid response after retries: {last_error}")


def extract_intent(provider: LLMProvider, prompt: str) -> Intent:
    return _call_with_retry(provider, prompts.INTENT_SYSTEM_PROMPT, prompt, Intent)


def plan_edits(provider: LLMProvider, intent: Intent, manifest_excerpt: dict) -> EditPlan:
    user_prompt = json.dumps({"intent": intent.model_dump(), "manifest": manifest_excerpt})
    return _call_with_retry(provider, prompts.PLAN_SYSTEM_PROMPT, user_prompt, EditPlan)


def generate_operations(provider: LLMProvider, plan: EditPlan, file_snippets: dict[str, str], selector_menus: dict = None) -> EditOperationBatch:
    user_prompt = json.dumps({
        "plan": plan.model_dump(),
        "files": file_snippets,
        "available_selectors": selector_menus or {},
    })
    return _call_with_retry(provider, prompts.OPERATIONS_SYSTEM_PROMPT, user_prompt, EditOperationBatch)


def generate_repair(provider: LLMProvider, intent: Intent, errors: list[str], file_snippets: dict[str, str], protected: list[str], selector_menus: dict = None) -> EditOperationBatch:
    user_prompt = json.dumps({
        "intent": intent.model_dump(),
        "validation_errors": errors,
        "files": file_snippets,
        "available_selectors": selector_menus or {},
        "protected_identifiers": protected,
    })
    return _call_with_retry(provider, prompts.REPAIR_SYSTEM_PROMPT, user_prompt, EditOperationBatch)

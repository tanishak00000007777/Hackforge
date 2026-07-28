"""Failure handling around the LLM call: a dead endpoint, a throttled one, and
a merely malformed answer must be treated differently."""
import httpx
import pytest

from app import config
from app.llm import pipeline
from app.llm.provider import LLMError, LLMProvider, LLMRateLimited, LLMUnavailable, _retry_after_seconds
from app.schemas import EditOperationBatch, Intent


def _response(status, body="", headers=None):
    return httpx.Response(status, text=body, headers=headers or {}, request=httpx.Request("POST", "http://x/v1/chat/completions"))


def _raise(exc):
    def _call(*args, **kwargs):
        raise exc
    return _call


def test_connection_refused_is_unavailable_and_not_retried(monkeypatch):
    monkeypatch.setattr(httpx, "post", _raise(httpx.ConnectError("refused")))
    provider = LLMProvider(base_url="http://localhost:11434/v1")

    calls = []
    original = provider.complete_json
    monkeypatch.setattr(provider, "complete_json", lambda *a, **k: calls.append(1) or original(*a, **k))

    with pytest.raises(LLMUnavailable) as exc:
        pipeline._call_with_retry(provider, "sys", "user", Intent)

    assert "Cannot reach the AI model" in str(exc.value)
    assert len(calls) == 1, "a refused connection must not be re-prompted"


def test_bad_api_key_is_unavailable(monkeypatch):
    monkeypatch.setattr(httpx, "post", lambda *a, **k: _response(401, '{"error":"bad key"}'))
    with pytest.raises(LLMUnavailable, match="rejected the API key"):
        LLMProvider().complete_json("sys", "user")


def test_rate_limit_waits_then_succeeds(monkeypatch):
    slept = []
    monkeypatch.setattr(pipeline.time, "sleep", slept.append)

    valid = {"goal": "g", "audience": "", "tone": "", "requested_changes": [],
             "hard_constraints": [], "inferred_preferences": [], "ambiguities": [],
             "allow_javascript_changes": False}
    attempts = []

    class Provider(LLMProvider):
        def complete_json(self, system_prompt, user_prompt, max_tokens=2048):
            attempts.append(user_prompt)
            if len(attempts) == 1:
                raise LLMRateLimited("429", retry_after=4.7)
            return valid

    result = pipeline._call_with_retry(Provider(), "sys", "user", Intent)

    assert result.goal == "g"
    assert slept == [4.7], "must wait the interval the provider asked for"
    assert attempts[1] == "user", "throttling is not a bad answer; do not append a correction"


def test_rate_limit_gives_up_after_configured_waits(monkeypatch):
    monkeypatch.setattr(pipeline.time, "sleep", lambda _: None)
    monkeypatch.setattr(config, "LLM_RATE_LIMIT_RETRIES", 2)

    class Provider(LLMProvider):
        def complete_json(self, *a, **k):
            raise LLMRateLimited("429 always", retry_after=1)

    with pytest.raises(LLMError, match="stayed rate limited after 2 waits"):
        pipeline._call_with_retry(Provider(), "sys", "user", Intent)


def test_daily_quota_fails_fast_instead_of_waiting(monkeypatch):
    slept = []
    monkeypatch.setattr(pipeline.time, "sleep", slept.append)
    monkeypatch.setattr(config, "LLM_MAX_BACKOFF_SECONDS", 30)

    class Provider(LLMProvider):
        def complete_json(self, *a, **k):
            raise LLMRateLimited("tokens per day (TPD)", retry_after=1170)

    with pytest.raises(LLMError, match="quota is exhausted"):
        pipeline._call_with_retry(Provider(), "sys", "user", Intent)
    assert slept == [], "a wait we cannot outlast must not block the job"


def test_malformed_answer_is_re_prompted_with_a_correction(monkeypatch):
    prompts = []

    class Provider(LLMProvider):
        def complete_json(self, system_prompt, user_prompt, max_tokens=2048):
            prompts.append(user_prompt)
            return {"not": "an intent"}

    with pytest.raises(LLMError, match="schema-valid"):
        pipeline._call_with_retry(Provider(), "sys", "user", Intent)

    assert len(prompts) == config.LLM_MAX_RETRIES + 1
    assert "previous response was invalid" in prompts[-1]


def test_invented_operation_is_rejected_and_re_prompted():
    """The model likes to answer with intent categories ('theme_change'). Those
    are not appliable, so the batch must fail validation, not silently no-op."""
    prompts = []

    class Provider(LLMProvider):
        def complete_json(self, system_prompt, user_prompt, max_tokens=2048):
            prompts.append(user_prompt)
            return {"operations": [{
                "operation_id": "1", "file_path": "index.html", "operation": "theme_change",
                "selector": "body", "new_value": "#2563eb", "reason": "recolour",
            }]}

    with pytest.raises(LLMError):
        pipeline._call_with_retry(Provider(), "sys", "user", EditOperationBatch)

    assert "unsupported operation 'theme_change'" in prompts[-1]
    assert "set_text" in prompts[-1], "the correction must list the appliable operations"


def test_valid_operation_passes():
    batch = EditOperationBatch.model_validate({"operations": [{
        "operation_id": "1", "file_path": "index.html", "operation": "set_text",
        "selector": "#headline", "new_value": "Hi", "reason": "rebrand",
    }]})
    assert batch.operations[0].operation == "set_text"


def test_retry_after_prefers_header_then_body():
    assert _retry_after_seconds(_response(429, "", {"retry-after": "12"})) == 12
    assert _retry_after_seconds(_response(429, "Please try again in 4.745s")) == 4.745
    assert _retry_after_seconds(_response(429, "no hint")) == 5.0


def test_every_operation_emitting_prompt_carries_the_applier_contract():
    """Repair once answered with intent objects because only the operations
    stage was told the contract."""
    from app.llm import prompts
    from app.schemas import OPERATION_TYPES

    for name in ("OPERATIONS_SYSTEM_PROMPT", "REPAIR_SYSTEM_PROMPT"):
        prompt = getattr(prompts, name)
        assert '"operation" MUST be a bare string' in prompt, name
        for op in ("set_text", "update_css_variable", "remove_element"):
            assert op in prompt, f"{name} omits {op}"
        assert OPERATION_TYPES >= {"set_text", "update_css_variable", "remove_element"}

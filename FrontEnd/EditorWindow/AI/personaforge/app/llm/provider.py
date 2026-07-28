import json
import re

import httpx

from .. import config


class LLMError(Exception):
    pass


class LLMUnavailable(LLMError):
    """The endpoint could not be reached or refused us (down, wrong URL, bad
    key). Re-prompting cannot fix it, so callers must not retry."""


class LLMRateLimited(LLMError):
    """Provider throttled us. Waiting fixes it; re-prompting does not."""

    def __init__(self, message: str, retry_after: float):
        super().__init__(message)
        self.retry_after = retry_after


def _retry_after_seconds(response) -> float:
    """Prefer the Retry-After header, else the hint hosted providers put in the
    error body ('Please try again in 4.745s'). Falls back to a short wait."""
    header = response.headers.get("retry-after")
    if header:
        try:
            return float(header)
        except ValueError:
            pass
    # e.g. "Please try again in 4.745s" or "in 19m32.9s"
    match = re.search(r"try again in (?:(\d+)m)?([\d.]+)s", response.text)
    if match:
        minutes, seconds = match.groups()
        return int(minutes or 0) * 60 + float(seconds)
    return 5.0


class LLMProvider:
    """OpenAI-compatible chat completions client (works with Ollama, vLLM,
    or any hosted OpenAI-compatible endpoint per section 24's provider
    abstraction requirement)."""

    def __init__(self, base_url: str = None, model: str = None, api_key: str = None):
        self.base_url = (base_url or config.LLM_BASE_URL).rstrip("/")
        self.model = model or config.LLM_MODEL
        self.api_key = api_key or config.LLM_API_KEY

    def complete_json(self, system_prompt: str, user_prompt: str, max_tokens: int = 2048) -> dict:
        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            "temperature": 0.1,
            "max_tokens": max_tokens,
            "response_format": {"type": "json_object"},
        }
        try:
            resp = httpx.post(
                f"{self.base_url}/chat/completions",
                json=payload,
                headers={"Authorization": f"Bearer {self.api_key}"},
                timeout=config.LLM_TIMEOUT_SECONDS,
            )
            resp.raise_for_status()
        except httpx.ConnectError as exc:
            raise LLMUnavailable(
                f"Cannot reach the AI model at {self.base_url}. Start it, or set "
                "PERSONAFORGE_LLM_BASE_URL / PERSONAFORGE_LLM_API_KEY to a hosted endpoint."
            ) from exc
        except httpx.TimeoutException as exc:
            raise LLMUnavailable(
                f"The AI model at {self.base_url} did not respond within "
                f"{config.LLM_TIMEOUT_SECONDS:.0f}s. Try again or raise PERSONAFORGE_LLM_TIMEOUT."
            ) from exc
        except httpx.HTTPStatusError as exc:
            status = exc.response.status_code
            detail = exc.response.text[:300]
            if status in (401, 403):
                raise LLMUnavailable(f"The AI model rejected the API key ({status}). Check PERSONAFORGE_LLM_API_KEY.") from exc
            if status == 413:
                raise LLMUnavailable(
                    f"The request was too large for model '{self.model}'. Lower "
                    "PERSONAFORGE_CONTEXT_CHARS, or use a model with a bigger allowance."
                ) from exc
            if status == 404:
                raise LLMUnavailable(f"Model '{self.model}' not found at {self.base_url} (404). Check PERSONAFORGE_LLM_MODEL.") from exc
            if status == 429:
                raise LLMRateLimited(
                    f"The AI model is rate limited (429). {detail}", _retry_after_seconds(exc.response),
                ) from exc
            raise LLMError(f"LLM request failed ({status}): {detail}") from exc
        except httpx.HTTPError as exc:
            raise LLMError(f"LLM request failed: {exc}") from exc

        data = resp.json()
        try:
            content = data["choices"][0]["message"]["content"]
        except (KeyError, IndexError) as exc:
            raise LLMError(f"Unexpected LLM response shape: {data}") from exc

        try:
            return json.loads(content)
        except json.JSONDecodeError as exc:
            raise LLMError(f"LLM did not return valid JSON: {content[:500]}") from exc

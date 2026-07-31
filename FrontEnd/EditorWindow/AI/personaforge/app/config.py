import os
from pathlib import Path

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent

# PersonaForge's own .env wins; the studio's .env is a fallback so a single
# Groq key configured for the editor also powers the AI editing backend.
load_dotenv(BASE_DIR / ".env")
load_dotenv(BASE_DIR.parent.parent / ".env")
DATA_DIR = Path(os.environ.get("PERSONAFORGE_DATA_DIR", BASE_DIR / "data"))
PROJECTS_DIR = DATA_DIR / "projects"
DB_PATH = DATA_DIR / "personaforge.db"

MAX_UPLOAD_BYTES = 50 * 1024 * 1024
MAX_EXTRACTED_BYTES = 200 * 1024 * 1024
MAX_FILE_COUNT = 2000
MAX_FILES_CHANGED_PER_JOB = int(os.environ.get("PERSONAFORGE_MAX_FILES_CHANGED", "10"))

SUPPORTED_EXTENSIONS = {
    ".html", ".htm", ".css", ".js", ".json",
    ".png", ".jpg", ".jpeg", ".gif", ".svg", ".webp", ".ico",
    ".woff", ".woff2", ".ttf", ".otf", ".eot",
    ".txt", ".md",
}
BLOCKED_EXTENSIONS = {
    ".exe", ".sh", ".bat", ".cmd", ".ps1", ".dll", ".so", ".php", ".py",
    ".jar", ".msi", ".com", ".vbs",
}

# LLM provider config (section 24). Any OpenAI-compatible endpoint works.
# Groq, sharing the key configured for the studio.
_HOSTED_KEY = os.environ.get("GROQ_API_KEY") or os.environ.get("VITE_GROQ_API_KEY")

# 70b-versatile, not 8b-instant. An 8b model cannot hold a design brief across a
# multi-thousand-token job: it returns generic, unstyled markup, which is the
# whole complaint this backend exists to fix. The free tier's daily budget for
# 70b is small, so PERSONAFORGE_LLM_MODEL is the knob to drop back to
# llama-3.1-8b-instant when quota matters more than quality.
_DEFAULT_BASE_URL = "https://api.groq.com/openai/v1"
_DEFAULT_MODEL = "llama-3.3-70b-versatile"

# No silent localhost fallback. A local Ollama is not running on most machines,
# so falling back to it turned "the key is missing" into a confusing connection
# error against port 11434. Point PERSONAFORGE_LLM_BASE_URL at Ollama to opt in.
LLM_BASE_URL = os.environ.get("PERSONAFORGE_LLM_BASE_URL", _DEFAULT_BASE_URL)
LLM_MODEL = os.environ.get("PERSONAFORGE_LLM_MODEL", _DEFAULT_MODEL)
LLM_API_KEY = os.environ.get("PERSONAFORGE_LLM_API_KEY", _HOSTED_KEY)

if not LLM_API_KEY:
    raise RuntimeError(
        "No LLM credentials. Set GROQ_API_KEY (or VITE_GROQ_API_KEY) in "
        "FrontEnd/EditorWindow/.env, or set PERSONAFORGE_LLM_BASE_URL and "
        "PERSONAFORGE_LLM_API_KEY to use a different OpenAI-compatible provider."
    )
LLM_TIMEOUT_SECONDS = float(os.environ.get("PERSONAFORGE_LLM_TIMEOUT", "60"))
LLM_MAX_RETRIES = 1
# Hosted tiers throttle on tokens-per-minute; a job makes several large calls
# back to back, so waiting out the window is normal, not an error.
LLM_RATE_LIMIT_RETRIES = int(os.environ.get("PERSONAFORGE_LLM_RATE_LIMIT_RETRIES", "3"))
# A tokens-per-minute window is at most ~60s, so waits up to 90s are worth
# sitting out. Anything longer is a daily quota -- fail fast instead.
LLM_MAX_BACKOFF_SECONDS = float(os.environ.get("PERSONAFORGE_LLM_MAX_BACKOFF", "90"))
# Total characters of project source sent in one request (~4 chars/token).
# Must stay under the model's per-request/per-minute token allowance.
LLM_CONTEXT_CHAR_BUDGET = int(os.environ.get("PERSONAFORGE_CONTEXT_CHARS", "12000"))

DATA_DIR.mkdir(parents=True, exist_ok=True)
PROJECTS_DIR.mkdir(parents=True, exist_ok=True)

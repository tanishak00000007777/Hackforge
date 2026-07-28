import difflib
from pathlib import Path


def diff_files(original_root: Path, modified_root: Path, changed_files: list[str]) -> list[dict]:
    diffs = []
    for rel in changed_files:
        orig_path = original_root / rel
        mod_path = modified_root / rel
        orig_lines = orig_path.read_text(encoding="utf-8", errors="replace").splitlines(keepends=True) if orig_path.exists() else []
        mod_lines = mod_path.read_text(encoding="utf-8", errors="replace").splitlines(keepends=True) if mod_path.exists() else []

        unified = "".join(difflib.unified_diff(orig_lines, mod_lines, fromfile=f"a/{rel}", tofile=f"b/{rel}"))
        additions = sum(1 for l in unified.splitlines() if l.startswith("+") and not l.startswith("+++"))
        deletions = sum(1 for l in unified.splitlines() if l.startswith("-") and not l.startswith("---"))

        diffs.append({
            "file": rel,
            "additions": additions,
            "deletions": deletions,
            "unified_diff": unified,
        })
    return diffs

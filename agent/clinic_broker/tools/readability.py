"""Flesch-Kincaid readability and plain-language check (`readability_check`)."""

from __future__ import annotations

import re
from typing import Any

import textstat

BANNED_HEDGING_WORDS = ("modeled", "estimate", "estimated", "percentile", "confidence")


def readability_check(text: str) -> dict[str, Any]:
    """Compute Flesch-Kincaid reading grade and check for banned statistical hedging words.

    The Explainer agent must reach `reading_grade <= 6.0` and contain zero banned hedging words.
    """
    cleaned = (text or "").strip()
    if not cleaned:
        return {
            "reading_grade": 0.0,
            "passes_grade_6": True,
            "banned_words_found": [],
            "passes_all": True,
        }

    grade = round(float(textstat.flesch_kincaid_grade(cleaned)), 2)
    lower_words = set(re.findall(r"[a-z]+", cleaned.lower()))
    found_banned = [w for w in BANNED_HEDGING_WORDS if w in lower_words]

    return {
        "reading_grade": grade,
        "passes_grade_6": grade <= 6.0,
        "banned_words_found": found_banned,
        "passes_all": (grade <= 6.0) and (len(found_banned) == 0),
    }


"""
Input validation and sanitization utilities
"""

import re


MAX_NOTES_LENGTH = 15000  # characters — roughly ~10 pages of text
MIN_NOTES_LENGTH = 50
ALLOWED_DIFFICULTIES = {"Beginner", "Intermediate", "Advanced"}


def validate_notes(notes: str) -> tuple[bool, str]:
    """
    Validate lecture notes input.
    Returns (is_valid, error_message).
    """
    if not notes or not notes.strip():
        return False, "Lecture notes cannot be empty."
    if len(notes.strip()) < MIN_NOTES_LENGTH:
        return False, f"Notes too short (minimum {MIN_NOTES_LENGTH} characters). Please provide more content."
    if len(notes) > MAX_NOTES_LENGTH:
        return False, f"Notes too long (maximum {MAX_NOTES_LENGTH} characters). Please shorten or split the content."
    return True, ""


def validate_difficulty(difficulty: str) -> tuple[bool, str]:
    """Validate difficulty level selection."""
    if difficulty not in ALLOWED_DIFFICULTIES:
        return False, f"Invalid difficulty '{difficulty}'. Choose from: {', '.join(ALLOWED_DIFFICULTIES)}."
    return True, ""


def validate_prompt_version(version: str) -> tuple[bool, str]:
    """Validate prompt version selection."""
    allowed = {"v1", "v2", "v3"}
    if version not in allowed:
        return False, f"Invalid prompt version '{version}'. Choose from: v1, v2, v3."
    return True, ""


def sanitize_notes(notes: str) -> str:
    """
    Basic sanitization: strip leading/trailing whitespace,
    normalize excessive blank lines, limit line length.
    """
    # Normalize line endings
    notes = notes.replace("\r\n", "\n").replace("\r", "\n")
    # Collapse more than 3 consecutive blank lines
    notes = re.sub(r"\n{4,}", "\n\n\n", notes)
    return notes.strip()

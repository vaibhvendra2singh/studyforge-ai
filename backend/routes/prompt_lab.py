"""
Prompt Lab route — compare all three prompt versions side by side
"""

import json
from flask import Blueprint, request, jsonify
from utils.groq_client import PROMPT_VERSIONS, call_groq
from utils.validators import validate_notes, validate_difficulty, sanitize_notes

prompt_lab_bp = Blueprint("prompt_lab", __name__)


@prompt_lab_bp.route("/prompt-lab/compare", methods=["POST"])
def compare_prompts():
    """
    POST /api/prompt-lab/compare
    Runs the same lecture notes through all 3 prompt versions simultaneously.
    Returns all three outputs for side-by-side comparison.
    """
    try:
        data = request.get_json(force=True)
    except Exception:
        return jsonify({"error": "Invalid JSON body."}), 400

    notes = data.get("notes", "").strip()
    difficulty = data.get("difficulty", "Intermediate")
    versions = data.get("versions", ["v1", "v2", "v3"])

    # Validate
    valid, err = validate_notes(notes)
    if not valid:
        return jsonify({"error": err}), 422

    valid, err = validate_difficulty(difficulty)
    if not valid:
        return jsonify({"error": err}), 422

    notes = sanitize_notes(notes)

    results = {}
    for version in versions:
        if version not in PROMPT_VERSIONS:
            continue
        prompt_fn = PROMPT_VERSIONS[version]["fn"]
        prompt = prompt_fn(notes, difficulty)
        result = call_groq(prompt, temperature=0.4)
        results[version] = {
            "name": PROMPT_VERSIONS[version]["name"],
            "success": result["success"],
            "content": result.get("content", ""),
            "error": result.get("error", ""),
            "usage": result.get("usage", {}),
            "prompt_preview": prompt[:500] + "..." if len(prompt) > 500 else prompt,
        }

    return jsonify({
        "success": True,
        "results": results,
        "difficulty": difficulty,
        "notes_length": len(notes),
    })


@prompt_lab_bp.route("/prompt-lab/prompts", methods=["GET"])
def get_prompt_definitions():
    """
    GET /api/prompt-lab/prompts
    Returns the prompt templates (with a sample input) for review.
    """
    sample = "[Your lecture notes will be inserted here]"
    output = {}
    for key, val in PROMPT_VERSIONS.items():
        prompt_text = val["fn"](sample, "Intermediate")
        output[key] = {
            "name": val["name"],
            "full_prompt": prompt_text,
        }
    return jsonify(output)

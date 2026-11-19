"""
Evaluate route — handles rubric-based manual evaluation scoring
"""

import json
import os
from datetime import datetime
from flask import Blueprint, request, jsonify

evaluate_bp = Blueprint("evaluate", __name__)

def get_eval_file_path() -> str:
    # If on Vercel or read-only filesystem, use /tmp
    if os.environ.get("VERCEL") or not os.access(os.path.dirname(__file__), os.W_OK):
        return "/tmp/evaluations.json"
    return os.path.join(os.path.dirname(__file__), "..", "data", "evaluations.json")


def load_evaluations() -> list:
    path = get_eval_file_path()
    try:
        if os.path.exists(path):
            with open(path, "r") as f:
                return json.load(f)
    except Exception:
        pass
    return []


def save_evaluations(evals: list):
    path = get_eval_file_path()
    try:
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, "w") as f:
            json.dump(evals, f, indent=2)
    except Exception as e:
        print(f"Error saving evaluations: {e}")


@evaluate_bp.route("/evaluate", methods=["POST"])
def submit_evaluation():
    """
    POST /api/evaluate
    Submit a manual rubric score for a generated study pack.
    
    Rubric dimensions (each scored 1–5):
    - factual_accuracy: Does content match the input notes?
    - relevance: Is content relevant to the notes topic?
    - completeness: Does the pack cover all requested sections?
    - question_quality: Are MCQs/SAQs meaningful and clear?
    - formatting: Is the output well-structured and readable?
    """
    try:
        data = request.get_json(force=True)
    except Exception:
        return jsonify({"error": "Invalid JSON."}), 400

    required_fields = ["test_id", "prompt_version", "difficulty", "rubric_scores", "notes_snippet"]
    for field in required_fields:
        if field not in data:
            return jsonify({"error": f"Missing field: {field}"}), 422

    rubric = data["rubric_scores"]
    dimensions = ["factual_accuracy", "relevance", "completeness", "question_quality", "formatting"]
    for dim in dimensions:
        if dim not in rubric:
            return jsonify({"error": f"Missing rubric dimension: {dim}"}), 422
        score = rubric[dim]
        if not isinstance(score, (int, float)) or not (1 <= score <= 5):
            return jsonify({"error": f"Score for '{dim}' must be between 1 and 5."}), 422

    total = sum(rubric[d] for d in dimensions)
    average = round(total / len(dimensions), 2)

    entry = {
        "id": datetime.utcnow().strftime("%Y%m%d%H%M%S%f"),
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "test_id": data["test_id"],
        "prompt_version": data["prompt_version"],
        "difficulty": data["difficulty"],
        "notes_snippet": data["notes_snippet"][:200],
        "rubric_scores": rubric,
        "total_score": total,
        "average_score": average,
        "notes": data.get("notes", ""),
        "failure_notes": data.get("failure_notes", ""),
    }

    evals = load_evaluations()
    evals.append(entry)
    save_evaluations(evals)

    return jsonify({
        "success": True,
        "entry": entry,
        "message": "Evaluation recorded successfully."
    })


@evaluate_bp.route("/evaluate", methods=["GET"])
def get_evaluations():
    """GET /api/evaluate — retrieve all recorded evaluations."""
    evals = load_evaluations()
    return jsonify({"evaluations": evals, "count": len(evals)})


@evaluate_bp.route("/evaluate", methods=["DELETE"])
def reset_all_evaluations():
    """DELETE /api/evaluate — remove all evaluation records."""
    save_evaluations([])
    return jsonify({"success": True, "message": "All evaluations reset successfully."})


@evaluate_bp.route("/evaluate/<eval_id>", methods=["DELETE"])
def delete_evaluation(eval_id: str):
    """DELETE /api/evaluate/<id> — remove a single evaluation record."""
    evals = load_evaluations()
    new_evals = [e for e in evals if e.get("id") != eval_id]
    if len(new_evals) == len(evals):
        return jsonify({"error": "Evaluation not found."}), 404
    save_evaluations(new_evals)
    return jsonify({"success": True, "message": "Evaluation deleted."})

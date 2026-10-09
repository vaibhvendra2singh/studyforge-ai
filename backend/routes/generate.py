"""
Generate route — handles study pack generation from lecture notes
"""

import json
from flask import Blueprint, request, jsonify
from utils.groq_client import PROMPT_VERSIONS, call_groq
from utils.validators import validate_notes, validate_difficulty, validate_prompt_version, sanitize_notes
from utils.pdf_parser import extract_text_from_pdf

generate_bp = Blueprint("generate", __name__)


@generate_bp.route("/generate", methods=["POST"])
def generate_study_pack():
    """
    POST /api/generate
    Accepts JSON or multipart form data.
    Returns AI-generated study pack content.
    """
    # ── Determine input type ──────────────────────────────────────────
    subject = ""
    mcq_count = 5
    saq_count = 3
    output_types = []

    if request.content_type and "multipart/form-data" in request.content_type:
        # File upload or form
        notes = request.form.get("notes", "").strip()
        difficulty = request.form.get("difficulty", "Intermediate")
        prompt_version = request.form.get("prompt_version", "v2")
        subject = request.form.get("subject", "").strip()
        try:
            mcq_count = int(request.form.get("mcq_count", 5))
            saq_count = int(request.form.get("saq_count", 3))
        except (ValueError, TypeError):
            mcq_count, saq_count = 5, 3
        
        file_obj = request.files.get("file") or request.files.get("pdf_file")
        if file_obj and file_obj.filename != "":
            fname_lower = file_obj.filename.lower()
            if fname_lower.endswith(".pdf"):
                try:
                    pdf_bytes = file_obj.read()
                    notes = extract_text_from_pdf(pdf_bytes)
                except ValueError as e:
                    return jsonify({"error": str(e)}), 422
            elif fname_lower.endswith((".txt", ".md", ".text")):
                try:
                    notes = file_obj.read().decode("utf-8", errors="ignore")
                except Exception as e:
                    return jsonify({"error": f"Failed to read file: {str(e)}"}), 422
            else:
                return jsonify({"error": "Only PDF and TXT files are supported."}), 400
        elif not notes:
            return jsonify({"error": "No file or notes provided."}), 400
    else:
        # JSON body
        try:
            data = request.get_json(force=True)
        except Exception:
            return jsonify({"error": "Invalid JSON body."}), 400

        notes = data.get("notes", "").strip()
        difficulty = data.get("difficulty", "Intermediate")
        prompt_version = data.get("prompt_version", "v2")
        subject = data.get("subject", "").strip()
        try:
            mcq_count = int(data.get("mcq_count", 5))
            saq_count = int(data.get("saq_count", 3))
        except (ValueError, TypeError):
            mcq_count, saq_count = 5, 3
        output_types = data.get("output_types", [])

    # ── Validate inputs ───────────────────────────────────────────────
    valid, err = validate_notes(notes)
    if not valid:
        return jsonify({"error": err}), 422

    valid, err = validate_difficulty(difficulty)
    if not valid:
        return jsonify({"error": err}), 422

    valid, err = validate_prompt_version(prompt_version)
    if not valid:
        return jsonify({"error": err}), 422

    # ── Sanitize ──────────────────────────────────────────────────────
    notes = sanitize_notes(notes)

    # ── Build prompt ──────────────────────────────────────────────────
    prompt_fn = PROMPT_VERSIONS[prompt_version]["fn"]
    prompt = prompt_fn(
        notes,
        difficulty,
        subject=subject,
        mcq_count=mcq_count,
        saq_count=saq_count,
        output_types=output_types
    )
    prompt_name = PROMPT_VERSIONS[prompt_version]["name"]

    # ── Call Groq API ─────────────────────────────────────────────────
    result = call_groq(prompt)

    if not result["success"]:
        return jsonify({"error": f"AI generation failed: {result['error']}"}), 502

    return jsonify({
        "success": True,
        "content": result["content"],
        "prompt_version": prompt_version,
        "prompt_version_name": prompt_name,
        "difficulty": difficulty,
        "subject": subject,
        "mcq_count": mcq_count,
        "saq_count": saq_count,
        "usage": result["usage"],
        "model": result["model"],
        "notes_length": len(notes),
    })


@generate_bp.route("/generate/stream", methods=["POST"])
def generate_study_pack_stream():
    """
    POST /api/generate/stream
    Streams the AI response using Server-Sent Events (SSE).
    """
    from flask import Response
    from utils.groq_client import call_groq_stream
    
    try:
        data = request.get_json(force=True)
    except Exception:
        return jsonify({"error": "Invalid JSON body."}), 400

    notes = data.get("notes", "").strip()
    difficulty = data.get("difficulty", "Intermediate")
    prompt_version = data.get("prompt_version", "v2")
    subject = data.get("subject", "").strip()
    
    try:
        mcq_count = int(data.get("mcq_count", 5))
        saq_count = int(data.get("saq_count", 3))
    except (ValueError, TypeError):
        mcq_count, saq_count = 5, 3
    output_types = data.get("output_types", [])

    valid, err = validate_notes(notes)
    if not valid:
        return jsonify({"error": err}), 422

    notes = sanitize_notes(notes)
    prompt_fn = PROMPT_VERSIONS[prompt_version]["fn"]
    prompt = prompt_fn(
        notes,
        difficulty,
        subject=subject,
        mcq_count=mcq_count,
        saq_count=saq_count,
        output_types=output_types
    )

    def generate():
        for chunk in call_groq_stream(prompt):
            # Format as SSE
            yield f"data: {json.dumps({'chunk': chunk})}\n\n"
        yield "data: [DONE]\n\n"

    return Response(generate(), content_type='text/event-stream')

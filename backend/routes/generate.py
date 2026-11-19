"""
Generate route — handles study pack generation from lecture notes
"""

import json
import urllib.parse
import urllib.request
import re
from flask import Blueprint, request, jsonify
from utils.groq_client import PROMPT_VERSIONS, call_groq
from utils.validators import validate_notes, validate_difficulty, validate_prompt_version, sanitize_notes
from utils.pdf_parser import extract_text_from_pdf

generate_bp = Blueprint("generate", __name__)


def generate_fallback_svg(topic: str) -> str:
    """
    Generate an offline, guaranteed high-quality SVG concept flowchart.
    """
    topic_clean = topic.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
    return f"""<svg width="100%" height="auto" viewBox="0 0 800 450" xmlns="http://www.w3.org/2000/svg" style="font-family: system-ui, -apple-system, sans-serif;">
  <defs>
    <linearGradient id="cardGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF"/>
      <stop offset="100%" stop-color="#F4F4F0"/>
    </linearGradient>
    <filter id="shadow" x="-5%" y="-5%" width="110%" height="110%">
      <feDropShadow dx="0" dy="4" stdDeviation="6" flood-opacity="0.08"/>
    </filter>
    <marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-reverse">
      <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#18181B"/>
    </marker>
  </defs>

  <rect width="100%" height="100%" fill="#FAF9F6" rx="16"/>
  <rect x="2" y="2" width="796" height="446" fill="none" stroke="#E4E4E7" stroke-width="1.5" rx="15"/>

  <!-- Header -->
  <text x="400" y="52" text-anchor="middle" font-size="20" font-weight="700" fill="#18181B">Concept Architecture: {topic_clean}</text>
  <text x="400" y="76" text-anchor="middle" font-size="12" fill="#71717A">Academic Concept Structure and Workflow</text>

  <!-- Step 1: Input / Origin -->
  <g filter="url(#shadow)">
    <rect x="60" y="140" width="180" height="180" rx="14" fill="url(#cardGrad)" stroke="#D4D4D8" stroke-width="1.5"/>
    <rect x="75" y="155" width="36" height="24" rx="6" fill="#18181B"/>
    <text x="93" y="171" text-anchor="middle" font-size="11" font-weight="700" fill="#FFFFFF">01</text>
    <text x="75" y="210" font-size="16" font-weight="700" fill="#18181B">Foundations</text>
    <text x="75" y="235" font-size="12" fill="#52525B">Core principles &amp;</text>
    <text x="75" y="252" font-size="12" fill="#52525B">fundamental axioms</text>
    <text x="75" y="270" font-size="12" fill="#52525B">governing {topic_clean}</text>
  </g>

  <!-- Arrow 1 -> 2 -->
  <line x1="240" y1="230" x2="305" y2="230" stroke="#18181B" stroke-width="2" marker-end="url(#arrow)"/>

  <!-- Step 2: Core Mechanism -->
  <g filter="url(#shadow)">
    <rect x="310" y="125" width="180" height="210" rx="14" fill="#18181B" stroke="#000000" stroke-width="1.5"/>
    <rect x="325" y="140" width="36" height="24" rx="6" fill="#FFFFFF"/>
    <text x="343" y="156" text-anchor="middle" font-size="11" font-weight="700" fill="#18181B">02</text>
    <text x="325" y="195" font-size="16" font-weight="700" fill="#FFFFFF">Mechanism</text>
    <text x="325" y="220" font-size="12" fill="#D4D4D8">Primary transformations,</text>
    <text x="325" y="237" font-size="12" fill="#D4D4D8">interactions &amp; functional</text>
    <text x="325" y="254" font-size="12" fill="#D4D4D8">processes in motion</text>
    <rect x="325" y="280" width="150" height="26" rx="6" fill="#27272A"/>
    <text x="400" y="297" text-anchor="middle" font-size="11" font-weight="600" fill="#A1A1AA">Central Hub</text>
  </g>

  <!-- Arrow 2 -> 3 -->
  <line x1="490" y1="230" x2="555" y2="230" stroke="#18181B" stroke-width="2" marker-end="url(#arrow)"/>

  <!-- Step 3: Outcomes -->
  <g filter="url(#shadow)">
    <rect x="560" y="140" width="180" height="180" rx="14" fill="url(#cardGrad)" stroke="#D4D4D8" stroke-width="1.5"/>
    <rect x="575" y="155" width="36" height="24" rx="6" fill="#18181B"/>
    <text x="593" y="171" text-anchor="middle" font-size="11" font-weight="700" fill="#FFFFFF">03</text>
    <text x="575" y="210" font-size="16" font-weight="700" fill="#18181B">Synthesis</text>
    <text x="575" y="235" font-size="12" fill="#52525B">Resulting products,</text>
    <text x="575" y="252" font-size="12" fill="#52525B">applications &amp;</text>
    <text x="575" y="270" font-size="12" fill="#52525B">practical outcomes</text>
  </g>

  <!-- Footer note -->
  <rect x="250" y="390" width="300" height="30" rx="15" fill="#E4E4E7"/>
  <text x="400" y="410" text-anchor="middle" font-size="11" font-weight="600" fill="#3F3F46">StudyForge AI Vector Infographic</text>
</svg>"""


def generate_ai_diagram_svg(topic: str, context: str = "") -> str:
    """
    Generate a clean, modern, responsive SVG infographic diagram for an academic topic using Groq.
    Returns valid <svg> markup or fallback SVG.
    """
    try:
        ctx = f" Context notes: {context[:300]}" if context else ""
        prompt = f"""You are an expert scientific and educational diagram illustrator.
Create a clean, visually informative SVG concept diagram/flowchart for the academic topic: "{topic}".{ctx}

Requirements:
1. Output ONLY a valid <svg ...>...</svg> element. Do NOT wrap in markdown code blocks (no ```xml or ```svg). Do not include any conversational text.
2. The SVG MUST have: width="100%" height="auto" viewBox="0 0 800 500" xmlns="http://www.w3.org/2000/svg"
3. Style: Clean academic editorial infographic. Use an off-white/cream background (#FBFBFA) or dark card background (#18181B) with rounded borders (rx="12").
4. Diagram structure: 4 to 6 connected concept cards/boxes with titles, brief explanations (font-size 11-13px), clear arrow connectors (<path> or <line> with marker-end), and distinct visual grouping.
5. Fonts: sans-serif or system-ui, high contrast, clean typography.
6. Absolutely NO emojis anywhere.
7. Return ONLY the complete SVG markup starting with <svg and ending with </svg>."""
        res = call_groq(prompt)
        if res.get("success") and res.get("content"):
            content = res["content"].strip()
            match = re.search(r"<svg[\s\S]*?</svg>", content, re.IGNORECASE)
            if match:
                return match.group(0)
    except Exception as e:
        print(f"Groq SVG generator error: {e}")
    
    return generate_fallback_svg(topic)


@generate_bp.route("/diagram/generate", methods=["POST"])
def generate_diagram():
    """
    POST /api/diagram/generate
    Accepts JSON: { "topic": str, "notes": str (optional) }
    Returns AI-generated SVG diagram code.
    """
    try:
        data = request.get_json(force=True)
    except Exception:
        data = {}
    topic = data.get("topic", "").strip() or "Academic Concept"
    notes = data.get("notes", "").strip()
    
    svg = generate_ai_diagram_svg(topic, notes)
    if not svg:
        svg = generate_fallback_svg(topic)
        
    return jsonify({
        "success": True,
        "svg": svg,
        "topic": topic
    })


@generate_bp.route("/generate", methods=["POST"])
def generate_study_pack():
    """
    POST /api/generate
    Accepts JSON or multipart form data.
    Returns AI-generated study pack content with AI SVG diagram.
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

    # Educational visual concept diagram & imagery
    topic_name = subject
    if not topic_name:
        for line in result["content"].split("\n"):
            line = line.strip().lstrip("#").strip()
            if line and len(line) < 50 and not any(w in line.lower() for w in ["summary", "study pack", "overview", "notes"]):
                topic_name = line
                break
    if not topic_name:
        topic_name = notes[:40].split("\n")[0].strip() or "Academic Concept"

    # Generate Groq AI SVG concept diagram
    diagram_svg = generate_ai_diagram_svg(topic_name, notes[:300])
    if not diagram_svg:
        diagram_svg = generate_fallback_svg(topic_name)

    return jsonify({
        "success": True,
        "content": result["content"],
        "prompt_version": prompt_version,
        "prompt_version_name": prompt_name,
        "difficulty": difficulty,
        "subject": subject or topic_name,
        "diagram_svg": diagram_svg,
        "image_topic": topic_name,
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

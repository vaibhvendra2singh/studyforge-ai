"""
Groq API client and prompt management utilities
"""

import os
from pathlib import Path
from dotenv import load_dotenv
from groq import Groq

# Load .env from the project root (one level up from backend/)
_root = Path(__file__).resolve().parents[2]
load_dotenv(_root / ".env")

client = Groq(api_key=os.environ.get("GROQ_API_KEY"))

# Use the best model available on this Groq account
MODEL = "openai/gpt-oss-120b"

# ─────────────────────────────────────────────
# PROMPT DEFINITIONS
# ─────────────────────────────────────────────

def get_prompt_v1_basic(notes: str, difficulty: str, **kwargs) -> str:
    """Version 1 – Basic Prompt: minimal instruction, no structure enforced."""
    subject = kwargs.get("subject", "").strip()
    subj_line = f"Subject: {subject}\n" if subject else ""
    return f"""You are a helpful study assistant. Read the following lecture notes and create a study pack.

{subj_line}Difficulty: {difficulty}

Lecture Notes:
{notes}

Please provide:
1. A summary
2. Key concepts
3. Definitions
4. MCQ questions with answers
5. Short answer questions
"""


def get_prompt_v2_constrained(notes: str, difficulty: str, **kwargs) -> str:
    """
    Version 2 – Constraint-Based Improved Prompt:
    adds strict output format, length constraints, and tone guidance.
    """
    subject = kwargs.get("subject", "").strip()
    subj_line = f"SUBJECT / DOMAIN: {subject}\n" if subject else ""
    mcq_count = int(kwargs.get("mcq_count", 5))
    saq_count = int(kwargs.get("saq_count", 3))

    return f"""You are an expert academic tutor specializing in creating structured study materials.

TASK: Transform the provided lecture notes into a comprehensive study pack.
{subj_line}DIFFICULTY LEVEL: {difficulty}
LANGUAGE: Clear, academic English suitable for university students.

CONSTRAINTS:
- Summary must be 150–200 words maximum.
- List exactly 5–8 key concepts, each with a one-sentence explanation.
- Provide exactly 5 definitions in "Term: Definition" format.
- Generate exactly {mcq_count} MCQs with 4 options (A–D) each, mark the correct answer with ✅ and provide a one-sentence explanation.
- Generate exactly {saq_count} short-answer questions with model answers (2–4 sentences each).
- Do NOT include information not present in the notes. If notes are insufficient, say so.
- Avoid hallucination: base all content strictly on the provided text.

OUTPUT FORMAT (use exactly these headers):
## 📝 Summary
[150–200 word summary here]

## 🔑 Key Concepts
- **Concept Name**: One-sentence explanation

## 📖 Definitions
- **Term**: Definition

## ❓ Multiple Choice Questions
**Q1.** [Question]
A) [Option]  B) [Option]  C) [Option]  D) [Option]
✅ Correct Answer: [Letter] — [Brief explanation]

## 💬 Short Answer Questions
**Q1.** [Question]
📌 Model Answer: [2–4 sentence answer]

---

LECTURE NOTES:
{notes}
"""


def get_prompt_v3_multistep(notes: str, difficulty: str, **kwargs) -> str:
    """
    Version 3 – Multi-Step Workflow Prompt:
    Chain-of-thought with explicit reasoning steps before output.
    """
    subject = kwargs.get("subject", "").strip()
    subj_line = f"SUBJECT / DOMAIN: {subject}\n" if subject else ""
    mcq_count = int(kwargs.get("mcq_count", 5))
    saq_count = int(kwargs.get("saq_count", 3))

    return f"""You are a senior academic curriculum designer. You will process lecture notes in THREE explicit steps before producing the final study pack.

{subj_line}DIFFICULTY: {difficulty}

STEP 1 — COMPREHENSION ANALYSIS (think silently, do not output this):
- Identify the main topic and sub-topics.
- Note any technical terms or concepts.
- Assess completeness of the notes.

STEP 2 — CONTENT PLANNING (think silently, do not output this):
- Plan the summary structure.
- Select the most important concepts for the difficulty level.
- Design {mcq_count} MCQs that test understanding, not just recall.
- For Advanced: include application/analysis questions.
- For Intermediate: balance recall and application.
- For Beginner: focus on core recall and understanding.
- Design {saq_count} short-answer questions tailored to {difficulty} level.

STEP 3 — FINAL GENERATION (produce this output):

Begin your response with this line:
[ANALYSIS COMPLETE — Generating {difficulty}-level study pack]

Then produce the study pack using these exact headers:

## 📝 Summary
[Concise 150–200 word summary capturing the core ideas]

## 🔑 Key Concepts  
[5–8 bullet points: **Term**: explanation tailored to {difficulty} level]

## 📖 Definitions
[5 definitions relevant to the difficulty level]

## ❓ Multiple Choice Questions (MCQs)
[{mcq_count} MCQs with 4 options, correct answer marked with ✅ and explanation]

## 💬 Short Answer Questions
[{saq_count} questions with model answers adjusted for {difficulty} level]

## ⚠️ Responsible AI Notice
[1–2 sentences noting that this content is AI-generated and should be verified against course materials]

IMPORTANT GUARDRAILS:
- Only state facts that appear in or are directly inferrable from the notes.
- If a section cannot be completed from the available notes, write: "⚠️ Insufficient information in notes for this section."
- Never fabricate statistics, dates, or author attributions.

LECTURE NOTES:
{notes}
"""


PROMPT_VERSIONS = {
    "v1": {"name": "Basic Prompt", "fn": get_prompt_v1_basic},
    "v2": {"name": "Constraint-Based Prompt", "fn": get_prompt_v2_constrained},
    "v3": {"name": "Multi-Step Workflow Prompt", "fn": get_prompt_v3_multistep},
}


# ─────────────────────────────────────────────
# API CALL UTILITY
# ─────────────────────────────────────────────

def call_groq(prompt: str, temperature: float = 0.4, max_tokens: int = 2048) -> dict:
    """
    Call Groq API and return result dict with content or error.
    """
    try:
        response = client.chat.completions.create(
            model=MODEL,
            messages=[{"role": "user", "content": prompt}],
            temperature=temperature,
            max_tokens=max_tokens,
        )
        content = response.choices[0].message.content
        usage = {
            "prompt_tokens": response.usage.prompt_tokens,
            "completion_tokens": response.usage.completion_tokens,
            "total_tokens": response.usage.total_tokens,
        }
        return {"success": True, "content": content, "usage": usage, "model": MODEL}
    except Exception as e:
        error_msg = str(e)
        return {"success": False, "error": error_msg}

def call_groq_stream(prompt: str, temperature: float = 0.4, max_tokens: int = 2048):
    """
    Call Groq API and yield chunks for SSE streaming.
    """
    try:
        response = client.chat.completions.create(
            model=MODEL,
            messages=[{"role": "user", "content": prompt}],
            temperature=temperature,
            max_tokens=max_tokens,
            stream=True
        )
        for chunk in response:
            if chunk.choices[0].delta.content is not None:
                yield chunk.choices[0].delta.content
    except Exception as e:
        yield f"\\n\\n**Error:** {str(e)}"

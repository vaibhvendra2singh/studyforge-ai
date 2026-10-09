"""
Automated API tests for StudyForge AI backend.
Run: python tests/test_api.py
Requires the Flask app running at http://localhost:5000
"""

import sys
import json
import urllib.request
import os
import urllib.error

BASE_URL = os.environ.get("BASE_URL", f"http://localhost:{os.environ.get('PORT', '5001')}")


def post_json(path: str, payload: dict) -> tuple[int, dict]:
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        BASE_URL + path,
        data=data,
        headers={"Content-Type": "application/json"},
        method="POST"
    )
    try:
        with urllib.request.urlopen(req) as resp:
            return resp.status, json.loads(resp.read())
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read())


def get_json(path: str) -> tuple[int, dict]:
    try:
        with urllib.request.urlopen(BASE_URL + path) as resp:
            return resp.status, json.loads(resp.read())
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read())


# ── Test Cases ──────────────────────────────────
SAMPLE_NOTES = (
    "Machine Learning is a subset of AI. "
    "Supervised learning uses labeled data to train models. "
    "Key algorithms include Linear Regression, Decision Trees, and Neural Networks. "
    "Overfitting occurs when a model performs well on training data but poorly on new data. "
    "The bias-variance tradeoff is central to model selection."
)


def test_generate_valid():
    print("TEST: Valid generation request (v2, Intermediate)...", end=" ")
    status, body = post_json("/api/generate", {
        "notes": SAMPLE_NOTES,
        "difficulty": "Intermediate",
        "prompt_version": "v2",
    })
    assert status == 200, f"Expected 200, got {status}: {body}"
    assert body.get("success"), f"Expected success=True: {body}"
    assert "content" in body, "Missing 'content' field"
    assert len(body["content"]) > 100, "Content too short"
    print("PASS ✓")


def test_generate_empty_notes():
    print("TEST: Empty notes validation...", end=" ")
    status, body = post_json("/api/generate", {
        "notes": "",
        "difficulty": "Beginner",
        "prompt_version": "v1",
    })
    assert status == 422, f"Expected 422, got {status}"
    assert "error" in body
    print("PASS ✓")


def test_generate_too_short():
    print("TEST: Too-short notes validation...", end=" ")
    status, body = post_json("/api/generate", {
        "notes": "short",
        "difficulty": "Beginner",
        "prompt_version": "v1",
    })
    assert status == 422, f"Expected 422, got {status}"
    print("PASS ✓")


def test_generate_invalid_difficulty():
    print("TEST: Invalid difficulty...", end=" ")
    status, body = post_json("/api/generate", {
        "notes": SAMPLE_NOTES,
        "difficulty": "Expert",
        "prompt_version": "v2",
    })
    assert status == 422, f"Expected 422, got {status}"
    print("PASS ✓")


def test_generate_invalid_version():
    print("TEST: Invalid prompt version...", end=" ")
    status, body = post_json("/api/generate", {
        "notes": SAMPLE_NOTES,
        "difficulty": "Intermediate",
        "prompt_version": "v99",
    })
    assert status == 422, f"Expected 422, got {status}"
    print("PASS ✓")


def test_evaluate_valid():
    print("TEST: Valid evaluation submission...", end=" ")
    status, body = post_json("/api/evaluate", {
        "test_id": "TS-TEST",
        "prompt_version": "v2",
        "difficulty": "Intermediate",
        "notes_snippet": SAMPLE_NOTES[:200],
        "rubric_scores": {
            "factual_accuracy": 4,
            "relevance": 5,
            "completeness": 4,
            "question_quality": 3,
            "formatting": 5,
        }
    })
    assert status == 200, f"Expected 200, got {status}: {body}"
    assert body.get("success")
    print("PASS ✓")
    return body.get("entry", {}).get("id")


def test_evaluate_invalid_score():
    print("TEST: Invalid rubric score (out of range)...", end=" ")
    status, body = post_json("/api/evaluate", {
        "test_id": "TS-TEST",
        "prompt_version": "v2",
        "difficulty": "Intermediate",
        "notes_snippet": "test",
        "rubric_scores": {
            "factual_accuracy": 6,  # invalid
            "relevance": 5,
            "completeness": 4,
            "question_quality": 3,
            "formatting": 5,
        }
    })
    assert status == 422, f"Expected 422, got {status}"
    print("PASS ✓")


def test_get_evaluations():
    print("TEST: GET /api/evaluate...", end=" ")
    status, body = get_json("/api/evaluate")
    assert status == 200, f"Expected 200, got {status}"
    assert "evaluations" in body
    print("PASS ✓")


def test_prompt_lab_prompts():
    print("TEST: GET /api/prompt-lab/prompts...", end=" ")
    status, body = get_json("/api/prompt-lab/prompts")
    assert status == 200, f"Expected 200, got {status}"
    assert "v1" in body and "v2" in body and "v3" in body
    print("PASS ✓")


if __name__ == "__main__":
    print("\n" + "="*55)
    print("StudyForge AI — Backend API Tests")
    print("="*55)
    print(f"Target: {BASE_URL}\n")

    tests = [
        test_generate_empty_notes,
        test_generate_too_short,
        test_generate_invalid_difficulty,
        test_generate_invalid_version,
        test_evaluate_invalid_score,
        test_get_evaluations,
        test_prompt_lab_prompts,
        test_evaluate_valid,
    ]

    passed = 0
    failed = 0

    for test_fn in tests:
        try:
            test_fn()
            passed += 1
        except Exception as e:
            print(f"FAIL ✗ — {e}")
            failed += 1

    # Run the live generation test last (costs API tokens)
    print("\n--- Live API test (requires GROQ_API_KEY) ---")
    try:
        test_generate_valid()
        passed += 1
    except Exception as e:
        print(f"FAIL ✗ — {e}")
        failed += 1

    print(f"\n{'='*55}")
    print(f"Results: {passed} passed, {failed} failed")
    print("="*55)
    sys.exit(0 if failed == 0 else 1)

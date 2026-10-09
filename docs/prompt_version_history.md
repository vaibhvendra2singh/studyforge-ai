# Prompt Version History — StudyForge AI

## Evolution of Prompt Design

This document tracks how the prompt was iterated from V1 (basic) → V2 (constrained) → V3 (multi-step).

---

## Version 1 — Basic Prompt (Baseline)

**Date:** Initial design  
**Rationale:** Start with the simplest possible prompt to establish a baseline for comparison.

**Key characteristics:**
- No output format specified
- No length constraints
- No anti-hallucination instructions
- No difficulty adaptation

**Observed failure modes:**
- Output format varies between runs
- Content sometimes includes information beyond the notes
- MCQ answer explanations often missing
- No structured headers → hard to parse programmatically

---

## Version 2 — Constraint-Based Improved Prompt

**Date:** First iteration  
**Rationale:** Fix V1 weaknesses by adding explicit constraints.

**Changes from V1:**
1. Added exact section headers with emoji markers
2. Specified word count for summary (150–200 words)
3. Specified exact counts: 5–8 concepts, 5 definitions, 5 MCQs, 3 SAQs
4. Added anti-hallucination rule: "Do NOT include information not present in the notes"
5. Specified MCQ format: 4 options (A–D), correct answer marked with ✅ + explanation
6. Added model answer format for SAQs

**Expected improvements over V1:**
- Consistent structure across runs
- More predictable output length
- Reduced hallucination
- Better MCQ quality with explanations

---

## Version 3 — Multi-Step Workflow Prompt

**Date:** Second iteration  
**Rationale:** Improve content quality through chain-of-thought reasoning.

**Changes from V2:**
1. Added explicit multi-step structure: Comprehension → Planning → Generation
2. Steps 1 & 2 are silent reasoning (not output) — prevents "thinking out loud" in final output
3. Added difficulty adaptation: Beginner = recall, Intermediate = balance, Advanced = application/analysis
4. Added Responsible AI Notice section in every output
5. Added specific guardrail: "⚠️ Insufficient information in notes for this section" — explicit handling of inadequate input
6. Strengthened anti-fabrication: "Never fabricate statistics, dates, or author attributions"
7. Added output header marker: `[ANALYSIS COMPLETE — Generating X-level study pack]`

**Expected improvements over V2:**
- Better reasoning quality through CoT
- More appropriately difficulty-adapted questions
- More consistent responsible AI behavior
- Explicit handling of edge cases (insufficient notes)

---

## Rubric Comparison (Fill in after testing)

> ⚠️ Record ONLY actual measured scores after testing all 5 samples.

| Dimension | V1 Avg | V2 Avg | V3 Avg |
|-----------|--------|--------|--------|
| Factual Accuracy | ___ | ___ | ___ |
| Relevance | ___ | ___ | ___ |
| Completeness | ___ | ___ | ___ |
| Question Quality | ___ | ___ | ___ |
| Formatting | ___ | ___ | ___ |
| **Overall Average** | ___ | ___ | ___ |

---

## Test Sample Coverage

| Sample | Topic | Difficulty | V1 Tested | V2 Tested | V3 Tested |
|--------|-------|------------|-----------|-----------|-----------|
| TS-01 | Machine Learning | Beginner | ☐ | ☐ | ☐ |
| TS-02 | Photosynthesis | Intermediate | ☐ | ☐ | ☐ |
| TS-03 | French Revolution | Intermediate | ☐ | ☐ | ☐ |
| TS-04 | Prompt Engineering | Advanced | ☐ | ☐ | ☐ |
| TS-05 | Database Normalization | Advanced | ☐ | ☐ | ☐ |

---

## Known Failure Patterns

| Pattern | Version(s) | Description |
|---------|------------|-------------|
| Unstructured output | V1 | Sections sometimes merged or missing |
| Extra-topical content | V1 | Occasionally adds general knowledge beyond notes |
| Verbosity | V2/V3 | Can exceed length constraints on complex topics |
| Incomplete Calvin cycle Q | V2 | MCQs sometimes test trivial facts rather than understanding |
| Analysis level for Beginner | V3 | Occasionally generates intermediate-level Q for Beginner difficulty |

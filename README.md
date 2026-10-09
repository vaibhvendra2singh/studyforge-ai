# ⚡ StudyForge AI — Lecture Notes to Study Pack Generator

> **Bennett University | CSE/IT | Prompt Engineering Mini-Project**  
> AI-powered academic study pack generator using Groq API + Llama 3.3-70B

---

## 📁 Project Structure

```
studyforge-ai/
├── backend/                    ← Flask server
│   ├── app.py                  ← Main application entry point
│   ├── requirements.txt        ← Python dependencies
│   ├── data/                   ← Persisted evaluation records (auto-created)
│   ├── routes/
│   │   ├── generate.py         ← POST /api/generate
│   │   ├── evaluate.py         ← POST/GET /api/evaluate
│   │   └── prompt_lab.py       ← POST /api/prompt-lab/compare
│   └── utils/
│       ├── groq_client.py      ← Groq API client + all 3 prompt versions
│       ├── pdf_parser.py       ← PDF text extraction (PyMuPDF)
│       └── validators.py       ← Input validation & sanitization
├── frontend/
│   ├── templates/
│   │   ├── index.html          ← Main generator page
│   │   ├── prompt_lab.html     ← Prompt comparison page
│   │   └── evaluation.html     ← Evaluation dashboard
│   └── static/
│       ├── css/main.css        ← Complete design system
│       └── js/main.js          ← Frontend logic
├── tests/
│   ├── test_samples.py         ← 5 predefined test samples
│   └── test_api.py             ← Automated API test suite
├── docs/
│   └── prompt_version_history.md  ← Prompt evolution documentation
├── .env.example                ← Environment variable template
├── .gitignore
└── README.md
```

---

## 🚀 Quick Start (One Command)

### Run with Launcher Script:
From the `studyforge-ai/` root folder:

```bash
# Option A: Using the shell script (macOS/Linux)
./run.sh

# Option B: Using Python directly (Cross-platform)
python run.py
```
> Both scripts automatically activate the virtual environment, verify `.env`, start the Flask backend on **http://localhost:5001**, and open your default browser automatically!

---

### Manual Setup (Step-by-Step)

```bash
# 1. Navigate to project
cd studyforge-ai

# 2. Activate virtual environment
source venv/bin/activate        # macOS/Linux
# OR: venv\Scripts\activate     # Windows

# 3. Install dependencies
pip install -r backend/requirements.txt

# 4. Start backend
python backend/app.py
```

Open your browser at **http://localhost:5001**

---

## 🌐 Pages & Features

| URL | Page | Description |
|-----|------|-------------|
| `/` | Generator | Paste notes or upload PDF → select difficulty & prompt version → generate study pack |
| `/prompt-lab` | Prompt Lab | Run same notes through all 3 prompts simultaneously, compare outputs |
| `/evaluation` | Evaluation | Record & view rubric scores, version averages, failure analysis |

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/generate` | Generate a study pack from notes or PDF |
| `POST` | `/api/prompt-lab/compare` | Compare all 3 prompt versions |
| `GET`  | `/api/prompt-lab/prompts` | View raw prompt templates |
| `POST` | `/api/evaluate` | Submit a rubric evaluation |
| `GET`  | `/api/evaluate` | Retrieve all evaluations |
| `DELETE` | `/api/evaluate/<id>` | Delete an evaluation record |

### Generate Endpoint — Request Body
```json
{
  "notes": "Your lecture notes here...",
  "difficulty": "Intermediate",
  "prompt_version": "v2"
}
```

### Generate Endpoint — Response
```json
{
  "success": true,
  "content": "## 📝 Summary\n...",
  "prompt_version": "v2",
  "prompt_version_name": "Constraint-Based Prompt",
  "difficulty": "Intermediate",
  "usage": { "prompt_tokens": 450, "completion_tokens": 820, "total_tokens": 1270 },
  "model": "llama-3.3-70b-versatile"
}
```

---

## 🧪 Running Tests

### Print All Test Samples
```bash
python tests/test_samples.py
```

### Run API Tests (requires running server)
```bash
python tests/test_api.py
```

---

## 🔬 Prompt Versions

### V1 — Basic Prompt
Minimal instruction. No structure enforced. Used as a **comparison baseline**.

```
You are a helpful study assistant. Read the following lecture notes and create a study pack.
Difficulty: {difficulty}
Please provide: 1. A summary 2. Key concepts 3. Definitions 4. MCQ questions with answers 5. Short answer questions
```

### V2 — Constraint-Based Improved Prompt
Adds strict section headers, word/count limits, anti-hallucination rules, and explicit format.
- Summary: 150–200 words
- Exactly 5–8 key concepts
- Exactly 5 definitions
- Exactly 5 MCQs with explanations
- Exactly 3 short-answer questions with model answers

### V3 — Multi-Step Workflow Prompt
Chain-of-thought approach: explicit comprehension, planning, then generation steps.
- Difficulty-adapted content
- Includes Responsible AI Notice section
- Explicit guardrails against fabrication

---

## 📊 Evaluation Rubric

Each generated output is manually scored across 5 dimensions (1–5 scale):

| Dimension | What to Evaluate |
|-----------|------------------|
| **Factual Accuracy** | Does content match the input notes? No hallucinations? |
| **Relevance** | Is content on-topic with the notes? |
| **Completeness** | Are all 5 sections present and adequately filled? |
| **Question Quality** | Are MCQs/SAQs meaningful, clear, and non-trivial? |
| **Formatting** | Is output well-structured and readable? |

**Scoring:**
- 5 = Excellent | 4 = Good | 3 = Acceptable | 2 = Poor | 1 = Very Poor

> ⚠️ Only submit scores after actually testing the output against your input notes.

---

## 🛡️ Responsible AI Safeguards

1. **Anti-hallucination instructions** in all 3 prompt versions
2. **V2 explicitly states**: "Do NOT include information not present in the notes"
3. **V3 generates** a "Responsible AI Notice" in every output
4. **Backend validation** rejects empty inputs and enforces length limits
5. **API key security**: Key is stored in `.env`, never in frontend code
6. **No fabricated scores**: Evaluation dashboard only shows manually submitted data

---

## 🎓 University Milestones

### Milestone 1 — Proposal
- Project: StudyForge AI
- Problem: Students struggle to create structured study materials from raw lecture notes
- Solution: AI-powered study pack generator with prompt engineering comparison
- Stack: Python Flask, Groq API (Llama 3.3-70B), HTML/CSS/JS

### Milestone 2 — Working Prototype
- All three prompt versions implemented and functional
- PDF upload and text input both working
- Prompt Lab comparison running
- Evaluation dashboard recording scores

### Milestone 3 — Final Report & Evaluation
- Completed rubric evaluations across all 5 test samples × 3 prompt versions = 15 evaluations
- Comparison analysis: V3 Multi-Step expected to score highest on question quality
- Failure analysis documented in evaluation dashboard
- Responsible AI safeguards implemented and documented

---

## 🔐 Security Notes

- `GROQ_API_KEY` is loaded from `.env` on the server — never sent to the client
- All API calls to Groq are made from the Flask backend
- Frontend uses `/api/generate` (your server) not Groq directly
- `.env` is in `.gitignore` — never commit API keys

---

## 🛠 Troubleshooting

| Issue | Solution |
|-------|----------|
| `ModuleNotFoundError: No module named 'groq'` | Run `pip install -r backend/requirements.txt` |
| `GROQ_API_KEY not found` | Create `.env` file with your key |
| PDF shows "No readable text" | PDF is image-based — paste text manually |
| Port 5000 already in use | Set `PORT=5001` in `.env` |
| Slow response | Normal — Groq takes 5–20s for complex prompts |

---

## 📚 Tech Stack

| Component | Technology |
|-----------|-----------|
| Backend | Python 3.10+, Flask 3.x |
| AI Model | Groq API — `llama-3.3-70b-versatile` |
| PDF Parsing | PyMuPDF (fitz) |
| Frontend | HTML5, Vanilla CSS, Vanilla JS |
| Markdown Rendering | marked.js (CDN) |
| Data Persistence | JSON file (evaluations.json) |
| Environment | python-dotenv |

---

*Built for Bennett University CSE/IT Prompt Engineering Mini-Project, 2025*

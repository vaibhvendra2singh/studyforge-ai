# 🚀 StudyForge AI — Complete User Guide

Welcome to **StudyForge AI**! This application is designed to take raw, messy lecture notes or massive PDF textbooks and use advanced Artificial Intelligence to instantly forge them into highly structured, exam-ready study materials.

This guide will walk you through every single feature of the app, what it does, and how you can use it to ace your exams.

---

## 🛠️ Feature 1: The Preparation Studio (Study Pack Generator)
**What it does:** This is the core engine of the app. It reads your notes and automatically writes a summary, pulls out key concepts, defines vocabulary, and generates a practice quiz.
**How to use it:**
1. Open the **Preparation** tab on the left sidebar.
2. Under "Input Method", choose whether you want to paste text directly or upload a PDF/TXT file.
3. On the right side, select your **Difficulty Level**.
   - *Beginner:* Focuses on basic recall and simple definitions.
   - *Intermediate:* Balances recall with applying concepts.
   - *Advanced:* Focuses heavily on critical analysis and complex synthesis.
4. Use the sliders to choose how many Multiple Choice Questions (MCQs) and Short Answer Questions (SAQs) you want to be tested on.
5. Click **Generate**!
6. **Real-Time Streaming:** Watch the screen as the AI types out your custom study pack right before your eyes, just like ChatGPT!

---

## 🧪 Feature 2: The Prompt Lab (A/B Testing)
**What it does:** Have you ever wondered how different AI instructions affect the output? The Prompt Lab allows you to run the exact same lecture notes through 3 different AI "Prompt Versions" simultaneously so you can compare the results side-by-side.
**How to use it:**
1. Open the **Prompt Lab** tab on the left sidebar.
2. Paste a difficult concept into the box.
3. Hit **Run All 3 Prompts**.
4. The AI will generate 3 different study packs:
   - **V1 (Basic):** A simple, unconstrained generation.
   - **V2 (Strict Rules):** The AI is forced to follow a highly specific output structure.
   - **V3 (Smart Thinking):** The AI is forced to do a "Chain-of-Thought" reasoning step before it is allowed to write the final study pack.
5. Compare them and see which one yields the best study material for your specific topic!

---

## 📊 Feature 3: Evaluation Dashboard
**What it does:** This is an analytics dashboard that helps you figure out if your AI prompts are actually generating good study materials over time. 
**How to use it:**
1. Open the **Evaluation** tab.
2. You will see a breakdown of how well the AI has performed on past runs based on a strict 5-point rubric:
   - **Factual Accuracy:** Did the AI hallucinate?
   - **Relevance:** Did it stay on topic?
   - **Completeness:** Did it miss anything important?
   - **Question Quality:** Are the practice questions actually challenging?
   - **Formatting:** Did it follow the Markdown structure correctly?
3. Use these metrics to tweak your prompt instructions in the backend if you notice scores dropping.

---

## 📚 Feature 4: The Saved Library
**What it does:** Every time you generate a Study Pack, it is automatically saved to your local Library so you never lose your work.
**How to use it:**
1. Open the **Library** tab on the left sidebar.
2. You will see a grid of all your previously generated Study Packs.
3. You can filter them by "Subject" using the tabs at the top, or use the Search bar to find a specific pack.
4. Click **Open Study Pack** to read it and take the practice quiz again, or click **Copy to Editor** to move the text back into the generator to make a harder version of it!

---

## 💾 Feature 5: Exporting & Downloading
**What it does:** Sometimes you want to study away from the app, or share your study pack with a friend. This feature lets you export the AI's output.
**How to use it:**
1. After generating a Study Pack (or opening one from your Library), look at the top right of the Results view.
2. Click the **Download (Markdown)** button.
3. The app will instantly package the AI's response into a `.md` file and download it to your computer. You can share this file, open it in Notion, Obsidian, or print it out!

---

## 🧠 Behind the Scenes: Advanced Features (For Interviews)
This app contains several high-end architectural features under the hood:
* **CI/CD Testing Pipeline:** The codebase includes a `.github/workflows/ci.yml` file and a `pytest` suite. When code is pushed to GitHub, it is automatically tested for bugs.
* **Retrieval-Augmented Generation (RAG):** The backend includes a `rag_engine.py` skeleton that mathematically chunks massive textbooks, turns them into Vector Embeddings using `sentence-transformers`, and stores them in a local Vector Database to bypass AI token limits.

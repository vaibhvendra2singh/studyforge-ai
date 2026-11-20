// Prompt Lab Controller & Benchmarking
let labDifficulty = 'Intermediate';
  let labTemplates = {"v1": {"name": "Basic Prompt", "full_prompt": "You are a helpful study assistant. Read the following lecture notes and create a study pack.\n\nDifficulty: Intermediate\n\nLecture Notes:\n[Your lecture notes will be inserted here]\n\nPlease provide:\n1. A summary\n2. Key concepts\n3. Definitions\n4. MCQ questions with answers\n5. Short answer questions\n"}, "v2": {"name": "Constraint-Based Prompt", "full_prompt": "You are an expert academic tutor specializing in creating structured study materials.\n\nTASK: Transform the provided lecture notes into a comprehensive study pack.\nDIFFICULTY LEVEL: Intermediate\nLANGUAGE: Clear, academic English suitable for university students.\n\nCONSTRAINTS:\n- Summary must be 150\u2013200 words maximum.\n- List exactly 5\u20138 key concepts, each with a one-sentence explanation.\n- Provide exactly 5 definitions in \"Term: Definition\" format.\n- Generate exactly 5 distinct Multiple Choice Questions (numbered Q1 to Q5).\n- Each MCQ must have exactly 4 choices (A, B, C, D) on separate lines.\n- Do NOT put ticks, checkmarks, or answers on the option lines. Keep all 4 options completely neutral and clean.\n- Place the correct answer and brief explanation strictly on the separate \"Correct Answer:\" line below each question.\n- Generate exactly 3 short-answer questions with model answers (2\u20134 sentences each).\n- Ground all content in the provided lecture notes and topic. If the input is brief or presents a topic outline (e.g. 'explain photosynthesis in detail'), synthesize foundational academic curriculum facts to produce a complete, thorough study pack.\n- Ensure every single section below is fully populated with accurate, high-quality academic content.\n- Do NOT include any emojis anywhere in your output. Use clean, plain academic text only.\n\nOUTPUT FORMAT (use exactly these headers):\n## Summary\n[150\u2013200 word summary here]\n\n## Key Concepts\n- **Concept Name**: One-sentence explanation\n\n## Definitions\n- **Term**: Definition\n\n## Multiple Choice Questions\n**Q1.** [Question text]\nA) [Option A]\nB) [Option B]\nC) [Option C]\nD) [Option D]\nCorrect Answer: [Letter] \u2014 [Brief explanation]\n\n**Q2.** [Question text]\nA) [Option A]\nB) [Option B]\nC) [Option C]\nD) [Option D]\nCorrect Answer: [Letter] \u2014 [Brief explanation]\n\n## Short Answer Questions\n**Q1.** [Question]\nModel Answer: [2\u20134 sentence answer]\n\n---\n\nLECTURE NOTES:\n[Your lecture notes will be inserted here]\n"}, "v3": {"name": "Multi-Step Workflow Prompt", "full_prompt": "You are a senior academic curriculum designer. You will process lecture notes in THREE explicit steps before producing the final study pack.\n\nDIFFICULTY: Intermediate\n\nSTEP 1 \u2014 COMPREHENSION ANALYSIS (think silently, do not output this):\n- Identify the main topic and sub-topics.\n- Note any technical terms or concepts.\n- Assess completeness of the notes.\n\nSTEP 2 \u2014 CONTENT PLANNING (think silently, do not output this):\n- Plan the summary structure.\n- Select the most important concepts for the difficulty level.\n- Design 5 MCQs that test understanding, not just recall.\n- For Advanced: include application/analysis questions.\n- For Intermediate: balance recall and application.\n- For Beginner: focus on core recall and understanding.\n- Design 3 short-answer questions tailored to Intermediate level.\n\nSTEP 3 \u2014 FINAL GENERATION (produce this output):\n\nBegin your response with this line:\n[ANALYSIS COMPLETE \u2014 Generating Intermediate-level study pack]\n\nThen produce the study pack using these exact headers:\n\n## Summary\n[Concise 150\u2013200 word summary capturing the core ideas]\n\n## Key Concepts  \n[5\u20138 bullet points: **Term**: explanation tailored to Intermediate level]\n\n## Definitions\n[5 definitions relevant to the difficulty level]\n\n## Multiple Choice Questions\n**Q1.** [Question text]\nA) [Option A]\nB) [Option B]\nC) [Option C]\nD) [Option D]\nCorrect Answer: [Letter] \u2014 [Brief explanation]\n\n**Q2.** [Question text]\nA) [Option A]\nB) [Option B]\nC) [Option C]\nD) [Option D]\nCorrect Answer: [Letter] \u2014 [Brief explanation]\n\n## Short Answer Questions\n**Q1.** [Question text]\nModel Answer: [2\u20134 sentence answer adjusted for Intermediate level]\n\n**Q2.** [Question text]\nModel Answer: [2\u20134 sentence answer adjusted for Intermediate level]\n\n## Responsible AI Notice\n[1\u20132 sentences noting that this content is AI-generated and should be verified against course materials]\n\nIMPORTANT INSTRUCTIONS:\n- Ground the study pack in the provided lecture notes. If the input is brief or presents a topic outline, draw upon foundational academic curriculum facts to produce a complete, thorough study pack.\n- Always generate all required sections (Summary, Key Concepts, Definitions, MCQs, Short Answers) with complete, detailed academic content.\n- Never leave sections blank or substitute placeholders.\n- Do NOT use any emojis anywhere in your output. Use clean, plain academic text only.\n\nLECTURE NOTES:\n[Your lecture notes will be inserted here]\n"}};
  const labResults = { v1: null, v2: null, v3: null };

  // Character counter
  function initLabNotesCounter() {
    const notesInput = document.getElementById('lab-notes-input');
    const charCounter = document.getElementById('lab-char-counter');
    if (notesInput && charCounter && !notesInput._hasCounterListener) {
      notesInput._hasCounterListener = true;
      notesInput.addEventListener('input', () => {
        const len = notesInput.value.length;
        charCounter.textContent = `${len.toLocaleString()} / 15,000 characters`;
        charCounter.style.color = len > 15000 ? '#e53e3e' : '';
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLabNotesCounter);
  } else {
    initLabNotesCounter();
  }

  let currentInspectorVersion = 'v1';
  let inspectorDifficulty = 'Intermediate';

  function setLabDifficulty(diff) {
    labDifficulty = diff;
    document.querySelectorAll('[id^="ldiff-"]').forEach(b => b.classList.remove('active'));
    const btn = document.getElementById(`ldiff-${diff.toLowerCase()}`);
    if (btn) btn.classList.add('active');
    changeInspectorDifficulty(diff);
  }

  async function changeInspectorDifficulty(diff) {
    inspectorDifficulty = diff;
    document.querySelectorAll('[id^="insp-diff-"]').forEach(b => b.classList.remove('active'));
    const btn = document.getElementById(`insp-diff-${diff.toLowerCase()}`);
    if (btn) btn.classList.add('active');
    
    // Fetch fresh prompt text for the selected difficulty level
    try {
      const res = await fetch(`/api/prompt-lab/prompts?difficulty=${diff}`);
      labTemplates = await res.json();
      showTemplate(currentInspectorVersion);
    } catch (e) {
      console.warn("Could not fetch prompt definitions:", e);
    }
  }

  function setButtonsDisabled(disabled) {
    const selector = '[id^="btn-run-"], [id^="btn-card-"], #btn-run-lab';
    document.querySelectorAll(selector).forEach(b => b.disabled = disabled);
  }

  const VERSION_INFO = {
    v1: { name: 'V1 Basic', badge: 'V1 BASIC' },
    v2: { name: 'V2 Strict Rules', badge: 'V2 STRUCTURED' },
    v3: { name: 'V3 Smart Thinking', badge: 'V3 STEP-BY-STEP' }
  };

  // Helper to extract clean title from notes
  function getSubjectFromNotes(notes) {
    if (!notes) return 'Lecture Study Pack';
    const firstLine = notes.trim().split('\n')[0].replace(/[#*_`]/g, '').trim();
    if (firstLine.length > 3 && firstLine.length < 50) return firstLine;
    return 'Lecture Study Pack';
  }

  // Open study pack in full page results view
  function openLabPackInFullPage(ver) {
    const res = labResults[ver];
    const notes = document.getElementById('lab-notes-input').value.trim();

    let content = res?.content;
    if (!content) {
      // If not in memory, check if column has text
      const outCol = document.getElementById(`lab-out-${ver}`);
      if (outCol && outCol.innerText && !outCol.innerText.includes('Not run yet') && !outCol.innerText.includes('Generating')) {
        content = outCol.innerText;
      }
    }

    if (!content) {
      // Run and open
      runPromptAndOpenPage(ver);
      return;
    }

    const title = getSubjectFromNotes(notes);
    const packData = {
      id: `pack-${Date.now()}`,
      content: content,
      prompt_version: ver,
      difficulty: labDifficulty,
      subject: title,
      date: new Date().toISOString().slice(0, 10),
      questionCount: 8,
      notes: notes
    };

    localStorage.setItem('studyforge_open_pack', JSON.stringify(packData));

    try {
      let library = JSON.parse(localStorage.getItem('studyforge_library_packs') || '[]');
      library.unshift(packData);
      localStorage.setItem('studyforge_library_packs', JSON.stringify(library));
    } catch(e) {}

    if (typeof switchView === 'function') { switchView('results'); } else { window.location.href = '/#results'; }
  }

  // Run a single prompt and automatically open it in the full study pack page
  async function runPromptAndOpenPage(ver) {
    const notes = document.getElementById('lab-notes-input').value.trim();
    if (!notes) {
      alert("Please paste your notes first.");
      document.getElementById('lab-notes-input').focus();
      return;
    }

    const loading = document.getElementById('lab-loading-indicator');
    const errAlert = document.getElementById('lab-error-alert');
    const loadText = document.getElementById('lab-loading-text');
    const loadSubtext = document.getElementById('lab-loading-subtext');

    if (loading) {
      loading.style.display = 'block';
      loading.scrollIntoView({ behavior: 'smooth' });
    }
    if (errAlert) errAlert.style.display = 'none';
    if (loadText) loadText.textContent = `Running ${VERSION_INFO[ver]?.name || ver}...`;
    if (loadSubtext) loadSubtext.textContent = 'Generating study pack with Groq AI and opening in full page...';

    setButtonsDisabled(true);

    try {
      const resp = await fetch('/api/prompt-lab/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notes: notes,
          difficulty: labDifficulty,
          versions: [ver]
        })
      });

      const data = await resp.json();
      if (!resp.ok || !data.success) {
        throw new Error(data.error || `Could not run ${VERSION_INFO[ver]?.name}`);
      }

      const res = data.results && data.results[ver];
      if (!res || !res.content) throw new Error(`No output received for ${ver}`);

      labResults[ver] = res;

      const title = getSubjectFromNotes(notes);
      const packData = {
        id: `pack-${Date.now()}`,
        content: res.content,
        prompt_version: ver,
        difficulty: labDifficulty,
        subject: title,
        date: new Date().toISOString().slice(0, 10),
        questionCount: 8,
        notes: notes
      };

      localStorage.setItem('studyforge_open_pack', JSON.stringify(packData));

      try {
        let library = JSON.parse(localStorage.getItem('studyforge_library_packs') || '[]');
        library.unshift(packData);
        localStorage.setItem('studyforge_library_packs', JSON.stringify(library));
      } catch(e) {}

      if (typeof switchView === 'function') { switchView('results'); } else { window.location.href = '/#results'; }

    } catch (err) {
      if (loading) loading.style.display = 'none';
      if (errAlert) {
        errAlert.style.display = 'block';
        document.getElementById('lab-error-text').textContent = err.message;
      }
      setButtonsDisabled(false);
    }
  }

  async function runSinglePrompt(ver) {
    const notes = document.getElementById('lab-notes-input').value.trim();
    if (!notes) {
      alert("Please paste your notes first.");
      document.getElementById('lab-notes-input').focus();
      return;
    }

    const results = document.getElementById('lab-results-grid');
    const errAlert = document.getElementById('lab-error-alert');
    const outCol = document.getElementById(`lab-out-${ver}`);
    const tokenBadge = document.getElementById(`${ver}-token-badge`);
    const headerBtn = document.getElementById(`btn-open-header-${ver}`);
    const footerBtn = document.getElementById(`btn-open-footer-${ver}`);

    results.style.display = 'block';
    errAlert.style.display = 'none';

    if (tokenBadge) tokenBadge.textContent = 'Generating...';
    if (outCol) {
      outCol.innerHTML = `
        <div style="text-align:center; padding:3.5rem 1rem;">
          <div style="display:inline-block; width:34px; height:34px; border:3px solid var(--rule); border-top-color:var(--ink); border-radius:50%; animation:spin 0.8s linear infinite; margin-bottom:1rem;"></div>
          <div style="font-size:0.9rem; font-weight:600;">Generating ${VERSION_INFO[ver]?.name || ver}...</div>
          <div style="font-size:0.78rem; color:var(--muted); margin-top:0.35rem;">Running with Groq AI</div>
        </div>
      `;
    }

    setButtonsDisabled(true);

    try {
      const resp = await fetch('/api/prompt-lab/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notes: notes,
          difficulty: labDifficulty,
          versions: [ver]
        })
      });

      const data = await resp.json();
      if (!resp.ok || !data.success) {
        throw new Error(data.error || `Could not run ${VERSION_INFO[ver]?.name}`);
      }

      const res = data.results && data.results[ver];
      if (!res) throw new Error(`No output received for ${ver}`);

      labResults[ver] = res;

      if (outCol) {
        const topBanner = `
          <div style="display:flex; justify-content:space-between; align-items:center; background:var(--ink); color:var(--white); padding:0.6rem 0.85rem; border-radius:8px; margin-bottom:1rem; font-size:0.82rem;">
            <span style="font-weight:600;">Full Study Pack Ready</span>
            <button class="btn btn-secondary btn-sm" style="font-size:0.76rem; padding:0.3rem 0.65rem;" onclick="openLabPackInFullPage('${ver}')">Open Full Page →</button>
          </div>
        `;
        outCol.innerHTML = topBanner + marked.parse(res.content || res.error || 'No content generated.');
      }
      if (tokenBadge) {
        tokenBadge.textContent = res.usage?.total_tokens ? `${res.usage.total_tokens} tokens` : 'Done';
      }
      if (headerBtn) headerBtn.style.display = 'inline-flex';
      if (footerBtn) footerBtn.style.display = 'inline-flex';

      document.getElementById('lab-timestamp').textContent = `Updated ${new Date().toLocaleTimeString()}`;

    } catch (err) {
      if (outCol) {
        outCol.innerHTML = `
          <div style="padding:1.5rem; color:#b91c1c; font-size:0.85rem;">
            <strong>Error running ${ver}:</strong> ${err.message}
          </div>
        `;
      }
      if (tokenBadge) tokenBadge.textContent = 'Failed';
      errAlert.style.display = 'block';
      document.getElementById('lab-error-text').textContent = err.message;
    } finally {
      setButtonsDisabled(false);
    }
  }

  async function runPromptComparison() {
    const notes = document.getElementById('lab-notes-input').value.trim();
    if (!notes) {
      alert("Please paste your notes first.");
      document.getElementById('lab-notes-input').focus();
      return;
    }

    const loading = document.getElementById('lab-loading-indicator');
    const results = document.getElementById('lab-results-grid');
    const errAlert = document.getElementById('lab-error-alert');

    results.style.display = 'block';
    loading.style.display = 'block';
    errAlert.style.display = 'none';

    ['v1', 'v2', 'v3'].forEach(v => {
      const b = document.getElementById(`${v}-token-badge`);
      if (b) b.textContent = 'Generating...';
      const out = document.getElementById(`lab-out-${v}`);
      if (out) {
        out.innerHTML = `
          <div style="text-align:center; padding:3.5rem 1rem;">
            <div style="display:inline-block; width:34px; height:34px; border:3px solid var(--rule); border-top-color:var(--ink); border-radius:50%; animation:spin 0.8s linear infinite; margin-bottom:1rem;"></div>
            <div style="font-size:0.9rem; font-weight:600;">Generating ${VERSION_INFO[v]?.name}...</div>
            <div style="font-size:0.78rem; color:var(--muted); margin-top:0.35rem;">Benchmarking on Groq</div>
          </div>
        `;
      }
    });

    setButtonsDisabled(true);

    try {
      const resp = await fetch('/api/prompt-lab/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notes: notes,
          difficulty: labDifficulty,
          versions: ['v1', 'v2', 'v3']
        })
      });

      const data = await resp.json();
      if (!resp.ok || !data.success) {
        throw new Error(data.error || 'Could not compare prompts');
      }

      ['v1', 'v2', 'v3'].forEach(v => {
        const res = data.results && data.results[v];
        const out = document.getElementById(`lab-out-${v}`);
        const badge = document.getElementById(`${v}-token-badge`);
        const headerBtn = document.getElementById(`btn-open-header-${v}`);
        const footerBtn = document.getElementById(`btn-open-footer-${v}`);

        if (res && out) {
          labResults[v] = res;
          const topBanner = `
            <div style="display:flex; justify-content:space-between; align-items:center; background:var(--ink); color:var(--white); padding:0.6rem 0.85rem; border-radius:8px; margin-bottom:1rem; font-size:0.82rem;">
              <span style="font-weight:600;">Full Study Pack Ready</span>
              <button class="btn btn-secondary btn-sm" style="font-size:0.76rem; padding:0.3rem 0.65rem;" onclick="openLabPackInFullPage('${v}')">Open Full Page →</button>
            </div>
          `;
          out.innerHTML = topBanner + marked.parse(res.content || res.error || 'No content');
        }
        if (res && badge) {
          badge.textContent = res.usage?.total_tokens ? `${res.usage.total_tokens} tokens` : 'Done';
        }
        if (headerBtn) headerBtn.style.display = 'inline-flex';
        if (footerBtn) footerBtn.style.display = 'inline-flex';
      });

      document.getElementById('lab-timestamp').textContent = `Done at ${new Date().toLocaleTimeString()}`;

    } catch (err) {
      errAlert.style.display = 'block';
      document.getElementById('lab-error-text').textContent = err.message;
    } finally {
      setButtonsDisabled(false);
      loading.style.display = 'none';
    }
  }

  function rateLabOutput(ver) {
    window.location.href = `/evaluation?ver=${ver}`;
  }

  async function togglePromptInspector() {
    const content = document.getElementById('inspector-content');
    const icon = document.getElementById('inspector-toggle-icon');
    if (content.style.display === 'none') {
      content.style.display = 'block';
      icon.textContent = '▲ HIDE';
      if (!labTemplates.v1) {
        const res = await fetch(`/api/prompt-lab/prompts?difficulty=${labDifficulty}`);
        labTemplates = await res.json();
        showTemplate(currentInspectorVersion || 'v1');
      }
    } else {
      content.style.display = 'none';
      icon.textContent = '▼ SHOW';
    }
  }

  function showTemplate(v) {
    currentInspectorVersion = v;
    document.querySelectorAll('[id^="btn-insp-"]').forEach(b => b.classList.remove('active'));
    document.getElementById(`btn-insp-${v}`).classList.add('active');
    document.getElementById('raw-template-code').textContent = labTemplates[v]?.full_prompt || 'Loading...';
  }

  // Auto-load prompt templates immediately on page load
  document.addEventListener('DOMContentLoaded', async () => {
    try {
      const res = await fetch(`/api/prompt-lab/prompts?difficulty=${labDifficulty}`);
      labTemplates = await res.json();
      showTemplate(currentInspectorVersion || 'v1');
    } catch (e) {
      console.warn("Could not load prompt templates on init:", e);
    }
  });

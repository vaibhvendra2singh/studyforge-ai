/* ==========================================================================
   STUDYFORGE AI — FRONTEND CORE ENGINE
   Strict Monochrome Architecture, View Routing, Interactive MCQs & Groq Integration
   ========================================================================== */

// ── GLOBAL APPLICATION STATE ───────────────────────────────────────────────
const appState = {
  currentView: 'dashboard',
  currentResultTab: 'overview',
  difficulty: 'Intermediate',
  promptVersion: 'v2',
  inputMethod: 'text',
  selectedFile: null,
  currentNotes: '',
  subject: '',
  mcqCount: 5,
  saqCount: 3,
  lastResult: null,
  evalScores: {
    factual_accuracy: 5,
    relevance: 5,
    completeness: 5,
    question_quality: 5,
    formatting: 5
  },
  libraryPacks: []
};

// Helper to escape HTML safely
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Prompt Version Descriptions in simple English
const PROMPT_DESCRIPTIONS = {
  v1: '<strong>Basic:</strong> A simple instruction. See what the AI does without strict rules.',
  v2: '<strong>Strict Rules:</strong> The AI must follow a strict format and exactly match your settings.',
  v3: '<strong>Smart Thinking:</strong> The AI takes its time to plan and think before writing the best study pack.'
};

// ── INITIALIZATION ────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initLibraryStorage();
  initRouting();
  initDragDropZone();
  initEventListeners();
  updateCharCounter();
  updateDashboardMetrics();
  
  // Safety fallback for entrance animations
  setTimeout(() => {
    document.body.classList.remove('anim-slide-down');
  }, 2200);
});

// ── ROUTING & VIEW SWITCHER ───────────────────────────────────────────────
function initRouting() {
  const hash = window.location.hash.replace('#', '');
  const path = window.location.pathname;
  const navType = performance.getEntriesByType("navigation")[0]?.type;

  if (path === '/prompt-lab' || path === '/evaluation') {
    return; // These are separate server-rendered pages, do not interfere.
  }

  // Respect the path or hash on page load
  if (path === '/generate' || hash === 'generator') {
    history.replaceState(null, '', '/#generator');
    switchView('generator', false);
  } else if (path === '/library' || hash === 'library') {
    history.replaceState(null, '', '/#library');
    switchView('library', false);
  } else if (path === '/settings' || hash === 'settings') {
    history.replaceState(null, '', '/#settings');
    switchView('settings', false);
  } else if (hash === 'results') {
    switchView('results', false);
  } else {
    history.replaceState(null, '', '/#dashboard');
    switchView('dashboard', false);
  }

  window.addEventListener('hashchange', () => {
    const currentHash = window.location.hash.replace('#', '');
    if (['dashboard', 'generator', 'results', 'library', 'settings'].includes(currentHash)) {
      switchView(currentHash, false);
    }
  });
}

function switchView(viewName, updateHash = true) {
  appState.currentView = viewName;
  
  if (updateHash) {
    window.location.hash = viewName;
  }

  // Hide all views
  document.querySelectorAll('.view-panel').forEach(panel => {
    panel.style.display = 'none';
  });

  // Show target view
  const target = document.getElementById(`view-${viewName}`);
  if (target) {
    target.style.display = 'block';
  }

  // Update active navigation buttons (floating pill navbar & sidebar)
  document.querySelectorAll('.pill-nav-item, .sidebar-nav-item').forEach(btn => {
    btn.classList.remove('active');
  });
  const activePill = document.getElementById(`pill-nav-${viewName}`);
  if (activePill) {
    activePill.classList.add('active');
  }
  const activeSidebar = document.getElementById(`nav-btn-${viewName}`);
  if (activeSidebar) {
    activeSidebar.classList.add('active');
  }

  // Update breadcrumb in simple English
  const breadcrumb = document.getElementById('view-breadcrumb');
  if (breadcrumb) {
    const names = {
      dashboard: 'Home',
      generator: 'Preparation',
      results: 'Results & Quiz',
      library: 'Saved Study Packs',
      settings: 'Settings'
    };
    breadcrumb.textContent = names[viewName] || viewName;
  }

  // If opening dashboard, refresh metrics and benchmark
  if (viewName === 'dashboard') {
    updateDashboardMetrics();
  }

  // If opening library, render fresh cards and subject filters
  if (viewName === 'library') {
    renderSubjectFilters();
    renderLibrary();
  }

  // Close mobile drawer if open
  closeMobileMenu();

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ── MOBILE MENU MANAGEMENT (SECTION 14) ───────────────────────────────────
function toggleMobileMenu() {
  const sidebar = document.getElementById('app-sidebar');
  const toggleBtn = document.getElementById('mobile-menu-toggle');
  const isOpen = sidebar.classList.toggle('open');
  toggleBtn.setAttribute('aria-expanded', String(isOpen));
}

function closeMobileMenu() {
  const sidebar = document.getElementById('app-sidebar');
  const toggleBtn = document.getElementById('mobile-menu-toggle');
  if (sidebar && sidebar.classList.contains('open')) {
    sidebar.classList.remove('open');
    if (toggleBtn) toggleBtn.setAttribute('aria-expanded', 'false');
  }
}

// Close mobile drawer on Escape key or outside click
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeMobileMenu();
    closeEvaluationModal();
  }
});

document.addEventListener('click', (e) => {
  const sidebar = document.getElementById('app-sidebar');
  const toggleBtn = document.getElementById('mobile-menu-toggle');
  if (sidebar && sidebar.classList.contains('open')) {
    if (!sidebar.contains(e.target) && (!toggleBtn || !toggleBtn.contains(e.target))) {
      closeMobileMenu();
    }
  }
});

// ── INPUT METHOD & DIFFICULTY ──────────────────────────────────────────────
function switchInputMethod(mode) {
  appState.inputMethod = mode;
  document.getElementById('btn-tab-text').classList.toggle('active', mode === 'text');
  document.getElementById('btn-tab-file').classList.toggle('active', mode === 'file');
  document.getElementById('panel-input-text').style.display = mode === 'text' ? 'block' : 'none';
  document.getElementById('panel-input-file').style.display = mode === 'file' ? 'block' : 'none';
}

function setDifficulty(diff) {
  appState.difficulty = diff;
  document.querySelectorAll('[id^="diff-btn-"]').forEach(btn => btn.classList.remove('active'));
  document.getElementById(`diff-btn-${diff.toLowerCase()}`).classList.add('active');
  document.getElementById('sum-difficulty').textContent = diff;
}

function setPromptVersion(ver) {
  appState.promptVersion = ver;
  document.querySelectorAll('[id^="ver-btn-"]').forEach(btn => btn.classList.remove('active'));
  document.getElementById(`ver-btn-${ver}`).classList.add('active');
  document.getElementById('prompt-desc-display').innerHTML = PROMPT_DESCRIPTIONS[ver];
  
  const names = { v1: 'Basic', v2: 'Strict Rules', v3: 'Smart Thinking' };
  document.getElementById('sum-version').textContent = names[ver];
}

function updateCharCounter() {
  const textarea = document.getElementById('notes-input');
  if (!textarea) return;
  const count = textarea.value.length;
  const el = document.getElementById('char-counter');
  el.textContent = `${count.toLocaleString()} / 15,000 characters`;
  el.classList.toggle('warn', count > 12000);
}

// ── FILE UPLOAD HANDLING (PDF & TXT SUPPORT) ───────────────────────────────
function initDragDropZone() {
  const zone = document.getElementById('file-dropzone');
  if (!zone) return;

  zone.addEventListener('dragover', (e) => {
    e.preventDefault();
    zone.classList.add('drag-over');
  });

  zone.addEventListener('dragleave', () => {
    zone.classList.remove('drag-over');
  });

  zone.addEventListener('drop', (e) => {
    e.preventDefault();
    zone.classList.remove('drag-over');
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleSelectedFileObject(e.dataTransfer.files[0]);
    }
  });
}

function handleFileSelected(event) {
  const file = event.target.files[0];
  if (file) {
    handleSelectedFileObject(file);
  }
}

function handleSelectedFileObject(file) {
  appState.selectedFile = file;
  const name = file.name;
  const sizeKb = (file.size / 1024).toFixed(1);
  document.getElementById('file-name-text').textContent = `${name} (${sizeKb} KB)`;
  document.getElementById('file-chosen-banner').style.display = 'flex';
  showNotificationToast(`Document selected: ${name}`);
}

function clearSelectedFile() {
  appState.selectedFile = null;
  document.getElementById('file-upload-input').value = '';
  document.getElementById('file-chosen-banner').style.display = 'none';
}

// ── GENERATION ENGINE (SECTION 7 & GROQ INTEGRATION) ──────────────────────
async function executeStudyPackGeneration() {
  const errBanner = document.getElementById('gen-error-banner');
  const errText = document.getElementById('gen-error-text');
  const btnGen = document.getElementById('btn-generate-main');
  
  errBanner.style.display = 'none';

  const notesText = document.getElementById('notes-input').value.trim();
  const subjectVal = document.getElementById('subject-input').value.trim();
  const mcqCountVal = parseInt(document.getElementById('mcq-count-select').value, 10) || 5;
  const saqCountVal = parseInt(document.getElementById('saq-count-select').value, 10) || 3;

  if (appState.inputMethod === 'text' && !notesText) {
    errBanner.style.display = 'flex';
    errText.textContent = "Please paste your notes first.";
    return;
  }
  if (appState.inputMethod === 'file' && !appState.selectedFile) {
    errBanner.style.display = 'flex';
    errText.textContent = "Please upload a PDF or TXT file.";
    return;
  }

  btnGen.disabled = true;

  try {
    let response;
    
    // Switch to Results View immediately for streaming
    switchView('results');
    switchResultTab('overview');
    
    const rawContainer = document.getElementById('raw-markdown-content');
    rawContainer.innerHTML = '<div style="color:var(--muted); font-style:italic;">Generating study pack...</div>';
    
    const vNames = { v1: 'V1 BASIC', v2: 'V2 STRUCTURED', v3: 'V3 MULTI-STEP' };
    document.getElementById('res-badge-version').textContent = vNames[appState.promptVersion] || 'V2';
    document.getElementById('res-badge-diff').textContent = appState.difficulty.toUpperCase();
    document.getElementById('result-title-display').textContent = subjectVal || 'Lecture Study Pack';

    if (appState.inputMethod === 'file') {
      const formData = new FormData();
      formData.append('pdf_file', appState.selectedFile);
      formData.append('difficulty', appState.difficulty);
      formData.append('prompt_version', appState.promptVersion);
      formData.append('subject', subjectVal);
      formData.append('mcq_count', mcqCountVal);
      formData.append('saq_count', saqCountVal);
      
      // Fallback to non-streaming for files to keep it simple for now
      response = await fetch('/api/generate', {
        method: 'POST',
        body: formData
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error);
      appState.lastResult = data;
      renderParsedResults(data);
      savePackToLibrary(data);
      showNotificationToast("Study pack generated successfully!");

    } else {
      // Streaming for text input
      response = await fetch('/api/generate/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notes: notesText,
          difficulty: appState.difficulty,
          prompt_version: appState.promptVersion,
          subject: subjectVal,
          mcq_count: mcqCountVal,
          saq_count: saqCountVal
        })
      });

      if (!response.ok) throw new Error("Stream request failed");

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let fullContent = "";
      rawContainer.innerHTML = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunkStr = decoder.decode(value, { stream: true });
        const lines = chunkStr.split('\\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ') && line !== 'data: [DONE]') {
            try {
              const parsed = JSON.parse(line.substring(6));
              fullContent += parsed.chunk;
              rawContainer.innerHTML = marked.parse(fullContent);
            } catch (e) {
              console.error("Stream parse error", e, line);
            }
          }
        }
      }
      
      const finalData = {
        success: true,
        content: fullContent,
        prompt_version: appState.promptVersion,
        difficulty: appState.difficulty,
        subject: subjectVal || 'General Lecture',
        mcq_count: mcqCountVal,
        saq_count: saqCountVal
      };
      
      appState.lastResult = finalData;
      appState.currentNotes = notesText;
      appState.subject = subjectVal || 'General Lecture';

      renderParsedResults(finalData);
      savePackToLibrary(finalData);
      showNotificationToast("Study pack generated successfully!");
    }

  } catch (err) {
    errBanner.style.display = 'flex';
    errText.textContent = err.message;
    switchView('generator');
  } finally {
    btnGen.disabled = false;
  }
}

// ── RESULTS RENDERING & INTERACTIVE MCQS (SECTION 8) ──────────────────────
function renderParsedResults(data) {
  const content = data.content || '';
  
  // 1. Raw Markdown for Overview Tab
  document.getElementById('raw-markdown-content').innerHTML = marked.parse(content);
  
  // 2. Toolbar Badges
  const vNames = { v1: 'V1 BASIC', v2: 'V2 STRUCTURED', v3: 'V3 MULTI-STEP' };
  document.getElementById('res-badge-version').textContent = vNames[data.prompt_version] || 'V2';
  document.getElementById('res-badge-diff').textContent = data.difficulty.toUpperCase();
  document.getElementById('result-title-display').textContent = data.subject || 'Lecture Study Pack';

  // 3. Parse Sections
  const parsed = parseStudyPackContent(content);

  // Tab: Summary
  document.getElementById('res-summary-content').innerHTML = parsed.summary || "Summary generated in Overview.";

  // Tab: Key Concepts
  const conceptsContainer = document.getElementById('res-concepts-list');
  conceptsContainer.innerHTML = '';
  if (parsed.concepts.length > 0) {
    parsed.concepts.forEach(c => {
      const card = document.createElement('div');
      card.className = 'paper-card card-cream';
      card.style.padding = '1rem 1.25rem';
      card.innerHTML = `<p style="margin:0; font-size:0.92rem; color:var(--ink);">${marked.parseInline(c)}</p>`;
      conceptsContainer.appendChild(card);
    });
  } else {
    conceptsContainer.innerHTML = `<p style="color:var(--muted);">View concepts in the Overview tab.</p>`;
  }

  // Tab: Definitions
  const defsContainer = document.getElementById('res-definitions-grid');
  defsContainer.innerHTML = '';
  if (parsed.definitions.length > 0) {
    parsed.definitions.forEach(d => {
      const tile = document.createElement('div');
      tile.className = 'paper-card card-cream';
      tile.style.padding = '1.15rem';
      tile.innerHTML = `<div style="font-size:0.9rem; line-height:1.5;">${marked.parseInline(d)}</div>`;
      defsContainer.appendChild(tile);
    });
  } else {
    defsContainer.innerHTML = `<p style="color:var(--muted);">View definitions in the Overview tab.</p>`;
  }

  // Tab: Interactive MCQs (Section 8: Question, 4 options, Reveal Answer, Correct Answer, Explanation, Difficulty Label)
  const mcqsContainer = document.getElementById('res-panel-mcqs');
  mcqsContainer.innerHTML = '';
  if (parsed.mcqs.length > 0) {
    parsed.mcqs.forEach((mcq, idx) => {
      const card = createInteractiveMcqCard(mcq, idx + 1, data.difficulty);
      mcqsContainer.appendChild(card);
    });
  } else {
    mcqsContainer.innerHTML = `<div class="paper-card card-white"><p>Refer to Overview for MCQ answers.</p></div>`;
  }

  // Tab: Short Answers
  const saqsContainer = document.getElementById('res-panel-saqs');
  saqsContainer.innerHTML = '';
  if (parsed.saqs.length > 0) {
    parsed.saqs.forEach((saq, idx) => {
      const card = document.createElement('div');
      card.className = 'paper-card card-white';
      card.innerHTML = `
        <div style="font-weight:700; font-size:0.98rem; margin-bottom:0.75rem;">Q${idx + 1}. ${saq.question}</div>
        <div class="paper-card card-cream" style="padding:1rem 1.25rem; font-size:0.9rem; line-height:1.6;">
          <div style="font-family:'JetBrains Mono'; font-weight:700; font-size:0.76rem; margin-bottom:0.35rem;">📌 MODEL ANSWER</div>
          ${saq.answer}
        </div>
      `;
      saqsContainer.appendChild(card);
    });
  }

  // Reset to Overview Tab
  switchResultTab('overview');
}

function parseStudyPackContent(text) {
  const result = {
    summary: '',
    concepts: [],
    definitions: [],
    mcqs: [],
    saqs: []
  };

  // Extract Summary
  const sumMatch = text.match(/##\s*📝\s*Summary([\s\S]*?)(?=##|$)/i);
  if (sumMatch) {
    result.summary = sumMatch[1].trim();
  }

  // Extract Key Concepts
  const conMatch = text.match(/##\s*🔑\s*Key Concepts([\s\S]*?)(?=##|$)/i);
  if (conMatch) {
    result.concepts = conMatch[1].trim().split('\n').filter(l => l.trim().startsWith('-') || l.trim().startsWith('*'));
  }

  // Extract Definitions
  const defMatch = text.match(/##\s*📖\s*Definitions([\s\S]*?)(?=##|$)/i);
  if (defMatch) {
    result.definitions = defMatch[1].trim().split('\n').filter(l => l.trim().startsWith('-') || l.trim().startsWith('*'));
  }

  // Extract MCQs
  const mcqMatch = text.match(/##\s*❓\s*(?:Multiple Choice Questions|MCQs)[\s\S]*?([\s\S]*?)(?=##|$)/i);
  if (mcqMatch) {
    const rawMcqSection = mcqMatch[1].trim();
    const qBlocks = rawMcqSection.split(/\*\*(?:Q\d+|Question\s*\d+)\.?\*\*/i).filter(b => b.trim().length > 0);

    qBlocks.forEach(block => {
      const lines = block.trim().split('\n').map(l => l.trim()).filter(l => l.length > 0);
      if (lines.length > 0) {
        const questionText = lines[0].replace(/^[:.\-\s]+/, '');
        const options = [];
        let correctAnswer = '';
        let explanation = '';

        lines.forEach(l => {
          if (l.match(/^[A-D]\)/i) || l.match(/^[A-D]\./i)) {
            options.push(l);
          } else if (l.includes('Correct Answer') || l.includes('✅')) {
            correctAnswer = l.replace(/.*(?:Correct Answer|✅)[:\s]*/i, '').trim();
          }
        });

        if (correctAnswer.includes('—') || correctAnswer.includes('-')) {
          const parts = correctAnswer.split(/[—\-]/);
          correctAnswer = parts[0].trim();
          explanation = parts.slice(1).join(' ').trim();
        }

        if (options.length >= 2) {
          result.mcqs.push({
            question: questionText,
            options: options,
            correct: correctAnswer || 'Refer to text',
            explanation: explanation || 'Derived directly from lecture transcript facts.'
          });
        }
      }
    });
  }

  // Extract Short Answers
  const saqMatch = text.match(/##\s*💬\s*Short Answer Questions([\s\S]*?)(?=##|$)/i);
  if (saqMatch) {
    const rawSaqSection = saqMatch[1].trim();
    const blocks = rawSaqSection.split(/\*\*(?:Q\d+|Question\s*\d+)\.?\*\*/i).filter(b => b.trim().length > 0);
    blocks.forEach(b => {
      const lines = b.trim().split('\n').filter(l => l.trim().length > 0);
      if (lines.length > 0) {
        const qText = lines[0];
        const aText = lines.slice(1).join(' ').replace(/.*Model Answer[:\s]*/i, '');
        result.saqs.push({ question: qText, answer: aText });
      }
    });
  }

  return result;
}

function createInteractiveMcqCard(mcq, num, difficulty) {
  const card = document.createElement('div');
  card.className = 'mcq-card';

  card.innerHTML = `
    <div class="mcq-header">
      <div class="mcq-question">Q${num}. ${mcq.question}</div>
      <span class="stamp">${difficulty.toUpperCase()}</span>
    </div>

    <div class="mcq-options-grid">
      ${mcq.options.map((opt, i) => {
        const letter = String.fromCharCode(65 + i);
        return `
          <button class="mcq-option-btn" onclick="selectMcqOption(this, '${letter}', ${num})">
            <span class="opt-letter">${letter}</span>
            <span>${opt.replace(/^[A-D][\).]\s*/i, '')}</span>
          </button>
        `;
      }).join('')}
    </div>

    <div style="display:flex; justify-content:space-between; align-items:center;">
      <button class="btn btn-ghost btn-sm" onclick="toggleMcqAnswerReveal(${num})">
        👁️ Reveal Answer &amp; Explanation
      </button>
      <span style="font-size:0.75rem; color:var(--muted); font-family:'JetBrains Mono';">MCQ #${num}</span>
    </div>

    <div class="mcq-reveal-box" id="mcq-reveal-${num}">
      <div class="mcq-answer-badge">✅ KEY: ${mcq.correct}</div>
      <p style="font-size:0.86rem; color:var(--ink); margin:0;"><strong>Explanation:</strong> ${mcq.explanation}</p>
    </div>
  `;

  return card;
}

function selectMcqOption(btn, letter, qNum) {
  const container = btn.closest('.mcq-options-grid');
  container.querySelectorAll('.mcq-option-btn').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
}

function toggleMcqAnswerReveal(num) {
  const box = document.getElementById(`mcq-reveal-${num}`);
  if (box) {
    box.classList.toggle('open');
  }
}

function switchResultTab(tabKey) {
  appState.currentResultTab = tabKey;
  
  document.querySelectorAll('.results-tab-btn').forEach(b => b.classList.remove('active'));
  document.getElementById(`tab-btn-${tabKey}`).classList.add('active');

  ['overview', 'summary', 'concepts', 'definitions', 'mcqs', 'saqs'].forEach(k => {
    const p = document.getElementById(`res-panel-${k}`);
    if (p) {
      p.style.display = (k === tabKey) ? 'block' : 'none';
      if (k === 'mcqs' && k === tabKey) p.style.display = 'flex';
    }
  });
}

function copyCurrentOutput() {
  if (!appState.lastResult?.content) return;
  navigator.clipboard.writeText(appState.lastResult.content).then(() => {
    showNotificationToast("Study pack copied to clipboard!");
  });
}

function downloadCurrentOutput() {
  if (!appState.lastResult?.content) return;
  const blob = new Blob([appState.lastResult.content], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `StudyForge-${appState.difficulty}-${Date.now()}.md`;
  a.click();
  URL.revokeObjectURL(url);
  showNotificationToast("Markdown downloaded!");
}

// ── MY STUDY PACKS (SAVED PACKS) ──────────────────────────────────────────
function initLibraryStorage() {
  if (!localStorage.getItem('studyforge_data_wipe_v2')) {
    localStorage.removeItem('studyforge_library_packs');
    localStorage.setItem('studyforge_data_wipe_v2', 'true');
  }

  const stored = localStorage.getItem('studyforge_library_packs');
  if (stored) {
    try {
      appState.libraryPacks = JSON.parse(stored);
    } catch (e) {
      appState.libraryPacks = [];
    }
  } else {
    appState.libraryPacks = [];
  }

  // Ensure legacy fake demo packs are removed from storage
  appState.libraryPacks = appState.libraryPacks.filter(p => p.id !== 'pack-ml-101' && p.id !== 'pack-os-deadlock');
  localStorage.setItem('studyforge_library_packs', JSON.stringify(appState.libraryPacks));

  renderDashboardRecentPacks();
  renderSubjectFilters();
  updateDashboardMetrics();
}

function savePackToLibrary(data) {
  const newPack = {
    id: `pack-${Date.now()}`,
    title: data.subject || "Study Pack",
    subject: data.subject || "General",
    difficulty: data.difficulty || "Intermediate",
    version: data.prompt_version || "v2",
    date: new Date().toISOString().slice(0, 10),
    questionCount: (data.mcq_count || 5) + (data.saq_count || 3),
    content: data.content
  };

  appState.libraryPacks.unshift(newPack);
  localStorage.setItem('studyforge_library_packs', JSON.stringify(appState.libraryPacks));
  renderDashboardRecentPacks();
  renderSubjectFilters();
  updateDashboardMetrics();
}

function renderDashboardRecentPacks() {
  const container = document.getElementById('dashboard-recent-packs');
  if (!container) return;

  const recents = appState.libraryPacks.slice(0, 3);
  if (recents.length === 0) {
    container.innerHTML = `
      <div style="text-align:center; padding:1.75rem 1rem; color:var(--muted);">
        <p style="margin-bottom:0.8rem; font-size:0.92rem;">No study packs yet</p>
        <button class="btn btn-primary btn-sm" onclick="switchView('generator')">Make a Study Pack</button>
      </div>
    `;
    return;
  }

  container.innerHTML = recents.map(pack => `
    <div style="display:flex; justify-content:space-between; align-items:center; padding:0.75rem 1rem; background:var(--card-cream); border:1px solid var(--line); border-radius:12px;">
      <div>
        <div style="font-weight:700; font-size:0.88rem; color:var(--ink);">${escapeHtml(pack.title)}</div>
        <div style="font-size:0.74rem; color:var(--muted);">${escapeHtml(pack.subject)} · ${escapeHtml(pack.difficulty)} · ${escapeHtml(pack.date)}</div>
      </div>
      <button class="btn btn-ghost btn-sm" onclick="loadSavedPack('${pack.id}')">Open →</button>
    </div>
  `).join('');
}

function renderSubjectFilters() {
  const container = document.getElementById('library-subject-filters');
  if (!container) return;

  const subjects = Array.from(new Set(appState.libraryPacks.map(p => (p.subject || '').trim()).filter(Boolean)));
  
  let html = `<button class="segment-btn ${!appState.currentSubjectFilter ? 'active' : ''}" onclick="filterLibrarySubject('ALL')">All Subjects</button>`;
  subjects.forEach(subj => {
    const isActive = appState.currentSubjectFilter === subj ? 'active' : '';
    html += `<button class="segment-btn ${isActive}" onclick="filterLibrarySubject('${escapeHtml(subj)}')">${escapeHtml(subj)}</button>`;
  });
  container.innerHTML = html;
}

function filterLibrarySubject(subj) {
  appState.currentSubjectFilter = subj === 'ALL' ? '' : subj;
  renderSubjectFilters();
  renderLibrary();
}

function renderLibrary() {
  const grid = document.getElementById('library-packs-grid');
  if (!grid) return;

  renderSubjectFilters();

  const query = (document.getElementById('library-search-input')?.value || '').toLowerCase().trim();
  const subjFilter = (appState.currentSubjectFilter || '').toLowerCase().trim();

  const filtered = appState.libraryPacks.filter(p => {
    const titleMatch = (p.title || '').toLowerCase().includes(query);
    const subjMatch = (p.subject || '').toLowerCase().includes(query);
    const matchesQuery = !query || titleMatch || subjMatch;
    const matchesSubj = !subjFilter || (p.subject || '').toLowerCase() === subjFilter;
    return matchesQuery && matchesSubj;
  });

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1 / -1; padding:3rem 1.5rem; text-align:center;" class="paper-card card-white">
        <h3>No study packs yet</h3>
        <p style="color:var(--muted); margin:0.5rem 0 1.25rem 0;">${appState.libraryPacks.length === 0 ? "You have not made any study packs yet." : "No study packs match your search."}</p>
        <button class="btn btn-primary btn-sm" onclick="switchView('generator')">Make a Study Pack</button>
      </div>
    `;
    return;
  }

  grid.innerHTML = filtered.map(pack => `
    <div class="paper-card card-white" style="display:flex; flex-direction:column; justify-content:space-between;">
      <div>
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.75rem;">
          <span class="stamp">${escapeHtml((pack.difficulty || 'Intermediate').toUpperCase())}</span>
          <span class="font-mono" style="font-size:0.72rem; color:var(--muted);">${escapeHtml(pack.date || '')}</span>
        </div>
        <h4 style="margin-bottom:0.4rem; font-size:1.05rem;">${escapeHtml(pack.title)}</h4>
        <p style="font-size:0.82rem; margin:0 0 1rem 0;">${escapeHtml(pack.subject || 'General')} · ${pack.questionCount || 0} Questions</p>
      </div>

      <div style="display:flex; gap:0.5rem; border-top:1px solid var(--line); padding-top:0.85rem;">
        <button class="btn btn-primary btn-sm" style="flex:1;" onclick="loadSavedPack('${pack.id}')">Open Study Pack</button>
        <button class="btn btn-ghost btn-sm" onclick="duplicatePackToEditor('${pack.id}')">Copy to Editor</button>
        <button class="btn btn-ghost btn-sm" onclick="deleteSavedPack('${pack.id}')">✕</button>
      </div>
    </div>
  `).join('');
}

function loadSavedPack(id) {
  const pack = appState.libraryPacks.find(p => p.id === id);
  if (!pack) return;

  appState.lastResult = {
    content: pack.content,
    difficulty: pack.difficulty,
    prompt_version: pack.version || 'v2',
    subject: pack.title
  };

  renderParsedResults(appState.lastResult);
  switchView('results');
}

function duplicatePackToEditor(id) {
  const pack = appState.libraryPacks.find(p => p.id === id);
  if (!pack) return;
  document.getElementById('notes-input').value = pack.content;
  document.getElementById('subject-input').value = pack.title;
  setDifficulty(pack.difficulty || 'Intermediate');
  switchView('generator');
  showNotificationToast("Copied into notes box.");
}

function deleteSavedPack(id) {
  if (!confirm("Delete this study pack?")) return;
  appState.libraryPacks = appState.libraryPacks.filter(p => p.id !== id);
  localStorage.setItem('studyforge_library_packs', JSON.stringify(appState.libraryPacks));
  renderLibrary();
  renderDashboardRecentPacks();
  renderSubjectFilters();
  updateDashboardMetrics();
  showNotificationToast("Study pack deleted.");
}

// ── REAL DASHBOARD METRICS CALCULATION ─────────────────────────────────────
async function updateDashboardMetrics() {
  // 1. Study packs created
  const packsCount = appState.libraryPacks.length;
  const packsEl = document.getElementById('metric-packs');
  if (packsEl) packsEl.textContent = packsCount;

  // 2. Questions generated
  const questionsTotal = appState.libraryPacks.reduce((acc, p) => acc + (Number(p.questionCount) || 0), 0);
  const qEl = document.getElementById('metric-questions');
  if (qEl) qEl.textContent = questionsTotal;

  // 3. Real evaluations count and 4. Average score
  let evals = [];
  try {
    const res = await fetch('/api/evaluate');
    if (res.ok) {
      const data = await res.json();
      evals = data.evaluations || [];
    }
  } catch (e) {
    evals = [];
  }

  const expEl = document.getElementById('metric-experiments');
  if (expEl) expEl.textContent = evals.length;

  const scoreEl = document.getElementById('metric-score');
  if (scoreEl) {
    if (evals.length === 0) {
      scoreEl.textContent = "0";
    } else {
      const sum = evals.reduce((acc, e) => acc + (Number(e.average_score) || 0), 0);
      scoreEl.textContent = (sum / evals.length).toFixed(2);
    }
  }

  renderDashboardRecentPacks();
  renderDashboardBenchmark(evals);
}

function renderDashboardBenchmark(evaluations) {
  const container = document.getElementById('dashboard-benchmark-container');
  if (!container) return;

  if (!evaluations || evaluations.length === 0) {
    container.innerHTML = `
      <div style="text-align:center; padding:1.75rem 1rem; color:var(--muted);">
        <p style="margin-bottom:0.8rem; font-size:0.92rem;">No runs yet</p>
        <a href="/prompt-lab" class="btn btn-secondary btn-sm">Compare Prompts</a>
      </div>
    `;
    return;
  }

  const v1List = evaluations.filter(e => (e.prompt_version || '').toLowerCase() === 'v1');
  const v2List = evaluations.filter(e => (e.prompt_version || '').toLowerCase() === 'v2');
  const v3List = evaluations.filter(e => (e.prompt_version || '').toLowerCase() === 'v3');

  function calcAvg(arr) {
    if (arr.length === 0) return null;
    return (arr.reduce((acc, e) => acc + (Number(e.average_score) || 0), 0) / arr.length);
  }

  const v1Avg = calcAvg(v1List);
  const v2Avg = calcAvg(v2List);
  const v3Avg = calcAvg(v3List);

  container.innerHTML = `
    <p style="font-size:0.82rem; margin-bottom:1rem; color:var(--muted);">Average scores from your test runs:</p>
    <div style="display:flex; flex-direction:column; gap:0.9rem;">
      <div>
        <div style="display:flex; justify-content:space-between; font-size:0.8rem; font-weight:700; margin-bottom:0.3rem;">
          <span>V3 Step-by-Step</span>
          <span class="font-mono">${v3Avg !== null ? v3Avg.toFixed(2) + ' / 5.0' : 'No runs yet'}</span>
        </div>
        <div style="height:8px; background:rgba(15,15,14,0.1); border-radius:9999px; overflow:hidden;">
          <div style="width:${v3Avg !== null ? (v3Avg / 5 * 100).toFixed(1) : 0}%; height:100%; background:var(--ink);"></div>
        </div>
      </div>
      <div>
        <div style="display:flex; justify-content:space-between; font-size:0.8rem; font-weight:700; margin-bottom:0.3rem;">
          <span>V2 Structured</span>
          <span class="font-mono">${v2Avg !== null ? v2Avg.toFixed(2) + ' / 5.0' : 'No runs yet'}</span>
        </div>
        <div style="height:8px; background:rgba(15,15,14,0.1); border-radius:9999px; overflow:hidden;">
          <div style="width:${v2Avg !== null ? (v2Avg / 5 * 100).toFixed(1) : 0}%; height:100%; background:var(--ink);"></div>
        </div>
      </div>
      <div>
        <div style="display:flex; justify-content:space-between; font-size:0.8rem; font-weight:700; margin-bottom:0.3rem;">
          <span>V1 Simple</span>
          <span class="font-mono">${v1Avg !== null ? v1Avg.toFixed(2) + ' / 5.0' : 'No runs yet'}</span>
        </div>
        <div style="height:8px; background:rgba(15,15,14,0.1); border-radius:9999px; overflow:hidden;">
          <div style="width:${v1Avg !== null ? (v1Avg / 5 * 100).toFixed(1) : 0}%; height:100%; background:var(--ink);"></div>
        </div>
      </div>
    </div>
    <div style="margin-top:1.25rem; text-align:right;">
      <a href="/evaluation" class="btn btn-ghost btn-sm">See all scores →</a>
    </div>
  `;
}

// ── EVALUATION MODAL (SECTION 10 & RUBRIC RATINGS) ────────────────────────
function openEvaluationModal() {
  document.getElementById('eval-input-sample-id').value = `TS-${Date.now().toString().slice(-4)}`;
  document.getElementById('eval-modal-backdrop').classList.add('open');
}

function closeEvaluationModal() {
  document.getElementById('eval-modal-backdrop').classList.remove('open');
}

function setRubricStar(dimension, rating) {
  appState.evalScores[dimension] = rating;
  const row = document.querySelector(`.star-rating[data-dim="${dimension}"]`);
  if (!row) return;

  const stars = row.querySelectorAll('.star-btn');
  stars.forEach((btn, idx) => {
    btn.classList.toggle('active', idx < rating);
  });
}

async function submitRubricEvaluation() {
  const sampleId = document.getElementById('eval-input-sample-id').value.trim() || 'TS-01';
  const notesObs = document.getElementById('eval-input-notes').value.trim();
  const btn = document.getElementById('btn-submit-eval');

  btn.disabled = true;
  btn.textContent = "Saving...";

  try {
    const payload = {
      test_id: sampleId,
      prompt_version: appState.lastResult?.prompt_version || appState.promptVersion,
      difficulty: appState.lastResult?.difficulty || appState.difficulty,
      notes_snippet: (appState.currentNotes || 'Sample evaluation notes').slice(0, 200),
      rubric_scores: { ...appState.evalScores },
      failure_notes: notesObs
    };

    const resp = await fetch('/api/evaluate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!resp.ok) {
      throw new Error("Failed to record evaluation.");
    }

    closeEvaluationModal();
    updateDashboardMetrics();
    showNotificationToast("Score saved!");

  } catch (err) {
    alert(err.message);
  } finally {
    btn.disabled = false;
    btn.textContent = "Save Score";
  }
}

// ── SETTINGS & ACCESSIBILITY ──────────────────────────────────────────────
function toggleTheme() {
  const isDark = document.body.classList.contains('theme-dark');
  setTheme(isDark ? 'paper' : 'dark');
}

function setTheme(theme) {
  const paperBtn = document.getElementById('theme-btn-paper');
  if (paperBtn) paperBtn.classList.toggle('active', theme === 'paper');
  const darkBtn = document.getElementById('theme-btn-dark');
  if (darkBtn) darkBtn.classList.toggle('active', theme === 'dark');
  document.body.classList.toggle('theme-dark', theme === 'dark');
  localStorage.setItem('studyforge_theme', theme);

  document.querySelectorAll('.pill-theme-btn').forEach(btn => {
    if (theme === 'dark') {
      btn.innerHTML = `<svg fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/></svg>`;
      btn.title = "Switch to Light Theme";
    } else {
      btn.innerHTML = `<svg fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/></svg>`;
      btn.title = "Switch to Dark Theme";
    }
  });

  showNotificationToast(`Theme set to ${theme}`);
}

function toggleMotionPreference(reduced) {
  document.querySelectorAll('.track-down, .track-up').forEach(tr => {
    tr.style.animationPlayState = reduced ? 'paused' : 'running';
  });
  localStorage.setItem('studyforge_reduced_motion', String(reduced));
  showNotificationToast(reduced ? "Marquee motion paused" : "Marquee motion enabled");
}

async function testApiHealth() {
  try {
    const r = await fetch('/api/health');
    const d = await r.json();
    alert(`Groq API Connected!\nModel: ${d.model}\nProvider: ${d.provider}\nStatus: ${d.status}`);
  } catch (e) {
    alert("Connection check failed.");
  }
}

// ── TOAST NOTIFICATIONS ───────────────────────────────────────────────────
function showNotificationToast(msg) {
  const toast = document.getElementById('toast-notification');
  if (!toast) return;
  toast.textContent = `✓ ${msg}`;
  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
  }, 2600);
}

function handleGlobalSearch(event) {
  const val = event.target.value.trim();
  if (val.length > 2 && appState.currentView !== 'library') {
    switchView('library');
    document.getElementById('library-search-input').value = val;
    renderLibrary();
  }
}

function initEventListeners() {
  // Theme restore
  const savedTheme = localStorage.getItem('studyforge_theme');
  if (savedTheme === 'dark') setTheme('dark');

  const savedMotion = localStorage.getItem('studyforge_reduced_motion');
  if (savedMotion === 'true') {
    const chk = document.getElementById('pref-reduced-motion');
    if (chk) chk.checked = true;
    toggleMotionPreference(true);
  }
}

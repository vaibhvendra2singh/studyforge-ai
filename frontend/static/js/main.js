/* ==========================================================================
   STUDYFORGE AI — FRONTEND CORE ENGINE
   Strict Monochrome Architecture, View Routing, Interactive MCQs & Groq Integration
   ========================================================================== */

// ── GLOBAL APPLICATION STATE ───────────────────────────────────────────────
const appState = {
  currentView: 'dashboard',
  currentResultTab: 'overview',
  difficulty: 'Intermediate',
  promptVersion: 'v3',
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

// ── MECHANICAL WHEEL DIAL PIP MAPPINGS ────────────────────────────────────
const WHEEL_PIP_ANGLES = {
  dashboard: '-56deg',
  generator: '-28deg',
  lab: '0deg',
  evaluation: '28deg',
  library: '56deg'
};

// ── NATIVE WEB AUDIO API SYNTHESIZER (ZERO EXTERNAL ASSETS) ────────────────
let mechanicalAudioCtx = null;
function playMechanicalTick(pitch = 1500, duration = 0.035) {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    if (!mechanicalAudioCtx) {
      mechanicalAudioCtx = new AudioContext();
    }
    if (mechanicalAudioCtx.state === 'suspended') {
      mechanicalAudioCtx.resume();
    }
    const now = mechanicalAudioCtx.currentTime;
    const osc = mechanicalAudioCtx.createOscillator();
    const gain = mechanicalAudioCtx.createGain();
    
    // Crisp tactile mechanical click: downward pitch drop for snap sound
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(pitch, now);
    osc.frequency.exponentialRampToValueAtTime(350, now + duration);
    
    // Punchy, loud, clear mechanical volume
    gain.gain.setValueAtTime(0.38, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    
    osc.connect(gain);
    gain.connect(mechanicalAudioCtx.destination);
    osc.start(now);
    osc.stop(now + duration);
  } catch (e) {
    // Silent fallback
  }
}

// ── INITIALIZATION ────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
  }
  window.scrollTo(0, 0);
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

  // Check if there is an active study pack to open from Prompt Lab or library
  const pendingPackStr = localStorage.getItem('studyforge_open_pack');
  if (pendingPackStr) {
    try {
      const pack = JSON.parse(pendingPackStr);
      localStorage.removeItem('studyforge_open_pack');
      appState.lastResult = pack;
      appState.currentNotes = pack.notes || '';
      appState.subject = pack.subject || 'Lecture Study Pack';
      appState.difficulty = pack.difficulty || 'Intermediate';
      appState.promptVersion = pack.prompt_version || 'v3';
      renderParsedResults(pack);
      history.replaceState(null, '', '/#results');
      switchView('results', false);
      return;
    } catch (e) {
      console.error("Error opening pending pack:", e);
    }
  }

  // Respect the path or hash on page load
  if (path === '/prompt-lab' || hash === 'lab') {
    switchView('lab', false);
  } else if (path === '/evaluation' || hash === 'evaluation') {
    switchView('evaluation', false);
  } else if (path === '/generate' || hash === 'generator') {
    switchView('generator', false);
  } else if (path === '/library' || hash === 'library') {
    switchView('library', false);
  } else if (path === '/settings' || hash === 'settings') {
    switchView('settings', false);
  } else if (hash === 'results') {
    if (appState.lastResult) {
      renderParsedResults(appState.lastResult);
      switchView('results', false);
    } else if (appState.libraryPacks && appState.libraryPacks.length > 0) {
      loadSavedPack(appState.libraryPacks[0].id);
    } else {
      switchView('generator', false);
    }
  } else {
    switchView('dashboard', false);
  }

  window.addEventListener('hashchange', () => {
    const currentHash = window.location.hash.replace('#', '');
    if (currentHash === 'results') {
      const pendingPack = localStorage.getItem('studyforge_open_pack');
      if (pendingPack) {
        try {
          const packData = JSON.parse(pendingPack);
          localStorage.removeItem('studyforge_open_pack');
          appState.lastResult = packData;
          renderParsedResults(packData);
          switchView('results', false);
          return;
        } catch (e) {
          console.error(e);
        }
      } else if (!appState.lastResult && appState.libraryPacks && appState.libraryPacks.length > 0) {
        loadSavedPack(appState.libraryPacks[0].id);
        return;
      }
    }
    if (['dashboard', 'generator', 'results', 'library', 'settings', 'lab', 'evaluation'].includes(currentHash)) {
      switchView(currentHash, false);
    }
  });

  window.addEventListener('popstate', () => {
    const currentPath = window.location.pathname;
    const currentHash = window.location.hash.replace('#', '');
    if (currentPath === '/prompt-lab' || currentHash === 'lab') {
      switchView('lab', false);
    } else if (currentPath === '/evaluation' || currentHash === 'evaluation') {
      switchView('evaluation', false);
    } else if (currentPath === '/generate' || currentHash === 'generator') {
      switchView('generator', false);
    } else if (currentPath === '/library' || currentHash === 'library') {
      switchView('library', false);
    } else if (currentHash === 'results') {
      switchView('results', false);
    } else {
      switchView('dashboard', false);
    }
  });
}

function switchView(viewName, updateHash = true) {
  appState.currentView = viewName;
  
  if (updateHash) {
    if (viewName === 'lab') {
      history.pushState(null, '', '/prompt-lab');
    } else if (viewName === 'evaluation') {
      history.pushState(null, '', '/evaluation');
    } else if (viewName === 'dashboard') {
      history.pushState(null, '', '/');
    } else if (viewName === 'generator') {
      history.pushState(null, '', '/generate');
    } else if (viewName === 'library') {
      history.pushState(null, '', '/library');
    } else {
      window.location.hash = viewName;
    }
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

  // Update active navigation buttons (wheel nav & floating pill navbar & sidebar)
  document.querySelectorAll('.wheel-item').forEach(btn => {
    btn.classList.remove('active');
  });
  const activeWheel = document.getElementById(`wheel-nav-${viewName}`);
  if (activeWheel) {
    activeWheel.classList.add('active');
  }

  // Update mechanical wheel dial active glowing pip position
  const wheelDisk = document.getElementById('wheel-disk');
  if (wheelDisk && WHEEL_PIP_ANGLES[viewName]) {
    wheelDisk.style.setProperty('--pip-angle', WHEEL_PIP_ANGLES[viewName]);
  }

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
      settings: 'Settings',
      lab: 'Prompt Lab',
      evaluation: 'Evaluation'
    };
    breadcrumb.textContent = names[viewName] || viewName;
  }

  // If opening dashboard, refresh metrics and benchmark
  if (viewName === 'dashboard') {
    updateDashboardMetrics();
  } else if (viewName === 'library') {
    renderSubjectFilters();
    renderLibrary();
  } else if (viewName === 'evaluation') {
    if (typeof fetchLiveEvaluations === 'function') {
      fetchLiveEvaluations();
    }
  } else if (viewName === 'lab') {
    if (typeof showTemplate === 'function') {
      showTemplate(typeof currentInspectorVersion !== 'undefined' ? currentInspectorVersion : 'v1');
    }
  }

  // Close mobile drawer if open
  closeMobileMenu();

  window.scrollTo(0, 0);
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
  const btn = document.getElementById(`diff-btn-${diff.toLowerCase()}`);
  if (btn) btn.classList.add('active');
  const sumDiff = document.getElementById('sum-difficulty');
  if (sumDiff) sumDiff.textContent = diff;
}

function setPromptVersion(ver) {
  appState.promptVersion = ver;
  document.querySelectorAll('[id^="ver-btn-"]').forEach(btn => btn.classList.remove('active'));
  const btn = document.getElementById(`ver-btn-${ver}`);
  if (btn) btn.classList.add('active');
  const pDesc = document.getElementById('prompt-desc-display');
  if (pDesc && typeof PROMPT_DESCRIPTIONS !== 'undefined' && PROMPT_DESCRIPTIONS[ver]) {
    pDesc.innerHTML = PROMPT_DESCRIPTIONS[ver];
  }
  
  const names = { v1: 'Basic', v2: 'Strict Rules', v3: 'Smart Thinking' };
  const sumVer = document.getElementById('sum-version');
  if (sumVer) sumVer.textContent = names[ver];
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

      if (!response.ok) {
        let errMessage = "Generation request failed";
        try {
          const errData = await response.json();
          if (errData.error) errMessage = errData.error;
        } catch (e) {}
        throw new Error(errMessage);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let fullContent = "";
      let sseBuffer = "";
      rawContainer.innerHTML = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        sseBuffer += decoder.decode(value, { stream: true });
        const lines = sseBuffer.split('\n');
        sseBuffer = lines.pop() || "";
        
        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('data: ') && trimmed !== 'data: [DONE]') {
            try {
              const parsed = JSON.parse(trimmed.substring(6));
              if (parsed.chunk) {
                fullContent += parsed.chunk;
                rawContainer.innerHTML = marked.parse(stripEmojis(fullContent));
              }
            } catch (e) {
              console.error("Stream parse error", e, trimmed);
            }
          }
        }
      }

      // Safeguard: If streaming was empty or truncated, fetch complete study pack via standard endpoint
      if (!fullContent || fullContent.trim().length < 50) {
        const fallbackRes = await fetch('/api/generate', {
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
        const fallbackData = await fallbackRes.json();
        if (fallbackRes.ok && fallbackData.success && fallbackData.content) {
          fullContent = fallbackData.content;
          rawContainer.innerHTML = marked.parse(stripEmojis(fullContent));
        }
      }
      
      const finalData = {
        success: true,
        content: fullContent,
        prompt_version: appState.promptVersion,
        difficulty: appState.difficulty,
        subject: subjectVal || 'General Lecture',
        image_topic: subjectVal || 'General Lecture',
        mcq_count: mcqCountVal,
        saq_count: saqCountVal
      };
      
      // Fetch AI diagram for streamed results
      try {
        const diagRes = await fetch('/api/diagram/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            topic: subjectVal || 'General Lecture',
            notes: notesText.slice(0, 300)
          })
        });
        if (diagRes.ok) {
          const diagData = await diagRes.json();
          if (diagData.svg) finalData.diagram_svg = diagData.svg;
        }
      } catch (e) { /* silent */ }
      
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

// Strip any emoji characters from text
function stripEmojis(str) {
  if (!str) return '';
  return str
    .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{27BF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1FA00}-\u{1FA9F}\u{FE0F}\u{200D}]/gu, '')
    .trim();
}

// ── RESULTS RENDERING & INTERACTIVE MCQS (SECTION 8) ──────────────────────
function renderParsedResults(data) {
  const content = stripEmojis(data.content || '');
  
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
          <div style="font-family:'JetBrains Mono'; font-weight:700; font-size:0.76rem; margin-bottom:0.35rem;">MODEL ANSWER</div>
          ${saq.answer}
        </div>
      `;
      saqsContainer.appendChild(card);
    });
  }

  // 5. Visual Diagram (AI Vector Diagram only)
  const svgTarget = document.getElementById('res-diagram-svg-target');
  const heading = document.getElementById('res-tab-diagram-heading');
  
  const topic = data.subject || data.image_topic || 'Academic Concept';
  if (heading) heading.textContent = `Visual Diagram: ${topic}`;

  // If diagram SVG is provided, render it directly
  if (data.diagram_svg && svgTarget) {
    svgTarget.innerHTML = data.diagram_svg;
  } else if (svgTarget) {
    // Generate inline on-the-fly if missing
    fetch('/api/diagram/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        topic: topic,
        notes: appState.currentNotes ? appState.currentNotes.slice(0, 300) : ''
      })
    }).then(r => r.json()).then(res => {
      if (res.svg && svgTarget) svgTarget.innerHTML = res.svg;
    }).catch(e => console.error("Auto diagram load error:", e));
  }

  // Update Audio player metadata
  updateAudioDurationDisplay();

  // Reset to Overview Tab
  switchResultTab('overview');
}

async function regenerateVisualDiagram() {
  const svgTarget = document.getElementById('res-diagram-svg-target');
  const loader = document.getElementById('res-diagram-loading');
  const btnRegen = document.getElementById('btn-regen-diagram');
  const topic = appState.subject || appState.lastResult?.subject || 'Academic Concept';

  if (loader) loader.style.display = 'block';
  if (svgTarget) svgTarget.style.opacity = '0.3';
  if (btnRegen) btnRegen.disabled = true;

  try {
    const res = await fetch('/api/diagram/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        topic: topic,
        notes: appState.currentNotes ? appState.currentNotes.slice(0, 300) : ''
      })
    });
    const data = await res.json();
    if (data.svg && svgTarget) {
      svgTarget.innerHTML = data.svg;
      if (appState.lastResult) appState.lastResult.diagram_svg = data.svg;
      showNotificationToast("New AI diagram generated!");
    }
  } catch (err) {
    showNotificationToast("Failed to generate diagram. Try again.");
  } finally {
    if (loader) loader.style.display = 'none';
    if (svgTarget) svgTarget.style.opacity = '1';
    if (btnRegen) btnRegen.disabled = false;
  }
}

function downloadDiagramSvg() {
  const svgTarget = document.getElementById('res-diagram-svg-target');
  if (!svgTarget) return;
  const svgEl = svgTarget.querySelector('svg');
  if (!svgEl) {
    showNotificationToast("No diagram available to download.");
    return;
  }
  const svgData = new XMLSerializer().serializeToString(svgEl);
  const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const topic = (appState.subject || appState.lastResult?.subject || 'Diagram').replace(/\s+/g, '_');
  a.href = url;
  a.download = `StudyForge_${topic}_Diagram.svg`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showNotificationToast("Diagram downloaded!");
}

function parseStudyPackContent(text) {
  text = stripEmojis(text || '');
  const cleanBody = text.replace(/\[ANALYSIS COMPLETE[^\]]*\]/gi, '').trim();
  const result = {
    summary: '',
    concepts: [],
    definitions: [],
    mcqs: [],
    saqs: []
  };

  // Extract Summary
  const sumMatch = cleanBody.match(/(?:##|#|\*\*)\s*(?:\d+[\.:\)]\s*)?Summary(?:\*\*)?([\s\S]*?)(?=(?:##|#|\*\*)\s*(?:\d+[\.:\)]\s*)?(?:Key Concepts|Definitions|Multiple|Practice|MCQs|Short)|$)/i);
  if (sumMatch) {
    result.summary = sumMatch[1].trim();
  } else {
    // Fallback if no explicit header
    const fallbackSum = cleanBody.match(/##\s*Summary([\s\S]*?)(?=##|$)/i);
    if (fallbackSum) result.summary = fallbackSum[1].trim();
  }

  // Extract Key Concepts
  const conMatch = cleanBody.match(/(?:##|#|\*\*)\s*(?:\d+[\.:\)]\s*)?Key Concepts(?:\*\*)?([\s\S]*?)(?=(?:##|#|\*\*)\s*(?:\d+[\.:\)]\s*)?(?:Summary|Definitions|Multiple|Practice|MCQs|Short)|$)/i);
  if (conMatch) {
    result.concepts = conMatch[1].trim().split('\n').filter(l => l.trim().startsWith('-') || l.trim().startsWith('*'));
  }

  // Extract Definitions — handle bullet (-/*), numbered (1.), or plain **Term**: lines
  const defMatch = cleanBody.match(/(?:##|#|\*\*)\s*(?:\d+[\.:\)]\s*)?Definitions(?:\*\*)?([\s\S]*?)(?=(?:##|#|\*\*)\s*(?:\d+[\.:\)]\s*)?(?:Summary|Key Concepts|Multiple|Practice|MCQs|Short)|$)/i);
  if (defMatch) {
    result.definitions = defMatch[1].trim().split('\n').map(l => l.trim()).filter(l => {
      if (!l || l.length < 3) return false;
      return (
        l.startsWith('-') ||
        l.startsWith('*') ||
        /^\d+[\.:\)]/.test(l) ||
        l.includes(':')
      );
    });
  }

  // Extract MCQs (Stateful parser: handles Q1., **Q1.**, Question 1:, 1., **1.**, etc.)
  const mcqMatch = cleanBody.match(/(?:##|#|\*\*)\s*(?:\d+[\.:\)]\s*)?(?:Multiple[- ]?Choice(?:\s+Questions)?|Practice Quiz|MCQs?)(?:\*\*)?([\s\S]*?)(?=(?:##|#|\*\*)\s*(?:\d+[\.:\)]\s*)?(?:Short\s*Answer|SAQs?|Responsible)|$)/i);
  if (mcqMatch) {
    const rawMcqSection = mcqMatch[1].trim();
    const rawLines = rawMcqSection.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    
    // Split inline options like A) ... B) ... into separate lines
    const lines = [];
    for (const line of rawLines) {
      if (/^[A-D][\).]\s+.*?\s+[B-D][\).]/i.test(line)) {
        const parts = line.split(/\s+(?=[A-D][\).])/i).filter(s => s.trim().length > 0);
        lines.push(...parts);
      } else {
        lines.push(line);
      }
    }

    let currentMcq = null;

    for (const line of lines) {
      const qStartMatch = line.match(/^(?:(?:\*{1,2}|#{1,4}\s*)?(?:Q(?:uestion)?\s*\d+|\d+)[\.:\)]\*{0,2})\s*(.*)/i);
      const isOption = /^[A-D][\).:\s-]/i.test(line);
      const isCorrect = /(?:Correct Answer|Answer Key|\bKey\b|Answer\s*:)/i.test(line);

      if (qStartMatch && !isOption && !isCorrect) {
        if (currentMcq && currentMcq.options.length >= 2) {
          result.mcqs.push(currentMcq);
        }
        let qText = qStartMatch[1].trim() || line.replace(/^(?:\*{1,2}|#{1,4}\s*)?(?:Q(?:uestion)?\s*\d+|\d+)[\.:\)]\*{0,2}\s*/i, '').trim();
        qText = qText.replace(/^\*+|\*+$/g, '').trim();
        currentMcq = {
          question: qText,
          options: [],
          correct: '',
          explanation: ''
        };
      } else if (isOption && currentMcq) {
        const cleanOpt = line
          .replace(/^[A-D][\).:\s-]+/i, '')
          .replace(/[\u2705\u2714\u2713\u2611\[x\]]/gi, '')
          .trim();
        currentMcq.options.push(cleanOpt);
      } else if (isCorrect && currentMcq) {
        let cleanAns = line.replace(/.*(?:Correct Answer|Answer Key|\bKey\b|Answer)[:\s*]*/i, '').trim();
        cleanAns = cleanAns.replace(/^\*+|\*+$/g, '').trim();
        if (cleanAns.includes('—') || cleanAns.includes('-')) {
          const parts = cleanAns.split(/[—\-]/);
          currentMcq.correct = parts[0].trim();
          currentMcq.explanation = parts.slice(1).join(' ').trim();
        } else {
          currentMcq.correct = cleanAns;
        }
      } else if (currentMcq && currentMcq.options.length === 0) {
        // Multi-line question text
        currentMcq.question += ' ' + line.replace(/^\*+|\*+$/g, '').trim();
      }
    }

    if (currentMcq && currentMcq.options.length >= 2) {
      result.mcqs.push(currentMcq);
    }
  }

  // Extract Short Answers (Stateful parser)
  const saqMatch = cleanBody.match(/(?:##|#|\*\*)\s*(?:\d+[\.:\)]\s*)?(?:Short\s+Answer(?:\s+Questions)?|SAQs?)(?:\*\*)?([\s\S]*?)(?=(?:##|#|\*\*)\s*(?:\d+[\.:\)]\s*)?(?:Responsible|$)|$)/i);
  if (saqMatch) {
    const rawSaqSection = saqMatch[1].trim();
    const lines = rawSaqSection.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    let currentSaq = null;

    for (const line of lines) {
      const qStartMatch = line.match(/^(?:(?:\*{1,2}|#{1,4}\s*)?(?:Q(?:uestion)?\s*\d+|\d+)[\.:\)]\*{0,2})\s*(.*)/i);
      const isAnswer = /(?:Model Answer|Answer\s*:|\*Model Answer:\*)/i.test(line);

      if (qStartMatch && !isAnswer) {
        if (currentSaq && currentSaq.answer) {
          result.saqs.push(currentSaq);
        }
        let qText = qStartMatch[1].trim() || line.replace(/^(?:\*{1,2}|#{1,4}\s*)?(?:Q(?:uestion)?\s*\d+|\d+)[\.:\)]\*{0,2}\s*/i, '').trim();
        currentSaq = {
          question: qText.replace(/^\*+|\*+$/g, '').trim(),
          answer: ''
        };
      } else if (isAnswer && currentSaq) {
        const cleanAns = line.replace(/.*(?:Model Answer|Answer\s*:|\*Model Answer:\*)[:\s*]*/i, '').trim();
        currentSaq.answer = cleanAns.replace(/^\*+|\*+$/g, '').trim();
      } else if (currentSaq) {
        if (currentSaq.answer) {
          currentSaq.answer += ' ' + line.trim();
        } else {
          currentSaq.question += ' ' + line.trim();
        }
      }
    }

    if (currentSaq && currentSaq.answer) {
      result.saqs.push(currentSaq);
    }
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
        const cleanOpt = opt
          .replace(/^[A-D][\).:\s-]+/i, '')
          .replace(/[\u2705\u2714\u2713\u2611\[x\]]/gi, '')
          .replace(/^\s*[-•]\s*/, '')
          .trim();
        return `
          <button class="mcq-option-btn" data-letter="${letter}" onclick="selectMcqOption(this, '${letter}', ${num})">
            <span class="opt-letter">${letter}</span>
            <span>${cleanOpt}</span>
          </button>
        `;
      }).join('')}
    </div>

    <div style="display:flex; justify-content:space-between; align-items:center;">
      <button class="btn btn-ghost btn-sm" onclick="toggleMcqAnswerReveal(${num})">
        Reveal Answer &amp; Explanation
      </button>
      <span style="font-size:0.75rem; color:var(--muted); font-family:'JetBrains Mono';">MCQ #${num}</span>
    </div>

    <div class="mcq-reveal-box" id="mcq-reveal-${num}">
      <div class="mcq-answer-badge">Answer Key: ${mcq.correct}</div>
      <p style="font-size:0.86rem; color:var(--ink); margin:0;"><strong>Explanation:</strong> ${mcq.explanation || 'Refer to lecture notes.'}</p>
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
  const btn = document.getElementById(`tab-btn-${tabKey}`);
  if (btn) btn.classList.add('active');

  ['overview', 'flashcards', 'summary', 'concepts', 'definitions', 'diagram', 'mcqs', 'saqs'].forEach(k => {
    const p = (k === 'mcqs') ? document.getElementById('res-panel-mcqs-wrapper') : document.getElementById(`res-panel-${k}`);
    if (p) {
      p.style.display = (k === tabKey) ? 'block' : 'none';
      if (k === 'saqs' && k === tabKey) p.style.display = 'flex';
    }
  });

  if (tabKey === 'flashcards') {
    renderFlashcardsFromCurrentPack();
  }
}

function copyCurrentOutput() {
  if (!appState.lastResult?.content) return;
  navigator.clipboard.writeText(appState.lastResult.content).then(() => {
    showNotificationToast("Study pack copied to clipboard!");
  });
}

function downloadCurrentOutput() {
  downloadCurrentPdf();
}

function downloadCurrentPdf() {
  if (!appState.lastResult?.content) {
    showNotificationToast("No study pack available to download.");
    return;
  }
  generateStudyPackPdf(appState.lastResult);
}

function downloadPackPdfById(id) {
  const pack = appState.libraryPacks.find(p => p.id === id);
  if (!pack || !pack.content) {
    showNotificationToast("Study pack not found.");
    return;
  }
  generateStudyPackPdf(pack);
}

async function generateStudyPackPdf(packData) {
  if (!packData || !packData.content) {
    showNotificationToast("No content available to export.");
    return;
  }

  const subject = packData.subject || packData.title || 'Lecture Study Pack';
  const difficulty = (packData.difficulty || 'Intermediate').toUpperCase();
  const cleanTitle = (subject || 'StudyPack').replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `StudyForge_${cleanTitle}_${difficulty}.pdf`;

  showNotificationToast("Generating high-quality PDF document...");

  try {
    // 1. First attempt: Server-side native vector PDF via PyMuPDF
    // Full width, zero cutoffs, clean text
    const response = await fetch('/api/generate/pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subject: subject,
        difficulty: difficulty,
        content: packData.content,
        diagram_svg: packData.diagram_svg || (document.querySelector("#res-diagram-svg-target svg") ? document.querySelector("#res-diagram-svg-target svg").outerHTML : "")
      })
    });

    if (response.ok) {
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }, 1000);
      showNotificationToast("PDF downloaded successfully!");
      return;
    }
  } catch (err) {
    console.warn("Backend PDF generation endpoint failed, falling back to print view:", err);
  }

  // 2. Client-side fallback: Clean formatted window print
  fallbackWindowPrint(packData, filename);
}

function fallbackWindowPrint(packData, filename) {
  const content = stripEmojis(packData.content || '');
  const parsed = parseStudyPackContent(content);
  const subject = packData.subject || packData.title || 'Lecture Study Pack';
  const difficulty = (packData.difficulty || 'Intermediate').toUpperCase();
  const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

  let bodyHtml = `
    <div class="sf-header">
      <div>
        <div class="sf-label">STUDYFORGE AI - STUDY PACK</div>
        <h1 class="sf-title">${escapeHtml(subject)}</h1>
      </div>
      <div class="sf-meta">
        <span class="sf-badge">${difficulty}</span>
        <div class="sf-date">${dateStr}</div>
      </div>
    </div>
  `;

  if (parsed.summary) {
    bodyHtml += `
      <div class="sf-section">
        <h2 class="sf-section-title">Summary</h2>
        <div class="sf-summary-box">${marked.parse(parsed.summary)}</div>
      </div>
    `;
  }

  if (parsed.concepts && parsed.concepts.length > 0) {
    bodyHtml += `
      <div class="sf-section">
        <h2 class="sf-section-title">Key Concepts</h2>
        <ul class="sf-list">
          ${parsed.concepts.map(c => `<li>${marked.parseInline(c.replace(/^[-*]\s*/, ''))}</li>`).join('')}
        </ul>
      </div>
    `;
  }

  if (parsed.definitions && parsed.definitions.length > 0) {
    bodyHtml += `
      <div class="sf-section">
        <h2 class="sf-section-title">Definitions</h2>
        <div class="sf-def-grid">
          ${parsed.definitions.map(d => `<div class="sf-def-item">${marked.parseInline(d.replace(/^[-*]|\d+\.\s*/, ''))}</div>`).join('')}
        </div>
      </div>
    `;
  }

  if (parsed.mcqs && parsed.mcqs.length > 0) {
    bodyHtml += `
      <div class="sf-section">
        <h2 class="sf-section-title">Practice Quiz</h2>
        ${parsed.mcqs.map((mcq, idx) => `
          <div class="sf-mcq">
            <div class="sf-mcq-q">Q${idx + 1}. ${escapeHtml(mcq.question)}</div>
            <div class="sf-opts">
              ${mcq.options.map((opt, i) => {
                const letter = String.fromCharCode(65 + i);
                const clean = opt.replace(/^[A-D][).:\s-]+/i, '').trim();
                return `<div class="sf-opt"><strong>${letter})</strong> ${escapeHtml(clean)}</div>`;
              }).join('')}
            </div>
            <div class="sf-answer"><strong>Answer:</strong> ${escapeHtml(mcq.correct)}${mcq.explanation ? ` &mdash; ${escapeHtml(mcq.explanation)}` : ''}</div>
          </div>
        `).join('')}
      </div>
    `;
  }

  if (parsed.saqs && parsed.saqs.length > 0) {
    bodyHtml += `
      <div class="sf-section">
        <h2 class="sf-section-title">Short Answer Questions</h2>
        ${parsed.saqs.map((saq, idx) => `
          <div class="sf-saq">
            <div class="sf-saq-q">Q${idx + 1}. ${escapeHtml(saq.question)}</div>
            <div class="sf-saq-a"><strong>Model Answer:</strong> ${escapeHtml(saq.answer)}</div>
          </div>
        `).join('')}
      </div>
    `;
  }

  if (!parsed.summary && (!parsed.concepts || parsed.concepts.length === 0)) {
    bodyHtml += `<div class="sf-section">${marked.parse(content)}</div>`;
  }

  bodyHtml += `<div class="sf-footer">Generated by StudyForge AI &mdash; Academic Study Pack</div>`;

  const popup = window.open('', '_blank');
  if (!popup) {
    showNotificationToast("Please allow pop-ups to print PDF.");
    return;
  }

  popup.document.open();
  popup.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${escapeHtml(filename)}</title>
  <style>
    @page { size: A4; margin: 15mm 15mm; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: Arial, Helvetica, sans-serif;
      font-size: 13px;
      color: #000;
      background: #fff;
      padding: 20px;
      max-width: 800px;
      margin: 0 auto;
    }
    .sf-header { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 2px solid #000; padding-bottom: 12px; margin-bottom: 20px; }
    .sf-label { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #555; margin-bottom: 4px; }
    .sf-title { font-size: 22px; font-weight: 800; color: #000; }
    .sf-meta { text-align: right; }
    .sf-badge { display: inline-block; padding: 3px 9px; background: #000; color: #fff; font-size: 9px; font-weight: 700; border-radius: 3px; }
    .sf-date { font-size: 10px; color: #555; margin-top: 4px; }
    .sf-section { margin-bottom: 20px; page-break-inside: avoid; }
    .sf-section-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #000; border-bottom: 1px solid #ccc; padding-bottom: 4px; margin-bottom: 8px; }
    .sf-summary-box { background: #f5f5f5; border-left: 4px solid #000; padding: 10px 14px; font-size: 12.5px; line-height: 1.65; color: #000; }
    .sf-list { padding-left: 18px; }
    .sf-list li { margin-bottom: 5px; font-size: 12.5px; color: #000; line-height: 1.5; }
    .sf-def-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 7px; }
    .sf-def-item { background: #f9f9f9; border: 1px solid #ddd; border-radius: 3px; padding: 7px 9px; font-size: 11.5px; line-height: 1.45; color: #000; }
    .sf-mcq, .sf-saq { border: 1px solid #ddd; border-radius: 4px; padding: 9px 11px; margin-bottom: 10px; background: #fff; page-break-inside: avoid; }
    .sf-mcq-q, .sf-saq-q { font-weight: 700; font-size: 12.5px; margin-bottom: 6px; color: #000; }
    .sf-opts { display: grid; grid-template-columns: 1fr 1fr; gap: 4px; margin-bottom: 7px; }
    .sf-opt { background: #f2f2f2; border-radius: 3px; padding: 4px 7px; font-size: 11px; color: #000; }
    .sf-answer { font-size: 11px; background: #f8f8f8; border-top: 1px dashed #ccc; padding: 5px 7px; color: #000; }
    .sf-saq-a { background: #f5f5f5; border-left: 3px solid #000; padding: 6px 10px; font-size: 11.5px; line-height: 1.55; color: #000; }
    .sf-footer { margin-top: 20px; border-top: 1px solid #ddd; padding-top: 8px; font-size: 9px; color: #777; text-align: center; }
  </style>
</head>
<body>
  ${bodyHtml}
  <script>
    window.onload = function() { setTimeout(function() { window.print(); }, 400); };
  </script>
</body>
</html>`);
  popup.document.close();
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

  if (appState.lastResult) {
    appState.lastResult.id = newPack.id;
  }

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
        <button class="btn btn-secondary btn-sm" onclick="downloadPackPdfById('${pack.id}')">Download PDF</button>
        <button class="btn btn-ghost btn-sm" onclick="deleteSavedPack('${pack.id}')" title="Delete">x</button>
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

async function deleteSavedPack(id) {
  if (!confirm("Delete this study pack?")) return;
  const deletedPack = appState.libraryPacks.find(p => p.id === id);
  appState.libraryPacks = appState.libraryPacks.filter(p => p.id !== id);
  localStorage.setItem('studyforge_library_packs', JSON.stringify(appState.libraryPacks));

  // Sync / adjust evaluations with remaining library packs
  const remainingIds = appState.libraryPacks.map(p => p.id);
  const remainingTitles = appState.libraryPacks.map(p => (p.title || '').toLowerCase());

  try {
    if (appState.libraryPacks.length === 0) {
      await fetch('/api/evaluate', { method: 'DELETE' });
    } else {
      await fetch('/api/evaluate/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          valid_pack_ids: remainingIds,
          valid_titles: remainingTitles,
          deleted_id: id,
          deleted_title: deletedPack ? (deletedPack.title || '').toLowerCase() : ''
        })
      });
    }
  } catch (e) {
    console.error("Error syncing evaluations:", e);
  }

  renderLibrary();
  renderDashboardRecentPacks();
  renderSubjectFilters();
  updateDashboardMetrics();
  showNotificationToast("Study pack deleted and evaluation scores updated.");
}

async function clearAllPacksAndEvaluations() {
  if (!confirm("Delete all study packs and reset all evaluation scores?")) return;
  appState.libraryPacks = [];
  localStorage.removeItem('studyforge_library_packs');
  try {
    await fetch('/api/evaluate', { method: 'DELETE' });
  } catch (e) {
    console.error("Error resetting evaluations:", e);
  }
  renderLibrary();
  renderDashboardRecentPacks();
  renderSubjectFilters();
  updateDashboardMetrics();
  showNotificationToast("All study packs and evaluations have been reset.");
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
      pack_id: appState.lastResult?.id || '',
      pack_title: appState.lastResult?.subject || sampleId,
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
  toast.textContent = ` ${msg}`;
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

  // Floating & Wheel nav hover animation & container shift across all views
  const wheelNav = document.getElementById('wheel-nav');
  const pillNav = document.querySelector('.floating-pill-nav');
  const appContainer = document.querySelector('.app-container');

  if (wheelNav && appContainer) {
    wheelNav.addEventListener('mouseenter', () => {
      document.body.classList.add('wheel-nav-hovered');
    });
    wheelNav.addEventListener('mouseleave', () => {
      document.body.classList.remove('wheel-nav-hovered');
    });
  }

  if (pillNav && appContainer) {
    pillNav.addEventListener('mouseenter', () => {
      document.body.classList.add('nav-is-hovered');
      appContainer.style.paddingLeft = '17.5rem';
    });
    pillNav.addEventListener('mouseleave', () => {
      document.body.classList.remove('nav-is-hovered');
      appContainer.style.paddingLeft = '';
    });
  }

  // Wheel Dial Orbital Pip and Mechanical Tick Listeners
  const wheelButtons = [
    { id: 'wheel-nav-dashboard', angle: '-56deg' },
    { id: 'wheel-nav-generator', angle: '-28deg' },
    { id: 'wheel-nav-lab', angle: '0deg' },
    { id: 'wheel-nav-evaluation', angle: '28deg' },
    { id: 'wheel-nav-library', angle: '56deg' }
  ];
  const disk = document.getElementById('wheel-disk');
  wheelButtons.forEach(wb => {
    const el = document.getElementById(wb.id);
    if (el) {
      el.addEventListener('mouseenter', () => {
        if (disk) {
          disk.style.setProperty('--pip-angle', wb.angle);
          disk.classList.add('pip-active');
        }
      });
      el.addEventListener('mouseleave', () => {
        if (disk) {
          disk.classList.remove('pip-active');
          const currentAngle = WHEEL_PIP_ANGLES[appState.currentView] || '-56deg';
          disk.style.setProperty('--pip-angle', currentAngle);
        }
      });
    }
  });

  // Spotlight Command Palette Listeners
  initCommandPaletteListeners();

  // Global tactile mechanical click audio feedback ONLY on click/press (NEVER on hover)
  document.addEventListener('pointerdown', (e) => {
    const interactive = e.target.closest('button, a, .clickable, .results-tab-btn, .pill-nav-item, .wheel-item, .wheel-hub-toggle, .paper-card, .radio-option, .difficulty-btn, .option-card, .mcq-option-btn, .speed-btn, .podcast-play-btn, .podcast-stop-btn, .palette-item, [role="button"], input[type="radio"], input[type="checkbox"], input[type="button"], input[type="submit"], select, .tab-btn, .chip');
    if (interactive) {
      playMechanicalTick(1500, 0.035);
    }
  }, true);
}


// ==========================================================================
// FEATURE 1: INTERACTIVE FLASHCARDS (SPACED REPETITION)
// ==========================================================================
const flashcardState = {
  cards: [],
  currentIndex: 0,
  isFlipped: false,
  masteredIndices: new Set()
};

function renderFlashcardsFromCurrentPack() {
  if (!appState.lastResult?.content) return;
  const parsed = parseStudyPackContent(appState.lastResult.content);
  flashcardState.cards = [];
  flashcardState.currentIndex = 0;
  flashcardState.isFlipped = false;
  flashcardState.masteredIndices.clear();

  // 1. Add Definitions as flashcards
  (parsed.definitions || []).forEach(d => {
    const clean = d.replace(/^[-*]|\d+\.\s*/, '').trim();
    if (clean.includes(':')) {
      const parts = clean.split(':');
      flashcardState.cards.push({
        term: parts[0].replace(/\*+/g, '').trim(),
        definition: parts.slice(1).join(':').trim(),
        type: 'Definition'
      });
    }
  });

  // 2. Add Key Concepts as flashcards
  (parsed.concepts || []).forEach(c => {
    const clean = c.replace(/^[-*]\s*/, '').trim();
    if (clean.includes(':')) {
      const parts = clean.split(':');
      flashcardState.cards.push({
        term: parts[0].replace(/\*+/g, '').trim(),
        definition: parts.slice(1).join(':').trim(),
        type: 'Key Concept'
      });
    } else {
      flashcardState.cards.push({
        term: 'Concept',
        definition: clean.replace(/\*+/g, '').trim(),
        type: 'Key Concept'
      });
    }
  });

  if (flashcardState.cards.length === 0) {
    flashcardState.cards.push({
      term: 'No Flashcards Found',
      definition: 'Generate a study pack with definitions and concepts to practice flashcards.',
      type: 'Notice'
    });
  }

  updateFlashcardDisplay();
}

function updateFlashcardDisplay() {
  const total = flashcardState.cards.length;
  if (total === 0) return;

  const card = flashcardState.cards[flashcardState.currentIndex];
  const sideLabel = document.getElementById('fc-side-label');
  const cardText = document.getElementById('fc-card-text');
  const badge = document.getElementById('fc-progress-badge');
  const masteryText = document.getElementById('fc-mastery-text');
  const progressBar = document.getElementById('fc-progress-bar');

  if (badge) badge.textContent = `Card ${flashcardState.currentIndex + 1} / ${total}`;
  if (masteryText) masteryText.textContent = `${flashcardState.masteredIndices.size} / ${total} Mastered`;
  if (progressBar) progressBar.style.width = `${(flashcardState.masteredIndices.size / total) * 100}%`;

  if (!flashcardState.isFlipped) {
    if (sideLabel) sideLabel.textContent = `FRONT (${card.type.toUpperCase()})`;
    if (cardText) cardText.textContent = card.term;
  } else {
    if (sideLabel) sideLabel.textContent = `BACK (ANSWER / EXPLANATION)`;
    if (cardText) cardText.textContent = card.definition;
  }
}

function flipFlashcard() {
  flashcardState.isFlipped = !flashcardState.isFlipped;
  updateFlashcardDisplay();
}

function nextFlashcard() {
  if (flashcardState.cards.length === 0) return;
  flashcardState.currentIndex = (flashcardState.currentIndex + 1) % flashcardState.cards.length;
  flashcardState.isFlipped = false;
  updateFlashcardDisplay();
}

function prevFlashcard() {
  if (flashcardState.cards.length === 0) return;
  flashcardState.currentIndex = (flashcardState.currentIndex - 1 + flashcardState.cards.length) % flashcardState.cards.length;
  flashcardState.isFlipped = false;
  updateFlashcardDisplay();
}

function markCardReviewed(isMastered) {
  if (isMastered) {
    flashcardState.masteredIndices.add(flashcardState.currentIndex);
    showNotificationToast("Marked as mastered!");
  } else {
    flashcardState.masteredIndices.delete(flashcardState.currentIndex);
    showNotificationToast("Scheduled for review!");
  }
  nextFlashcard();
}

// Spacebar listener to flip flashcards
document.addEventListener('keydown', (e) => {
  if (e.code === 'Space' && appState.currentResultTab === 'flashcards' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
    e.preventDefault();
    flipFlashcard();
  }
});


// ==========================================================================
// FEATURE 2: AUDIO OVERVIEW / NOTEBOOKLM-STYLE WAVEFORM PLAYER
// ==========================================================================
const audioState = {
  isPlaying: false,
  isPaused: false,
  rate: 1.0,
  utterance: null,
  progressTimer: null,
  elapsedSeconds: 0,
  estimatedDuration: 60,
  fullText: '',
  words: []
};

function formatAudioTime(seconds) {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function updateAudioPlayIcon(state) {
  // state: 'playing' | 'paused' | 'stopped'
  const playIcon = document.getElementById('audio-play-icon');
  const pauseIcon = document.getElementById('audio-pause-icon');
  const playBtn = document.getElementById('btn-audio-play-pause');

  if (playBtn) {
    // Safeguard: remove any text nodes accidentally injected into the circular button
    Array.from(playBtn.childNodes).forEach(node => {
      if (node.nodeType === Node.TEXT_NODE) node.remove();
    });
  }

  if (state === 'playing') {
    // Show PAUSE symbol (❚❚)
    if (playIcon) playIcon.style.display = 'none';
    if (pauseIcon) pauseIcon.style.display = 'block';
  } else {
    // Show PLAY symbol (▶) to resume or start
    if (playIcon) playIcon.style.display = 'block';
    if (pauseIcon) pauseIcon.style.display = 'none';
  }
}

function getAudioNarrationText() {
  // 1. From appState.lastResult
  if (appState.lastResult?.content) {
    const parsed = parseStudyPackContent(appState.lastResult.content);
    const summary = (parsed.summary || '').replace(/<[^>]*>/g, '').trim();
    const concepts = (parsed.concepts || []).map(c => c.replace(/<[^>]*>/g, '').replace(/^[-*]\s*/, '').trim()).filter(Boolean);
    const parts = [
      `Study briefing for ${appState.lastResult.subject || 'your lecture'}.`,
      summary ? `Summary: ${summary}` : '',
      concepts.length > 0 ? `Key Concepts: ${concepts.join('. ')}` : ''
    ].filter(Boolean);
    if (parts.length > 0) return parts.join(' ');
  }

  // 2. From DOM summary element
  const summaryEl = document.getElementById('res-summary-content');
  if (summaryEl && summaryEl.innerText.trim()) {
    const title = document.getElementById('result-title-display')?.innerText || 'Lecture';
    return `Study briefing for ${title}. Summary: ${summaryEl.innerText.trim()}`;
  }

  // 3. From library packs if available
  if (appState.libraryPacks && appState.libraryPacks.length > 0 && appState.libraryPacks[0].content) {
    const pack = appState.libraryPacks[0];
    const parsed = parseStudyPackContent(pack.content);
    const summary = (parsed.summary || '').replace(/<[^>]*>/g, '').trim();
    if (summary) return `Study briefing for ${pack.title || 'your lecture'}. Summary: ${summary}`;
  }

  // 4. From generator text box
  const notesInput = document.getElementById('input-lecture-notes');
  if (notesInput && notesInput.value.trim()) {
    return `Lecture overview: ${notesInput.value.trim().slice(0, 800)}`;
  }

  return '';
}

function updateAudioDurationDisplay() {
  const text = getAudioNarrationText();
  const totalTimeEl = document.getElementById('audio-time-total');
  if (!text) {
    if (totalTimeEl) totalTimeEl.textContent = '0:00';
    return;
  }
  const words = text.split(/\s+/).filter(Boolean);
  audioState.fullText = text;
  audioState.words = words;
  audioState.estimatedDuration = Math.max(10, Math.round((words.length / 140) * 60 / audioState.rate));
  if (totalTimeEl) totalTimeEl.textContent = formatAudioTime(audioState.estimatedDuration);
}

function toggleAudioOverview() {
  const bar = document.getElementById('audio-player-bar');
  if (!bar) return;
  if (bar.style.display === 'none' || !bar.style.display) {
    bar.style.display = 'flex';
    updateAudioDurationDisplay();
    playMechanicalTick(1800, 0.015);
    // Start playback immediately when user clicks Listen
    if (!audioState.isPlaying) {
      playPauseAudio();
    }
  } else {
    bar.style.display = 'none';
    stopAudio();
    playMechanicalTick(1200, 0.015);
  }
}

function playPauseAudio() {
  if (!window.speechSynthesis) {
    showNotificationToast("Text-to-speech not supported in this browser.");
    return;
  }

  const statusLabel = document.getElementById('audio-status-label');
  const eq = document.getElementById('audio-eq');

  // Case 1: Currently Playing -> Pause it
  if (audioState.isPlaying && !audioState.isPaused) {
    audioState.isPaused = true;
    try {
      window.speechSynthesis.cancel(); // Cancel cleanly to avoid Chromium freeze
    } catch (e) {}
    if (audioState.progressTimer) clearInterval(audioState.progressTimer);
    updateAudioPlayIcon('paused'); // Shows PLAY symbol (▶) to resume
    if (statusLabel) statusLabel.textContent = 'Paused';
    if (eq) eq.classList.remove('playing');
    playMechanicalTick(1400, 0.012);
    return;
  }

  // Case 2: Currently Paused -> Resume from current offset
  if (audioState.isPaused) {
    audioState.isPaused = false;
    audioState.isPlaying = true;
    updateAudioPlayIcon('playing'); // Shows PAUSE symbol (❚❚)
    if (statusLabel) statusLabel.textContent = 'Playing lecture audio...';
    if (eq) eq.classList.add('playing');
    playMechanicalTick(2000, 0.012);

    // Calculate words to speak from resume position
    const words = audioState.words.length > 0 ? audioState.words : (getAudioNarrationText().split(/\s+/).filter(Boolean));
    const fraction = audioState.estimatedDuration > 0 ? Math.min(0.95, audioState.elapsedSeconds / audioState.estimatedDuration) : 0;
    const startWord = Math.floor(words.length * fraction);
    const resumeText = words.slice(startWord).join(' ') || audioState.fullText;

    startSpeechEngine(resumeText);
    startAudioProgressLoop();
    return;
  }

  // Case 3: Start from beginning
  const textToRead = getAudioNarrationText();
  if (!textToRead) {
    showNotificationToast("Please paste or generate lecture notes first.");
    return;
  }

  audioState.fullText = textToRead;
  audioState.words = textToRead.split(/\s+/).filter(Boolean);
  audioState.elapsedSeconds = 0;
  audioState.isPaused = false;
  audioState.isPlaying = true;
  updateAudioDurationDisplay();
  updateAudioPlayIcon('playing'); // Shows PAUSE symbol (❚❚)

  if (statusLabel) statusLabel.textContent = 'Playing lecture audio...';
  if (eq) eq.classList.add('playing');
  playMechanicalTick(2000, 0.015);

  const bar = document.getElementById('audio-progress-bar');
  if (bar) bar.style.width = '0%';
  const elTime = document.getElementById('audio-time-elapsed');
  if (elTime) elTime.textContent = '0:00';

  startSpeechEngine(textToRead);
  startAudioProgressLoop();
}

function startSpeechEngine(text) {
  try {
    window.speechSynthesis.cancel();
  } catch (e) {}

  setTimeout(() => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = audioState.rate;
    utterance.pitch = 1.0;
    window.__activeUtterance = utterance; // Prevent garbage collection in Chromium

    utterance.onend = () => {
      if (audioState.isPlaying && !audioState.isPaused) {
        stopAudio();
        const statusLabel = document.getElementById('audio-status-label');
        if (statusLabel) statusLabel.textContent = 'Finished';
      }
    };

    utterance.onerror = (e) => {
      // If error is canceled by user action (pause/seek), ignore
      if (e.error === 'canceled' || e.error === 'interrupted') return;
      stopAudio();
      const statusLabel = document.getElementById('audio-status-label');
      if (statusLabel) statusLabel.textContent = 'Audio stopped';
    };

    window.speechSynthesis.speak(utterance);
  }, 40);
}

function startAudioProgressLoop() {
  if (audioState.progressTimer) clearInterval(audioState.progressTimer);
  audioState.progressTimer = setInterval(() => {
    if (!audioState.isPlaying || audioState.isPaused) return;
    audioState.elapsedSeconds += 0.25;
    const pct = Math.min(100, (audioState.elapsedSeconds / audioState.estimatedDuration) * 100);
    const bar = document.getElementById('audio-progress-bar');
    if (bar) bar.style.width = pct + '%';
    const elTime = document.getElementById('audio-time-elapsed');
    if (elTime) elTime.textContent = formatAudioTime(Math.floor(audioState.elapsedSeconds));
    if (pct >= 100) {
      clearInterval(audioState.progressTimer);
      stopAudio();
      const statusLabel = document.getElementById('audio-status-label');
      if (statusLabel) statusLabel.textContent = 'Finished';
    }
  }, 250);
}

function stopAudio() {
  try {
    if (window.speechSynthesis) window.speechSynthesis.cancel();
  } catch (e) {}
  if (audioState.progressTimer) {
    clearInterval(audioState.progressTimer);
    audioState.progressTimer = null;
  }
  audioState.isPlaying = false;
  audioState.isPaused = false;
  audioState.elapsedSeconds = 0;

  updateAudioPlayIcon('stopped'); // Shows PLAY symbol (▶)
  const statusLabel = document.getElementById('audio-status-label');
  const eq = document.getElementById('audio-eq');
  const bar = document.getElementById('audio-progress-bar');
  const elTime = document.getElementById('audio-time-elapsed');

  if (statusLabel) statusLabel.textContent = 'Ready to play';
  if (eq) eq.classList.remove('playing');
  if (bar) bar.style.width = '0%';
  if (elTime) elTime.textContent = '0:00';
  playMechanicalTick(1100, 0.015);
}

function setAudioSpeed(speed) {
  audioState.rate = speed;
  const speeds = [
    { id: 'btn-speed-1', val: 1.0 },
    { id: 'btn-speed-125', val: 1.25 },
    { id: 'btn-speed-15', val: 1.5 },
    { id: 'btn-speed-2', val: 2.0 }
  ];
  speeds.forEach(s => {
    const el = document.getElementById(s.id);
    if (el) el.classList.toggle('active', Math.abs(speed - s.val) < 0.05);
  });
  playMechanicalTick(2200, 0.01);
  updateAudioDurationDisplay();
  if (audioState.isPlaying && !audioState.isPaused) {
    // Restart from current progress at new speed
    const currentElapsed = audioState.elapsedSeconds;
    audioState.isPaused = true;
    try { window.speechSynthesis.cancel(); } catch(e) {}
    audioState.elapsedSeconds = currentElapsed;
    playPauseAudio();
  }
}

function seekAudioFromClick(event) {
  const track = event.currentTarget;
  if (!track || !audioState.estimatedDuration) return;
  const rect = track.getBoundingClientRect();
  const clickX = event.clientX - rect.left;
  const pct = Math.max(0, Math.min(1, clickX / rect.width));
  audioState.elapsedSeconds = audioState.estimatedDuration * pct;
  const bar = document.getElementById('audio-progress-bar');
  if (bar) bar.style.width = (pct * 100) + '%';
  const elTime = document.getElementById('audio-time-elapsed');
  if (elTime) elTime.textContent = formatAudioTime(Math.floor(audioState.elapsedSeconds));
  playMechanicalTick(2400, 0.008);

  // If playing, re-anchor speech to the seek point
  if (audioState.isPlaying && !audioState.isPaused) {
    const words = audioState.words.length > 0 ? audioState.words : (getAudioNarrationText().split(/\s+/).filter(Boolean));
    const startWord = Math.floor(words.length * pct);
    const seekText = words.slice(startWord).join(' ');
    startSpeechEngine(seekText);
  }
}


// ==========================================================================
// FEATURE 3: TIMED QUIZ MODE & INSTANT SCORECARD
// ==========================================================================
const examState = {
  timerInterval: null,
  secondsRemaining: 0,
  userAnswers: {},
  isSubmitted: false
};

function startTimedQuiz(minutes) {
  examState.secondsRemaining = minutes * 60;
  examState.isSubmitted = false;
  examState.userAnswers = {};

  const display = document.getElementById('quiz-timer-display');
  const banner = document.getElementById('exam-scorecard-banner');
  if (banner) banner.style.display = 'none';

  // Hide all answer keys
  document.querySelectorAll('.mcq-reveal-box').forEach(box => {
    box.style.display = 'none';
  });

  if (examState.timerInterval) clearInterval(examState.timerInterval);

  showNotificationToast(`Started ${minutes}-minute timed exam! Answers will be scored upon submission.`);

  function updateTimer() {
    const mins = Math.floor(examState.secondsRemaining / 60);
    const secs = examState.secondsRemaining % 60;
    if (display) {
      display.textContent = `Time Remaining: ${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
      if (examState.secondsRemaining <= 60) {
        display.style.color = '#e53e3e';
      } else {
        display.style.color = 'var(--ink)';
      }
    }

    if (examState.secondsRemaining <= 0) {
      clearInterval(examState.timerInterval);
      showNotificationToast("Time is up! Submitting answers automatically.");
      submitExamForGrading();
    } else {
      examState.secondsRemaining--;
    }
  }

  updateTimer();
  examState.timerInterval = setInterval(updateTimer, 1000);
}

function submitExamForGrading() {
  if (examState.timerInterval) clearInterval(examState.timerInterval);
  examState.isSubmitted = true;

  if (!appState.lastResult?.content) return;
  const parsed = parseStudyPackContent(appState.lastResult.content);
  const mcqs = parsed.mcqs || [];
  if (mcqs.length === 0) {
    showNotificationToast("No quiz questions to grade.");
    return;
  }

  let correctCount = 0;
  mcqs.forEach((mcq, idx) => {
    const num = idx + 1;
    // Reveal answer key box
    const box = document.getElementById(`mcq-reveal-${num}`);
    if (box) box.style.display = 'block';

    const selectedBtn = document.querySelector(`.mcq-card:nth-child(${num}) .mcq-option-btn.selected`);
    const selectedLetter = selectedBtn ? selectedBtn.getAttribute('data-letter') : '';
    const cleanCorrect = (mcq.correct || '').toUpperCase().trim();

    if (selectedLetter && cleanCorrect.startsWith(selectedLetter)) {
      correctCount++;
    }
  });

  const percent = Math.round((correctCount / mcqs.length) * 100);
  let grade = 'A';
  let desc = 'Outstanding master of course materials!';
  if (percent < 60) {
    grade = 'C';
    desc = 'Needs review. Re-read the Key Concepts and Summary sections above.';
  } else if (percent < 80) {
    grade = 'B';
    desc = 'Solid understanding with a few missed questions. Review the answer keys below.';
  }

  const banner = document.getElementById('exam-scorecard-banner');
  const gradeBadge = document.getElementById('exam-grade-badge');
  const title = document.getElementById('exam-score-title');
  const descEl = document.getElementById('exam-score-desc');
  const timerDisplay = document.getElementById('quiz-timer-display');

  if (gradeBadge) gradeBadge.textContent = `GRADE: ${grade}`;
  if (title) title.textContent = `Score: ${correctCount} / ${mcqs.length} (${percent}%)`;
  if (descEl) descEl.textContent = desc;
  if (banner) banner.style.display = 'block';
  if (timerDisplay) timerDisplay.textContent = 'Exam Finished';

  banner.scrollIntoView({ behavior: 'smooth' });
  showNotificationToast(`Exam graded: ${correctCount}/${mcqs.length} (${percent}%)`);
}


// ==========================================================================
// FEATURE 6: "ASK AI ABOUT THIS STUDY PACK" (MINI Q&A SIDEBAR DRAWER)
// ==========================================================================
function toggleAskAiDrawer() {
  const drawer = document.getElementById('ask-ai-drawer');
  const backdrop = document.getElementById('ask-ai-backdrop');
  if (!drawer) return;

  const isOpen = drawer.style.right === '0px';
  if (isOpen) {
    drawer.style.right = '-460px';
    if (backdrop) backdrop.style.display = 'none';
  } else {
    drawer.style.right = '0px';
    if (backdrop) backdrop.style.display = 'block';
    setTimeout(() => {
      document.getElementById('ask-ai-input')?.focus();
    }, 300);
  }
}

async function submitAskAiQuestion() {
  const input = document.getElementById('ask-ai-input');
  const btn = document.getElementById('btn-submit-ask-ai');
  const messagesContainer = document.getElementById('ask-ai-messages');
  if (!input || !input.value.trim()) return;

  const question = input.value.trim();
  input.value = '';

  // Append user message bubble
  const userBubble = document.createElement('div');
  userBubble.style.cssText = 'align-self:flex-end; background:var(--ink); color:var(--white); padding:0.75rem 1rem; border-radius:12px; font-size:0.86rem; max-width:85%;';
  userBubble.textContent = question;
  messagesContainer.appendChild(userBubble);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;

  // Append thinking bubble
  const aiBubble = document.createElement('div');
  aiBubble.style.cssText = 'align-self:flex-start; background:var(--card-cream); border:1px solid var(--line); padding:0.85rem 1rem; border-radius:12px; font-size:0.86rem; max-width:90%; line-height:1.5;';
  aiBubble.textContent = 'Thinking...';
  messagesContainer.appendChild(aiBubble);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;

  if (btn) btn.disabled = true;

  try {
    const res = await fetch('/api/study-pack/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question: question,
        content: appState.lastResult?.content || '',
        notes: appState.currentNotes || ''
      })
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'AI answer failed');
    }

    aiBubble.innerHTML = marked.parse(stripEmojis(data.answer));
  } catch (err) {
    aiBubble.textContent = `Error: ${err.message}`;
  } finally {
    if (btn) btn.disabled = false;
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }
}


// ==========================================================================
// SEMI-CIRCLE ROTATING WHEEL NAVIGATION CONTROLLER
// ==========================================================================
function toggleWheelNav() {
  playMechanicalTick(1500, 0.02);
  const container = document.getElementById('wheel-nav');
  if (container) {
    const isOpen = container.classList.toggle('open');
    document.body.classList.toggle('wheel-nav-open', isOpen);
  }
}

function closeWheelIfMobile() {
  const container = document.getElementById('wheel-nav');
  if (container && window.innerWidth <= 768) {
    container.classList.remove('open');
    document.body.classList.remove('wheel-nav-open');
  }
}

// Click outside to close wheel if it was toggled open via click
document.addEventListener('click', (e) => {
  const container = document.getElementById('wheel-nav');
  if (container && container.classList.contains('open')) {
    if (!container.contains(e.target)) {
      container.classList.remove('open');
      document.body.classList.remove('wheel-nav-open');
    }
  }
});


// ==========================================================================
// FEATURE 3: SPOTLIGHT COMMAND PALETTE (CMD + K / LINEAR & RAYCAST STYLE)
// ==========================================================================
const COMMAND_PALETTE_ITEMS = [
  // Navigation
  {
    id: 'nav-dashboard',
    title: 'Go to Home / Overview',
    subtitle: 'Dashboard metrics, quick-start guide, and recent activity',
    category: 'Navigation',
    badge: 'View',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>',
    action: () => switchView('dashboard')
  },
  {
    id: 'nav-generator',
    title: 'Study Pack Preparation',
    subtitle: 'Paste lecture notes or upload PDF/TXT documents',
    category: 'Navigation',
    badge: 'View',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>',
    action: () => switchView('generator')
  },
  {
    id: 'nav-lab',
    title: 'Prompt Comparison Lab',
    subtitle: 'Benchmark Basic vs Strict Rules vs Smart Thinking prompts',
    category: 'Navigation',
    badge: 'View',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 2v7.31L4.36 17.5A2 2 0 0 0 6 20.5h12a2 2 0 0 0 1.64-3L14 9.31V2"/></svg>',
    action: () => switchView('lab')
  },
  {
    id: 'nav-evaluation',
    title: 'Evaluation & Analytics',
    subtitle: 'Compare accuracy, cost, latency, and rubric ratings',
    category: 'Navigation',
    badge: 'View',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>',
    action: () => switchView('evaluation')
  },
  {
    id: 'nav-library',
    title: 'Saved Study Packs',
    subtitle: 'Browse your offline saved notes, quizzes, and exports',
    category: 'Navigation',
    badge: 'View',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>',
    action: () => switchView('library')
  },
  // Actions
  {
    id: 'act-export-pdf',
    title: 'Export Active Pack to PDF',
    subtitle: 'Download high-res printable PDF with cover and answer keys',
    category: 'Actions',
    badge: 'Export',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>',
    action: () => downloadCurrentPdf()
  },
  {
    id: 'act-audio',
    title: 'Listen to Audio Briefing',
    subtitle: 'NotebookLM speech synthesizer with live bouncing equalizer',
    category: 'Actions',
    badge: 'Audio',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>',
    action: () => {
      const bar = document.getElementById('audio-player-bar');
      if (bar) bar.style.display = 'flex';
      playPauseAudio();
    }
  },
  {
    id: 'act-quiz-15',
    title: 'Start 15-Minute Timed Quiz',
    subtitle: 'Simulate exam conditions with live countdown and instant grading',
    category: 'Actions',
    badge: 'Quiz',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
    action: () => {
      if (!appState.lastResult?.content) {
        switchView('generator');
        showNotificationToast("Please generate or select a study pack first to start a quiz.");
      } else {
        switchView('results');
        switchResultTab('mcqs');
        startTimedQuiz(15);
      }
    }
  },
  {
    id: 'act-flashcards',
    title: 'Practice Interactive Flashcards',
    subtitle: 'Flip key concept terms and master definitions',
    category: 'Actions',
    badge: 'Study',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>',
    action: () => {
      if (!appState.lastResult?.content) {
        switchView('generator');
        showNotificationToast("Please generate a study pack first for flashcards.");
      } else {
        switchView('results');
        switchResultTab('flashcards');
      }
    }
  },
  {
    id: 'act-ask-ai',
    title: 'Ask AI Assistant',
    subtitle: 'Open the slide-over AI tutor grounded strictly in your notes',
    category: 'Actions',
    badge: 'AI',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
    action: () => toggleAskAiDrawer()
  },
  {
    id: 'act-copy-summary',
    title: 'Copy Study Pack to Clipboard',
    subtitle: 'Quickly copy the active notes and questions',
    category: 'Actions',
    badge: 'Copy',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>',
    action: () => copyCurrentOutput()
  },
  // Preferences
  {
    id: 'set-theme',
    title: 'Toggle Dark / Light Paper Mode',
    subtitle: 'Switch between warm parchment and architectural dark theme',
    category: 'Preferences',
    badge: 'Theme',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/></svg>',
    action: () => toggleTheme()
  },
  {
    id: 'set-diff-beg',
    title: 'Set Difficulty: Beginner',
    subtitle: 'Introductory level questions with foundational terms',
    category: 'Preferences',
    badge: 'Setting',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
    action: () => {
      document.querySelectorAll('#difficulty-selector .difficulty-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.difficulty === 'beginner');
      });
      appState.difficulty = 'Beginner';
      showNotificationToast('Difficulty set to Beginner');
    }
  },
  {
    id: 'set-diff-int',
    title: 'Set Difficulty: Intermediate',
    subtitle: 'Balanced conceptual understanding and application questions',
    category: 'Preferences',
    badge: 'Setting',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
    action: () => {
      document.querySelectorAll('#difficulty-selector .difficulty-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.difficulty === 'intermediate');
      });
      appState.difficulty = 'Intermediate';
      showNotificationToast('Difficulty set to Intermediate');
    }
  },
  {
    id: 'set-diff-adv',
    title: 'Set Difficulty: Advanced',
    subtitle: 'Rigorous analytical scenarios, edge cases, and synthesis',
    category: 'Preferences',
    badge: 'Setting',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
    action: () => {
      document.querySelectorAll('#difficulty-selector .difficulty-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.difficulty === 'advanced');
      });
      appState.difficulty = 'Advanced';
      showNotificationToast('Difficulty set to Advanced');
    }
  }
];

let paletteSelectedIndex = 0;
let paletteFilteredItems = [];

function openCommandPalette() {
  playMechanicalTick(1600, 0.015);
  const backdrop = document.getElementById('cmd-palette-backdrop');
  const input = document.getElementById('palette-search-input');
  if (!backdrop || !input) return;

  backdrop.style.display = 'flex';
  input.value = '';
  paletteSelectedIndex = 0;
  renderPaletteItems('');
  input.focus();
}

function closeCommandPalette() {
  const backdrop = document.getElementById('cmd-palette-backdrop');
  if (backdrop) backdrop.style.display = 'none';
  playMechanicalTick(1200, 0.012);
}

function renderPaletteItems(query = '') {
  const list = document.getElementById('palette-results-list');
  if (!list) return;

  const q = query.trim().toLowerCase();
  paletteFilteredItems = COMMAND_PALETTE_ITEMS.filter(item => {
    if (!q) return true;
    return item.title.toLowerCase().includes(q) ||
           item.subtitle.toLowerCase().includes(q) ||
           item.category.toLowerCase().includes(q);
  });

  if (paletteFilteredItems.length === 0) {
    list.innerHTML = `
      <div style="padding:2.5rem 1rem; text-align:center; color:var(--muted); font-size:0.9rem;">
        No matching commands found for "${escapeHtml(query)}"
      </div>
    `;
    paletteSelectedIndex = -1;
    return;
  }

  if (paletteSelectedIndex >= paletteFilteredItems.length || paletteSelectedIndex < 0) {
    paletteSelectedIndex = 0;
  }

  let html = '';
  let lastCategory = '';
  paletteFilteredItems.forEach((item, idx) => {
    if (item.category !== lastCategory) {
      lastCategory = item.category;
      html += `<div class="palette-category-label">${escapeHtml(lastCategory)}</div>`;
    }
    const isSelected = idx === paletteSelectedIndex;
    html += `
      <div class="palette-item ${isSelected ? 'selected' : ''}" 
           data-index="${idx}" 
           onclick="executePaletteItem(${idx})"
           onmouseenter="hoverPaletteItem(${idx})">
        <div class="palette-item-icon">${item.icon}</div>
        <div class="palette-item-text">
          <div class="palette-item-title">${escapeHtml(item.title)}</div>
          <div class="palette-item-sub">${escapeHtml(item.subtitle)}</div>
        </div>
        <span class="palette-item-badge">${escapeHtml(item.badge)}</span>
      </div>
    `;
  });

  list.innerHTML = html;
}

function updatePaletteSelection() {
  const list = document.getElementById('palette-results-list');
  if (!list) return;
  const items = list.querySelectorAll('.palette-item');
  items.forEach((item, idx) => {
    item.classList.toggle('selected', idx === paletteSelectedIndex);
    if (idx === paletteSelectedIndex) {
      item.scrollIntoView({ block: 'nearest' });
    }
  });
}

function hoverPaletteItem(idx) {
  if (paletteSelectedIndex !== idx) {
    paletteSelectedIndex = idx;
    updatePaletteSelection();
  }
}

function executePaletteItem(idx) {
  const item = paletteFilteredItems[idx];
  if (!item) return;
  playMechanicalTick(2200, 0.02);
  closeCommandPalette();
  setTimeout(() => {
    item.action();
  }, 50);
}

function initCommandPaletteListeners() {
  // Check OS for badge label
  const badge = document.getElementById('cmd-k-badge');
  if (badge && !navigator.platform.toUpperCase().includes('MAC')) {
    badge.textContent = 'Ctrl+K';
  }

  // Global keyboard shortcut
  window.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
      e.preventDefault();
      const backdrop = document.getElementById('cmd-palette-backdrop');
      if (backdrop && backdrop.style.display === 'flex') {
        closeCommandPalette();
      } else {
        openCommandPalette();
      }
      return;
    }

    if (e.key === '/' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) {
      e.preventDefault();
      openCommandPalette();
      return;
    }

    const backdrop = document.getElementById('cmd-palette-backdrop');
    if (backdrop && backdrop.style.display === 'flex') {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeCommandPalette();
      }
    }
  });

  // Search input listeners
  const input = document.getElementById('palette-search-input');
  if (input) {
    input.addEventListener('input', (e) => {
      paletteSelectedIndex = 0;
      renderPaletteItems(e.target.value);
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (paletteFilteredItems.length > 0) {
          paletteSelectedIndex = (paletteSelectedIndex + 1) % paletteFilteredItems.length;
          updatePaletteSelection();
          playMechanicalTick(2000, 0.006);
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (paletteFilteredItems.length > 0) {
          paletteSelectedIndex = (paletteSelectedIndex - 1 + paletteFilteredItems.length) % paletteFilteredItems.length;
          updatePaletteSelection();
          playMechanicalTick(2000, 0.006);
        }
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (paletteSelectedIndex >= 0 && paletteSelectedIndex < paletteFilteredItems.length) {
          executePaletteItem(paletteSelectedIndex);
        }
      }
    });
  }
}

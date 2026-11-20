// Evaluation Benchmarking Controller
document.addEventListener('DOMContentLoaded', () => {
    fetchLiveEvaluations();
  });

  async function fetchLiveEvaluations() {
    try {
      // Auto-sync evaluations with existing study packs
      let storedPacks = [];
      try {
        storedPacks = JSON.parse(localStorage.getItem('studyforge_library_packs') || '[]');
      } catch (e) { storedPacks = []; }

      if (storedPacks.length === 0) {
        await fetch('/api/evaluate', { method: 'DELETE' });
      } else {
        const validIds = storedPacks.map(p => p.id);
        const validTitles = storedPacks.map(p => (p.title || '').toLowerCase());
        await fetch('/api/evaluate/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ valid_pack_ids: validIds, valid_titles: validTitles })
        });
      }

      const resp = await fetch('/api/evaluate');
      const data = await resp.json();
      const list = data.evaluations || [];

      // Update counters
      document.getElementById('eval-stat-total').textContent = list.length;
      
      if (list.length === 0) {
        document.getElementById('eval-stat-avg').textContent = '—';
        document.getElementById('eval-stat-best').textContent = '—';
        document.getElementById('eval-stat-samples').textContent = '0';
        document.getElementById('dim-score-accuracy').textContent = '—';
        document.getElementById('dim-score-relevance').textContent = '—';
        document.getElementById('dim-score-completeness').textContent = '—';
        document.getElementById('dim-score-quality').textContent = '—';
        document.getElementById('dim-score-formatting').textContent = '—';

        document.getElementById('prompt-summary-table-body').innerHTML = `
          <tr><td colspan="7" style="text-align:center; padding:2.5rem; color:var(--muted); font-size:0.88rem;">
            No scores yet. Make a study pack in "Preparation" and click "Score this Pack" to see which prompt wins!
          </td></tr>`;

        document.getElementById('evaluations-table-body').innerHTML = `
          <tr><td colspan="12" style="text-align:center; padding:2.5rem; color:var(--muted); font-size:0.88rem;">
            No graded packs yet. Whenever you make a study pack, click "Score this Pack" to add a rating here!
          </td></tr>`;
        return;
      }

      // Compute averages
      let sumAvg = 0;
      let dims = { factual_accuracy: 0, relevance: 0, completeness: 0, question_quality: 0, formatting: 0 };
      let uniqueSubjects = new Set();
      
      const verStats = {
        v1: { name: 'V1 Basic', type: 'Simple prompt with few rules', count: 0, acc: 0, rel: 0, qq: 0, total: 0 },
        v2: { name: 'V2 Structured', type: 'Fixed format and clear rules', count: 0, acc: 0, rel: 0, qq: 0, total: 0 },
        v3: { name: 'V3 Step-by-Step', type: 'Reads notes and writes step by step', count: 0, acc: 0, rel: 0, qq: 0, total: 0 }
      };

      list.forEach(item => {
        sumAvg += item.average_score || 0;
        if (item.rubric_scores) {
          for (let d in dims) {
            dims[d] += (item.rubric_scores[d] || 0);
          }
        }
        if (item.test_id) uniqueSubjects.add(item.test_id);

        const vKey = (item.prompt_version || 'v2').toLowerCase();
        if (verStats[vKey]) {
          verStats[vKey].count += 1;
          verStats[vKey].total += (item.average_score || 0);
          verStats[vKey].acc += (item.rubric_scores?.factual_accuracy || 0);
          verStats[vKey].rel += (item.rubric_scores?.relevance || 0);
          verStats[vKey].qq += (item.rubric_scores?.question_quality || 0);
        }
      });

      const meanTotal = (sumAvg / list.length).toFixed(2);
      document.getElementById('eval-stat-avg').textContent = `${meanTotal} / 5.0`;
      document.getElementById('eval-stat-samples').textContent = uniqueSubjects.size || list.length;

      // Find best scoring prompt version
      let bestVer = '—';
      let bestVerScore = -1;
      ['v1', 'v2', 'v3'].forEach(v => {
        if (verStats[v].count > 0) {
          const avg = verStats[v].total / verStats[v].count;
          if (avg > bestVerScore) {
            bestVerScore = avg;
            bestVer = v.toUpperCase();
          }
        }
      });
      document.getElementById('eval-stat-best').textContent = bestVer;

      document.getElementById('dim-score-accuracy').textContent = (dims.factual_accuracy / list.length).toFixed(1);
      document.getElementById('dim-score-relevance').textContent = (dims.relevance / list.length).toFixed(1);
      document.getElementById('dim-score-completeness').textContent = (dims.completeness / list.length).toFixed(1);
      document.getElementById('dim-score-quality').textContent = (dims.question_quality / list.length).toFixed(1);
      document.getElementById('dim-score-formatting').textContent = (dims.formatting / list.length).toFixed(1);

      // Render prompt version summary table
      const summaryRows = ['v1', 'v2', 'v3'].map(v => {
        const s = verStats[v];
        if (s.count === 0) {
          return `
            <tr>
              <td><strong>${s.name}</strong></td>
              <td style="color:var(--muted);">${s.type}</td>
              <td class="font-mono">—</td>
              <td class="font-mono">—</td>
              <td class="font-mono">—</td>
              <td class="font-mono">—</td>
              <td style="color:var(--muted);">No runs yet</td>
            </tr>
          `;
        }
        return `
          <tr>
            <td><strong>${s.name}</strong></td>
            <td style="color:var(--muted);">${s.type}</td>
            <td class="font-mono">${(s.acc / s.count).toFixed(1)} / 5.0</td>
            <td class="font-mono">${(s.rel / s.count).toFixed(1)} / 5.0</td>
            <td class="font-mono">${(s.qq / s.count).toFixed(1)} / 5.0</td>
            <td class="font-mono"><strong>${(s.total / s.count).toFixed(2)} / 5.0</strong></td>
            <td>${s.count} run${s.count > 1 ? 's' : ''}</td>
          </tr>
        `;
      }).join('');
      document.getElementById('prompt-summary-table-body').innerHTML = summaryRows;

      // Render table
      const rows = list.map(item => `
        <tr>
          <td><span class="font-mono" style="font-weight:700;">${item.test_id || 'TS-01'}</span></td>
          <td><span class="stamp">${item.prompt_version?.toUpperCase() || 'V2'}</span></td>
          <td>${item.difficulty || 'Intermediate'}</td>
          <td class="font-mono">${item.rubric_scores?.factual_accuracy || '—'}</td>
          <td class="font-mono">${item.rubric_scores?.relevance || '—'}</td>
          <td class="font-mono">${item.rubric_scores?.completeness || '—'}</td>
          <td class="font-mono">${item.rubric_scores?.question_quality || '—'}</td>
          <td class="font-mono">${item.rubric_scores?.formatting || '—'}</td>
          <td class="font-mono" style="font-weight:800;">${item.average_score?.toFixed(2) || '—'}</td>
          <td style="font-size:0.78rem; max-width:200px; color:var(--muted);">${item.failure_notes || '—'}</td>
          <td class="font-mono" style="font-size:0.72rem; color:var(--muted);">${item.timestamp ? item.timestamp.slice(0, 10) : '—'}</td>
          <td>
            <button class="btn btn-ghost btn-sm" onclick="deleteEvalItem('${item.id}')">x</button>
          </td>
        </tr>
      `).join('');

      document.getElementById('evaluations-table-body').innerHTML = rows;

    } catch (err) {
      console.error(err);
    }
  }

  async function resetAllEvaluations() {
    if (!confirm("Are you sure you want to reset all evaluation scores to zero?")) return;
    try {
      await fetch('/api/evaluate', { method: 'DELETE' });
      fetchLiveEvaluations();
    } catch (err) {
      alert("Could not reset evaluations.");
    }
  }

  async function deleteEvalItem(id) {
    if (!confirm("Are you sure you want to delete this score?")) return;
    try {
      await fetch(`/api/evaluate/${id}`, { method: 'DELETE' });
      fetchLiveEvaluations();
    } catch (err) {
      alert("Could not delete score.");
    }
  }

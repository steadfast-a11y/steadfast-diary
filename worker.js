// worker.js — Steadfast Accessibility Learning Diary
// Cloudflare Worker + KV — single-file deployment

const HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Steadfast Accessibility — Learning Diary</title>
  <style>
    :root {
      --navy: #1B2A4A;
      --blue: #2E5090;
      --light-blue: #4A78C4;
      --text: #1A1A2E;
      --green: #1B6B3A;
      --green-bg: #EAF5EE;
      --green-border: #A8D5B5;
      --amber: #B8860B;
      --amber-bg: #FDF8E1;
      --amber-border: #E8D080;
      --red: #C0392B;
      --red-bg: #FDEDEB;
      --red-border: #F1A9A0;
      --gray: #555;
      --light-gray: #F5F7FA;
      --border: #D8DEE9;
      --white: #FFFFFF;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; color: var(--text); background: #F0F4FA; line-height: 1.6; }

    /* HEADER */
    header { background: var(--navy); color: white; padding: 40px 40px 32px; }
    .header-inner { max-width: 1100px; margin: 0 auto; }
    .logo { font-size: 12px; letter-spacing: 0.12em; text-transform: uppercase; opacity: 0.55; margin-bottom: 10px; }
    header h1 { font-size: 32px; font-weight: 700; line-height: 1.2; margin-bottom: 6px; }
    header .subtitle { font-size: 16px; opacity: 0.7; margin-bottom: 24px; }
    .progress-wrap { background: rgba(255,255,255,0.12); border-radius: 8px; padding: 16px 20px; display: flex; align-items: center; gap: 20px; flex-wrap: wrap; }
    .progress-bar-outer { flex: 1; min-width: 200px; background: rgba(255,255,255,0.2); border-radius: 99px; height: 10px; overflow: hidden; }
    .progress-bar-inner { height: 100%; background: #4ADE80; border-radius: 99px; transition: width 0.4s ease; }
    .progress-label { font-size: 14px; opacity: 0.9; white-space: nowrap; }
    .current-week-badge { background: var(--amber); color: #1a1000; font-size: 12px; font-weight: 700; padding: 3px 10px; border-radius: 12px; letter-spacing: 0.04em; }

    /* AUTH BANNER */
    #auth-banner { background: var(--amber-bg); border-bottom: 2px solid var(--amber-border); padding: 10px 40px; display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
    #auth-banner label { font-size: 13px; font-weight: 600; color: var(--amber); }
    #auth-input { font-size: 13px; padding: 5px 10px; border: 1px solid var(--amber-border); border-radius: 6px; width: 280px; font-family: monospace; }
    #auth-btn { background: var(--amber); color: white; border: none; padding: 5px 14px; border-radius: 6px; font-size: 13px; font-weight: 600; cursor: pointer; }
    #auth-status { font-size: 12px; color: var(--gray); }
    #auth-banner.hidden { display: none; }

    /* NAV */
    nav { background: var(--white); border-bottom: 1px solid var(--border); padding: 10px 40px; position: sticky; top: 0; z-index: 100; box-shadow: 0 2px 8px rgba(0,0,0,0.06); overflow-x: auto; }
    .nav-inner { max-width: 1100px; margin: 0 auto; display: flex; gap: 6px; align-items: center; flex-wrap: nowrap; }
    .week-btn { font-size: 11px; font-weight: 600; padding: 4px 10px; border-radius: 12px; border: 1px solid var(--border); background: var(--light-gray); color: var(--gray); cursor: pointer; white-space: nowrap; text-decoration: none; transition: all 0.15s; }
    .week-btn:hover { background: #e8eef8; border-color: var(--light-blue); color: var(--blue); }
    .week-btn.current { background: var(--amber-bg); border-color: var(--amber); color: var(--amber); }
    .week-btn.complete { background: var(--green-bg); border-color: var(--green-border); color: var(--green); }
    .nav-stats { margin-left: auto; font-size: 12px; color: var(--gray); white-space: nowrap; padding-left: 12px; border-left: 1px solid var(--border); }

    /* MAIN */
    main { max-width: 1100px; margin: 0 auto; padding: 32px 40px 64px; }

    /* WEEK SECTION */
    .week-section { margin-bottom: 40px; background: var(--white); border: 1px solid var(--border); border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.04); }
    .week-header { background: var(--navy); color: white; padding: 16px 24px; display: flex; align-items: flex-start; gap: 16px; flex-wrap: wrap; }
    .week-header.current-week { background: #1a3060; border-left: 4px solid var(--amber); }
    .week-title { flex: 1; }
    .week-title h2 { font-size: 16px; font-weight: 700; line-height: 1.3; }
    .week-title .week-dates { font-size: 12px; opacity: 0.65; margin-top: 2px; }
    .week-meta { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
    .hours-badge { background: rgba(255,255,255,0.12); border: 1px solid rgba(255,255,255,0.2); border-radius: 12px; padding: 3px 10px; font-size: 11px; opacity: 0.85; white-space: nowrap; }
    .week-progress-text { font-size: 11px; opacity: 0.7; }
    .week-progress-bar { background: rgba(255,255,255,0.15); border-radius: 99px; height: 4px; width: 80px; overflow: hidden; }
    .week-progress-fill { height: 100%; background: #4ADE80; border-radius: 99px; transition: width 0.4s; }

    /* CATEGORY GROUP */
    .category-group { border-bottom: 1px solid var(--border); }
    .category-group:last-child { border-bottom: none; }
    .category-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: var(--light-blue); background: #F8FAFF; padding: 6px 24px; border-bottom: 1px solid var(--border); }

    /* TASK ITEM */
    .task-item { border-bottom: 1px solid #F0F4FA; }
    .task-item:last-child { border-bottom: none; }
    .task-row { display: flex; align-items: flex-start; gap: 12px; padding: 12px 24px; cursor: pointer; transition: background 0.12s; }
    .task-row:hover { background: #F8FAFF; }
    .task-check { flex-shrink: 0; margin-top: 2px; }
    .task-check input[type="checkbox"] { width: 18px; height: 18px; cursor: pointer; accent-color: var(--green); }
    .task-body { flex: 1; min-width: 0; }
    .task-text { font-size: 14px; color: var(--text); line-height: 1.5; }
    .task-text.completed-text { color: var(--gray); text-decoration: line-through; opacity: 0.7; }
    .task-meta { display: flex; align-items: center; gap: 10px; margin-top: 3px; flex-wrap: wrap; }
    .completed-at { font-size: 11px; color: var(--green); font-weight: 600; }
    .journal-toggle { font-size: 11px; color: var(--light-blue); cursor: pointer; text-decoration: underline; background: none; border: none; padding: 0; cursor: pointer; }
    .journal-toggle:hover { color: var(--blue); }
    .word-count { font-size: 11px; color: var(--gray); }

    /* MILESTONE */
    .milestone-banner { display: flex; align-items: center; gap: 10px; padding: 10px 24px; background: linear-gradient(90deg, #FDF8E1, #FFFDF5); border-bottom: 1px solid var(--amber-border); }
    .milestone-star { font-size: 16px; }
    .milestone-text { font-size: 13px; font-weight: 700; color: var(--amber); }
    .deadline-banner { display: flex; align-items: center; gap: 10px; padding: 10px 24px; background: var(--red-bg); border-bottom: 1px solid var(--red-border); }
    .deadline-text { font-size: 13px; font-weight: 700; color: var(--red); }

    /* JOURNAL AREA */
    .journal-area { display: none; padding: 0 24px 16px 54px; }
    .journal-area.open { display: block; }
    .journal-textarea { width: 100%; min-height: 120px; font-size: 13px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: var(--text); border: 1px solid var(--border); border-radius: 8px; padding: 10px 12px; resize: vertical; outline: none; transition: border-color 0.15s; background: #FAFBFE; }
    .journal-textarea:focus { border-color: var(--light-blue); background: white; }
    .journal-footer { display: flex; align-items: center; gap: 12px; margin-top: 6px; font-size: 11px; color: var(--gray); }
    .save-indicator { font-weight: 600; color: var(--green); opacity: 0; transition: opacity 0.3s; }
    .save-indicator.visible { opacity: 1; }
    .journal-updated { font-style: italic; }

    /* WEEK 15 STATUS TABLE */
    .status-table-wrap { padding: 16px 24px; }
    .status-table { width: 100%; border-collapse: collapse; font-size: 13px; }
    .status-table th { background: var(--light-gray); text-align: left; padding: 8px 12px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; color: var(--gray); border-bottom: 2px solid var(--border); }
    .status-table td { padding: 8px 12px; border-bottom: 1px solid var(--border); }
    .status-table tr:last-child td { border-bottom: none; }

    /* FOOTER */
    footer { background: var(--navy); color: rgba(255,255,255,0.5); text-align: center; padding: 24px 40px; font-size: 13px; }
    footer strong { color: rgba(255,255,255,0.8); }
    .export-btn { background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); color: rgba(255,255,255,0.8); padding: 6px 16px; border-radius: 8px; font-size: 13px; cursor: pointer; margin-bottom: 12px; transition: background 0.15s; }
    .export-btn:hover { background: rgba(255,255,255,0.18); }
    .last-synced { font-size: 11px; margin-top: 6px; opacity: 0.5; }

    @media (max-width: 768px) {
      header, main { padding: 24px 16px; }
      header h1 { font-size: 24px; }
      nav { padding: 8px 16px; }
      .task-row { padding: 10px 16px; }
      .journal-area { padding: 0 16px 14px 16px; }
      .category-label { padding: 5px 16px; }
    }
  </style>
</head>
<body>

<header>
  <div class="header-inner">
    <div class="logo">Steadfast Accessibility LLC</div>
    <h1>Steadfast Accessibility — Learning Diary</h1>
    <div class="subtitle">15-Week Upskilling Schedule &amp; Journal</div>
    <div class="progress-wrap">
      <div class="progress-bar-outer">
        <div class="progress-bar-inner" id="overall-bar" style="width:0%"></div>
      </div>
      <div class="progress-label" id="overall-label">Loading…</div>
      <div class="current-week-badge" id="current-week-badge">Week —</div>
    </div>
  </div>
</header>

<div id="auth-banner">
  <label for="auth-input">🔒 Enter access token to enable saving:</label>
  <input type="password" id="auth-input" placeholder="Paste your token here" autocomplete="off" />
  <button id="auth-btn">Unlock</button>
  <span id="auth-status"></span>
</div>

<nav>
  <div class="nav-inner" id="week-nav">
    <!-- week buttons injected by JS -->
    <span class="nav-stats" id="nav-stats">Loading…</span>
  </div>
</nav>

<main id="main-content">
  <p style="text-align:center;padding:60px;color:#999;">Loading your diary…</p>
</main>

<footer>
  <button class="export-btn" onclick="exportData()">⬇ Export All Data as JSON</button><br>
  <strong>Steadfast Accessibility LLC</strong> — Dan Harrison<br>
  <div class="last-synced" id="last-synced"></div>
</footer>

<script>
// ─── Constants ───────────────────────────────────────────────────────────────
const START_DATE = new Date('2026-04-05T00:00:00');
const TOTAL_WEEKS = 15;

// ─── Auth ────────────────────────────────────────────────────────────────────
let authToken = sessionStorage.getItem('diary_token') || '';

function initAuth() {
  const banner = document.getElementById('auth-banner');
  const btn = document.getElementById('auth-btn');
  const input = document.getElementById('auth-input');
  const status = document.getElementById('auth-status');
  if (authToken) { banner.classList.add('hidden'); return; }
  btn.addEventListener('click', async () => {
    const val = input.value.trim();
    if (!val) return;
    // Quick check — try a dummy PUT
    const res = await fetch('/api/task/__ping', {
      method: 'PUT',
      headers: { 'Authorization': 'Bearer ' + val, 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed: false })
    });
    if (res.status === 401) { status.textContent = '✗ Invalid token'; status.style.color = '#C0392B'; return; }
    authToken = val;
    sessionStorage.setItem('diary_token', val);
    banner.classList.add('hidden');
    status.textContent = '';
  });
  input.addEventListener('keydown', e => { if (e.key === 'Enter') btn.click(); });
}

// ─── Current Week ─────────────────────────────────────────────────────────────
function getCurrentWeek() {
  const now = new Date();
  const diff = Math.floor((now - START_DATE) / (7 * 24 * 60 * 60 * 1000));
  return Math.max(1, Math.min(TOTAL_WEEKS, diff + 1));
}

// ─── Data ────────────────────────────────────────────────────────────────────
let allData = null;

async function loadData() {
  try {
    allData = window.__DIARY_DATA__ || await fetch('/api/data').then(r => r.json());
    render();
  } catch(e) {
    document.getElementById('main-content').innerHTML =
      '<p style="text-align:center;padding:60px;color:#C0392B;">Failed to load diary data. Please refresh.</p>';
  }
}

// ─── Render ──────────────────────────────────────────────────────────────────
function render() {
  const { tasks, weeks } = allData;
  const currentWeek = getCurrentWeek();

  // Overall stats
  const allTaskIds = Object.keys(tasks);
  const totalTasks = allTaskIds.length;
  const completedTasks = allTaskIds.filter(id => tasks[id].completed).length;
  const journalEntries = allTaskIds.filter(id => tasks[id].journal && tasks[id].journal.trim()).length;
  const pct = totalTasks ? Math.round(completedTasks / totalTasks * 100) : 0;

  document.getElementById('overall-bar').style.width = pct + '%';
  document.getElementById('overall-label').textContent = completedTasks + ' of ' + totalTasks + ' tasks (' + pct + '%)';
  document.getElementById('current-week-badge').textContent = 'Week ' + currentWeek;

  // Nav
  const nav = document.getElementById('week-nav');
  let navHTML = '';
  weeks.forEach(w => {
    const wTasks = w.tasks || [];
    const wCompleted = wTasks.filter(id => tasks[id] && tasks[id].completed).length;
    const wComplete = wTasks.length > 0 && wCompleted === wTasks.length;
    const isCurrent = w.weekNum === currentWeek;
    let cls = 'week-btn';
    if (isCurrent) cls += ' current';
    else if (wComplete) cls += ' complete';
    navHTML += '<a href="#week-' + w.weekNum + '" class="' + cls + '">W' + w.weekNum + '</a>';
  });
  navHTML += '<span class="nav-stats" id="nav-stats">' + completedTasks + ' done · ' + journalEntries + ' journal entries · ' + pct + '% overall</span>';
  nav.innerHTML = navHTML;

  // Main
  let html = '';
  weeks.forEach(w => {
    const wTasks = w.tasks || [];
    const wCompleted = wTasks.filter(id => tasks[id] && tasks[id].completed).length;
    const wPct = wTasks.length ? Math.round(wCompleted / wTasks.length * 100) : 0;
    const isCurrent = w.weekNum === currentWeek;

    html += '<div class="week-section" id="week-' + w.weekNum + '">';
    html += '<div class="week-header' + (isCurrent ? ' current-week' : '') + '">';
    html += '<div class="week-title"><h2>WEEK ' + w.weekNum + ': ' + escHtml(w.title) + '</h2>';
    html += '<div class="week-dates">' + escHtml(w.dates) + '</div></div>';
    html += '<div class="week-meta">';
    if (w.hours) html += '<span class="hours-badge">' + escHtml(w.hours) + '</span>';
    html += '<div><div class="week-progress-text">' + wCompleted + '/' + wTasks.length + ' tasks</div>';
    html += '<div class="week-progress-bar"><div class="week-progress-fill" style="width:' + wPct + '%"></div></div></div>';
    html += '</div></div>';

    // Week 15 status table
    if (w.weekNum === 15 && w.statusTable) {
      html += '<div class="status-table-wrap">';
      html += '<table class="status-table"><thead><tr><th>Credential / Milestone</th><th>Status</th></tr></thead><tbody>';
      w.statusTable.forEach(row => {
        html += '<tr><td>' + escHtml(row[0]) + '</td><td>' + escHtml(row[1]) + '</td></tr>';
      });
      html += '</tbody></table></div>';
    }

    // Categories
    const categorized = w.categories || [];
    categorized.forEach(cat => {
      html += '<div class="category-group">';

      // Milestones / deadlines before category
      if (cat.milestoneBefore) {
        cat.milestoneBefore.forEach(m => {
          if (m.type === 'milestone') {
            html += '<div class="milestone-banner"><span class="milestone-star">⭐</span><span class="milestone-text">' + escHtml(m.text) + '</span></div>';
          } else {
            html += '<div class="deadline-banner"><span class="milestone-star">⚠️</span><span class="deadline-text">' + escHtml(m.text) + '</span></div>';
          }
        });
      }

      html += '<div class="category-label">' + escHtml(cat.name) + '</div>';

      cat.taskIds.forEach(taskId => {
        const task = tasks[taskId];
        if (!task) return;
        const checked = task.completed;
        const hasJournal = task.journal && task.journal.trim().length > 0;
        const wordCount = task.journal ? task.journal.trim().split(/\\s+/).filter(Boolean).length : 0;

        html += '<div class="task-item" id="item-' + taskId + '">';
        html += '<div class="task-row" onclick="toggleJournal(\'' + taskId + '\')">';
        html += '<div class="task-check"><input type="checkbox" ' + (checked ? 'checked' : '') +
          ' onclick="event.stopPropagation();toggleTask(\'' + taskId + '\', this)" /></div>';
        html += '<div class="task-body">';
        html += '<div class="task-text' + (checked ? ' completed-text' : '') + '">' + escHtml(task.description) + '</div>';
        html += '<div class="task-meta">';
        if (checked && task.completedAt) {
          html += '<span class="completed-at">✓ Completed ' + formatDate(task.completedAt) + '</span>';
        }
        html += '<button class="journal-toggle" onclick="event.stopPropagation();toggleJournal(\'' + taskId + '\')">' +
          (hasJournal ? '📝 View journal (' + wordCount + ' words)' : '+ Add journal note') + '</button>';
        html += '</div></div></div>';

        // Journal area
        html += '<div class="journal-area" id="journal-' + taskId + '">';
        html += '<textarea class="journal-textarea" id="jtext-' + taskId + '" placeholder="What did you learn? What surprised you? Notes for future reference…" ' +
          'oninput="scheduleJournalSave(\'' + taskId + '\')">' + escHtml(task.journal || '') + '</textarea>';
        html += '<div class="journal-footer">';
        html += '<span class="save-indicator" id="saved-' + taskId + '">✓ Saved</span>';
        html += '<span class="word-count" id="wc-' + taskId + '">' + (wordCount > 0 ? wordCount + ' words' : '') + '</span>';
        if (task.journalUpdatedAt) {
          html += '<span class="journal-updated">Last updated ' + formatDate(task.journalUpdatedAt) + '</span>';
        }
        html += '</div></div>';
        html += '</div>';
      });

      html += '</div>'; // category-group
    });

    html += '</div>'; // week-section
  });

  document.getElementById('main-content').innerHTML = html;

  // Last synced
  if (allData.meta && allData.meta.lastUpdated) {
    document.getElementById('last-synced').textContent = 'Last synced: ' + formatDate(allData.meta.lastUpdated);
  }
}

// ─── Toggle task completion ───────────────────────────────────────────────────
async function toggleTask(taskId, checkbox) {
  const completed = checkbox.checked;
  const task = allData.tasks[taskId];
  if (!task) return;

  // Optimistic UI
  task.completed = completed;
  task.completedAt = completed ? new Date().toISOString() : null;
  const textEl = checkbox.closest('.task-row').querySelector('.task-text');
  if (textEl) {
    textEl.classList.toggle('completed-text', completed);
  }
  refreshStats();

  if (!authToken) { alert('Please enter your access token at the top of the page to save changes.'); checkbox.checked = !completed; task.completed = !completed; return; }

  try {
    const res = await fetch('/api/task/' + encodeURIComponent(taskId), {
      method: 'PUT',
      headers: { 'Authorization': 'Bearer ' + authToken, 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed })
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const updated = await res.json();
    task.completedAt = updated.completedAt;
    // Re-render just the completion meta for this task
    const metaEl = checkbox.closest('.task-row').querySelector('.task-meta');
    if (metaEl) {
      const existing = metaEl.querySelector('.completed-at');
      if (existing) existing.remove();
      if (completed && updated.completedAt) {
        const span = document.createElement('span');
        span.className = 'completed-at';
        span.textContent = '✓ Completed ' + formatDate(updated.completedAt);
        metaEl.prepend(span);
      }
    }
  } catch(e) {
    console.error('Save failed:', e);
    checkbox.checked = !completed;
    task.completed = !completed;
    alert('Could not save — check your connection.');
  }
}

// ─── Journal ─────────────────────────────────────────────────────────────────
function toggleJournal(taskId) {
  const area = document.getElementById('journal-' + taskId);
  if (!area) return;
  const isOpen = area.classList.toggle('open');
  if (isOpen) {
    const ta = document.getElementById('jtext-' + taskId);
    if (ta) { ta.focus(); updateWordCount(taskId); }
  }
}

const journalTimers = {};
function scheduleJournalSave(taskId) {
  updateWordCount(taskId);
  clearTimeout(journalTimers[taskId]);
  journalTimers[taskId] = setTimeout(() => saveJournal(taskId), 2000);
}

function updateWordCount(taskId) {
  const ta = document.getElementById('jtext-' + taskId);
  const wc = document.getElementById('wc-' + taskId);
  if (!ta || !wc) return;
  const words = ta.value.trim().split(/\\s+/).filter(Boolean).length;
  wc.textContent = words > 0 ? words + ' words' : '';
}

async function saveJournal(taskId) {
  if (!authToken) return;
  const ta = document.getElementById('jtext-' + taskId);
  if (!ta) return;
  const journal = ta.value;
  const savedEl = document.getElementById('saved-' + taskId);

  try {
    const res = await fetch('/api/journal/' + encodeURIComponent(taskId), {
      method: 'PUT',
      headers: { 'Authorization': 'Bearer ' + authToken, 'Content-Type': 'application/json' },
      body: JSON.stringify({ journal })
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    if (allData.tasks[taskId]) allData.tasks[taskId].journal = journal;
    if (savedEl) {
      savedEl.classList.add('visible');
      setTimeout(() => savedEl.classList.remove('visible'), 2000);
    }
  } catch(e) {
    console.error('Journal save failed:', e);
  }
}

// ─── Stats refresh (without full re-render) ───────────────────────────────────
function refreshStats() {
  const { tasks, weeks } = allData;
  const allTaskIds = Object.keys(tasks);
  const totalTasks = allTaskIds.length;
  const completedTasks = allTaskIds.filter(id => tasks[id].completed).length;
  const journalEntries = allTaskIds.filter(id => tasks[id].journal && tasks[id].journal.trim()).length;
  const pct = totalTasks ? Math.round(completedTasks / totalTasks * 100) : 0;
  const bar = document.getElementById('overall-bar');
  const label = document.getElementById('overall-label');
  const stats = document.getElementById('nav-stats');
  if (bar) bar.style.width = pct + '%';
  if (label) label.textContent = completedTasks + ' of ' + totalTasks + ' tasks (' + pct + '%)';
  if (stats) stats.textContent = completedTasks + ' done · ' + journalEntries + ' journal entries · ' + pct + '% overall';
}

// ─── Export ──────────────────────────────────────────────────────────────────
async function exportData() {
  const res = await fetch('/api/export');
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'steadfast-diary-export-' + new Date().toISOString().slice(0,10) + '.json';
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function escHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// ─── Boot ────────────────────────────────────────────────────────────────────
initAuth();
loadData();
</script>
</body>
</html>`;

// ─── Task seed data (parsed from accessibility-upskilling-checklist-v2.md) ──────────
const SEED_DATA = {
  tasks: {
    // WEEK 1
    "w1-admin-iaap": { description: "Join IAAP ($235)", completed: true, completedAt: "2026-04-05T00:00:00Z", journal: "", journalUpdatedAt: null },
    "w1-admin-deque": { description: "Enroll in Deque University Full Access ($450)", completed: true, completedAt: "2026-04-05T00:00:00Z", journal: "", journalUpdatedAt: null },
    "w1-admin-dhs": { description: "Enroll in DHS Trusted Tester (free, self-paced)", completed: true, completedAt: "2026-04-05T00:00:00Z", journal: "", journalUpdatedAt: null },
    "w1-admin-windows": { description: "Set up Windows on Linux PC", completed: true, completedAt: "2026-04-05T00:00:00Z", journal: "", journalUpdatedAt: null },
    "w1-admin-tools": { description: "Install all tools (NVDA, JAWS, Accessibility Insights, PAC, Colour Contrast Analyser, WAVE, axe DevTools, Chrome, Firefox on Windows PC)", completed: true, completedAt: "2026-04-05T00:00:00Z", journal: "", journalUpdatedAt: null },
    "w1-admin-jaws": { description: "Purchase JAWS Home Annual license ($104.50)", completed: true, completedAt: "2026-04-05T00:00:00Z", journal: "", journalUpdatedAt: null },
    "w1-admin-voiceover": { description: "Enable VoiceOver on Mac (Settings > Accessibility)", completed: false, completedAt: null, journal: "", journalUpdatedAt: null },
    "w1-admin-outreach": { description: "Reach out to Joel, Ellen, Mitchell, and Dale — let them know you're pivoting to accessibility consulting and would love to grab coffee or a Zoom call in the coming weeks", completed: false, completedAt: null, journal: "", journalUpdatedAt: null },
    "w1-skills-nvda": { description: "First NVDA session — 1 hour navigating real e-commerce sites with screen reader only", completed: false, completedAt: null, journal: "", journalUpdatedAt: null },
    "w1-study-deque": { description: "Begin Deque Accessibility Fundamentals course (2–3 hrs)", completed: false, completedAt: null, journal: "", journalUpdatedAt: null },
    "w1-biz-kevin": { description: "Send Kevin mutual-acknowledgment message", completed: true, completedAt: "2026-04-05T00:00:00Z", journal: "", journalUpdatedAt: null },
    "w1-biz-domain": { description: "Register steadfastaccessibility.com (Cloudflare Registrar)", completed: true, completedAt: "2026-04-05T00:00:00Z", journal: "", journalUpdatedAt: null },
    "w1-biz-llc": { description: "File Steadfast Accessibility LLC in California", completed: true, completedAt: "2026-04-05T00:00:00Z", journal: "", journalUpdatedAt: null },
    "w1-biz-ein": { description: "Apply for EIN from IRS", completed: true, completedAt: "2026-04-05T00:00:00Z", journal: "", journalUpdatedAt: null },

    // WEEK 2
    "w2-skills-nvda-commands": { description: "NVDA core commands practice: H (headings), F (forms), T (tables), Tab (interactive), arrow keys (reading), Insert+F7 (elements list)", completed: false, completedAt: null, journal: "", journalUpdatedAt: null },
    "w2-skills-nvda-shopify": { description: "Navigate 3 real Shopify stores with NVDA only — no mouse, minimize looking at screen (5 hrs)", completed: false, completedAt: null, journal: "", journalUpdatedAt: null },
    "w2-skills-nvda-flows": { description: "Complete full user flows: browse → add to cart → checkout → form submission", completed: false, completedAt: null, journal: "", journalUpdatedAt: null },
    "w2-skills-keyboard-unplug": { description: "Unplug mouse entirely. Navigate the same 3 Shopify stores keyboard-only — Tab/Shift+Tab/Enter/Space/Escape/Arrow keys", completed: false, completedAt: null, journal: "", journalUpdatedAt: null },
    "w2-skills-keyboard-document": { description: "For each site, document: Can you reach every interactive element? Can you see where focus is? Can you escape every modal/drawer/dropdown? Can you complete checkout?", completed: false, completedAt: null, journal: "", journalUpdatedAt: null },
    "w2-skills-keyboard-time": { description: "Time yourself — target is to keyboard-test a 10-page site in under 2 hours by Week 4", completed: false, completedAt: null, journal: "", journalUpdatedAt: null },
    "w2-study-cpacc": { description: "Begin CPACC prep via Deque University (3–4 hrs)", completed: false, completedAt: null, journal: "", journalUpdatedAt: null },
    "w2-study-dhs1": { description: "DHS Trusted Tester Module 1 (2–3 hrs)", completed: false, completedAt: null, journal: "", journalUpdatedAt: null },

    // WEEK 3
    "w3-skills-nvda-restaurant": { description: "NVDA: Full user flows — cart, checkout, forms on 2 restaurant sites (4 hrs)", completed: false, completedAt: null, journal: "", journalUpdatedAt: null },
    "w3-skills-keyboard-restaurant": { description: "Keyboard: Repeat keyboard-only testing on the 2 restaurant sites — document focus traps, missing skip nav, broken date pickers (2 hrs)", completed: false, completedAt: null, journal: "", journalUpdatedAt: null },
    "w3-study-cpacc": { description: "CPACC: Complete Deque prep course, review IAAP Body of Knowledge (8–10 hrs)", completed: false, completedAt: null, journal: "", journalUpdatedAt: null },
    "w3-study-dhs23": { description: "DHS Trusted Tester Modules 2–3 (4 hrs)", completed: false, completedAt: null, journal: "", journalUpdatedAt: null },
    "w3-study-wcag-print": { description: "Print or open the full WCAG 2.1 success criteria list (all 78: 50 A + 20 AA + 8 AAA)", completed: false, completedAt: null, journal: "", journalUpdatedAt: null },
    "w3-study-wcag-tag": { description: "Tag each WCAG criterion: 🔴 High lawsuit risk / 🟡 Medium lawsuit risk / ⚪ Low/AAA — using the deep dive document's top 10 list", completed: false, completedAt: null, journal: "", journalUpdatedAt: null },
    "w3-study-wcag-reference": { description: "Keep tagged WCAG list as reference during all future study — go deep on 🔴 criteria, lighter on ⚪ AAA criteria", completed: false, completedAt: null, journal: "", journalUpdatedAt: null },

    // WEEK 4
    "w4-skills-jaws": { description: "JAWS: Learn equivalents of NVDA commands, test same sites with both screen readers (4 hrs)", completed: false, completedAt: null, journal: "", journalUpdatedAt: null },
    "w4-skills-keyboard": { description: "Keyboard testing: Test 2 new sites you haven't seen before — can you find issues cold? (3 hrs)", completed: false, completedAt: null, journal: "", journalUpdatedAt: null },
    "w4-skills-combined": { description: "Combined test: Run NVDA + keyboard on a site end-to-end, logging findings in structured format — dress rehearsal for Mock Audit #1 (2 hrs)", completed: false, completedAt: null, journal: "", journalUpdatedAt: null },
    "w4-study-cpacc": { description: "CPACC: Practice questions, review weak areas (6 hrs)", completed: false, completedAt: null, journal: "", journalUpdatedAt: null },
    "w4-study-dhs45": { description: "DHS Trusted Tester Modules 4–5 (4 hrs)", completed: false, completedAt: null, journal: "", journalUpdatedAt: null },
    "w4-biz-linkedin-draft": { description: "Draft anti-overlay LinkedIn article — 25% of lawsuits cite overlays, FTC fined accessiBe $1M, courts reject overlay defense. Write this week, publish Week 5.", completed: false, completedAt: null, journal: "", journalUpdatedAt: null },
    "w4-network-joel-prep": { description: "Work with Claude to build conversation outline + questions for Joel (Week 5 meeting). Bring Mock Audit #1 experience and screen reader questions.", completed: false, completedAt: null, journal: "", journalUpdatedAt: null },

    // WEEK 5
    "w5-admin-cpacc-apply": { description: "5/6: Submit CPACC exam application ($410) — application window opens 5/6, closes 5/20", completed: false, completedAt: null, journal: "", journalUpdatedAt: null },
    "w5-admin-was-apply": { description: "5/6: Submit WAS screening application (free to submit — $455 exam fee only if approved) — closes 5/20", completed: false, completedAt: null, journal: "", journalUpdatedAt: null },
    "w5-mock-pick-store": { description: "Pick a real Shopify store (Panic Button tier — 5–10 pages)", completed: false, completedAt: null, journal: "", journalUpdatedAt: null },
    "w5-mock-workflow": { description: "Run full workflow: axe-core scan → keyboard navigation → NVDA testing → JAWS testing → contrast spot-checks", completed: false, completedAt: null, journal: "", journalUpdatedAt: null },
    "w5-mock-checklist": { description: "Use the Top 20 Panic Button Checklist from the deep dive document as your testing protocol", completed: false, completedAt: null, journal: "", journalUpdatedAt: null },
    "w5-mock-alttext": { description: "Shopify-specific: Product image alt text coverage — spot-check 20+ products, not just pages you scan", completed: false, completedAt: null, journal: "", journalUpdatedAt: null },
    "w5-mock-cart-focus": { description: "Shopify-specific: Cart drawer/slideout focus management — does focus move into the drawer? Can you Tab out? Does focus return when closed?", completed: false, completedAt: null, journal: "", journalUpdatedAt: null },
    "w5-mock-quickview": { description: "Shopify-specific: Quick-view modal keyboard trap test", completed: false, completedAt: null, journal: "", journalUpdatedAt: null },
    "w5-mock-thirdparty": { description: "Shopify-specific: Third-party app audit — list every third-party app visible, run axe on pages with each app loaded, note which introduce violations", completed: false, completedAt: null, journal: "", journalUpdatedAt: null },
    "w5-mock-dynamic": { description: "Shopify-specific: Dynamic price/inventory update — does screen reader announce 'Sale price' or 'Out of stock' changes?", completed: false, completedAt: null, journal: "", journalUpdatedAt: null },
    "w5-mock-findings": { description: "Log all findings in structured format. Time yourself (target: under 10 hours). Write executive summary.", completed: false, completedAt: null, journal: "", journalUpdatedAt: null },
    "w5-mock-buckets": { description: "Categorize findings: Fix directly / Fix with vendor / Mitigate or replace", completed: false, completedAt: null, journal: "", journalUpdatedAt: null },
    "w5-mock-testimonial": { description: "Offer results to the business owner for free in exchange for a testimonial", completed: false, completedAt: null, journal: "", journalUpdatedAt: null },
    "w5-study-cpacc": { description: "CPACC: Final prep (4 hrs)", completed: false, completedAt: null, journal: "", journalUpdatedAt: null },
    "w5-study-dhs67": { description: "DHS Trusted Tester Modules 6–7 (4 hrs)", completed: false, completedAt: null, journal: "", journalUpdatedAt: null },
    "w5-study-confirm-networking": { description: "Confirm networking meetings are scheduled for Weeks 5–6 (Joel + first practitioner)", completed: false, completedAt: null, journal: "", journalUpdatedAt: null },
    "w5-biz-linkedin-publish": { description: "Publish anti-overlay LinkedIn article", completed: false, completedAt: null, journal: "", journalUpdatedAt: null },
    "w5-biz-channels": { description: "Begin Channel 2 (community presence — Shopify forums, Reddit) and Channel 3 (direct outreach to recently-sued businesses)", completed: false, completedAt: null, journal: "", journalUpdatedAt: null },
    "w5-network-joel-schedule": { description: "Schedule coffee/Zoom with Joel Isaac this week", completed: false, completedAt: null, journal: "", journalUpdatedAt: null },
    "w5-network-joel-audit": { description: "Share Mock Audit #1 findings with Joel and ask him to walk you through how he'd experience those issues. Use conversation outline built in Week 4.", completed: false, completedAt: null, journal: "", journalUpdatedAt: null },

    // WEEK 6
    "w6-skills-nvda-new": { description: "NVDA + keyboard testing on 2 new sites you haven't seen before — keep building speed and pattern recognition (4 hrs)", completed: false, completedAt: null, journal: "", journalUpdatedAt: null },
    "w6-skills-focus": { description: "Focus on testing the interactive components that tripped you up in Mock Audit #1 (2 hrs)", completed: false, completedAt: null, journal: "", journalUpdatedAt: null },
    "w6-study-cpacc": { description: "CPACC: Intensive review — exam window opens 5/20 (8–10 hrs)", completed: false, completedAt: null, journal: "", journalUpdatedAt: null },
    "w6-study-dhs": { description: "DHS Trusted Tester: Maintain momentum (2–3 hrs)", completed: false, completedAt: null, journal: "", journalUpdatedAt: null },
    "w6-network-p1-prep": { description: "Work with Claude to build conversation outline + questions for Practitioner #1 meeting (Ellen, Mitchell, or Dale)", completed: false, completedAt: null, journal: "", journalUpdatedAt: null },
    "w6-network-p1-schedule": { description: "Schedule coffee/Zoom with one of your JPMC accessibility practitioner contacts this week", completed: false, completedAt: null, journal: "", journalUpdatedAt: null },

    // WEEK 7
    "w7-exam-cpacc": { description: "Take CPACC exam (5/20 or later) — 100 questions, 2 hours, online proctored via Pearson VUE. Results by 7/29/2026.", completed: false, completedAt: null, journal: "", journalUpdatedAt: null },
    "w7-skills-voiceover": { description: "VoiceOver on iPhone: swipe navigation, rotor controls, basic testing workflow (5 hrs)", completed: false, completedAt: null, journal: "", journalUpdatedAt: null },
    "w7-skills-voiceover-sites": { description: "Test 3 sites with VoiceOver — same sites tested on desktop", completed: false, completedAt: null, journal: "", journalUpdatedAt: null },
    "w7-study-dhs89": { description: "DHS Trusted Tester Modules 8–9 (4 hrs)", completed: false, completedAt: null, journal: "", journalUpdatedAt: null },

    // WEEK 8
    "w8-mock-pick-restaurant": { description: "Find a restaurant with online ordering, a menu PDF, and a reservation form — these are your target clients", completed: false, completedAt: null, journal: "", journalUpdatedAt: null },
    "w8-mock-workflow": { description: "Full workflow including mobile VoiceOver spot-check + cognitive/content review", completed: false, completedAt: null, journal: "", journalUpdatedAt: null },
    "w8-mock-menu-pdf": { description: "Restaurant-specific: Menu PDF — open in NVDA and PAC. Is it tagged? Is it a scanned image? Can a screen reader read menu items and prices?", completed: false, completedAt: null, journal: "", journalUpdatedAt: null },
    "w8-mock-ordering-widget": { description: "Restaurant-specific: Embedded ordering widget (Toast, Square, ChowNow, DoorDash) — test inside the iframe with NVDA and keyboard. Document every failure and note vendor.", completed: false, completedAt: null, journal: "", journalUpdatedAt: null },
    "w8-mock-date-picker": { description: "Restaurant-specific: Reservation form date picker — can you select a date keyboard-only? Does NVDA announce the selected date? Can you change the date?", completed: false, completedAt: null, journal: "", journalUpdatedAt: null },
    "w8-mock-location": { description: "Restaurant-specific: Location finder — is the address in real text or an image? Is the Google Maps embed supplemented with a text address?", completed: false, completedAt: null, journal: "", journalUpdatedAt: null },
    "w8-mock-hours": { description: "Restaurant-specific: Hours of operation — real text or image?", completed: false, completedAt: null, journal: "", journalUpdatedAt: null },
    "w8-mock-buckets": { description: "Categorize findings: Fix directly / Fix with vendor (include which vendor) / Mitigate or replace (include specific alternatives). Draft sample vendor outreach language for restaurant owner.", completed: false, completedAt: null, journal: "", journalUpdatedAt: null },
    "w8-mock-testimonial": { description: "Target: 12–15 hours. Offer results to the business owner for free in exchange for a testimonial.", completed: false, completedAt: null, journal: "", journalUpdatedAt: null },
    "w8-study-was1": { description: "Begin Deque WAS Exam Prep course — Domain 1 focus (4–6 hrs)", completed: false, completedAt: null, journal: "", journalUpdatedAt: null },
    "w8-study-dhs1011": { description: "DHS Trusted Tester Modules 10–11 (4 hrs)", completed: false, completedAt: null, journal: "", journalUpdatedAt: null },
    "w8-network-p2-prep": { description: "Work with Claude to build conversation outline + questions for Practitioner #2 (Ellen, Mitchell, or Dale). You now have restaurant mock audit findings.", completed: false, completedAt: null, journal: "", journalUpdatedAt: null },
    "w8-network-p2-schedule": { description: "Schedule coffee/Zoom with Practitioner #2 this week", completed: false, completedAt: null, journal: "", journalUpdatedAt: null },

    // WEEK 9
    "w9-admin-was-followup": { description: "If WAS screening approval hasn't arrived yet, follow up with IAAP. You need approval before exam window closes 6/17.", completed: false, completedAt: null, journal: "", journalUpdatedAt: null },
    "w9-study-was23": { description: "WAS: Domains 2 and 3 (10 hrs)", completed: false, completedAt: null, journal: "", journalUpdatedAt: null },
    "w9-study-dhs-remaining": { description: "DHS Trusted Tester: Complete remaining coursework (6 hrs)", completed: false, completedAt: null, journal: "", journalUpdatedAt: null },

    // WEEK 10
    "w10-exam-dhs": { description: "Take DHS Trusted Tester exam — Must score 85%+, results are immediate", completed: false, completedAt: null, journal: "", journalUpdatedAt: null },
    "w10-exam-dhs-linkedin": { description: "Update LinkedIn immediately with DHS Trusted Tester certification", completed: false, completedAt: null, journal: "", journalUpdatedAt: null },
    "w10-exam-dhs-website": { description: "Update Steadfast Accessibility website and all marketing materials with DHS Trusted Tester certification", completed: false, completedAt: null, journal: "", journalUpdatedAt: null },
    "w10-study-was": { description: "WAS: ARIA deep dive, WCAG success criteria review, practice questions (8–10 hrs). Use your legal risk mapping from Week 3 — extra time on 🔴 criteria.", completed: false, completedAt: null, journal: "", journalUpdatedAt: null },
    "w10-network-p3-prep": { description: "Work with Claude to build conversation outline + questions for Practitioner #3. You now have DHS Trusted Tester cert, 2 mock audits, possibly first client.", completed: false, completedAt: null, journal: "", journalUpdatedAt: null },
    "w10-network-p3-schedule": { description: "Schedule coffee/Zoom with Practitioner #3 this week", completed: false, completedAt: null, journal: "", journalUpdatedAt: null },

    // WEEK 11
    "w11-mock-pick-complex": { description: "Pick a complex site (Stay Protected tier — 15+ pages, PDFs, forms, interactive components)", completed: false, completedAt: null, journal: "", journalUpdatedAt: null },
    "w11-mock-workflow": { description: "Full workflow including mobile testing + PDF testing", completed: false, completedAt: null, journal: "", journalUpdatedAt: null },
    "w11-mock-fix-direct": { description: "Fix directly: step-by-step instructions with screenshots, referencing the specific platform (Shopify admin, WooCommerce, Squarespace)", completed: false, completedAt: null, journal: "", journalUpdatedAt: null },
    "w11-mock-fix-vendor": { description: "Fix with vendor: documented findings + draft vendor outreach", completed: false, completedAt: null, journal: "", journalUpdatedAt: null },
    "w11-mock-mitigate": { description: "Mitigate or replace: specific alternative recommendations with rationale", completed: false, completedAt: null, journal: "", journalUpdatedAt: null },
    "w11-mock-summary": { description: "Write complete executive summary + remediation roadmap + compliance posture statement. This is your portfolio piece. Target: 15–18 hrs.", completed: false, completedAt: null, journal: "", journalUpdatedAt: null },
    "w11-mock-testimonial": { description: "Offer results to the business owner for free in exchange for a testimonial", completed: false, completedAt: null, journal: "", journalUpdatedAt: null },
    "w11-study-was": { description: "WAS: Final review, weak areas only (4–6 hrs)", completed: false, completedAt: null, journal: "", journalUpdatedAt: null },

    // WEEK 12
    "w12-exam-was": { description: "Take WAS exam (by 6/17 at latest) — 75 questions, 2 hours, online proctored via Pearson VUE. May/June exam window closes 6/17. Results by 7/29/2026.", completed: false, completedAt: null, journal: "", journalUpdatedAt: null },
    "w12-biz-templates": { description: "Build audit report templates from mock audits — create separate templates for e-commerce and restaurant clients", completed: false, completedAt: null, journal: "", journalUpdatedAt: null },
    "w12-biz-service-page": { description: "Draft service page with confirmed credentials (DHS Trusted Tester + CPACC pending)", completed: false, completedAt: null, journal: "", journalUpdatedAt: null },
    "w12-biz-three-bucket": { description: "Create the three-bucket finding template (Fix directly / Fix with vendor / Mitigate or replace) as a reusable deliverable format", completed: false, completedAt: null, journal: "", journalUpdatedAt: null },

    // WEEK 13
    "w13-biz-results": { description: "CPACC and WAS results expected by 7/29 — if either arrives early, update all materials immediately", completed: false, completedAt: null, journal: "", journalUpdatedAt: null },
    "w13-biz-audit-tool": { description: "Finalize audit tool (parallel development track)", completed: false, completedAt: null, journal: "", journalUpdatedAt: null },
    "w13-biz-sample-deliverable": { description: "Create sample audit deliverable from best mock audit (sales collateral)", completed: false, completedAt: null, journal: "", journalUpdatedAt: null },
    "w13-biz-linkedin-restaurant": { description: "Write second LinkedIn article — restaurant-specific: 'Your Restaurant Got a Demand Letter — Here's What's Actually Broken and What to Do About It.' Use anonymized findings from Mock Audit #2.", completed: false, completedAt: null, journal: "", journalUpdatedAt: null },

    // WEEK 14
    "w14-biz-publish-restaurant": { description: "Publish restaurant LinkedIn article", completed: false, completedAt: null, journal: "", journalUpdatedAt: null },
    "w14-biz-insurance": { description: "E&O insurance in place", completed: false, completedAt: null, journal: "", journalUpdatedAt: null },
    "w14-biz-entity": { description: "Entity structure finalized", completed: false, completedAt: null, journal: "", journalUpdatedAt: null },
    "w14-biz-kevin": { description: "Kevin conversation completed and documented", completed: false, completedAt: null, journal: "", journalUpdatedAt: null },
    "w14-biz-cold-audit": { description: "Cold audit test: new site, timed, check your work", completed: false, completedAt: null, journal: "", journalUpdatedAt: null },

    // WEEK 15 (status review — no checkable tasks, just review)
    "w15-review-status": { description: "Review all credentials, skills, and milestones achieved across the 15-week program", completed: false, completedAt: null, journal: "", journalUpdatedAt: null },
  },

  weeks: [
    {
      weekNum: 1, title: "Launch Everything", dates: "April 5–11, 2026", hours: "~8–10 hours",
      tasks: ["w1-admin-iaap","w1-admin-deque","w1-admin-dhs","w1-admin-windows","w1-admin-tools","w1-admin-jaws","w1-admin-voiceover","w1-admin-outreach","w1-skills-nvda","w1-study-deque","w1-biz-kevin","w1-biz-domain","w1-biz-llc","w1-biz-ein"],
      categories: [
        { name: "Admin", taskIds: ["w1-admin-iaap","w1-admin-deque","w1-admin-dhs","w1-admin-windows","w1-admin-tools","w1-admin-jaws","w1-admin-voiceover","w1-admin-outreach"] },
        { name: "Skills", taskIds: ["w1-skills-nvda"] },
        { name: "Study", taskIds: ["w1-study-deque"] },
        { name: "Business", taskIds: ["w1-biz-kevin","w1-biz-domain","w1-biz-llc","w1-biz-ein"] },
      ]
    },
    {
      weekNum: 2, title: "Screen Reader + Keyboard Sprint", dates: "April 12–18, 2026", hours: "~18–20 hours",
      tasks: ["w2-skills-nvda-commands","w2-skills-nvda-shopify","w2-skills-nvda-flows","w2-skills-keyboard-unplug","w2-skills-keyboard-document","w2-skills-keyboard-time","w2-study-cpacc","w2-study-dhs1"],
      categories: [
        { name: "Skills — Screen Reader (10 hrs)", taskIds: ["w2-skills-nvda-commands","w2-skills-nvda-shopify","w2-skills-nvda-flows"] },
        { name: "Skills — Keyboard Testing (5 hrs)", taskIds: ["w2-skills-keyboard-unplug","w2-skills-keyboard-document","w2-skills-keyboard-time"] },
        { name: "Study", taskIds: ["w2-study-cpacc","w2-study-dhs1"] },
      ]
    },
    {
      weekNum: 3, title: "CPACC Study + NVDA Deepening + Legal Risk Mapping", dates: "April 19–25, 2026", hours: "~20–22 hours",
      tasks: ["w3-skills-nvda-restaurant","w3-skills-keyboard-restaurant","w3-study-cpacc","w3-study-dhs23","w3-study-wcag-print","w3-study-wcag-tag","w3-study-wcag-reference"],
      categories: [
        { name: "Skills", taskIds: ["w3-skills-nvda-restaurant","w3-skills-keyboard-restaurant"] },
        { name: "Study", taskIds: ["w3-study-cpacc","w3-study-dhs23"] },
        { name: "Legal Risk Mapping Exercise (2 hrs)", taskIds: ["w3-study-wcag-print","w3-study-wcag-tag","w3-study-wcag-reference"] },
      ]
    },
    {
      weekNum: 4, title: "Add JAWS + Keyboard Mastery", dates: "April 26 – May 2, 2026", hours: "~20–22 hours",
      tasks: ["w4-skills-jaws","w4-skills-keyboard","w4-skills-combined","w4-study-cpacc","w4-study-dhs45","w4-biz-linkedin-draft","w4-network-joel-prep"],
      categories: [
        { name: "Skills", taskIds: ["w4-skills-jaws","w4-skills-keyboard","w4-skills-combined"] },
        { name: "Study", taskIds: ["w4-study-cpacc","w4-study-dhs45"] },
        { name: "Business", taskIds: ["w4-biz-linkedin-draft"] },
        { name: "Networking Prep", taskIds: ["w4-network-joel-prep"] },
      ]
    },
    {
      weekNum: 5, title: "Mock Audit #1: Shopify E-Commerce (Quality Gate) + Exam Applications", dates: "May 3–9, 2026", hours: "~22–25 hours",
      tasks: ["w5-admin-cpacc-apply","w5-admin-was-apply","w5-mock-pick-store","w5-mock-workflow","w5-mock-checklist","w5-mock-alttext","w5-mock-cart-focus","w5-mock-quickview","w5-mock-thirdparty","w5-mock-dynamic","w5-mock-findings","w5-mock-buckets","w5-mock-testimonial","w5-study-cpacc","w5-study-dhs67","w5-study-confirm-networking","w5-biz-linkedin-publish","w5-biz-channels","w5-network-joel-schedule","w5-network-joel-audit"],
      categories: [
        {
          name: "Admin — IAAP Exam Applications",
          taskIds: ["w5-admin-cpacc-apply","w5-admin-was-apply"],
          milestoneBefore: [{ type: "milestone", text: "Quality Gate — If you can deliver this confidently, you're ready for paying Panic Button clients" }]
        },
        { name: "Mock Audit #1 — Shopify E-Commerce", taskIds: ["w5-mock-pick-store","w5-mock-workflow","w5-mock-checklist","w5-mock-alttext","w5-mock-cart-focus","w5-mock-quickview","w5-mock-thirdparty","w5-mock-dynamic","w5-mock-findings","w5-mock-buckets","w5-mock-testimonial"] },
        { name: "Study", taskIds: ["w5-study-cpacc","w5-study-dhs67","w5-study-confirm-networking"] },
        { name: "Business", taskIds: ["w5-biz-linkedin-publish","w5-biz-channels"] },
        {
          name: "Networking — Joel Isaac (legally blind, former JPMC)",
          taskIds: ["w5-network-joel-schedule","w5-network-joel-audit"],
          milestoneBefore: [{ type: "milestone", text: "Client Acquisition Begins — First revenue target: late May or June" }]
        },
      ]
    },
    {
      weekNum: 6, title: "CPACC Final Prep + Practitioner Networking", dates: "May 10–16, 2026", hours: "~20–22 hours",
      tasks: ["w6-skills-nvda-new","w6-skills-focus","w6-study-cpacc","w6-study-dhs","w6-network-p1-prep","w6-network-p1-schedule"],
      categories: [
        { name: "Skills", taskIds: ["w6-skills-nvda-new","w6-skills-focus"] },
        { name: "Study", taskIds: ["w6-study-cpacc","w6-study-dhs"] },
        { name: "Networking — Practitioner #1 (Ellen, Mitchell, or Dale)", taskIds: ["w6-network-p1-prep","w6-network-p1-schedule"] },
      ]
    },
    {
      weekNum: 7, title: "CPACC Exam + Mobile Sprint", dates: "May 17–23, 2026", hours: "~18–20 hours",
      tasks: ["w7-exam-cpacc","w7-skills-voiceover","w7-skills-voiceover-sites","w7-study-dhs89"],
      categories: [
        {
          name: "Exam",
          taskIds: ["w7-exam-cpacc"],
          milestoneBefore: [{ type: "deadline", text: "IAAP application deadline: 5/20/2026 — Both CPACC and WAS applications must be submitted by 5/20" }]
        },
        { name: "Skills", taskIds: ["w7-skills-voiceover","w7-skills-voiceover-sites"] },
        { name: "Study", taskIds: ["w7-study-dhs89"] },
      ]
    },
    {
      weekNum: 8, title: "Mock Audit #2: Restaurant Site + WAS Study Begins", dates: "May 24–30, 2026", hours: "~22–25 hours",
      tasks: ["w8-mock-pick-restaurant","w8-mock-workflow","w8-mock-menu-pdf","w8-mock-ordering-widget","w8-mock-date-picker","w8-mock-location","w8-mock-hours","w8-mock-buckets","w8-mock-testimonial","w8-study-was1","w8-study-dhs1011","w8-network-p2-prep","w8-network-p2-schedule"],
      categories: [
        {
          name: "Mock Audit #2 — Restaurant Site",
          taskIds: ["w8-mock-pick-restaurant","w8-mock-workflow","w8-mock-menu-pdf","w8-mock-ordering-widget","w8-mock-date-picker","w8-mock-location","w8-mock-hours","w8-mock-buckets","w8-mock-testimonial"],
          milestoneBefore: [{ type: "milestone", text: "After this mock audit, you can take Fix It Right clients ($5,000) with confidence" }]
        },
        { name: "Study", taskIds: ["w8-study-was1","w8-study-dhs1011"] },
        { name: "Networking — Practitioner #2 (Ellen, Mitchell, or Dale)", taskIds: ["w8-network-p2-prep","w8-network-p2-schedule"] },
      ]
    },
    {
      weekNum: 9, title: "WAS Study Intensive", dates: "May 31 – June 6, 2026", hours: "~20–22 hours",
      tasks: ["w9-admin-was-followup","w9-study-was23","w9-study-dhs-remaining"],
      categories: [
        { name: "Admin", taskIds: ["w9-admin-was-followup"] },
        { name: "Study", taskIds: ["w9-study-was23","w9-study-dhs-remaining"] },
      ]
    },
    {
      weekNum: 10, title: "DHS Exam + WAS Deep Study", dates: "June 7–13, 2026", hours: "~18–22 hours",
      tasks: ["w10-exam-dhs","w10-exam-dhs-linkedin","w10-exam-dhs-website","w10-study-was","w10-network-p3-prep","w10-network-p3-schedule"],
      categories: [
        {
          name: "Exam",
          taskIds: ["w10-exam-dhs","w10-exam-dhs-linkedin","w10-exam-dhs-website"],
          milestoneBefore: [{ type: "milestone", text: "First confirmed credential — DHS Trusted Tester" }]
        },
        { name: "Study", taskIds: ["w10-study-was"] },
        { name: "Networking — Practitioner #3 (Ellen, Mitchell, or Dale)", taskIds: ["w10-network-p3-prep","w10-network-p3-schedule"] },
      ]
    },
    {
      weekNum: 11, title: "Mock Audit #3: Complex Multi-Platform + WAS Exam Window Closing", dates: "June 14–20, 2026", hours: "~22–25 hours",
      tasks: ["w11-mock-pick-complex","w11-mock-workflow","w11-mock-fix-direct","w11-mock-fix-vendor","w11-mock-mitigate","w11-mock-summary","w11-mock-testimonial","w11-study-was"],
      categories: [
        {
          name: "Mock Audit #3 — Complex Multi-Platform",
          taskIds: ["w11-mock-pick-complex","w11-mock-workflow","w11-mock-fix-direct","w11-mock-fix-vendor","w11-mock-mitigate","w11-mock-summary","w11-mock-testimonial"],
          milestoneBefore: [{ type: "deadline", text: "May/June exam window closes 6/17 — If you haven't taken WAS yet, schedule it for 6/14–6/17 this week" }]
        },
        { name: "Study", taskIds: ["w11-study-was"] },
      ]
    },
    {
      weekNum: 12, title: "WAS Exam", dates: "June 21–27, 2026", hours: "~15–18 hours",
      tasks: ["w12-exam-was","w12-biz-templates","w12-biz-service-page","w12-biz-three-bucket"],
      categories: [
        { name: "Exam", taskIds: ["w12-exam-was"] },
        { name: "Business", taskIds: ["w12-biz-templates","w12-biz-service-page","w12-biz-three-bucket"] },
      ]
    },
    {
      weekNum: 13, title: "Business Launch Polish", dates: "June 28 – July 4, 2026", hours: "~10–12 hours (holiday week)",
      tasks: ["w13-biz-results","w13-biz-audit-tool","w13-biz-sample-deliverable","w13-biz-linkedin-restaurant"],
      categories: [
        { name: "Business", taskIds: ["w13-biz-results","w13-biz-audit-tool","w13-biz-sample-deliverable","w13-biz-linkedin-restaurant"] },
      ]
    },
    {
      weekNum: 14, title: "Go-Live", dates: "July 5–11, 2026", hours: "~10–12 hours",
      tasks: ["w14-biz-publish-restaurant","w14-biz-insurance","w14-biz-entity","w14-biz-kevin","w14-biz-cold-audit"],
      categories: [
        { name: "Business", taskIds: ["w14-biz-publish-restaurant","w14-biz-insurance","w14-biz-entity","w14-biz-kevin","w14-biz-cold-audit"] },
      ]
    },
    {
      weekNum: 15, title: "Fully Operational", dates: "July 12–15, 2026", hours: null,
      tasks: ["w15-review-status"],
      categories: [
        {
          name: "Status Review",
          taskIds: ["w15-review-status"],
          milestoneBefore: [{ type: "milestone", text: "Fully Operational — 15-week program complete" }]
        },
      ],
      statusTable: [
        ["DHS Trusted Tester v5", "✅ CERTIFIED (Week 10)"],
        ["IAAP CPACC", "Exam taken Week 7 (5/20+), results by 7/29/2026"],
        ["IAAP WAS", "Exam taken Week 11–12 (by 6/17), results by 7/29/2026"],
        ["IAAP CPWA", "Both results arrive by 7/29 — CPWA awarded early August if both pass"],
        ["Screen reader proficiency", "60+ hrs NVDA + JAWS + VoiceOver"],
        ["Keyboard testing proficiency", "Practiced since Week 2, tested across all 3 mock audits"],
        ["Mock audits completed", "3 — Shopify e-commerce, restaurant, complex multi-platform — with testimonials"],
        ["Platform-specific knowledge", "Shopify, WooCommerce, Squarespace checklists tested in practice"],
        ["Practitioner networking", "4 conversations completed (Joel + 3 practitioners)"],
        ["Audit tool", "Built and tested"],
        ["LinkedIn content", "2 published articles (anti-overlay + restaurant-specific)"],
        ["Finding categorization", "Three-bucket system battle-tested across 3 mock audits"],
      ]
    },
  ],

  meta: {
    lastUpdated: new Date().toISOString(),
    totalTasks: 0,
    completedTasks: 0,
  }
};

// Compute totals for meta
SEED_DATA.meta.totalTasks = Object.keys(SEED_DATA.tasks).length;
SEED_DATA.meta.completedTasks = Object.values(SEED_DATA.tasks).filter(t => t.completed).length;

// ─── Worker ────────────────────────────────────────────────────────────────────
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    // ── Auth helper ──────────────────────────────────────────────────────────
    function checkAuth() {
      const header = request.headers.get('Authorization') || '';
      const token = header.replace(/^Bearer\s+/i, '').trim();
      return token === env.AUTH_TOKEN;
    }

    // ── GET /api/data ────────────────────────────────────────────────────────
    if (path === '/api/data' && request.method === 'GET') {
      let data = await env.DIARY_DATA.get('diary', { type: 'json' });
      if (!data) data = SEED_DATA;
      return new Response(JSON.stringify(data), {
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
      });
    }

    // ── PUT /api/task/:taskId ─────────────────────────────────────────────────
    if (path.startsWith('/api/task/') && request.method === 'PUT') {
      if (path === '/api/task/__ping') {
        if (!checkAuth()) return new Response('Unauthorized', { status: 401 });
        return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } });
      }
      if (!checkAuth()) return new Response('Unauthorized', { status: 401 });
      const taskId = decodeURIComponent(path.slice('/api/task/'.length));
      const body = await request.json();
      let data = await env.DIARY_DATA.get('diary', { type: 'json' });
      if (!data) data = JSON.parse(JSON.stringify(SEED_DATA));
      if (!data.tasks[taskId]) {
        return new Response(JSON.stringify({ error: 'Task not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
      }
      const now = new Date().toISOString();
      data.tasks[taskId].completed = !!body.completed;
      data.tasks[taskId].completedAt = body.completed ? now : null;
      data.meta.lastUpdated = now;
      data.meta.completedTasks = Object.values(data.tasks).filter(t => t.completed).length;
      await env.DIARY_DATA.put('diary', JSON.stringify(data));
      return new Response(JSON.stringify({ ok: true, completedAt: data.tasks[taskId].completedAt }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // ── PUT /api/journal/:taskId ──────────────────────────────────────────────
    if (path.startsWith('/api/journal/') && request.method === 'PUT') {
      if (!checkAuth()) return new Response('Unauthorized', { status: 401 });
      const taskId = decodeURIComponent(path.slice('/api/journal/'.length));
      const body = await request.json();
      let data = await env.DIARY_DATA.get('diary', { type: 'json' });
      if (!data) data = JSON.parse(JSON.stringify(SEED_DATA));
      if (!data.tasks[taskId]) {
        return new Response(JSON.stringify({ error: 'Task not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
      }
      const now = new Date().toISOString();
      data.tasks[taskId].journal = body.journal || '';
      data.tasks[taskId].journalUpdatedAt = now;
      data.meta.lastUpdated = now;
      await env.DIARY_DATA.put('diary', JSON.stringify(data));
      return new Response(JSON.stringify({ ok: true, journalUpdatedAt: now }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // ── GET /api/export ──────────────────────────────────────────────────────
    if (path === '/api/export' && request.method === 'GET') {
      let data = await env.DIARY_DATA.get('diary', { type: 'json' });
      if (!data) data = SEED_DATA;
      return new Response(JSON.stringify(data, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': 'attachment; filename="steadfast-diary-export.json"'
        }
      });
    }

    // ── GET / — serve HTML app ───────────────────────────────────────────────
    let data = await env.DIARY_DATA.get('diary', { type: 'json' });
    if (!data) {
      // First load — seed KV and return seeded data
      data = JSON.parse(JSON.stringify(SEED_DATA));
      await env.DIARY_DATA.put('diary', JSON.stringify(data));
    }
    const inlineScript = `<script>window.__DIARY_DATA__ = ${JSON.stringify(data)};<\/script>`;
    const page = HTML.replace('</head>', inlineScript + '</head>');
    return new Response(page, {
      headers: { 'Content-Type': 'text/html; charset=UTF-8', 'Cache-Control': 'no-store' }
    });
  }
};

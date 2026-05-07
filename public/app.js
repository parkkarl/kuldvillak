const PRIZES = [
  100, 200, 300, 500, 1000,
  2000, 4000, 8000, 16000, 32000,
  64000, 125000, 250000, 500000, 1000000,
];
const SAFE_LEVELS = [5, 10, 15];

const app = document.getElementById('app');
const aiBadge = document.getElementById('aiBadge');

const state = {
  questions: [],
  taskTitle: '',
  taskId: null,
  bankSize: 0,
  index: 0,
  selected: null,
  locked: false,
  lifelines: { fifty: true, seventy: true, audience: true },
  removed: [],
  answers: [],
};

function renderTemplate(id) {
  const tpl = document.getElementById(id);
  return tpl.content.cloneNode(true);
}

async function fetchJson(url, options = {}) {
  const res = await fetch(url, options);
  if (!res.ok) {
    let body = {};
    try { body = await res.json(); } catch { /* ignore */ }
    throw new Error(body.error || `Päring ebaõnnestus (${res.status})`);
  }
  return res.json();
}

function setBadge(totalBank) {
  aiBadge.textContent = `Küsimustepank: ${totalBank} valmis küsimust`;
  aiBadge.classList.remove('mock', 'cli');
  aiBadge.classList.add('cloud');
}

async function showTaskList() {
  app.innerHTML = '';
  app.appendChild(renderTemplate('taskListTemplate'));
  const list = document.getElementById('taskList');
  const emptyState = document.getElementById('taskListEmpty');

  try {
    const data = await fetchJson('/api/tasks');
    const totalBank = data.tasks.reduce((sum, t) => sum + (t.bankSize || 0), 0);
    setBadge(totalBank);
    if (!data.tasks.length) {
      emptyState.classList.remove('hidden');
      return;
    }
    for (const task of data.tasks) {
      const li = document.createElement('li');
      li.innerHTML = `
        <span class="task-id">${task.id}</span>
        <span class="task-title">${escapeHtml(task.title)}</span>
        <span class="muted">${task.bankSize || 0} küsimust ▸</span>
      `;
      li.addEventListener('click', () => showTaskDetail(task.id));
      list.appendChild(li);
    }
  } catch (err) {
    list.innerHTML = `<li class="muted">Viga: ${escapeHtml(err.message)}</li>`;
  }
}

async function showTaskDetail(taskId) {
  app.innerHTML = '';
  app.appendChild(renderTemplate('taskDetailTemplate'));
  document.querySelector('[data-action="back"]').addEventListener('click', showTaskList);

  const titleEl = document.getElementById('taskTitle');
  const filesEl = document.getElementById('taskFiles');
  const bodyEl = document.getElementById('assignmentBody');
  const startBtn = document.getElementById('startGameBtn');
  const status = document.getElementById('generationStatus');

  titleEl.textContent = 'Laeb…';
  try {
    const task = await fetchJson(`/api/tasks/${taskId}`);
    titleEl.textContent = task.title;
    filesEl.textContent = `${task.files.length} faili (sh assignment.md) · küsimustepank: ${task.bankSize || 0}`;
    bodyEl.innerHTML = renderMarkdown(task.assignment || '*(assignment.md puudub)*');

    startBtn.addEventListener('click', async () => {
      startBtn.disabled = true;
      status.classList.remove('hidden', 'error');
      status.textContent = 'Valin küsimustepangast 15 küsimust…';
      try {
        const data = await fetchJson(`/api/tasks/${taskId}/questions`, { method: 'POST' });
        startBtn.disabled = false;
        startGame(data);
      } catch (err) {
        startBtn.disabled = false;
        status.classList.add('error');
        status.textContent = `Viga: ${err.message}`;
      }
    });
  } catch (err) {
    titleEl.textContent = 'Viga ülesande laadimisel';
    bodyEl.innerHTML = `<p class="muted">${escapeHtml(err.message)}</p>`;
  }
}

function startGame(data) {
  state.questions = data.questions;
  state.taskTitle = data.taskTitle;
  state.taskId = data.taskId;
  state.index = 0;
  state.selected = null;
  state.locked = false;
  state.lifelines = { fifty: true, audience: true };
  state.removed = [];
  state.answers = [];

  app.innerHTML = '';
  app.appendChild(renderTemplate('gameTemplate'));
  document.getElementById('quitBtn').addEventListener('click', () => {
    if (confirm('Lahkuda ja vorma sailitada hetke punktiseis?')) {
      finishGame({ reason: 'quit' });
    }
  });
  document.getElementById('confirmBtn').addEventListener('click', confirmAnswer);
  document.querySelectorAll('[data-lifeline]').forEach((btn) => {
    btn.addEventListener('click', () => useLifeline(btn.dataset.lifeline));
  });

  renderLadder();
  renderQuestion();
}

function renderLadder() {
  const ladder = document.getElementById('ladder');
  ladder.innerHTML = '';
  for (let i = PRIZES.length - 1; i >= 0; i--) {
    const li = document.createElement('li');
    const level = i + 1;
    li.dataset.level = level;
    if (SAFE_LEVELS.includes(level)) li.classList.add('safe');
    if (level === state.index + 1) li.classList.add('current');
    if (level <= state.index) li.classList.add('passed');
    li.innerHTML = `<span>${level}.</span><span>${PRIZES[i].toLocaleString('et-EE')} p</span>`;
    ladder.appendChild(li);
  }
}

function renderQuestion() {
  const q = state.questions[state.index];
  document.getElementById('qIndex').textContent = state.index + 1;
  document.getElementById('qPrize').textContent = `${PRIZES[state.index].toLocaleString('et-EE')} punkti`;
  const safeIdx = SAFE_LEVELS.findIndex((s) => state.index + 1 <= s);
  document.getElementById('qSafe').textContent = safeIdx >= 0
    ? `Järgmine turvatase: ${SAFE_LEVELS[safeIdx]}. küsimus`
    : 'Lõpufiniš!';

  document.getElementById('questionText').textContent = q.question;
  const optsList = document.getElementById('optionsList');
  optsList.innerHTML = '';
  state.selected = null;
  state.locked = false;
  state.removed = [];
  const confirmBtn = document.getElementById('confirmBtn');
  confirmBtn.disabled = true;
  confirmBtn.textContent = 'Kinnita vastus';
  confirmBtn.onclick = null;
  document.getElementById('feedback').classList.add('hidden');
  document.getElementById('lifelineOutput').classList.add('hidden');

  q.options.forEach((opt, idx) => {
    const li = document.createElement('li');
    li.dataset.idx = idx;
    li.innerHTML = `<span class="marker">${'ABCD'[idx]}</span><span>${escapeHtml(opt)}</span>`;
    li.addEventListener('click', () => selectOption(idx));
    optsList.appendChild(li);
  });

  renderLadder();
  syncLifelineButtons();
}

function selectOption(idx) {
  if (state.locked) return;
  if (state.removed.includes(idx)) return;
  state.selected = idx;
  document.querySelectorAll('#optionsList li').forEach((li) => {
    li.classList.toggle('selected', Number(li.dataset.idx) === idx);
  });
  document.getElementById('confirmBtn').disabled = false;
}

function confirmAnswer() {
  if (state.selected === null || state.locked) return;
  state.locked = true;
  const q = state.questions[state.index];
  const correct = state.selected === q.correctIndex;
  const optEls = document.querySelectorAll('#optionsList li');
  optEls.forEach((li) => {
    const idx = Number(li.dataset.idx);
    li.classList.add('locked');
    if (idx === q.correctIndex) li.classList.add('correct');
    if (idx === state.selected && !correct) li.classList.add('wrong');
  });

  state.answers.push({
    question: q.question,
    chosen: q.options[state.selected],
    correct: q.options[q.correctIndex],
    isCorrect: correct,
    explanation: q.explanation,
  });

  const feedback = document.getElementById('feedback');
  feedback.classList.remove('hidden');
  feedback.classList.toggle('correct', correct);
  feedback.classList.toggle('wrong', !correct);
  feedback.innerHTML = `<strong>${correct ? '✓ Õige!' : '✗ Vale!'}</strong> ${escapeHtml(q.explanation || '')}`;

  const confirmBtn = document.getElementById('confirmBtn');
  const isLastCorrect = correct && state.index === PRIZES.length - 1;
  if (!correct) {
    confirmBtn.textContent = 'Vaata tulemust';
  } else if (isLastCorrect) {
    confirmBtn.textContent = 'Vaata võitu';
  } else {
    confirmBtn.textContent = 'Edasi →';
  }
  confirmBtn.disabled = false;
  confirmBtn.onclick = () => {
    if (!correct) { finishGame({ reason: 'wrong' }); return; }
    if (isLastCorrect) { finishGame({ reason: 'won' }); return; }
    state.index += 1;
    renderQuestion();
  };
}

function useLifeline(name) {
  if (!state.lifelines[name] || state.locked) return;
  const q = state.questions[state.index];
  if (name === 'fifty') {
    const wrongIdxs = q.options
      .map((_, i) => i)
      .filter((i) => i !== q.correctIndex);
    shuffle(wrongIdxs);
    state.removed = wrongIdxs.slice(0, 2);
    document.querySelectorAll('#optionsList li').forEach((li) => {
      if (state.removed.includes(Number(li.dataset.idx))) {
        li.classList.add('disabled');
      }
    });
    state.lifelines.fifty = false;
  } else if (name === 'seventy') {
    window.open('https://www.youtube.com/watch?v=dQw4w9WgXcQ', '_blank', 'noopener');
    state.lifelines.seventy = false;
  } else if (name === 'audience') {
    const dist = audienceVote(q, state.index);
    const out = document.getElementById('lifelineOutput');
    out.classList.remove('hidden');
    out.innerHTML = `<strong>Publik hääletas:</strong>` + audienceBars(dist);
    state.lifelines.audience = false;
  }
  syncLifelineButtons();
}

function syncLifelineButtons() {
  document.querySelectorAll('[data-lifeline]').forEach((btn) => {
    btn.classList.toggle('used', !state.lifelines[btn.dataset.lifeline]);
  });
}

function audienceVote(q, level) {
  const correctConfidence = Math.max(0.35, 0.85 - level * 0.03);
  const dist = [0, 0, 0, 0];
  dist[q.correctIndex] = Math.round(correctConfidence * 100);
  let remaining = 100 - dist[q.correctIndex];
  const others = [0, 1, 2, 3].filter((i) => i !== q.correctIndex);
  shuffle(others);
  others.forEach((i, k) => {
    if (k === others.length - 1) dist[i] = remaining;
    else {
      const portion = Math.round(remaining * (0.3 + Math.random() * 0.4));
      dist[i] = portion;
      remaining -= portion;
    }
  });
  return dist;
}

function audienceBars(dist) {
  return `<div class="audience-bars">` + dist.map((v, i) =>
    `<div><span>${'ABCD'[i]}</span><span class="bar"><span style="width:${v}%"></span></span><span>${v}%</span></div>`,
  ).join('') + `</div>`;
}

function finishGame({ reason }) {
  let earned;
  if (reason === 'won') earned = PRIZES[PRIZES.length - 1];
  else if (reason === 'quit') earned = state.index === 0 ? 0 : PRIZES[state.index - 1];
  else {
    const lastSafe = SAFE_LEVELS.filter((s) => s <= state.index).pop();
    earned = lastSafe ? PRIZES[lastSafe - 1] : 0;
  }

  app.innerHTML = '';
  app.appendChild(renderTemplate('resultTemplate'));
  const heading = document.getElementById('resultHeading');
  const message = document.getElementById('resultMessage');
  const prize = document.getElementById('resultPrize');
  prize.textContent = earned.toLocaleString('et-EE');
  if (reason === 'won') {
    heading.textContent = '🏆 Miljon punkti!';
    message.textContent = 'Vastasid kõigile 15 küsimusele õigesti — sa mõistad lahendust hästi.';
  } else if (reason === 'quit') {
    heading.textContent = 'Lahkusid mängust';
    message.textContent = `Lahkusid ${state.index + 1}. küsimuse juures.`;
  } else {
    heading.textContent = '✗ Vale vastus — mäng lõppes';
    message.textContent = `Tulemus langes lähimale turvatasemele.`;
  }

  const review = document.getElementById('reviewList');
  review.innerHTML = '<h3>Vastuste ülevaade</h3>';
  state.answers.forEach((a, i) => {
    const div = document.createElement('div');
    div.className = 'review-item';
    div.innerHTML = `
      <p class="q"><strong>${i + 1}.</strong> ${escapeHtml(a.question)}</p>
      <p class="a ${a.isCorrect ? 'correct' : 'wrong'}">Sinu vastus: ${escapeHtml(a.chosen)} ${a.isCorrect ? '✓' : '✗'}</p>
      ${!a.isCorrect ? `<p class="a correct">Õige vastus: ${escapeHtml(a.correct)}</p>` : ''}
      ${a.explanation ? `<p class="muted">${escapeHtml(a.explanation)}</p>` : ''}
    `;
    review.appendChild(div);
  });

  document.getElementById('playAgainBtn').addEventListener('click', () => showTaskDetail(state.taskId));
  document.getElementById('backToListBtn').addEventListener('click', showTaskList);
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

function renderMarkdown(md) {
  const lines = md.split('\n');
  const out = [];
  let inCode = false;
  for (const raw of lines) {
    const line = raw;
    if (/^```/.test(line)) {
      inCode = !inCode;
      out.push(inCode ? '<pre><code>' : '</code></pre>');
      continue;
    }
    if (inCode) { out.push(escapeHtml(line)); continue; }
    if (/^### (.+)/.test(line)) out.push(`<h3>${escapeHtml(RegExp.$1)}</h3>`);
    else if (/^## (.+)/.test(line)) out.push(`<h2>${escapeHtml(RegExp.$1)}</h2>`);
    else if (/^# (.+)/.test(line)) out.push(`<h1>${escapeHtml(RegExp.$1)}</h1>`);
    else if (/^- (.+)/.test(line)) out.push(`<li>${escapeHtml(RegExp.$1)}</li>`);
    else if (line.trim() === '') out.push('');
    else out.push(`<p>${escapeHtml(line).replace(/`([^`]+)`/g, '<code>$1</code>')}</p>`);
  }
  return out.join('\n').replace(/(<li>.*<\/li>(\s*<li>.*<\/li>)*)/g, '<ul>$1</ul>');
}

showTaskList();

'use strict';

// Binly — camera -> identify -> follow-ups -> disposal verdict.

const el = (id) => document.getElementById(id);
const esc = (v) => String(v).replace(/[&<>"']/g, (c) => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
));

const state = {
  object: null,
  questions: [],
  answers: {},
  qIndex: 0,
  catalog: [],
  stream: null,
};

function show(step) {
  document.querySelectorAll('.step').forEach((s) => {
    s.classList.toggle('is-active', s.id === `step-${step}`);
  });
  el('restart').hidden = step === 'camera';
}

async function api(path, body) {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(data.error || `Request failed (${res.status})`), { data });
  return data;
}

// --- camera ---------------------------------------------------------------

async function startCamera() {
  if (!navigator.mediaDevices?.getUserMedia) return failCamera();
  try {
    state.stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: 'environment' } },
      audio: false,
    });
    el('video').srcObject = state.stream;
  } catch {
    failCamera();
  }
}

// No camera (desktop, denied permission, insecure origin) — the upload and
// manual paths still work, so just swap the viewfinder out.
function failCamera() {
  el('video').hidden = true;
  el('camera-fallback').hidden = false;
  el('shutter').disabled = true;
}

function captureFrame() {
  const video = el('video');
  const canvas = el('canvas');
  const w = video.videoWidth;
  const h = video.videoHeight;
  if (!w || !h) return null;

  // Cap the long edge so we are not shipping a 12 MP frame over the wire.
  const scale = Math.min(1, 1024 / Math.max(w, h));
  canvas.width = Math.round(w * scale);
  canvas.height = Math.round(h * scale);
  canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', 0.8);
}

function readFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Could not read that file'));
    reader.readAsDataURL(file);
  });
}

// --- flow -----------------------------------------------------------------

async function runIdentify(payload, previewDataUrl) {
  if (previewDataUrl) el('shot').src = previewDataUrl;
  el('scan-status').textContent = 'Identifying…';
  el('scan-status').className = 'prompt';
  show('scanning');

  // A beat of visible "work" — the scan animation is the whole point of the
  // screen, and an instant flash reads as broken.
  const [data] = await Promise.all([
    api('/api/identify', payload).catch((err) => err),
    new Promise((r) => setTimeout(r, 900)),
  ]);

  if (data instanceof Error) {
    if (data.data?.catalog) {
      state.catalog = data.data.catalog;
      return openPicker();
    }
    el('scan-status').textContent = data.message;
    el('scan-status').className = 'error';
    return;
  }

  state.object = data.object;
  state.questions = data.questions || [];
  state.answers = {};
  state.qIndex = 0;

  // A user-picked object needs no confirmation step.
  if (data.source === 'user') return nextQuestion();

  el('guess-label').textContent = data.object.label;
  el('guess-confidence').textContent =
    `${Math.round(data.confidence * 100)}% confident${data.stubbed ? ' · demo recognition' : ''}`;
  show('confirm');
}

function nextQuestion() {
  if (state.qIndex >= state.questions.length) return showResult();

  const q = state.questions[state.qIndex];
  el('q-progress').textContent = state.questions.length > 1
    ? `Question ${state.qIndex + 1} of ${state.questions.length}`
    : 'One quick question';
  el('q-text').textContent = q.text;
  el('q-help').textContent = q.help || '';

  el('q-options').innerHTML = q.options
    .map((o) => `<button class="btn" data-value="${esc(o.value)}">${esc(o.label)}</button>`)
    .join('');

  show('questions');
}

async function showResult() {
  let data;
  try {
    data = await api('/api/resolve', { objectId: state.object.id, answers: state.answers });
  } catch (err) {
    el('verdict').innerHTML = `<p class="error">${esc(err.message)}</p>`;
    el('components').innerHTML = '';
    return show('result');
  }

  el('verdict').dataset.outcome = data.headline.id;
  el('verdict').innerHTML = `
    <div class="verdict-icon">${data.headline.icon}</div>
    <h2>${esc(data.headline.label)}</h2>
    <p>${esc(data.headline.blurb)}</p>
    ${data.split ? '<p class="split-note">This item splits into parts that go to different places — see below.</p>' : ''}
    ${data.hazard ? '<p class="hazard-flag">Do not put this in a household bin.</p>' : ''}`;

  el('components').innerHTML = data.components.map((c) => `
    <div class="comp" data-outcome="${c.outcome.id}">
      <div class="comp-top">
        <span class="comp-name">${esc(c.label)}</span>
        <span class="comp-dest">${c.outcome.icon} ${esc(c.outcome.label)}</span>
      </div>
      <p class="comp-material">${esc(c.material)}</p>
      <p class="comp-why">${esc(c.why)}</p>
    </div>`).join('');

  const tip = el('tip');
  tip.hidden = !data.tip;
  if (data.tip) tip.textContent = data.tip;

  show('result');
}

async function openPicker() {
  if (!state.catalog.length) {
    const res = await fetch('/api/catalog');
    state.catalog = (await res.json()).objects || [];
  }
  el('picker-search').value = '';
  renderPicker('');
  show('picker');
  el('picker-search').focus();
}

function renderPicker(query) {
  const q = query.toLowerCase().trim();
  const items = state.catalog.filter((o) => !q || o.label.toLowerCase().includes(q));
  el('picker-list').innerHTML = items.length
    ? items.map((o) => `<button data-id="${esc(o.id)}">${esc(o.label)}</button>`).join('')
    : '<p class="prompt">Nothing matches that yet.</p>';
}

function reset() {
  state.object = null;
  state.questions = [];
  state.answers = {};
  state.qIndex = 0;
  show('camera');
}

// --- events ---------------------------------------------------------------

el('shutter').addEventListener('click', async () => {
  const image = captureFrame();
  if (!image) return;
  await runIdentify({ image }, image);
});

el('file').addEventListener('change', async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  const image = await readFile(file);
  e.target.value = '';
  await runIdentify({ image }, image);
});

el('pick-manual').addEventListener('click', openPicker);
el('restart').addEventListener('click', reset);
el('again').addEventListener('click', reset);

el('confirm-yes').addEventListener('click', nextQuestion);
el('confirm-no').addEventListener('click', openPicker);

el('picker-search').addEventListener('input', (e) => renderPicker(e.target.value));

el('picker-list').addEventListener('click', async (e) => {
  const btn = e.target.closest('[data-id]');
  if (btn) await runIdentify({ hint: btn.dataset.id });
});

el('q-options').addEventListener('click', (e) => {
  const btn = e.target.closest('[data-value]');
  if (!btn) return;
  state.answers[state.questions[state.qIndex].id] = btn.dataset.value;
  state.qIndex += 1;
  nextQuestion();
});

startCamera();

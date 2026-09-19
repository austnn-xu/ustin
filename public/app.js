'use strict';

// US Tin — camera -> identify -> follow-ups -> disposal verdict.

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

// The rules engine runs in the browser — lib/rules.js and lib/identify.js are
// loaded ahead of this file, so there is no backend to call. server.js still
// serves the same engine over HTTP for local development.
const RULES = window.USTinRules;
const IDENTIFY = window.USTinIdentify;

function dataUrlToBytes(dataUrl) {
  const comma = dataUrl.indexOf(',');
  const binary = atob(comma === -1 ? dataUrl : dataUrl.slice(comma + 1));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
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
  const bytes = payload.image ? dataUrlToBytes(payload.image) : null;
  const [guess] = await Promise.all([
    Promise.resolve(IDENTIFY.identify(bytes, payload.hint)),
    new Promise((r) => setTimeout(r, 900)),
  ]);

  // Nothing recognised — fall back to letting the user say what it is.
  if (!guess) return openPicker();

  state.object = { id: guess.object.id, label: guess.object.label };
  state.questions = RULES.questionsFor(guess.object);
  state.answers = {};
  state.qIndex = 0;

  // A user-picked object needs no confirmation step.
  if (guess.source === 'user') return nextQuestion();

  el('guess-label').textContent = guess.object.label;
  el('guess-confidence').textContent =
    `${Math.round(guess.confidence * 100)}% confident${IDENTIFY.STUBBED ? ' · demo recognition' : ''}`;
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

// A stream badge: resin code (or material code) plus its plain-English name.
function streamChip(s) {
  return `<span class="chip" data-family="${esc(s.family)}">
    <b>${esc(s.code)}</b>${esc(s.short)}</span>`;
}

async function showResult() {
  const data = RULES.resolve(RULES.findObject(state.object.id), state.answers);

  el('verdict').dataset.outcome = data.headline.id;
  el('verdict').innerHTML = `
    <div class="verdict-icon">${data.headline.icon}</div>
    <h2>${esc(data.headline.label)}</h2>
    <p>${esc(data.headline.blurb)}</p>
    ${data.streams.length ? `<div class="stream-row">${data.streams.map(streamChip).join('')}</div>` : ''}
    ${data.split ? '<p class="split-note">This item splits into parts that go to different streams — see below.</p>' : ''}
    ${data.hazard ? '<p class="hazard-flag">Do not put this in a household bin.</p>' : ''}`;

  el('components').innerHTML = data.components.map((c) => `
    <div class="comp" data-outcome="${c.outcome.id}">
      <div class="comp-top">
        <span class="comp-name">${esc(c.label)}</span>
        <span class="comp-dest">${c.outcome.icon} ${esc(c.outcome.label)}</span>
      </div>
      <p class="comp-material">${esc(c.material)}</p>
      ${c.stream ? `
        <div class="stream">
          <div class="stream-head">
            ${streamChip(c.stream)}
            <span class="acceptance" data-level="${c.stream.acceptance.id}">${esc(c.stream.acceptance.label)}</span>
          </div>
          <p class="stream-note">${esc(c.stream.note)}</p>
        </div>` : ''}
      <p class="comp-why">${esc(c.why)}</p>
    </div>`).join('');

  const tip = el('tip');
  tip.hidden = !data.tip;
  if (data.tip) tip.textContent = data.tip;

  show('result');
}

async function openPicker() {
  if (!state.catalog.length) {
    state.catalog = RULES.OBJECTS.map((o) => ({ id: o.id, label: o.label }));
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

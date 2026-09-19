'use strict';

/**
 * US Tin — screen flow.
 *
 * capture -> analyze -> confirm (or pick) -> follow-up questions -> verdict
 *
 * Everything runs client-side: lib/rules.js holds the disposal knowledge,
 * lib/recognizer.js maps the classifier's output onto it, and
 * assets/vision.js owns the model. This file only moves between screens and
 * renders.
 */

(function () {
  const RULES = window.USTinRules;
  const RECOGNIZER = window.USTinRecognizer;
  const VISION = window.USTinVision;

  const $ = (id) => document.getElementById(id);
  const esc = (value) => String(value).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));

  const icon = (name, size) =>
    `<svg width="${size}" height="${size}" aria-hidden="true"><use href="#i-${esc(name)}"/></svg>`;

  /** Screen -> which of the four rail segments are filled. */
  const RAIL_STEP = {
    capture: 1,
    analyzing: 2,
    confirm: 2,
    picker: 2,
    question: 3,
    result: 4,
  };

  const state = {
    objectId: null,
    questions: [],
    answers: {},
    questionIndex: 0,
    candidates: [],
    subset: null,
    cameraStream: null,
  };

  // --- screens ------------------------------------------------------------

  function show(name) {
    document.querySelectorAll('.screen').forEach((screen) => {
      screen.classList.toggle('is-active', screen.id === `screen-${name}`);
    });

    const step = RAIL_STEP[name] || 1;
    [...$('rail').children].forEach((segment, i) => {
      segment.dataset.on = String(i < step);
    });

    $('restart').classList.toggle('u-hidden', name === 'capture');
  }

  // --- classifier bootstrap ----------------------------------------------

  function setStatus(tone, html) {
    const chip = $('model-status');
    chip.classList.remove('u-hidden');
    chip.dataset.tone = tone;
    chip.innerHTML = html;
  }

  async function prepareClassifier() {
    setStatus('', '<span class="spinner"></span><span>Loading the recognizer…</span>');

    try {
      await VISION.load((fraction) => {
        const percent = Math.round(fraction * 100);
        setStatus('', `<span>Downloading model</span><span class="bar"><i style="width:${percent}%"></i></span><span>${percent}%</span>`);
      });
      $('model-status').classList.add('u-hidden');
      $('shutter').disabled = false;
    } catch {
      setStatus('bad', `${icon('alert', 15)}<span>Recognition is unavailable offline. Choose the item from the list instead.</span>`);
      $('shutter').disabled = true;
    }
  }

  // --- camera -------------------------------------------------------------

  async function startCamera() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      return disableCamera('This browser will not open a camera here.');
    }

    try {
      state.cameraStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      });
      $('video').srcObject = state.cameraStream;
    } catch (err) {
      const denied = err && (err.name === 'NotAllowedError' || err.name === 'SecurityError');
      disableCamera(denied
        ? 'Camera access was declined. Upload a photo, or choose the item from the list.'
        : 'No camera is available here. Upload a photo, or choose the item from the list.');
    }
  }

  function disableCamera(message) {
    $('video').classList.add('u-hidden');
    $('camera-off-text').textContent = message;
    $('camera-off').classList.remove('u-hidden');
    $('shutter').disabled = true;
  }

  /** Draw the current video frame, capped so the preview is not a 12 MP bitmap. */
  function captureFrame() {
    const video = $('video');
    const canvas = $('canvas');
    const width = video.videoWidth;
    const height = video.videoHeight;
    if (!width || !height) return null;

    const scale = Math.min(1, 1024 / Math.max(width, height));
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);
    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas;
  }

  function readImage(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error('That file is not an image we can read'));
        image.src = reader.result;
      };
      reader.onerror = () => reject(new Error('Could not read that file'));
      reader.readAsDataURL(file);
    });
  }

  // --- recognition --------------------------------------------------------

  async function analyze(source, width, height, previewUrl) {
    $('shot').src = previewUrl;
    $('match-thumb').src = previewUrl;
    show('analyzing');

    let reading;
    let result;
    try {
      // A short floor on the scan animation: an instant cut reads as a bug,
      // and the first WebGL pass is not always instant anyway.
      [result] = await Promise.all([
        VISION.classify(source, width, height),
        new Promise((done) => setTimeout(done, 600)),
      ]);
      reading = RECOGNIZER.interpret(result.classes, { material: result.material });
    } catch {
      return openPicker('The recognizer could not run on this device. Choose the item instead.');
    }

    state.candidates = reading.candidates;

    if (!reading.recognized) {
      // The object model failed, but the material model usually has not — and
      // "it is glass" turns 177 entries into a dozen. Two taps, not a dead end.
      const narrowed = result.material && RECOGNIZER.byMaterial(result.material);

      if (narrowed && narrowed.objects.length) {
        return openPicker(
          `Not sure what it is, but it looks like ${narrowed.material.id}. Here is everything made of that.`,
          narrowed.objects,
        );
      }

      const saw = reading.saw.label;
      return openPicker(saw
        ? `Closest guess was “${saw}”, which has no disposal rule yet. Choose the item instead.`
        : 'That one is not in the catalog yet. Choose the item instead.');
    }

    const best = reading.candidates[0];
    $('guess-label').textContent = best.object.label;
    $('confidence-fill').style.width = `${Math.round(Math.min(1, best.score) * 100)}%`;
    $('confidence-value').textContent = `${Math.round(Math.min(1, best.score) * 100)}% match`;
    $('confidence-source').textContent = 'On-device model';
    // Say what each model actually saw. When the guess is wrong, this is what
    // tells the user whether the photo or the catalog is the problem.
    const read = reading.saw.label ? `Read as “${reading.saw.label}”` : '';
    const material = reading.material && reading.material.probability >= 0.5
      ? `${read ? ', material looks like' : 'Material looks like'} ${reading.material.id}`
      : '';
    $('match-note').textContent = read || material ? `${read}${material}.` : '';

    const alternatives = reading.candidates.slice(1);
    $('alternatives-block').classList.toggle('u-hidden', alternatives.length === 0);
    $('alternatives').innerHTML = alternatives.map((candidate) => `
      <button class="btn" type="button" data-id="${esc(candidate.object.id)}">
        <span>${esc(candidate.object.label)}</span>
        ${icon('chevron', 17)}
      </button>`).join('');

    show('confirm');
  }

  // --- catalog picker -----------------------------------------------------

  /**
   * The picker doubles as the recovery path. `subset` is what the material
   * head narrowed the catalog down to; searching clears it, because a typed
   * query is a stronger signal than a model's guess.
   */
  function openPicker(note, subset) {
    state.subset = subset || null;
    $('picker-note').textContent = note || '';
    $('picker-note').classList.toggle('u-hidden', !note);
    $('picker-search').value = '';
    renderPicker('');
    show('picker');
    $('picker-search').focus();
  }

  function renderPicker(query) {
    const needle = query.trim();
    const narrowed = state.subset && !needle;
    const matches = narrowed ? state.subset : RULES.search(needle, 60);

    $('show-all').classList.toggle('u-hidden', !narrowed);
    $('picker-count').textContent = needle
      ? `${matches.length} match${matches.length === 1 ? '' : 'es'}`
      : `${matches.length} of ${RULES.OBJECTS.length} items`;

    $('picker-list').innerHTML = matches.length
      ? matches.map((o) => `
        <button type="button" data-id="${esc(o.id)}">
          <span>
            ${esc(o.label)}
            <span class="btn-sub">${esc(o.components.map((c) => c.material).join(' · '))}</span>
          </span>
          ${icon('chevron', 16)}
        </button>`).join('')
      : '<p class="empty">Nothing in the catalog matches that yet. Try a material, like “foam” or “steel”.</p>';
  }

  // --- follow-up questions ------------------------------------------------

  function selectObject(id) {
    const object = RULES.findObject(id);
    if (!object) return;

    state.objectId = object.id;
    state.questions = RULES.questionsFor(object);
    state.answers = {};
    state.questionIndex = 0;
    nextQuestion();
  }

  function nextQuestion() {
    if (state.questionIndex >= state.questions.length) return showResult();

    const question = state.questions[state.questionIndex];
    $('question-progress').textContent = state.questions.length > 1
      ? `Step 3 · Question ${state.questionIndex + 1} of ${state.questions.length}`
      : 'Step 3 · One question';
    $('question-text').textContent = question.text;
    $('question-help').textContent = question.help || '';

    $('question-options').innerHTML = question.options.map((option) => `
      <button class="btn" type="button" data-value="${esc(option.value)}">
        <span>${esc(option.label)}</span>
        ${icon('chevron', 17)}
      </button>`).join('');

    show('question');
  }

  // --- verdict ------------------------------------------------------------

  const streamChip = (stream) =>
    `<span class="chip"><b>${esc(stream.code)}</b>${esc(stream.short)}</span>`;

  function showResult() {
    const data = RULES.resolve(RULES.findObject(state.objectId), state.answers);
    const parts = data.components.length;

    $('verdict').dataset.outcome = data.headline.id;
    $('verdict').innerHTML = `
      <div class="verdict-head">
        <span class="verdict-icon">${icon(data.headline.icon, 20)}</span>
        <div>
          <h2>${esc(data.headline.label)}</h2>
          <p class="object-name">${esc(data.object.label)} · ${parts} part${parts === 1 ? '' : 's'}</p>
        </div>
      </div>
      <p class="body">${esc(data.headline.blurb)}</p>
      ${data.streams.length ? `<div class="stream-row">${data.streams.map(streamChip).join('')}</div>` : ''}
      ${data.split ? `<div class="note note-info">${icon('info', 15)}<span>This item splits into parts with different destinations. Take it apart before you bin it.</span></div>` : ''}
      ${data.hazard ? `<div class="note note-hazard">${icon('alert', 15)}<span>Do not put this in a household bin.</span></div>` : ''}`;

    $('components').innerHTML = data.components.map((component) => `
      <article class="comp" data-outcome="${esc(component.outcome.id)}">
        <div class="comp-head">
          <div>
            <p class="comp-name">${esc(component.label)}</p>
            <p class="comp-material">${esc(component.material)}</p>
          </div>
          <span class="comp-dest">${icon(component.outcome.icon, 14)}${esc(component.outcome.label)}</span>
        </div>
        ${component.stream ? `
          <div class="stream-block">
            <div class="stream-head">
              ${streamChip(component.stream)}
              <span class="acceptance" data-level="${esc(component.stream.acceptance.id)}">${esc(component.stream.acceptance.label)}</span>
            </div>
            <p class="stream-note">${esc(component.stream.note)}</p>
          </div>` : ''}
        <p class="comp-why">${esc(component.why)}</p>
      </article>`).join('');

    const tip = $('tip');
    tip.classList.toggle('u-hidden', !data.tip);
    if (data.tip) tip.innerHTML = `${icon('info', 15)}<span>${esc(data.tip)}</span>`;

    show('result');
  }

  function restart() {
    state.objectId = null;
    state.questions = [];
    state.answers = {};
    state.questionIndex = 0;
    state.candidates = [];
    state.subset = null;
    show('capture');
  }

  // --- wiring -------------------------------------------------------------

  $('shutter').addEventListener('click', async () => {
    const canvas = captureFrame();
    if (!canvas) return;
    await analyze(canvas, canvas.width, canvas.height, canvas.toDataURL('image/jpeg', 0.85));
  });

  $('file').addEventListener('change', async (event) => {
    const file = event.target.files && event.target.files[0];
    event.target.value = '';
    if (!file) return;

    try {
      const image = await readImage(file);
      await analyze(image, image.naturalWidth, image.naturalHeight, image.src);
    } catch {
      openPicker('That file could not be read. Choose the item instead.');
    }
  });

  // A <label> is not a button, so give it the keyboard behaviour of one.
  document.querySelector('label[for="file"]').addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      $('file').click();
    }
  });

  $('open-picker').addEventListener('click', () => openPicker(''));
  $('show-all').addEventListener('click', () => { state.subset = null; renderPicker($('picker-search').value); });
  $('restart').addEventListener('click', restart);
  $('again').addEventListener('click', restart);

  $('confirm-yes').addEventListener('click', () => {
    if (state.candidates.length) selectObject(state.candidates[0].object.id);
  });

  $('confirm-no').addEventListener('click', () => openPicker(''));

  $('alternatives').addEventListener('click', (event) => {
    const button = event.target.closest('[data-id]');
    if (button) selectObject(button.dataset.id);
  });

  $('picker-search').addEventListener('input', (event) => renderPicker(event.target.value));

  $('picker-list').addEventListener('click', (event) => {
    const button = event.target.closest('[data-id]');
    if (button) selectObject(button.dataset.id);
  });

  $('question-options').addEventListener('click', (event) => {
    const button = event.target.closest('[data-value]');
    if (!button) return;
    state.answers[state.questions[state.questionIndex].id] = button.dataset.value;
    state.questionIndex += 1;
    nextQuestion();
  });

  $('picker-search').placeholder = `Search ${RULES.OBJECTS.length} items…`;

  startCamera();
  prepareClassifier();
}());

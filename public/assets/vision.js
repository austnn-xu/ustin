'use strict';

/**
 * On-device image classification.
 *
 * MobileNet v2 (ILSVRC-2012, 1000 classes) runs in the browser through
 * TensorFlow.js. Nothing about the photo leaves the device: the weights come
 * to the phone rather than the picture going to a server.
 *
 * The library is vendored (public/vendor) so the app has no third-party script
 * dependency. The 14 MB of weights are fetched from Google's tfjs-models
 * bucket on first use and then served from the browser's HTTP cache, which is
 * why the capture screen reports download progress instead of hanging.
 *
 * lib/recognizer.js turns the 1000-way distribution this produces into a
 * catalog object; the two are kept apart so the mapping can be unit-tested in
 * Node without a WebGL context.
 */

window.USTinVision = (function () {
  const TFJS_SRC = 'vendor/tensorflow.min.js';
  const MODEL_URL = 'https://storage.googleapis.com/tfjs-models/savedmodel/mobilenet_v2_1.0_224/model.json';
  const HEAD_URL = 'assets/material-head.json';
  const INPUT_SIZE = 224;

  // The graph exposes its penultimate pooled features as well as its logits.
  // One pass gives us both: the 1000-way object guess and the 1280-dimensional
  // embedding the material head reads.
  const EMBED_NODE = 'module_apply_default/MobilenetV2/Logits/AvgPool';
  const LOGITS_NODE = 'module_apply_default/MobilenetV2/Logits/output';

  let model = null;
  let head = null;
  let loading = null;
  let status = 'idle'; // idle | loading | ready | failed

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const tag = document.createElement('script');
      tag.src = src;
      tag.async = true;
      tag.onload = resolve;
      tag.onerror = () => reject(new Error(`Could not load ${src}`));
      document.head.appendChild(tag);
    });
  }

  /**
   * Fetch the library and the weights. `onProgress` receives 0..1 for the
   * weight download, which is the part slow enough to be worth reporting.
   */
  function load(onProgress) {
    if (loading) return loading;
    status = 'loading';

    loading = (async () => {
      if (!window.tf) await loadScript(TFJS_SRC);
      await window.tf.ready();

      // The material head is small and same-origin, so it is never the thing
      // that makes the user wait. If it is missing the app still works — it
      // just loses the material tie-break and the narrowing fallback.
      head = await fetch(HEAD_URL).then((r) => (r.ok ? r.json() : null)).catch(() => null);

      model = await window.tf.loadGraphModel(MODEL_URL, {
        onProgress: (fraction) => {
          if (typeof onProgress === 'function') onProgress(fraction);
        },
      });

      // The first inference compiles the WebGL shaders — several hundred
      // milliseconds that would otherwise land on the user's first photo.
      const warm = window.tf.zeros([1, INPUT_SIZE, INPUT_SIZE, 3]);
      const out = model.execute(warm, [EMBED_NODE, LOGITS_NODE]);
      out.forEach((t) => t.dataSync());
      window.tf.dispose([warm, ...out]);

      status = 'ready';
    })().catch((err) => {
      status = 'failed';
      loading = null;
      throw err;
    });

    return loading;
  }

  /**
   * Center-crop to a square before resizing, so a 4:5 phone frame is not
   * squashed into the model's square input. Objects are centered in the
   * viewfinder by construction, so the crop keeps the subject.
   */
  function toSquare(source, sourceWidth, sourceHeight) {
    const side = Math.min(sourceWidth, sourceHeight);
    const canvas = document.createElement('canvas');
    canvas.width = INPUT_SIZE;
    canvas.height = INPUT_SIZE;
    canvas.getContext('2d').drawImage(
      source,
      (sourceWidth - side) / 2, (sourceHeight - side) / 2, side, side,
      0, 0, INPUT_SIZE, INPUT_SIZE,
    );
    return canvas;
  }

  /** Softmax over a plain array, for the handful of numbers the head emits. */
  function softmax(values) {
    const max = Math.max(...values);
    const exps = values.map((v) => Math.exp(v - max));
    const total = exps.reduce((a, b) => a + b, 0);
    return exps.map((v) => v / total);
  }

  /**
   * The material head: a linear layer over the embedding, trained on 2,527
   * photographs of actual household waste. Small enough to run in plain
   * JavaScript, which keeps it out of the WebGL path entirely.
   */
  function readMaterial(embedding) {
    if (!head) return null;

    const logits = head.bias.map((b, k) => {
      let sum = b;
      const row = k * head.inputs;
      for (let i = 0; i < head.inputs; i += 1) sum += embedding[i] * head.weights[row + i];
      return sum;
    });

    const probabilities = softmax(logits);
    const out = {};
    head.classes.forEach((name, i) => { out[name] = probabilities[i]; });
    return out;
  }

  /**
   * @returns {Promise<{classes: Float32Array, material: object|null}>}
   *   `classes` is the 1000-way ILSVRC distribution; `material` is the
   *   six-way material distribution, or null if the head did not load.
   */
  async function classify(source, width, height) {
    if (!model) throw new Error('The classifier is not loaded yet');
    const tf = window.tf;
    const square = toSquare(source, width, height);

    const [probabilities, embedding] = tf.tidy(() => {
      // MobileNet v2 was trained on inputs scaled to [-1, 1].
      const input = tf.browser.fromPixels(square)
        .toFloat()
        .div(127.5)
        .sub(1)
        .expandDims(0);

      const [embed, logits] = model.execute(input, [EMBED_NODE, LOGITS_NODE]);

      // This graph emits 1001 logits: a leading "background" class, then the
      // 1000 ILSVRC classes. Dropping it is not cosmetic — leave it in and
      // every class is read one index off, which silently turns the whole
      // classifier into noise.
      const flat = logits.squeeze();
      const classes = flat.size === 1001 ? flat.slice([1], [1000]) : flat;
      return [tf.softmax(classes), embed.reshape([-1])];
    });

    const classes = await probabilities.data();
    const features = await embedding.data();
    tf.dispose([probabilities, embedding]);

    return { classes, material: readMaterial(features) };
  }

  return {
    load,
    classify,
    get status() { return status; },
  };
}());

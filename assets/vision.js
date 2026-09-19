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
  const INPUT_SIZE = 224;

  let model = null;
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
      model = await window.tf.loadGraphModel(MODEL_URL, {
        onProgress: (fraction) => {
          if (typeof onProgress === 'function') onProgress(fraction);
        },
      });

      // The first inference compiles the WebGL shaders — several hundred
      // milliseconds that would otherwise land on the user's first photo.
      const warm = window.tf.zeros([1, INPUT_SIZE, INPUT_SIZE, 3]);
      const out = model.predict(warm);
      out.dataSync();
      window.tf.dispose([warm, out]);

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

  /** @returns {Promise<Float32Array>} probabilities over the 1000 classes. */
  async function classify(source, width, height) {
    if (!model) throw new Error('The classifier is not loaded yet');
    const tf = window.tf;
    const square = toSquare(source, width, height);

    const probabilities = tf.tidy(() => {
      // MobileNet v2 was trained on inputs scaled to [-1, 1].
      const input = tf.browser.fromPixels(square)
        .toFloat()
        .div(127.5)
        .sub(1)
        .expandDims(0);
      return tf.softmax(model.predict(input).squeeze());
    });

    const values = await probabilities.data();
    probabilities.dispose();
    return values;
  }

  return {
    load,
    classify,
    get status() { return status; },
  };
}());

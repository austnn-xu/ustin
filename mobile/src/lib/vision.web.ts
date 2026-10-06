/**
 * On-device image classification in the browser.
 *
 * MobileNet v2 (ILSVRC-2012, 1000 classes) runs through TensorFlow.js; the photo never leaves the device. The library
 * and the TrashNet material head are served from the app's own `public/` folder (copied there from ../public by
 * scripts/web-assets.mjs); the weights come from Google's tfjs-models bucket on first use and are then cached by the
 * browser. ../lib/recognizer.js turns the output into catalog objects.
 *
 * This is the same pipeline as ../public/assets/vision.js, typed and adapted to load from the Expo base URL.
 */
export type Classification = { classes: Float32Array; material: Record<string, number> | null };

type Tensor = { dataSync(): Float32Array; data(): Promise<Float32Array>; size: number };
type TF = any; // eslint-disable-line @typescript-eslint/no-explicit-any

declare global {
  interface Window {
    tf?: TF;
  }
}

const BASE = process.env.EXPO_BASE_URL ?? '';
const TFJS_SRC = `${BASE}/vendor/tensorflow.min.js`;
const HEAD_URL = `${BASE}/models/material-head.json`;
const MODEL_URL = 'https://storage.googleapis.com/tfjs-models/savedmodel/mobilenet_v2_1.0_224/model.json';
const INPUT_SIZE = 224;

// One pass gives both the 1000-way object guess and the 1280-d embedding the material head reads.
const EMBED_NODE = 'module_apply_default/MobilenetV2/Logits/AvgPool';
const LOGITS_NODE = 'module_apply_default/MobilenetV2/Logits/output';

type Head = { classes: string[]; inputs: number; weights: number[]; bias: number[] };

let model: { execute(input: unknown, outputs: string[]): Tensor[] } | null = null;
let head: Head | null = null;
let loading: Promise<void> | null = null;

export const visionSupported = true;

function loadScript(src: string) {
  return new Promise<void>((resolve, reject) => {
    const tag = document.createElement('script');
    tag.src = src;
    tag.async = true;
    tag.onload = () => resolve();
    tag.onerror = () => reject(new Error(`Could not load ${src}`));
    document.head.appendChild(tag);
  });
}

/** Fetch the library and weights. `onProgress` gets 0..1 for the weight download, the slow part. */
export function loadVision(onProgress?: (fraction: number) => void): Promise<void> {
  if (loading) return loading;
  loading = (async () => {
    if (!window.tf) await loadScript(TFJS_SRC);
    const tf = window.tf;
    await tf.ready();
    // Small and same-origin. If it is missing, recognition still works without the material tie-break.
    head = await fetch(HEAD_URL)
      .then((r) => (r.ok ? (r.json() as Promise<Head>) : null))
      .catch(() => null);
    model = await tf.loadGraphModel(MODEL_URL, { onProgress: (f: number) => onProgress?.(f) });
    // The first inference compiles the WebGL shaders; do it now rather than on the user's first photo.
    const warm = tf.zeros([1, INPUT_SIZE, INPUT_SIZE, 3]);
    const out = model!.execute(warm, [EMBED_NODE, LOGITS_NODE]);
    out.forEach((t) => t.dataSync());
    tf.dispose([warm, ...out]);
  })().catch((err) => {
    loading = null;
    throw err;
  });
  return loading;
}

function loadImage(uri: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Could not read that photo'));
    img.src = uri;
  });
}

/** Center-crop to a square, so a tall phone photo is not squashed into the model's square input. */
function toSquare(img: HTMLImageElement) {
  const w = img.naturalWidth;
  const h = img.naturalHeight;
  const side = Math.min(w, h);
  const canvas = document.createElement('canvas');
  canvas.width = INPUT_SIZE;
  canvas.height = INPUT_SIZE;
  canvas.getContext('2d')!.drawImage(img, (w - side) / 2, (h - side) / 2, side, side, 0, 0, INPUT_SIZE, INPUT_SIZE);
  return canvas;
}

function softmax(values: number[]) {
  const max = Math.max(...values);
  const exps = values.map((v) => Math.exp(v - max));
  const total = exps.reduce((a, b) => a + b, 0);
  return exps.map((v) => v / total);
}

/** The material head: a linear layer over the embedding, trained on TrashNet photos of real waste. */
function readMaterial(embedding: Float32Array) {
  if (!head) return null;
  const h = head;
  const logits = h.bias.map((b, k) => {
    let sum = b;
    const row = k * h.inputs;
    for (let i = 0; i < h.inputs; i += 1) sum += embedding[i]! * h.weights[row + i]!;
    return sum;
  });
  const p = softmax(logits);
  const out: Record<string, number> = {};
  h.classes.forEach((name, i) => {
    out[name] = p[i]!;
  });
  return out;
}

export async function classifyImage(uri: string): Promise<Classification> {
  await loadVision();
  const tf = window.tf;
  const square = toSquare(await loadImage(uri));
  const [probabilities, embedding] = tf.tidy(() => {
    // MobileNet v2 expects inputs scaled to [-1, 1].
    const input = tf.browser.fromPixels(square).toFloat().div(127.5).sub(1).expandDims(0);
    const [embed, logits] = model!.execute(input, [EMBED_NODE, LOGITS_NODE]);
    // This graph emits 1001 logits: a leading "background" class, then the 1000 ILSVRC classes. Leaving it in reads
    // every class one index off and silently turns the classifier into noise.
    const flat = (logits as TF).squeeze();
    const classes = flat.size === 1001 ? flat.slice([1], [1000]) : flat;
    return [tf.softmax(classes), (embed as TF).reshape([-1])];
  });
  const classes = (await probabilities.data()) as Float32Array;
  const features = (await embedding.data()) as Float32Array;
  tf.dispose([probabilities, embedding]);
  return { classes, material: readMaterial(features) };
}

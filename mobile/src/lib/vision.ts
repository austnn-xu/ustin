/**
 * Photo recognition is web-only for now: MobileNet runs through the vendored TensorFlow.js in the browser
 * (see vision.web.ts). Native builds use search and the catalog instead.
 */
export type Classification = { classes: Float32Array; material: Record<string, number> | null };

export const visionSupported = false;

export async function loadVision(_onProgress?: (fraction: number) => void): Promise<void> {
  throw new Error('Photo recognition is available in the web version of US Tin.');
}

export async function classifyImage(_uri: string): Promise<Classification> {
  throw new Error('Photo recognition is available in the web version of US Tin.');
}

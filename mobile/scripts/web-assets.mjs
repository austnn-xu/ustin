#!/usr/bin/env node
// Copy the recognition assets the web build serves from public/: the vendored TensorFlow.js and the trained material
// head. Their source of truth is the web app in ../public; this keeps one copy in git.
import { copyFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const app = join(here, '..');
const files = [
  ['../public/vendor/tensorflow.min.js', 'public/vendor/tensorflow.min.js'],
  ['../public/assets/material-head.json', 'public/models/material-head.json'],
];
for (const [from, to] of files) {
  mkdirSync(dirname(join(app, to)), { recursive: true });
  copyFileSync(join(app, from), join(app, to));
}
console.log(`web-assets: copied ${files.length} files into public/`);

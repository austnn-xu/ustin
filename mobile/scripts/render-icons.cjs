#!/usr/bin/env node
// Render the app icon and its variants from the drawings in ../site/img (Tin on jade, see site/DESIGN.md).
// Run after changing those SVGs: node scripts/render-icons.cjs
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const IMG = path.join(__dirname, '..', '..', 'site', 'img');
const svg = (name) => fs.readFileSync(path.join(IMG, name), 'utf8');
const jobs = [
  // [source svg, size, output, background]
  ['icon.svg', 1024, 'assets/icon.png'],
  ['icon.svg', 1024, 'public/apple-touch-icon.png'],
  ['icon.svg', 180, '../site/apple-touch-icon.png'],
  ['icon.svg', 48, 'assets/favicon.png'],
  ['icon.svg', 48, '../site/favicon.png'],
  ['icon.svg', 512, '../site/img/icon-512.png'],
  ['icon-foreground.svg', 1024, 'assets/android-icon-foreground.png'],
  ['icon-mono.svg', 1024, 'assets/android-icon-monochrome.png'],
  ['icon-splash.svg', 1024, 'assets/splash-icon.png'],
  [null, 1024, 'assets/android-icon-background.png', '#2D7BC0'],
];

(async () => {
  const b = await chromium.launch();
  const page = await b.newPage();
  for (const [src, size, out, bg] of jobs) {
    await page.setViewportSize({ width: size, height: size });
    const body = src ? svg(src).replace('<svg ', `<svg width="${size}" height="${size}" `) : '';
    await page.setContent(`<html><body style="margin:0;background:${bg || 'transparent'}">${body}</body></html>`);
    await page.screenshot({ path: path.join(__dirname, '..', out), omitBackground: !bg, clip: { x: 0, y: 0, width: size, height: size } });
    console.log('render-icons:', out);
  }
  await b.close();
})();

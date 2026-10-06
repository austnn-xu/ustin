#!/usr/bin/env node
// Screenshot a route at iPhone 15 Pro size in light and dark mode (Expo web must be running).
// Usage: node scripts/screenshot.mjs [route] [outDir]
// Used in the Linux cloud sandbox where the iOS simulator isn't available.
import { existsSync, mkdirSync } from 'node:fs';
import { chromium } from 'playwright';

const route = process.argv[2] ?? '/';
const out = process.argv[3] ?? 'screenshots';
const base = process.env.EXPO_WEB_URL ?? 'http://localhost:8081';
mkdirSync(out, { recursive: true });

const executablePath = existsSync('/opt/pw-browsers/chromium')
  ? '/opt/pw-browsers/chromium'
  : undefined;
const browser = await chromium.launch(executablePath ? { executablePath } : {});
const name = route.replace(/\W+/g, '-').replace(/^-|-$/g, '') || 'index';

for (const scheme of ['light', 'dark']) {
  const page = await browser.newPage({
    viewport: { width: 393, height: 852 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
    colorScheme: scheme,
  });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await page.goto(base + route, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `${out}/${name}-${scheme}.png` });
  // Content scrolls inside a ScrollView, so grow the viewport to the content height for the full shot.
  const height = await page.evaluate(() =>
    Math.max(...[...document.querySelectorAll('div')].map((d) => d.scrollHeight)),
  );
  await page.setViewportSize({ width: 393, height: Math.min(height, 8000) });
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${out}/${name}-${scheme}-full.png` });
  if (errors.length) console.log(`[${scheme}] errors:\n  ` + errors.join('\n  '));
  await page.close();
}
await browser.close();
console.log(`saved ${out}/${name}-{light,dark}[-full].png`);

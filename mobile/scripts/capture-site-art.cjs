#!/usr/bin/env node
// Capture the app's own drawings and screens for the website (../site), from the web build.
//
//   1. ./scripts/build-pages.sh && node scripts/preview-pages.mjs     (serves http://localhost:4173/)
//   2. node scripts/capture-site-art.cjs
//
// Writes ../site/assets/wardrobe.json: every item in Tin's shop, drawn by the app's shop on a bare Tin (so the website's
// wardrobe wall can never drift from what the app really sells). Screens are captured separately, see site/README.md.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE = process.env.PAGES_URL || 'http://localhost:4173/app';
const settings = { state: { colorScheme: 'light', dailyGoal: 20, place: null, onboarded: true, lessonCoached: true,
  toursSeen: ['index', 'arena', 'scan', 'nearby', 'shop', 'profile'], recentPins: [] }, version: 0 };
const progress = { state: { xp: 0, xpByDay: {}, streak: { count: 0, best: 0, lastDay: null }, lessons: {}, perfectLessons: 0,
  sorted: {}, mistakes: {}, celebrated: {}, coins: 0, owned: { 'paint-green': 0 }, equipped: { paint: 'paint-green' },
  arena: { played: 0, wins: 0, losses: 0, ties: 0, best: 0, points: 0, lastAt: null } }, version: 2 };

(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1200, height: 1600 }, colorScheme: 'light' });
  await ctx.addInitScript(([s, p]) => {
    localStorage.setItem('ustin-settings', s);
    localStorage.setItem('ustin-progress', p);
  }, [JSON.stringify(settings), JSON.stringify(progress)]);
  const page = await ctx.newPage();
  await page.goto(`${BASE}/shop`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  const items = [];
  for (const tab of ['Hats', 'Glasses', 'Neckwear', 'Paint']) {
    await page.getByText(tab, { exact: true }).first().click();
    await page.waitForTimeout(1200);
    const found = await page.evaluate(() => [...document.querySelectorAll('svg[viewBox="0 -28 120 168"]')].map((s) => {
      let el = s, label = '';
      for (let i = 0; i < 6 && el; i++) {
        el = el.parentElement;
        if (el && el.innerText && el.innerText.trim()) { label = el.innerText.trim().split('\n')[0]; break; }
      }
      return { name: label, svg: s.outerHTML.replace(/ width="100%" height="100%"/, '') };
    }));
    for (const f of found) {
      if (!f.name || f.name === 'Your Tin' || items.some((i) => i.name === f.name)) continue;
      items.push({ slot: tab, ...f });
    }
  }
  const out = path.join(__dirname, '..', '..', 'site', 'assets', 'wardrobe.json');
  fs.writeFileSync(out, JSON.stringify(items));
  console.log(`capture-site-art: ${items.length} items -> ${path.relative(process.cwd(), out)}`);
  await b.close();
})();

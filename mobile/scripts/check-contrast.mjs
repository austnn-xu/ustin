#!/usr/bin/env node
// Check the palette's text/background pairs against WCAG contrast, in light and dark mode.
//   body text 4.5:1, secondary text 4.5:1, tertiary (hints, captions next to stronger text) 3:1,
//   hue text on paper / cards / its own tint 4.5:1, button labels on a hue fill 3:1 (bold display type).
// Usage: node scripts/check-contrast.mjs   (exits 1 on a failure)
import { light, dark } from '../src/theme/colors.ts';

const hex = (h) => h.replace('#', '').match(/../g).map((x) => parseInt(x, 16) / 255);
const lum = (h) => {
  const [r, g, b] = hex(h).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
};

let failed = 0;
const rows = [];
function check(mode, label, fg, bg, min) {
  const r = ratio(fg, bg);
  const ok = r >= min;
  if (!ok) failed++;
  rows.push(`${ok ? '  ok ' : 'FAIL '} ${mode.padEnd(5)} ${label.padEnd(34)} ${r.toFixed(2)} (min ${min})`);
}

for (const [mode, p] of [['light', light], ['dark', dark]]) {
  for (const surface of ['bg', 'surface']) {
    check(mode, `text on ${surface}`, p.text, p[surface], 4.5);
    check(mode, `textSecondary on ${surface}`, p.textSecondary, p[surface], 4.5);
    check(mode, `textTertiary on ${surface}`, p.textTertiary, p[surface], 3);
  }
  for (const [name, h] of Object.entries(p.hue)) {
    check(mode, `${name}.text on bg`, h.text, p.bg, 4.5);
    check(mode, `${name}.text on surface`, h.text, p.surface, 4.5);
    check(mode, `${name}.text on ${name}.subtle`, h.text, h.subtle, 4.5);
    check(mode, `text on ${name}.subtle`, p.text, h.subtle, 4.5);
    // Yellow is a reward colour drawn as an icon or a badge, never a button with a label on it.
    if (name !== 'yellow') check(mode, `onColor on ${name}.base`, p.onColor, h.base, 3);
  }
}
console.log(rows.join('\n'));
console.log(failed ? `\ncheck-contrast: ${failed} pair(s) below WCAG` : '\ncheck-contrast: every pair passes');
process.exit(failed ? 1 : 0);

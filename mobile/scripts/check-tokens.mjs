#!/usr/bin/env node
// Fails if components or routes use raw colors or raw layout numbers instead of theme tokens.
// Raw values belong in src/theme only. Allowed literals: 0, 1, flex values, percentages.
// src/components/art is skipped: artwork is drawn in its own SVG viewBox, and those coordinates are geometry, not layout.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const roots = ['src/components', 'src/app'];
const STYLE_KEYS =
  'padding|paddingHorizontal|paddingVertical|paddingTop|paddingBottom|paddingLeft|paddingRight|' +
  'margin|marginHorizontal|marginVertical|marginTop|marginBottom|marginLeft|marginRight|gap|rowGap|columnGap|' +
  'fontSize|lineHeight|letterSpacing|borderRadius|borderTopLeftRadius|borderTopRightRadius|width|height|' +
  'minHeight|maxHeight|minWidth|maxWidth|top|left|right|bottom|shadowRadius|elevation|opacity';
const rules = [
  { name: 'hex color', re: /['"`]#[0-9a-fA-F]{3,8}['"`]/ },
  { name: 'rgb color', re: /\brgba?\(/ },
  { name: 'raw style number', re: new RegExp(`\\b(${STYLE_KEYS})\\s*[:=]\\s*\\{?\\s*-?(?:[2-9]|\\d{2,})(?:\\.\\d+)?\\b`) },
];

const SKIP = [join('src', 'components', 'art')];

const files = (dir) =>
  readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    if (SKIP.includes(p)) return [];
    return statSync(p).isDirectory() ? files(p) : /\.tsx?$/.test(p) ? [p] : [];
  });

let failures = 0;
for (const file of roots.flatMap(files)) {
  readFileSync(file, 'utf8')
    .split('\n')
    .forEach((line, i) => {
      if (line.includes('tokens-ok')) return;
      for (const r of rules) {
        if (r.re.test(line)) {
          failures++;
          console.log(`${file}:${i + 1}  ${r.name}: ${line.trim()}`);
        }
      }
    });
}
if (failures) {
  console.log(`\n${failures} hardcoded value(s). Use theme tokens (see CLAUDE.md).`);
  process.exit(1);
}
console.log('check:tokens — no hardcoded values');

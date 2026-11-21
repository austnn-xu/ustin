'use strict';

const test = require('node:test');
const assert = require('node:assert');
const { safeWebUrl, safeTel } = require('../lib/safe-url');

test('ordinary website tags become https links', () => {
  assert.strictEqual(safeWebUrl('https://example.org/recycling'), 'https://example.org/recycling');
  assert.strictEqual(safeWebUrl('http://example.org'), 'http://example.org/');
  assert.strictEqual(safeWebUrl('www.example.org'), 'https://www.example.org/');
  assert.strictEqual(safeWebUrl('  example.org  '), 'https://example.org/');
  assert.strictEqual(safeWebUrl('//example.org/a'), 'https://example.org/a');
  assert.strictEqual(safeWebUrl('https://a.example.org; https://b.example.org'), 'https://a.example.org/');
});

test('anything that is not a web page is refused', () => {
  const bad = [
    'javascript:alert(1)',
    'JavaScript:alert(1)',
    ' javascript:alert(1)',
    'java\tscript:alert(1)',
    'java\nscript:alert(1)',
    'data:text/html,<script>alert(1)</script>',
    'vbscript:msgbox(1)',
    'file:///etc/passwd',
    'intent://x#Intent;end',
    'https:\\\\evil.example',
    'https://user:pass@evil.example',
    'https://localhost',
    'not a url',
    '',
    null,
    undefined,
    42,
    'https://' + 'a'.repeat(3000) + '.com',
  ];
  for (const v of bad) assert.strictEqual(safeWebUrl(v), null, JSON.stringify(v));
});

test('phone numbers become tel: links with only digits and a leading plus', () => {
  assert.strictEqual(safeTel('+1 (555) 010-2030'), 'tel:+15550102030');
  assert.strictEqual(safeTel('555 0102; 555 0103'), 'tel:5550102');
  assert.strictEqual(safeTel('1+2+3'), 'tel:123');
  assert.strictEqual(safeTel('javascript:alert(1)'), null);
  assert.strictEqual(safeTel('12'), null);
  assert.strictEqual(safeTel(null), null);
});

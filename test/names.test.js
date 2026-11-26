'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const names = require('../lib/names');
const { build, FILE } = require('../supabase/gen-names-migration');

const LISTS = { first: names.FIRST, middle: names.MIDDLE, last: names.LAST };

/** A small seeded generator, so a test can roll the same names every time. */
function seeded(seed) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

test('each list has at least 500 words, so there are at least 125 million names', () => {
  for (const [slot, list] of Object.entries(LISTS)) assert.ok(list.length >= 500, `${slot} has ${list.length} words`);
  assert.ok(names.COMBINATIONS >= 125_000_000);
  assert.equal(names.COMBINATIONS, names.FIRST.length * names.MIDDLE.length * names.LAST.length);
});

test('every word is a plain capitalised word of nine letters or fewer', () => {
  for (const [slot, list] of Object.entries(LISTS)) {
    for (const w of list) assert.match(w, /^[A-Z][a-z]{2,8}$/, `${slot}: ${w}`);
  }
});

test('no word appears twice, in one list or across lists', () => {
  const all = [...names.FIRST, ...names.MIDDLE, ...names.LAST];
  const dupes = all.filter((w, i) => all.indexOf(w) !== i);
  assert.deepEqual(dupes, []);
});

test('no word is on the blocklist', () => {
  // Strong stems may not appear inside any word, at all.
  const strong = [
    'fuck', 'shit', 'cunt', 'dick', 'porn', 'nazi', 'slut', 'whore', 'bitch', 'penis', 'nigg', 'fag', 'dyke', 'jizz',
    'sex', 'nude', 'naked', 'drug', 'drunk', 'beer', 'vodka', 'poop', 'piss', 'turd', 'fart', 'crap', 'damn', 'sperm',
    'demon', 'devil', 'satan', 'ghost', 'zombie', 'blood', 'murder', 'dead', 'death', 'hate', 'stupid', 'dumb', 'ugly',
    'fat', 'chubby', 'plump', 'pudgy',
  ];
  for (const list of Object.values(LISTS)) {
    for (const w of list) for (const s of strong) assert.ok(!w.toLowerCase().includes(s), `${w} contains "${s}"`);
  }
  // These short letter runs also sit inside harmless words ("Glass", "Butter", "Grape"). Every word that contains one
  // was read by a person and is listed here; a new word that trips one fails until it is looked at.
  const risky = ['rape', 'cock', 'coon', 'spic', 'tard', 'hell', 'kill', 'war', 'gun', 'butt', 'strip', 'trump', 'ass', 'tit', 'god', 'wank', 'twat', 'anus', 'boob'];
  const reviewed = new Set(
    ('Assured Aware Bassoon Brass Burgundy Butter Buttercup Butterfly Buttery Button Cassowary Classic Cocoon Compass ' +
      'Custard Draped Eggshell Forward Glass Glassy Grape Grassy Gunmetal Massive Mustard Peacock Petite Raccoon ' +
      'Reassured Rewarding Sassy Seashell Shell Shelled Skilled Skillet Skyward Stalwart Stardust Stitched Striped ' +
      'Stripy Tasseled Trumpet Warbler Warm Wrasse').split(' '),
  );
  const flagged = new Set();
  for (const list of Object.values(LISTS)) for (const w of list) if (risky.some((s) => w.toLowerCase().includes(s))) flagged.add(w);
  assert.deepEqual([...flagged].sort(), [...reviewed].sort());
});

test('roll gives one word from each list, in order, and the longest name fits', () => {
  const random = seeded(7);
  for (let i = 0; i < 2000; i++) {
    const name = names.roll(random);
    const [a, b, c] = name.split(' ');
    assert.ok(names.FIRST.includes(a) && names.MIDDLE.includes(b) && names.LAST.includes(c), name);
    assert.ok(names.isRolled(name));
    assert.ok(name.length <= names.MAX_LENGTH);
  }
  const longest = [names.FIRST, names.MIDDLE, names.LAST].map((l) => Math.max(...l.map((w) => w.length))).reduce((x, y) => x + y) + 2;
  assert.ok(longest <= names.MAX_LENGTH);
});

test('roll covers the whole list, including its first and last word', () => {
  assert.equal(names.roll(() => 0).split(' ')[0], names.FIRST[0]);
  assert.equal(names.roll(() => 0.9999999).split(' ')[2], names.LAST[names.LAST.length - 1]);
  assert.equal(names.roll(() => 1).split(' ')[2], names.LAST[names.LAST.length - 1], 'a source that returns 1 does not run off the end');
});

test('rolling spreads names out: a thousand rolls rarely repeat', () => {
  const random = seeded(99);
  const seen = new Set(Array.from({ length: 1000 }, () => names.roll(random)));
  assert.ok(seen.size >= 999);
});

test('isRolled refuses anything that is not three listed words', () => {
  const ok = `${names.FIRST[0]} ${names.MIDDLE[0]} ${names.LAST[0]}`;
  assert.ok(names.isRolled(ok));
  for (const bad of [
    '', 'Alice', 'Happy Otter', `${ok} Extra`, ok.toLowerCase(), ok.toUpperCase(), ` ${ok}`, `${ok} `, ok.replace(/ /g, '  '),
    ok.replace(/ /g, '_'), `${names.LAST[0]} ${names.MIDDLE[0]} ${names.FIRST[0]}`, `${names.FIRST[0]} ${names.FIRST[1]} ${names.LAST[0]}`,
    '<script> alert 1', null, undefined, 42, {},
  ]) {
    assert.equal(names.isRolled(bad), false, String(bad));
  }
});

test('the migration holds exactly the lists in lib/names.js (regenerate with node supabase/gen-names-migration.js)', () => {
  assert.equal(fs.readFileSync(FILE, 'utf8'), build());
  const sql = fs.readFileSync(FILE, 'utf8');
  const count = (slot) => (sql.match(new RegExp(`\\(${slot}, '`, 'g')) || []).length;
  assert.equal(count(1), names.FIRST.length);
  assert.equal(count(2), names.MIDDLE.length);
  assert.equal(count(3), names.LAST.length);
  assert.match(sql, /not public\.is_rolled_name\(v_name\)/);
  assert.match(sql, new RegExp(`char_length\\(name\\) between 2 and ${names.MAX_LENGTH}`));
});

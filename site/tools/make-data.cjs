#!/usr/bin/env node
// Write site/assets/course.json from the course itself (lib/lessons.js): each unit's title and its stops in order.
// The home page uses it to draw the route and, if this browser has played, to put the truck where the player is.
// test/site.test.js fails if this file falls out of date.  Run: node site/tools/make-data.cjs
const fs = require('fs');
const path = require('path');
const { UNITS } = require('../../lib/lessons');

const course = UNITS.map((u) => ({ title: u.title, stops: u.lessons.map((l) => l.id) }));
fs.writeFileSync(path.join(__dirname, '..', 'assets', 'course.json'), JSON.stringify(course) + '\n');
console.log(`course.json: ${course.length} units, ${course.reduce((n, u) => n + u.stops.length, 0)} stops`);

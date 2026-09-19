'use strict';

const http = require('node:http');
const fsp = require('node:fs/promises');
const path = require('node:path');

const { OBJECTS, findObject, questionsFor, resolve } = require('./lib/rules');
const { identify, STUBBED } = require('./lib/identify');

const PORT = Number(process.env.PORT) || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');
const MAX_UPLOAD = 8 * 1024 * 1024; // 8 MB of base64 image

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
};

function sendJson(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    'Cache-Control': 'no-store',
  });
  res.end(body);
}

function readJsonBody(req, limit = MAX_UPLOAD) {
  return new Promise((resolve_, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > limit) {
        reject(Object.assign(new Error('Image too large (8 MB max)'), { statusCode: 413 }));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf8');
      if (!raw) return resolve_({});
      try {
        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
          throw new Error('body must be a JSON object');
        }
        resolve_(parsed);
      } catch (err) {
        reject(Object.assign(new Error(`Invalid JSON: ${err.message}`), { statusCode: 400 }));
      }
    });
    req.on('error', reject);
  });
}

function decodeImage(dataUrl) {
  if (typeof dataUrl !== 'string' || !dataUrl) return null;
  const comma = dataUrl.indexOf(',');
  const base64 = comma === -1 ? dataUrl : dataUrl.slice(comma + 1);
  try {
    const buf = Buffer.from(base64, 'base64');
    return buf.length ? buf : null;
  } catch {
    return null;
  }
}

/** Step 1: photo (or manual pick) -> object + the questions it needs. */
async function handleIdentify(req, res) {
  const body = await readJsonBody(req);
  const image = decodeImage(body.image);
  const hint = typeof body.hint === 'string' ? body.hint : '';

  if (!image && !hint) {
    return sendJson(res, 400, { error: 'Send an image or a hint.' });
  }

  const guess = identify(image, hint);
  if (!guess) {
    return sendJson(res, 422, {
      error: 'Could not identify that. Pick it from the list instead.',
      catalog: OBJECTS.map((o) => ({ id: o.id, label: o.label })),
    });
  }

  sendJson(res, 200, {
    stubbed: STUBBED,
    confidence: guess.confidence,
    source: guess.source,
    object: { id: guess.object.id, label: guess.object.label },
    questions: questionsFor(guess.object),
  });
}

/** Step 2: object + answers -> per-component disposal verdict. */
async function handleResolve(req, res) {
  const body = await readJsonBody(req, 64 * 1024);
  const obj = findObject(String(body.objectId || ''));
  if (!obj) return sendJson(res, 404, { error: 'Unknown object' });

  const answers = (body.answers && typeof body.answers === 'object' && !Array.isArray(body.answers))
    ? body.answers
    : {};

  sendJson(res, 200, resolve(obj, answers));
}

async function serveStatic(pathname, res) {
  const rel = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
  const target = path.join(PUBLIC_DIR, rel);

  if (target !== PUBLIC_DIR && !target.startsWith(PUBLIC_DIR + path.sep)) {
    return sendJson(res, 403, { error: 'Forbidden' });
  }

  try {
    const data = await fsp.readFile(target);
    res.writeHead(200, {
      'Content-Type': MIME[path.extname(target).toLowerCase()] || 'application/octet-stream',
      'Content-Length': data.length,
    });
    res.end(data);
  } catch {
    sendJson(res, 404, { error: 'Not found' });
  }
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

  try {
    if (url.pathname === '/api/identify' && req.method === 'POST') {
      return await handleIdentify(req, res);
    }
    if (url.pathname === '/api/resolve' && req.method === 'POST') {
      return await handleResolve(req, res);
    }
    if (url.pathname === '/api/catalog' && req.method === 'GET') {
      return sendJson(res, 200, { objects: OBJECTS.map((o) => ({ id: o.id, label: o.label })) });
    }
    if (url.pathname.startsWith('/api/')) {
      return sendJson(res, 404, { error: 'Unknown endpoint' });
    }
    if (req.method === 'GET' || req.method === 'HEAD') {
      return await serveStatic(url.pathname, res);
    }
    sendJson(res, 405, { error: 'Method not allowed' });
  } catch (err) {
    const status = err.statusCode || 500;
    if (status === 500) console.error(err);
    if (!res.headersSent) sendJson(res, status, { error: err.message || 'Internal error' });
  }
});

if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`Binly running at http://localhost:${PORT}`);
    console.log(`Recognition: ${STUBBED ? 'STUBBED (hash-based)' : 'live'} · ${OBJECTS.length} objects in catalog`);
  });
}

module.exports = { server };

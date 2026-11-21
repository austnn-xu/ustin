'use strict';

const http = require('node:http');
const fsp = require('node:fs/promises');
const path = require('node:path');

const { OBJECTS, findObject, resolve } = require('./lib/rules');
const { SECURITY_HEADERS, cacheControlFor } = require('./security-headers');

const PORT = Number(process.env.PORT) || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');
const LIB_DIR = path.join(__dirname, 'lib');
const MAX_BODY = 64 * 1024;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
};

function sendJson(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    ...SECURITY_HEADERS,
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    'Cache-Control': 'no-store',
  });
  res.end(body);
}

function readJsonBody(req, limit = MAX_BODY) {
  return new Promise((resolve_, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > limit) {
        reject(Object.assign(new Error('Request body too large'), { statusCode: 413 }));
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

/** Object + answers -> per-component disposal verdict. */
async function handleResolve(req, res) {
  const body = await readJsonBody(req);
  const obj = findObject(String(body.objectId || ''));
  if (!obj) return sendJson(res, 404, { error: 'Unknown object' });

  const answers = (body.answers && typeof body.answers === 'object' && !Array.isArray(body.answers))
    ? body.answers
    : {};

  sendJson(res, 200, resolve(obj, answers));
}

async function serveStatic(pathname, res) {
  const rel = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');

  // The browser loads the shared engine from /lib/, which lives beside public/
  // rather than inside it. Each root is its own boundary: /lib/ can reach only
  // the .js files in lib/, never the rest of the repository.
  const isLib = rel.startsWith('lib/');
  const base = isLib ? LIB_DIR : PUBLIC_DIR;
  const target = path.join(base, isLib ? rel.slice('lib/'.length) : rel);

  if (target === base || !target.startsWith(base + path.sep) || (isLib && path.extname(target) !== '.js')) {
    return sendJson(res, 403, { error: 'Forbidden' });
  }

  try {
    const data = await fsp.readFile(target);
    res.writeHead(200, {
      ...SECURITY_HEADERS,
      'Content-Type': MIME[path.extname(target).toLowerCase()] || 'application/octet-stream',
      'Content-Length': data.length,
      'Cache-Control': cacheControlFor(pathname),
    });
    res.end(data);
  } catch {
    sendJson(res, 404, { error: 'Not found' });
  }
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

  try {
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
    console.log(`US Tin running at http://localhost:${PORT}`);
    console.log(`${OBJECTS.length} objects in the catalog · recognition runs in the browser`);
  });
}

module.exports = { server };

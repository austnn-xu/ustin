#!/usr/bin/env node
// Serve mobile/pages/ the way GitHub Pages does: at the root (or under BASE_PATH), directories serve index.html, a directory without a
// trailing slash redirects to one, and any missing file gets 404.html with a 404 status.
// Usage: node scripts/preview-pages.mjs [port]
import { createServer } from 'node:http';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';

const root = join(process.cwd(), 'pages');
const port = Number(process.argv[2] ?? 4173);
const PREFIX = process.env.BASE_PATH ?? '';
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
  '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.svg': 'image/svg+xml', '.ttf': 'font/ttf',
  '.woff2': 'font/woff2', '.ico': 'image/x-icon', '.txt': 'text/plain; charset=utf-8', '.xml': 'application/xml',
  '.webp': 'image/webp', '.jpg': 'image/jpeg',
};

createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  if (PREFIX && !url.pathname.startsWith(PREFIX)) {
    res.writeHead(302, { Location: PREFIX + '/' });
    return res.end();
  }
  const rel = normalize(decodeURIComponent(url.pathname.slice(PREFIX.length))).replace(/^(\.\.[/\\])+/, '');
  let file = join(root, rel);
  if (existsSync(file) && statSync(file).isDirectory()) {
    if (!url.pathname.endsWith('/')) {
      res.writeHead(301, { Location: url.pathname + '/' + url.search });
      return res.end();
    }
    file = join(file, 'index.html');
  }
  if (existsSync(file) && statSync(file).isFile()) {
    res.writeHead(200, { 'Content-Type': TYPES[extname(file)] ?? 'application/octet-stream' });
    return res.end(readFileSync(file));
  }
  res.writeHead(404, { 'Content-Type': TYPES['.html'] });
  res.end(readFileSync(join(root, '404.html')));
}).listen(port, () => console.log(`pages preview: http://localhost:${port}${PREFIX}/`));

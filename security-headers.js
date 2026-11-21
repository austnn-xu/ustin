'use strict';

/**
 * HTTP security headers for the original single-page web app (public/), served by server.js in development and by
 * Vercel in production (vercel.json carries the same list; test/security-headers.test.js keeps them identical).
 *
 * The Expo app in mobile/ is published to GitHub Pages, which cannot send headers; it gets the parts of this policy a
 * page can declare itself (see mobile/scripts/harden-web.mjs).
 */

const CSP = [
  "default-src 'self'",
  // Only this site's own files: the shared engine in lib/, the app, the vendored TensorFlow.js. No inline, no eval.
  // 'wasm-unsafe-eval' lets TensorFlow.js compile WebAssembly; it does not allow JavaScript eval.
  "script-src 'self' 'wasm-unsafe-eval'",
  // The download bar sets its width with an inline style; Google Fonts serves the stylesheet.
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  'font-src https://fonts.gstatic.com',
  "img-src 'self' data: blob:",
  "media-src 'self' blob:",
  // MobileNet's weights.
  "connect-src 'self' https://storage.googleapis.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  // Nobody may frame this app (clickjacking).
  "frame-ancestors 'none'",
].join('; ');

const SECURITY_HEADERS = {
  'Content-Security-Policy': CSP,
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  // The camera is the one powerful feature the app uses, and only for itself.
  'Permissions-Policy': 'camera=(self), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()',
  'Cross-Origin-Opener-Policy': 'same-origin',
};

/** Only over HTTPS (Vercel); sending it from a plain-http dev server would be meaningless. */
const HSTS = { 'Strict-Transport-Security': 'max-age=63072000; includeSubDomains' };

/**
 * Caching: pages are always revalidated so a deploy shows up at once; scripts, styles and data revalidate after an
 * hour (file names are not content-hashed, so they cannot be cached forever). API answers are never cached.
 */
function cacheControlFor(pathname) {
  if (pathname.startsWith('/api/')) return 'no-store';
  if (pathname === '/' || pathname.endsWith('.html')) return 'no-cache';
  if (pathname.startsWith('/vendor/')) return 'public, max-age=86400';
  return 'public, max-age=3600';
}

module.exports = { CSP, SECURITY_HEADERS, HSTS, cacheControlFor };

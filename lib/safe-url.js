'use strict';

/**
 * US Tin — links from data the app does not control.
 *
 * Drop-off sites come from OpenStreetMap, which anyone can edit. A site's
 * `website` tag is free text: usually "example.com" or "https://…", but it
 * could be "javascript:…" or "data:…", and opening that would run someone
 * else's code in the app. Every link built from map data goes through here:
 * only plain web pages (http/https) and phone numbers get through.
 */

(function (root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof window !== 'undefined') root.USTinSafeUrl = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const MAX_URL = 2000;
  const SCHEME = /^[a-z][a-z0-9+.-]*:/i;

  /** A web address safe to open, or null. Bare domains ("example.com") get https://. */
  function safeWebUrl(raw) {
    if (typeof raw !== 'string') return null;
    // OSM sometimes lists several, separated by ";".
    let s = raw.trim().split(/[;\s]+/)[0] || '';
    if (!s || s.length > MAX_URL) return null;
    // No control characters or backslashes: they are how filters get fooled ("java\tscript:", "https:\\\\evil").
    if (/[\u0000-\u001f\u007f\\]/.test(s)) return null;
    if (s.startsWith('//')) s = `https:${s}`;
    else if (!SCHEME.test(s)) s = `https://${s}`;
    let url;
    try {
      url = new URL(s);
    } catch (_) {
      return null;
    }
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
    // A real public host: has a dot, no credentials smuggled in front of it.
    if (!url.hostname.includes('.') || url.username || url.password) return null;
    return url.href;
  }

  /** A tel: link for a phone number, or null when it does not look like one. */
  function safeTel(raw) {
    if (typeof raw !== 'string') return null;
    const first = raw.split(/[;,]/)[0] || '';
    const digits = first.replace(/[^\d+]/g, '').replace(/(?!^)\+/g, '');
    const count = digits.replace('+', '').length;
    return count >= 3 && count <= 17 ? `tel:${digits}` : null;
  }

  return { safeWebUrl, safeTel };
}));

import { COSMETICS, DEFAULT_OWNED, type Outfit, type Slot } from '@/lib/cosmetics';
import { isTourId } from '@/lib/tour';

/**
 * Persisted state comes back from storage the app does not control: a browser's localStorage can be edited by hand,
 * corrupted by an extension, or left over from an older version. Nothing read back is trusted. Every field is checked
 * for type and range and anything wrong falls back to its default, so a bad value can never crash a screen or turn
 * into a strange number on it.
 *
 * (Editing your own progress only changes your own phone. The global leaderboard never takes numbers from here: the
 * server re-scores every match.)
 */

type Obj = Record<string, unknown>;

/** Most entries a persisted map may keep: far above real use, low enough that a bloated value cannot stall startup. */
const MAX_KEYS = 5000;
/** Ceiling for any counter (coins, XP, points): big enough for years of play, far below float trouble. */
export const MAX_COUNT = 100_000_000;
const DAY = /^\d{4}-\d{2}-\d{2}$/;

export const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v);

/** A whole number in [min, max], or the fallback. */
export function count(v: unknown, fallback = 0, min = 0, max = MAX_COUNT): number {
  return typeof v === 'number' && Number.isFinite(v) ? Math.min(max, Math.max(min, Math.floor(v))) : fallback;
}

/** A number in [min, max] (fractions allowed), or the fallback. */
export function real(v: unknown, fallback: number, min: number, max: number): number {
  return typeof v === 'number' && Number.isFinite(v) && v >= min && v <= max ? v : fallback;
}

export const bool = (v: unknown, fallback: boolean) => (typeof v === 'boolean' ? v : fallback);

export function text(v: unknown, fallback: string, max = 200): string {
  return typeof v === 'string' ? v.slice(0, max) : fallback;
}

export function oneOf<T extends string | number>(v: unknown, allowed: readonly T[], fallback: T): T {
  return allowed.includes(v as T) ? (v as T) : fallback;
}

export const dayOrNull = (v: unknown) => (typeof v === 'string' && DAY.test(v) ? v : null);

/** A string-keyed map whose values pass `value`; bad entries are dropped. Keys can be limited with `key`. */
export function map<T>(v: unknown, value: (x: unknown) => T | undefined, key: (k: string) => boolean = () => true): Record<string, T> {
  if (!isObj(v)) return {};
  const out: Record<string, T> = {};
  let n = 0;
  for (const [k, raw] of Object.entries(v)) {
    if (n >= MAX_KEYS) break;
    // Never let stored data name a key that reaches the object's prototype.
    if (k === '__proto__' || k === 'constructor' || k === 'prototype' || k.length > 120 || !key(k)) continue;
    const val = value(raw);
    if (val === undefined) continue;
    out[k] = val;
    n += 1;
  }
  return out;
}

export const countOrSkip = (x: unknown) => (typeof x === 'number' && Number.isFinite(x) && x >= 0 ? count(x) : undefined);
export const isDay = (k: string) => DAY.test(k);

// ---------------------------------------------------------------------------
// Cosmetics
// ---------------------------------------------------------------------------

const KNOWN = new Map(COSMETICS.map((c) => [c.id, c]));

/** Only cosmetics that exist; the free paint is always owned. */
export function owned(v: unknown): Record<string, number> {
  const out = map(v, countOrSkip, (k) => KNOWN.has(k));
  for (const id of DEFAULT_OWNED) out[id] ??= 0;
  return out;
}

/** An outfit can only wear things that exist, that are owned, and in the slot they belong to. Paint is never empty. */
export function outfit(v: unknown, have: Record<string, number>): Outfit {
  const out: Outfit = {};
  if (isObj(v)) {
    for (const [slot, id] of Object.entries(v)) {
      const item = typeof id === 'string' ? KNOWN.get(id) : undefined;
      if (item && item.slot === (slot as Slot) && have[item.id] !== undefined) out[item.slot] = item.id;
    }
  }
  out.paint ??= 'paint-green';
  return out;
}

export const tours = (v: unknown): string[] =>
  Array.isArray(v) ? [...new Set(v.filter((x): x is string => typeof x === 'string' && isTourId(x)))] : [];

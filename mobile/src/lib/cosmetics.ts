import type { HueName } from '@/theme';

/**
 * Things Tin can wear, bought with coins earned in lessons. One item per slot; `paint` is the colour of Tin's label
 * band and always has a value (classic green is free and owned from the start).
 */
export type Slot = 'hat' | 'eyes' | 'neck' | 'paint';

export type Cosmetic = {
  id: string;
  slot: Slot;
  name: string;
  price: number;
  /** For paint jobs: the hue of the band. */
  hue?: HueName;
};

export type Outfit = Partial<Record<Slot, string>>;

export const SLOTS: { id: Slot; label: string }[] = [
  { id: 'hat', label: 'Hats' },
  { id: 'eyes', label: 'Glasses' },
  { id: 'neck', label: 'Neckwear' },
  { id: 'paint', label: 'Paint' },
];

export const COSMETICS: Cosmetic[] = [
  { id: 'hat-cap', slot: 'hat', name: 'Recycling cap', price: 20 },
  { id: 'hat-beanie', slot: 'hat', name: 'Cozy beanie', price: 30 },
  { id: 'hat-hardhat', slot: 'hat', name: 'Hard hat', price: 40 },
  { id: 'hat-party', slot: 'hat', name: 'Party hat', price: 50 },
  { id: 'hat-chef', slot: 'hat', name: "Chef's hat", price: 60 },
  { id: 'hat-cowboy', slot: 'hat', name: 'Cowboy hat', price: 75 },
  { id: 'hat-flowers', slot: 'hat', name: 'Flower crown', price: 80 },
  { id: 'hat-tophat', slot: 'hat', name: 'Top hat', price: 100 },
  { id: 'hat-propeller', slot: 'hat', name: 'Propeller cap', price: 120 },
  { id: 'hat-crown', slot: 'hat', name: 'Golden crown', price: 250 },

  { id: 'eyes-shades', slot: 'eyes', name: 'Sunglasses', price: 25 },
  { id: 'eyes-nerd', slot: 'eyes', name: 'Round specs', price: 35 },
  { id: 'eyes-hearts', slot: 'eyes', name: 'Heart shades', price: 60 },
  { id: 'eyes-stars', slot: 'eyes', name: 'Star shades', price: 80 },
  { id: 'eyes-monocle', slot: 'eyes', name: 'Monocle', price: 90 },

  { id: 'neck-bowtie', slot: 'neck', name: 'Bow tie', price: 20 },
  { id: 'neck-bandana', slot: 'neck', name: 'Bandana', price: 30 },
  { id: 'neck-scarf', slot: 'neck', name: 'Striped scarf', price: 35 },
  { id: 'neck-medal', slot: 'neck', name: 'Gold medal', price: 150 },

  { id: 'paint-green', slot: 'paint', name: 'Classic green', price: 0, hue: 'green' },
  { id: 'paint-blue', slot: 'paint', name: 'Ocean blue', price: 15, hue: 'blue' },
  { id: 'paint-orange', slot: 'paint', name: 'Traffic orange', price: 15, hue: 'orange' },
  { id: 'paint-purple', slot: 'paint', name: 'Grape', price: 15, hue: 'purple' },
  { id: 'paint-red', slot: 'paint', name: 'Fire red', price: 15, hue: 'red' },
  { id: 'paint-brown', slot: 'paint', name: 'Compost brown', price: 15, hue: 'brown' },
  { id: 'paint-yellow', slot: 'paint', name: 'Sunshine', price: 25, hue: 'yellow' },
  { id: 'paint-slate', slot: 'paint', name: 'Stealth', price: 25, hue: 'slate' },
];

export const DEFAULT_OWNED = ['paint-green'];

export const findCosmetic = (id: string | undefined) => (id ? COSMETICS.find((c) => c.id === id) ?? null : null);

/** The band hue an outfit paints Tin with, if any. */
export const paintOf = (outfit: Outfit | null | undefined): HueName | undefined => findCosmetic(outfit?.paint)?.hue;

// ---------------------------------------------------------------------------
// Earning
// ---------------------------------------------------------------------------

export const COINS = {
  /** Every right answer. */
  correct: 1,
  /** Landing 5 in a row (and 15, 25, …). */
  combo5: 5,
  /** Landing 10 in a row (and 20, 30, …). */
  combo10: 10,
} as const;

/** Coins for a right answer that brings the run of right answers to `combo`. */
export function coinsForCorrect(combo: number) {
  const bonus = combo > 0 && combo % 10 === 0 ? COINS.combo10 : combo > 0 && combo % 5 === 0 ? COINS.combo5 : 0;
  return { base: COINS.correct, bonus, total: COINS.correct + bonus };
}

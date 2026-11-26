/**
 * Where to take it: real places near the user, from OpenStreetMap.
 *
 * - ZIP code → coordinates through Zippopotam (US ZIPs) or Nominatim (anything else), both free and keyless.
 * - Coordinates + a kind of place → nearby sites through the Overpass API, nearest first.
 *
 * Nothing here is invented. A site is either *tagged* in OpenStreetMap as accepting the thing (a battery bin, a
 * recycling centre that lists e-waste), or it is a kind of place that *usually* takes it (a pharmacy for medicine, a
 * supermarket for plastic film) and the app says "call ahead". When the map has nothing, the screen links out to
 * Earth911 and Google Maps rather than pretending.
 */
import type { LucideIcon } from 'lucide-react-native';
import {
  Battery, Car, Droplet, FlaskConical, Hammer, Lightbulb, Pill, Plug, Recycle, Repeat2, ShoppingBag, Sprout,
  Syringe, Shirt, Sofa, Trash2, TreeDeciduous, Wine, Wrench,
} from 'lucide-react-native';
import { Platform } from 'react-native';
import type { HueName } from '@/theme';
import { overpassNet, safeUrl, type OutcomeId, type Verdict } from './engine';

export type PlaceKind =
  | 'recycling'
  | 'glass'
  | 'batteries'
  | 'electronics'
  | 'lamps'
  | 'hazardous'
  | 'clothes'
  | 'donate'
  | 'medicine'
  | 'sharps'
  | 'film'
  | 'scrap'
  | 'cookingOil'
  | 'auto'
  | 'tires'
  | 'bulky'
  | 'wood'
  | 'rubble'
  | 'compost'
  | 'trash';

type Cond = [key: string, value: string | RegExp];
type Selector = { all: Cond[]; likely?: boolean; why?: string };

export type KindInfo = {
  label: string;
  icon: LucideIcon;
  hue: HueName;
  /** What to search for on Earth911 / Google Maps when the map comes up empty. */
  search: string;
  /** Kinds whose likely places are everywhere (pharmacies, supermarkets) search a tighter radius first. */
  dense?: boolean;
  selectors: Selector[];
};

const RETAIL_TAKEBACK = /^(Best Buy|Staples|The Home Depot|Home Depot|Lowe's)$/;
const centre: Selector = {
  all: [['amenity', 'recycling'], ['recycling_type', 'centre']],
  likely: true,
  why: 'Recycling centers often take this. Check what they accept before you go.',
};

export const KINDS: Record<PlaceKind, KindInfo> = {
  recycling: {
    label: 'Recycling',
    icon: Recycle,
    hue: 'blue',
    search: 'recycling center',
    dense: true,
    selectors: [{ all: [['amenity', 'recycling']] }],
  },
  glass: {
    label: 'Glass',
    icon: Wine,
    hue: 'blue',
    search: 'glass recycling',
    selectors: [{ all: [['recycling:glass_bottles', 'yes']] }, { all: [['recycling:glass', 'yes']] }, centre],
  },
  batteries: {
    label: 'Batteries',
    icon: Battery,
    hue: 'orange',
    search: 'battery recycling',
    selectors: [
      { all: [['recycling:batteries', 'yes']] },
      { all: [['brand', RETAIL_TAKEBACK]], likely: true, why: 'This chain runs a battery take-back program in most stores. Call to check.' },
    ],
  },
  electronics: {
    label: 'E-waste',
    icon: Plug,
    hue: 'orange',
    search: 'electronics recycling',
    selectors: [
      { all: [['recycling:electrical_appliances', 'yes']] },
      { all: [['recycling:small_appliances', 'yes']] },
      { all: [['recycling:small_electrical_appliances', 'yes']] },
      { all: [['recycling:computers', 'yes']] },
      { all: [['recycling:mobile_phones', 'yes']] },
      { all: [['recycling:electronics', 'yes']] },
      { all: [['brand', /^(Best Buy|Staples)$/]], likely: true, why: 'This chain takes back electronics in most stores. Call to check.' },
    ],
  },
  lamps: {
    label: 'Bulbs',
    icon: Lightbulb,
    hue: 'orange',
    search: 'CFL bulb recycling',
    selectors: [
      { all: [['recycling:low_energy_bulbs', 'yes']] },
      { all: [['recycling:fluorescent_tubes', 'yes']] },
      { all: [['recycling:light_bulbs', 'yes']] },
      { all: [['brand', /^(The Home Depot|Home Depot|Lowe's)$/]], likely: true, why: 'Most stores of this chain have a CFL bulb bin. Call to check.' },
    ],
  },
  hazardous: {
    label: 'Hazardous',
    icon: FlaskConical,
    hue: 'red',
    search: 'household hazardous waste',
    selectors: [
      { all: [['recycling:hazardous_waste', 'yes']] },
      { all: [['recycling:paint', 'yes']] },
      { all: [['recycling:chemicals', 'yes']] },
      centre,
    ],
  },
  clothes: {
    label: 'Clothes',
    icon: Shirt,
    hue: 'purple',
    search: 'clothing donation',
    selectors: [
      { all: [['recycling:clothes', 'yes']] },
      { all: [['recycling:shoes', 'yes']] },
      { all: [['recycling:textiles', 'yes']] },
      { all: [['shop', 'charity']], likely: true, why: 'Charity shops take wearable clothes and shoes.' },
      { all: [['shop', 'second_hand']], likely: true, why: 'Thrift stores take wearable clothes and shoes.' },
    ],
  },
  donate: {
    label: 'Donate',
    icon: Repeat2,
    hue: 'purple',
    search: 'donation center',
    selectors: [
      { all: [['shop', 'charity']] },
      { all: [['shop', 'second_hand']] },
      { all: [['amenity', 'give_box']] },
    ],
  },
  medicine: {
    label: 'Medicine',
    icon: Pill,
    hue: 'red',
    search: 'medication take back',
    dense: true,
    selectors: [
      { all: [['recycling:medicine', 'yes']] },
      { all: [['amenity', 'pharmacy']], likely: true, why: 'Many pharmacies have a take-back kiosk. Ask at the counter.' },
    ],
  },
  sharps: {
    label: 'Sharps',
    icon: Syringe,
    hue: 'red',
    search: 'sharps disposal',
    dense: true,
    selectors: [
      { all: [['recycling:sharps', 'yes']] },
      { all: [['amenity', 'pharmacy']], likely: true, why: 'Many pharmacies take sealed sharps containers. Call to check.' },
    ],
  },
  film: {
    label: 'Plastic bags',
    icon: ShoppingBag,
    hue: 'blue',
    search: 'plastic bag recycling',
    dense: true,
    selectors: [
      { all: [['recycling:plastic_bags', 'yes']] },
      { all: [['recycling:plastic_film', 'yes']] },
      { all: [['shop', 'supermarket']], likely: true, why: 'Most large supermarkets have a bag and film bin by the entrance.' },
    ],
  },
  scrap: {
    label: 'Scrap metal',
    icon: Wrench,
    hue: 'slate',
    search: 'scrap metal yard',
    selectors: [{ all: [['recycling:scrap_metal', 'yes']] }, { all: [['industrial', 'scrap_yard']] }],
  },
  cookingOil: {
    label: 'Cooking oil',
    icon: Droplet,
    hue: 'orange',
    search: 'cooking oil recycling',
    selectors: [{ all: [['recycling:cooking_oil', 'yes']] }, centre],
  },
  auto: {
    label: 'Motor oil',
    icon: Car,
    hue: 'slate',
    search: 'used motor oil recycling',
    selectors: [
      { all: [['recycling:engine_oil', 'yes']] },
      { all: [['recycling:car_batteries', 'yes']] },
      { all: [['shop', 'car_parts']], likely: true, why: 'Auto parts stores usually take used oil and car batteries.' },
    ],
  },
  tires: {
    label: 'Tires',
    icon: Car,
    hue: 'slate',
    search: 'tire recycling',
    selectors: [
      { all: [['recycling:tyres', 'yes']] },
      { all: [['shop', 'tyres']], likely: true, why: 'Tire shops usually take old tires, often for a small fee.' },
    ],
  },
  bulky: {
    label: 'Bulky items',
    icon: Sofa,
    hue: 'slate',
    search: 'bulky waste drop off',
    selectors: [{ all: [['amenity', 'waste_transfer_station']], likely: true }, centre],
  },
  wood: {
    label: 'Wood',
    icon: TreeDeciduous,
    hue: 'brown',
    search: 'wood recycling',
    selectors: [{ all: [['recycling:wood', 'yes']] }, centre],
  },
  rubble: {
    label: 'Rubble',
    icon: Hammer,
    hue: 'slate',
    search: 'construction debris recycling',
    selectors: [{ all: [['recycling:rubble', 'yes']] }, centre],
  },
  compost: {
    label: 'Compost',
    icon: Sprout,
    hue: 'brown',
    search: 'compost drop off',
    selectors: [
      { all: [['recycling:green_waste', 'yes']] },
      { all: [['recycling:organic', 'yes']] },
      { all: [['recycling:garden_waste', 'yes']] },
      { all: [['recycling:food_waste', 'yes']] },
      { all: [['leisure', 'garden'], ['garden:type', 'community']], likely: true, why: 'Community gardens often take food scraps. Ask first.' },
    ],
  },
  trash: {
    label: 'Dump',
    icon: Trash2,
    hue: 'slate',
    search: 'transfer station',
    selectors: [{ all: [['amenity', 'waste_transfer_station']] }, { all: [['landuse', 'landfill']] }],
  },
};

/** The order kinds are offered in the Near me chips. */
export const KIND_ORDER: PlaceKind[] = [
  'recycling', 'batteries', 'electronics', 'hazardous', 'clothes', 'donate', 'medicine', 'film', 'compost', 'glass',
  'lamps', 'auto', 'tires', 'scrap', 'cookingOil', 'bulky', 'wood', 'rubble', 'sharps', 'trash',
];

const STREAM_KIND: Record<string, PlaceKind> = {
  battery: 'batteries',
  ewaste: 'electronics',
  ewasteBulb: 'lamps',
  hazardous: 'hazardous',
  textile: 'clothes',
  pharmacy: 'medicine',
  filmDropoff: 'film',
  scrap: 'scrap',
  cookingOil: 'cookingOil',
  motorOil: 'auto',
  tyre: 'tires',
  sharps: 'sharps',
  bulky: 'bulky',
  wood: 'wood',
  rubble: 'rubble',
  organics: 'compost',
  glass: 'glass',
};

const OUTCOME_KIND: Record<OutcomeId, PlaceKind> = {
  recycle: 'recycling',
  compost: 'compost',
  trash: 'trash',
  dropoff: 'recycling',
  reuse: 'donate',
};

/** The kind of place one resolved component needs. */
export function kindFor(outcome: OutcomeId, streamId?: string | null): PlaceKind {
  if (streamId && STREAM_KIND[streamId] && (outcome === 'dropoff' || outcome === 'compost' || streamId === 'glass')) {
    return STREAM_KIND[streamId]!;
  }
  return OUTCOME_KIND[outcome];
}

/** Every kind of place a verdict needs, most urgent first (drop-offs before curbside). */
export function kindsForVerdict(verdict: Verdict): PlaceKind[] {
  const order: OutcomeId[] = ['dropoff', 'reuse', 'recycle', 'compost', 'trash'];
  const sorted = [...verdict.components].sort((a, b) => order.indexOf(a.outcome.id) - order.indexOf(b.outcome.id));
  return [...new Set(sorted.map((c) => kindFor(c.outcome.id, c.stream?.id)))];
}

// ---------------------------------------------------------------------------
// Geocoding
// ---------------------------------------------------------------------------

export type GeoPoint = { lat: number; lon: number; label: string; zip?: string };

async function getJSON<T>(url: string, ms = 8_000): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    const res = await fetch(url, { signal: controller.signal, headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error(`${res.status}`);
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

export class LookupError extends Error {}

/** A US ZIP, or any postcode / town name, to coordinates. */
export async function geocode(query: string): Promise<GeoPoint> {
  const q = query.trim();
  if (!q) throw new LookupError('Enter a ZIP code or a town.');
  const zip = /^\d{5}(?:-\d{4})?$/.test(q) ? q.slice(0, 5) : null;

  if (zip) {
    try {
      type Zippo = { places: { 'place name': string; latitude: string; longitude: string; 'state abbreviation': string }[] };
      const data = await getJSON<Zippo>(`https://api.zippopotam.us/us/${zip}`, 6_000);
      const p = data.places[0];
      if (p) return { lat: Number(p.latitude), lon: Number(p.longitude), label: `${p['place name']}, ${p['state abbreviation']} ${zip}`, zip };
    } catch {
      // Fall through to Nominatim, which also knows ZIP codes.
    }
  }

  type Nom = { lat: string; lon: string; display_name: string; address?: { postcode?: string } }[];
  const params = zip ? `postalcode=${zip}&country=us` : `q=${encodeURIComponent(q)}`;
  let data: Nom;
  try {
    data = await getJSON<Nom>(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&addressdetails=1&${params}`, 10_000);
  } catch {
    throw new LookupError("Can't reach the map. Try again.");
  }
  const hit = data[0];
  if (!hit) throw new LookupError(zip ? `Could not find ZIP code ${zip}.` : `Could not find "${q}".`);
  const label = hit.display_name.split(',').slice(0, 2).join(',').trim();
  return { lat: Number(hit.lat), lon: Number(hit.lon), label, zip: zip ?? hit.address?.postcode };
}

/** Name the neighbourhood around a GPS fix, for the location pill. Never fails — falls back to "Current location". */
export async function reverseGeocode(lat: number, lon: number): Promise<{ label: string; zip?: string }> {
  try {
    type Rev = { address?: Record<string, string> };
    const data = await getJSON<Rev>(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=14&lat=${lat}&lon=${lon}`, 4_000);
    const a = data.address ?? {};
    const area = a.suburb ?? a.neighbourhood ?? a.city ?? a.town ?? a.village ?? a.county;
    return { label: area ? `Near ${area}` : 'Current location', zip: a.postcode };
  } catch {
    return { label: 'Current location' };
  }
}

// ---------------------------------------------------------------------------
// Places
// ---------------------------------------------------------------------------

export type Site = {
  id: string;
  name: string;
  /** "Recycling center", "Pharmacy", … */
  type: string;
  lat: number;
  lon: number;
  /** Kilometres from the search point. */
  distanceKm: number;
  address: string | null;
  hours: string | null;
  phone: string | null;
  website: string | null;
  /** What OpenStreetMap says it accepts, as readable labels. */
  accepts: string[];
  /** true: tagged as accepting this. false: a kind of place that usually does — call ahead. */
  confirmed: boolean;
  /** For unconfirmed sites, why it is listed. */
  note: string | null;
};

export type PlacesResult = { sites: Site[]; radiusKm: number; at: { lat: number; lon: number } };

const isNum = (v: unknown, min: number, max: number): v is number => typeof v === 'number' && Number.isFinite(v) && v >= min && v <= max;
const strOrNull = (v: unknown) => (typeof v === 'string' ? v.slice(0, 300) : null);

/**
 * A places result checked field by field. Results are cached on the device between launches (see queryCache.ts), and a
 * cached copy is data the app no longer controls: anything malformed is dropped rather than drawn, and links are
 * checked again by the site card.
 */
export function cleanPlaces(raw: unknown): PlacesResult | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const at = r.at as Record<string, unknown> | undefined;
  if (!at || !isNum(at.lat, -90, 90) || !isNum(at.lon, -180, 180) || !isNum(r.radiusKm, 0, 1000) || !Array.isArray(r.sites)) return null;
  const sites: Site[] = [];
  for (const s of r.sites.slice(0, 50) as Record<string, unknown>[]) {
    if (!s || typeof s !== 'object' || typeof s.id !== 'string' || typeof s.name !== 'string' || typeof s.type !== 'string') continue;
    if (!isNum(s.lat, -90, 90) || !isNum(s.lon, -180, 180) || !isNum(s.distanceKm, 0, 20000)) continue;
    sites.push({
      id: s.id.slice(0, 64),
      name: s.name.slice(0, 200),
      type: s.type.slice(0, 100),
      lat: s.lat,
      lon: s.lon,
      distanceKm: s.distanceKm,
      address: strOrNull(s.address),
      hours: strOrNull(s.hours),
      phone: strOrNull(s.phone),
      website: safeUrl.safeWebUrl(s.website),
      accepts: Array.isArray(s.accepts) ? s.accepts.filter((a): a is string => typeof a === 'string').slice(0, 30) : [],
      confirmed: s.confirmed === true,
      note: strOrNull(s.note),
    });
  }
  return { sites, radiusKm: r.radiusKm, at: { lat: at.lat, lon: at.lon } };
}

type OsmElement = {
  type: string;
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
};

const OVERPASS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
  'https://overpass.openstreetmap.fr/api/interpreter',
];

const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/"/g, '\\"');

function toOverpass(sel: Selector) {
  return sel.all
    .map(([k, v]) => (typeof v === 'string' ? `["${esc(k)}"="${esc(v)}"]` : `["${esc(k)}"~"${esc(v.source)}"]`))
    .join('');
}

function matches(sel: Selector, tags: Record<string, string>) {
  return sel.all.every(([k, v]) => (typeof v === 'string' ? tags[k] === v : tags[k] !== undefined && v.test(tags[k]!)));
}

export function buildQuery(kind: PlaceKind, lat: number, lon: number, radiusM: number) {
  const around = `(around:${Math.round(radiusM)},${lat.toFixed(5)},${lon.toFixed(5)})`;
  const lines = KINDS[kind].selectors.map((s) => `  nwr${around}${toOverpass(s)};`).join('\n');
  // A short server-side limit: a query that cannot finish in ten seconds is better re-asked elsewhere than waited on.
  return `[out:json][timeout:10];\n(\n${lines}\n);\nout tags center 100;`;
}

/** The mirror that answered last goes first next time, so a dead one is only waited on once, not once per radius. */
let lastGood: string | null = null;

/** One query, asked of the mirrors a moment apart; the first good answer wins (see ../lib/overpass.js). */
function overpass(query: string, signal?: AbortSignal): Promise<OsmElement[]> {
  const endpoints = lastGood ? [lastGood, ...OVERPASS.filter((e) => e !== lastGood)] : OVERPASS;
  return overpassNet.fetchOverpass(query, {
    endpoints,
    fetch: (url, init) => fetch(url, init),
    signal,
    onSuccess: (endpoint) => {
      lastGood = endpoint;
    },
  }) as Promise<OsmElement[]>;
}

export function distanceKm(a: { lat: number; lon: number }, b: { lat: number; lon: number }) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLon = ((b.lon - a.lon) * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

const ACCEPT_LABEL: Record<string, string> = {
  batteries: 'Batteries',
  car_batteries: 'Car batteries',
  glass_bottles: 'Glass bottles',
  glass: 'Glass',
  cans: 'Cans',
  paper: 'Paper',
  cardboard: 'Cardboard',
  plastic_bottles: 'Plastic bottles',
  plastic_packaging: 'Plastic packaging',
  plastic: 'Plastic',
  plastic_bags: 'Plastic bags',
  clothes: 'Clothes',
  shoes: 'Shoes',
  electrical_appliances: 'Electronics',
  small_appliances: 'Small appliances',
  small_electrical_appliances: 'Small electronics',
  computers: 'Computers',
  mobile_phones: 'Phones',
  low_energy_bulbs: 'CFL bulbs',
  fluorescent_tubes: 'Fluorescent tubes',
  light_bulbs: 'Light bulbs',
  paint: 'Paint',
  engine_oil: 'Motor oil',
  cooking_oil: 'Cooking oil',
  green_waste: 'Yard waste',
  garden_waste: 'Yard waste',
  organic: 'Organics',
  food_waste: 'Food scraps',
  scrap_metal: 'Scrap metal',
  wood: 'Wood',
  rubble: 'Rubble',
  hazardous_waste: 'Hazardous waste',
  tyres: 'Tires',
  books: 'Books',
  furniture: 'Furniture',
};

function typeOf(tags: Record<string, string>): string {
  if (tags.amenity === 'recycling') return tags.recycling_type === 'container' ? 'Recycling bin' : 'Recycling center';
  if (tags.amenity === 'waste_transfer_station') return 'Transfer station';
  if (tags.landuse === 'landfill') return 'Landfill';
  if (tags.amenity === 'pharmacy') return 'Pharmacy';
  if (tags.amenity === 'give_box') return 'Give box';
  if (tags.shop === 'supermarket') return 'Supermarket';
  if (tags.shop === 'charity') return 'Charity shop';
  if (tags.shop === 'second_hand') return 'Thrift store';
  if (tags.shop === 'car_parts') return 'Auto parts store';
  if (tags.shop === 'tyres') return 'Tire shop';
  if (tags.shop === 'electronics') return 'Electronics store';
  if (tags.shop === 'hardware' || tags.shop === 'doityourself') return 'Hardware store';
  if (tags.shop === 'stationery') return 'Office supply store';
  if (tags.industrial === 'scrap_yard') return 'Scrap yard';
  if (tags.leisure === 'garden') return 'Community garden';
  return 'Drop-off point';
}

function addressOf(tags: Record<string, string>): string | null {
  const street = [tags['addr:housenumber'], tags['addr:street']].filter(Boolean).join(' ');
  const town = tags['addr:city'] ?? tags['addr:town'] ?? tags['addr:village'];
  const parts = [street, town].filter(Boolean);
  return parts.length ? parts.join(', ') : null;
}

export function toSite(el: OsmElement, kind: PlaceKind, from: { lat: number; lon: number }): Site | null {
  const lat = el.lat ?? el.center?.lat;
  const lon = el.lon ?? el.center?.lon;
  const tags = el.tags ?? {};
  if (lat === undefined || lon === undefined) return null;

  const selectors = KINDS[kind].selectors;
  const confirmed = selectors.some((s) => !s.likely && matches(s, tags));
  const likely = selectors.find((s) => s.likely && matches(s, tags));
  const type = typeOf(tags);
  const accepts = Object.entries(tags)
    .filter(([k, v]) => k.startsWith('recycling:') && v === 'yes')
    .map(([k]) => ACCEPT_LABEL[k.slice('recycling:'.length)] ?? null)
    .filter((v): v is string => !!v);

  return {
    id: `${el.type}/${el.id}`,
    name: tags.name ?? tags.brand ?? tags.operator ?? type,
    type,
    lat,
    lon,
    distanceKm: distanceKm(from, { lat, lon }),
    address: addressOf(tags),
    hours: tags.opening_hours ?? null,
    phone: tags.phone ?? tags['contact:phone'] ?? null,
    // Map data is editable by anyone: only a plain http(s) page survives as a link (see ../lib/safe-url.js).
    website: safeUrl.safeWebUrl(tags.website ?? tags['contact:website']),
    accepts: [...new Set(accepts)],
    confirmed,
    note: confirmed ? null : (likely?.why ?? 'Usually accepts this. Call ahead to check.'),
  };
}

/** Radii to try, nearest first, until enough places turn up. */
const RADII = { dense: [2500, 8000, 25000], normal: [8000, 25000, 60000] };
const ENOUGH = 5;

/** OpenStreetMap elements to sites, one per place (a place is often mapped as both a building and a point). */
function sitesFrom(elements: OsmElement[], kind: PlaceKind, from: { lat: number; lon: number }): Site[] {
  const seen = new Set<string>();
  return elements
    .map((el) => toSite(el, kind, from))
    .filter((s): s is Site => !!s)
    .filter((s) => {
      const key = `${s.name}|${s.lat.toFixed(3)}|${s.lon.toFixed(3)}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

/**
 * Nearby places, nearest first. The whole search has one deadline (about half a minute at the very worst); if a
 * smaller radius already found places by then, those are shown rather than an error.
 */
export async function findPlaces(kind: PlaceKind, lat: number, lon: number): Promise<PlacesResult> {
  const from = { lat, lon };
  const { value: sites, radius } = await overpassNet.widen<Site[]>({
    radii: KINDS[kind].dense ? RADII.dense : RADII.normal,
    run: async (r, signal) => sitesFrom(await overpass(buildQuery(kind, lat, lon, r), signal), kind, from),
    enough: (found) => found.length >= ENOUGH,
  });
  // Nearest first, with a head start for places confirmed to accept it — but a "usually accepts" that is much
  // closer still wins.
  sites.sort((a, b) => a.distanceKm * (a.confirmed ? 1 : 1.6) - b.distanceKm * (b.confirmed ? 1 : 1.6));
  return { sites: sites.slice(0, 25), radiusKm: radius / 1000, at: from };
}

// ---------------------------------------------------------------------------
// Links out
// ---------------------------------------------------------------------------

export const usesMiles = (zip?: string) => {
  if (zip && /^\d{5}$/.test(zip)) return true;
  try {
    return /-US$/.test(Intl.DateTimeFormat().resolvedOptions().locale);
  } catch {
    return false;
  }
};

export function formatDistance(km: number, miles: boolean) {
  const v = miles ? km * 0.621371 : km;
  const unit = miles ? 'mi' : 'km';
  return `${v < 10 ? v.toFixed(1) : Math.round(v)} ${unit}`;
}

export function directionsUrl(site: Pick<Site, 'lat' | 'lon' | 'name'>) {
  if (Platform.OS === 'ios') return `http://maps.apple.com/?daddr=${site.lat},${site.lon}&q=${encodeURIComponent(site.name)}`;
  return `https://www.google.com/maps/dir/?api=1&destination=${site.lat},${site.lon}`;
}

export function earth911Url(kind: PlaceKind, where: { zip?: string; lat: number; lon: number }) {
  const at = where.zip ?? `${where.lat.toFixed(4)},${where.lon.toFixed(4)}`;
  return `https://search.earth911.com/?what=${encodeURIComponent(KINDS[kind].search)}&where=${encodeURIComponent(at)}`;
}

export function mapsSearchUrl(kind: PlaceKind, where: { lat: number; lon: number }) {
  return `https://www.google.com/maps/search/${encodeURIComponent(KINDS[kind].search)}/@${where.lat.toFixed(5)},${where.lon.toFixed(5)},12z`;
}

export const OSM_ATTRIBUTION = 'Map data © OpenStreetMap contributors';

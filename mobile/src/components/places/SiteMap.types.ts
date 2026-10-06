import type { Site } from '@/lib/places';

export type SiteMapProps = {
  center: { lat: number; lon: number };
  sites: Site[];
  selectedId: string | null;
  onSelect: (id: string) => void;
};

/** Bounding box around the search point and the nearest few sites, padded so markers are not on the edge. */
export function boundsOf(center: { lat: number; lon: number }, sites: Site[], selectedId: string | null) {
  const pts = [center, ...sites.slice(0, 4)];
  const selected = sites.find((s) => s.id === selectedId);
  if (selected) pts.push(selected);
  const lats = pts.map((p) => p.lat);
  const lons = pts.map((p) => p.lon);
  const pad = 0.15;
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLon = Math.min(...lons);
  const maxLon = Math.max(...lons);
  const dLat = Math.max(maxLat - minLat, 0.01) * pad;
  const dLon = Math.max(maxLon - minLon, 0.01) * pad;
  return { minLat: minLat - dLat, maxLat: maxLat + dLat, minLon: minLon - dLon, maxLon: maxLon + dLon };
}

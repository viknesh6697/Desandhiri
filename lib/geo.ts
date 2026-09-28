import type { LineStringGeometry, LngLat, Place } from "./types";

export function round6(n: number) {
  return Math.round(n * 1e6) / 1e6;
}

export function haversineKm(a: LngLat, b: LngLat) {
  const R = 6371;
  const dLat = ((b[1] - a[1]) * Math.PI) / 180;
  const dLng = ((b[0] - a[0]) * Math.PI) / 180;
  const lat1 = (a[1] * Math.PI) / 180;
  const lat2 = (b[1] * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** A short bow between two pins. Used when a road leg is not in the cache. */
export function arc(a: LngLat, b: LngLat): LngLat[] {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const d = Math.hypot(dx, dy);
  const steps = Math.max(10, Math.min(56, Math.round(d * 48)));
  const bow = Math.min(0.09, Math.max(0.004, d * 0.14));
  const len = d || 1;
  const cx = (a[0] + b[0]) / 2 + (-dy / len) * bow;
  const cy = (a[1] + b[1]) / 2 + (dx / len) * bow;
  const pts: LngLat[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const omt = 1 - t;
    pts.push([
      round6(omt * omt * a[0] + 2 * omt * t * cx + t * t * b[0]),
      round6(omt * omt * a[1] + 2 * omt * t * cy + t * t * b[1]),
    ]);
  }
  return pts;
}

export function routeThrough(
  places: Place[],
  legs: Record<string, LngLat[]>,
): LineStringGeometry {
  if (places.length === 0) return { type: "LineString", coordinates: [] };
  if (places.length === 1) {
    return { type: "LineString", coordinates: [[places[0].lng, places[0].lat]] };
  }
  const coordinates: LngLat[] = [];
  for (let i = 0; i < places.length - 1; i++) {
    const a = places[i];
    const b = places[i + 1];
    const cached = legs[`${a.id}>${b.id}`];
    const pts = cached && cached.length >= 2 ? cached : arc([a.lng, a.lat], [b.lng, b.lat]);
    if (coordinates.length === 0) coordinates.push(...pts);
    else coordinates.push(...pts.slice(1));
  }
  return { type: "LineString", coordinates };
}

export function centroid(places: Pick<Place, "lng" | "lat">[]): LngLat {
  if (places.length === 0) return [78.5, 22];
  const lng = places.reduce((s, p) => s + p.lng, 0) / places.length;
  const lat = places.reduce((s, p) => s + p.lat, 0) / places.length;
  return [lng, lat];
}

export function boundsOf(coords: LngLat[]): [LngLat, LngLat] | null {
  if (coords.length === 0) return null;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const [x, y] of coords) {
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  }
  if (minX === maxX && minY === maxY) {
    minX -= 0.02;
    maxX += 0.02;
    minY -= 0.02;
    maxY += 0.02;
  }
  return [
    [minX, minY],
    [maxX, maxY],
  ];
}

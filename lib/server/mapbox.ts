import type { LngLat } from "../types";
import { haversineKm } from "../geo";

export function mapboxToken() {
  return process.env.MAPBOX_TOKEN?.trim() || process.env.NEXT_PUBLIC_MAPBOX_TOKEN?.trim() || "";
}

export async function geocode(query: string, token: string, proximity?: LngLat): Promise<LngLat | null> {
  const url = new URL(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json`);
  url.searchParams.set("access_token", token);
  url.searchParams.set("limit", "1");
  url.searchParams.set("types", "poi,place,locality,neighborhood,region,address");
  if (proximity) url.searchParams.set("proximity", `${proximity[0]},${proximity[1]}`);
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) return null;
  const data = (await response.json()) as { features?: { center?: [number, number] }[] };
  const center = data.features?.[0]?.center;
  if (!center || center.length < 2) return null;
  return [center[0], center[1]];
}

export async function routeGeometry(points: LngLat[], token: string): Promise<LngLat[] | null> {
  if (points.length < 2) return points;
  let maxHop = 0;
  for (let i = 1; i < points.length; i++) {
    maxHop = Math.max(maxHop, haversineKm(points[i - 1], points[i]));
  }
  const profile = maxHop < 2.2 ? "walking" : "driving";
  const path = points.map((point) => `${point[0]},${point[1]}`).join(";");
  const url = new URL(`https://api.mapbox.com/directions/v5/mapbox/${profile}/${path}`);
  url.searchParams.set("geometries", "geojson");
  url.searchParams.set("overview", "full");
  url.searchParams.set("access_token", token);
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) return null;
  const data = (await response.json()) as {
    routes?: { geometry?: { coordinates?: LngLat[] } }[];
  };
  const coordinates = data.routes?.[0]?.geometry?.coordinates;
  if (!coordinates || coordinates.length < 2) return null;
  return coordinates;
}

export async function wikiPhotos(name: string): Promise<string[]> {
  try {
    const title = name.replace(/ /g, "_");
    const response = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`, {
      headers: { "User-Agent": "Desandhiri/1.0 (trip planner)" },
      signal: AbortSignal.timeout(4000),
      cache: "no-store",
    });
    if (!response.ok) return [];
    const data = (await response.json()) as {
      originalimage?: { source?: string };
      thumbnail?: { source?: string };
    };
    const source = data.originalimage?.source || data.thumbnail?.source;
    return source ? [source] : [];
  } catch {
    return [];
  }
}

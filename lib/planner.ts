import { centroid, haversineKm, routeThrough } from "./geo";
import { getDemo, matchDemo } from "./demo-trips";
import type { DayPlan, LngLat, Place, VibeId } from "./types";

export { getDemo, matchDemo };

export const VIBES: { id: VibeId; label: string }[] = [
  { id: "solo", label: "Solo" },
  { id: "spiritual", label: "Spiritual" },
  { id: "scenic", label: "Scenic" },
  { id: "hiking", label: "Hiking" },
  { id: "cultural", label: "Cultural" },
  { id: "educational", label: "Educational" },
  { id: "culinary", label: "Culinary" },
  { id: "wildlife", label: "Wildlife" },
  { id: "slow", label: "Slow" },
];

export const VIBE_IDS = VIBES.map((vibe) => vibe.id);

const MAX_DAYS = 12;

export function dayCountFromRange(start: string, end: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(start) || !/^\d{4}-\d{2}-\d{2}$/.test(end)) return null;
  const [sy, sm, sd] = start.split("-").map(Number);
  const [ey, em, ed] = end.split("-").map(Number);
  const from = new Date(sy, sm - 1, sd).getTime();
  const to = new Date(ey, em - 1, ed).getTime();
  if (Number.isNaN(from) || Number.isNaN(to) || to < from) return null;
  return Math.round((to - from) / 86_400_000) + 1;
}

export function assertDayCount(dayCount: number) {
  if (!Number.isInteger(dayCount) || dayCount < 1 || dayCount > MAX_DAYS) {
    throw new Error(`Trips here run from 1 to ${MAX_DAYS} days. Shorten or lengthen the date range.`);
  }
}

export function formatRange(start: string, end: string) {
  const label = (value: string) => {
    const [year, month, day] = value.split("-").map(Number);
    return new Date(year, month - 1, day).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
    });
  };
  return start === end ? label(start) : `${label(start)} – ${label(end)}`;
}

export function defaultDateRange(days: number) {
  const start = new Date();
  start.setDate(start.getDate() + 21);
  const end = new Date(start);
  end.setDate(end.getDate() + days - 1);
  const iso = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };
  return { startDate: iso(start), endDate: iso(end) };
}

export function scorePlace(place: Place, vibes: VibeId[]) {
  if (vibes.length === 0) return 0;
  return place.vibeTags.filter((tag) => vibes.includes(tag)).length;
}

export function discoverPrompt(destination: string, vibes: VibeId[], dayCount: number) {
  return `You are the place researcher for Desandhiri, a trip planner.
The traveller is going to ${destination} for ${dayCount} days.
Vibes they chose: ${vibes.join(", ")}.

Return ONLY a JSON object, no markdown, with this shape:
{
  "places": [
    {
      "id": "kebab-case-unique",
      "name": "Real place name",
      "description": "Two concrete sentences a traveller can use.",
      "activities": ["specific thing to do", "another", "a third if useful"],
      "timeToSpend": "1–2 hours",
      "bestTimeToVisit": "Early morning",
      "vibeTags": ["scenic"],
      "why": "One sentence on why this place fits the chosen vibes."
    }
  ]
}

Rules:
- Return 12 real, visitable places in or near ${destination}. No invented landmarks.
- Do NOT include coordinates, addresses, or opening hours you are unsure of.
- vibeTags must be chosen only from: ${VIBE_IDS.join(", ")}.
- Spread places across distinct neighbourhoods or nearby areas so they can be grouped into about ${dayCount} geographic days without zigzagging.
- The "why" must be written now. Detail is not fetched later.
- No duplicate places.`;
}

export function clusterPrompt(
  destination: string,
  dayCount: number,
  places: Place[],
  previous?: { day: number; title: string; placeIds: string[] }[],
  instructions?: string,
) {
  const catalogue = places
    .map((place) => `${place.id} | ${place.name} | ${place.lng.toFixed(4)},${place.lat.toFixed(4)}`)
    .join("\n");
  const note = instructions?.trim().slice(0, 600) ?? "";
  const prior = previous?.length ? `\nPrevious grouping:\n${JSON.stringify(previous)}\n` : "";
  const ask = note
    ? `\nThe traveller added these instructions. Follow them. Keep every place exactly once and keep each day in one area:\n${note}\n`
    : previous?.length
      ? `\nThe traveller asked to regenerate without extra instructions. Produce a different grouping that is still geographic. Do not zigzag.\n`
      : "";
  return `Cluster these places into exactly ${dayCount} days for ${destination}.
Group by geography so each day stays in one area. Order the days as a sensible route across the trip.
${prior}${ask}
Places (id | name | lng,lat):
${catalogue}

Return ONLY JSON:
{
  "days": [
    { "day": 1, "title": "Short place-based title", "summary": "One sentence.", "placeIds": ["id"] }
  ]
}

Rules:
- Use every place id exactly once. Do not invent ids.
- Exactly ${dayCount} days. No empty days.
- Titles should name the area, not say "Day 1".`;
}

export function parseModelJson(text: string): unknown {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end <= start) throw new Error("The model did not return JSON.");
  return JSON.parse(text.slice(start, end + 1));
}

function asString(value: unknown, fallback = "") {
  return typeof value === "string" ? value.trim() : fallback;
}

export function sanitizeDiscoveredPlaces(raw: unknown): Omit<Place, "lng" | "lat" | "photos">[] {
  const places = (raw as { places?: unknown })?.places;
  if (!Array.isArray(places)) throw new Error("The model returned no places.");
  const used = new Set<string>();
  const clean: Omit<Place, "lng" | "lat" | "photos">[] = [];
  for (const entry of places) {
    if (!entry || typeof entry !== "object") continue;
    const record = entry as Record<string, unknown>;
    const name = asString(record.name);
    if (!name) continue;
    let id = asString(record.id)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    if (!id) id = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    while (used.has(id)) id = `${id}-2`;
    used.add(id);
    const tags = Array.isArray(record.vibeTags)
      ? record.vibeTags.filter((tag): tag is VibeId => VIBE_IDS.includes(tag as VibeId))
      : [];
    const activities = Array.isArray(record.activities)
      ? record.activities.map((item) => asString(item)).filter(Boolean).slice(0, 4)
      : [];
    clean.push({
      id,
      name,
      description: asString(record.description, name),
      activities: activities.length ? activities : ["Walk the site and take it in slowly"],
      timeToSpend: asString(record.timeToSpend, "1–2 hours"),
      bestTimeToVisit: asString(record.bestTimeToVisit, "Morning"),
      vibeTags: tags.length ? tags : ["scenic"],
      why: asString(record.why, `A strong match for a trip to see ${name}.`),
    });
  }
  if (clean.length < 8) throw new Error("The model did not return enough real places to plan from.");
  return clean.slice(0, 15);
}

function centroidOf(places: Place[]): LngLat {
  return centroid(places);
}

function closestAdjacent(groups: Place[][]) {
  let best = 0;
  let bestKm = Infinity;
  for (let i = 0; i < groups.length - 1; i++) {
    const km = haversineKm(centroidOf(groups[i]), centroidOf(groups[i + 1]));
    if (km < bestKm) {
      bestKm = km;
      best = i;
    }
  }
  return best;
}

function splitGroup(group: Place[]) {
  const mid = Math.max(1, Math.ceil(group.length / 2));
  return [group.slice(0, mid), group.slice(mid)].filter((part) => part.length > 0);
}

/** Keep visit order. Merge the closest adjacent areas, or split the fullest one, until the day count fits. */
export function packByGeography(groups: Place[][], dayCount: number, variant = 0): Place[][] {
  const packed = groups.map((group) => group.slice()).filter((group) => group.length > 0);
  const twists = variant % 3;
  for (let twist = 0; twist < twists && packed.length > 1; twist++) {
    const index = closestAdjacent(packed);
    const merged = packed[index].concat(packed[index + 1]);
    packed.splice(index, 2, merged);
    let splitAt = 0;
    for (let i = 1; i < packed.length; i++) {
      if (packed[i].length > packed[splitAt].length) splitAt = i;
    }
    if (packed[splitAt].length >= 2 && packed[splitAt] !== merged) {
      const [left, right] = splitGroup(packed[splitAt]);
      packed.splice(splitAt, 1, left, right);
    }
  }

  while (packed.length > dayCount) {
    const index = closestAdjacent(packed);
    packed.splice(index, 2, packed[index].concat(packed[index + 1]));
  }

  let guard = 0;
  while (packed.length < dayCount && guard < 24) {
    guard += 1;
    let splitAt = -1;
    for (let i = 0; i < packed.length; i++) {
      if (packed[i].length >= 2 && (splitAt < 0 || packed[i].length > packed[splitAt].length)) {
        splitAt = i;
      }
    }
    if (splitAt < 0) break;
    const [left, right] = splitGroup(packed[splitAt]);
    if (right.length === 0) break;
    packed.splice(splitAt, 1, left, right);
  }
  return packed;
}

export function orderByNearest(places: Place[]): Place[] {
  if (places.length <= 2) return places.slice();
  const unused = new Set(places.map((place) => place.id));
  const center = centroidOf(places);
  let current = places.reduce((far, place) =>
    haversineKm([place.lng, place.lat], center) > haversineKm([far.lng, far.lat], center) ? place : far,
  );
  const ordered = [current];
  unused.delete(current.id);
  while (unused.size) {
    let next = current;
    let best = Infinity;
    for (const place of places) {
      if (!unused.has(place.id)) continue;
      const km = haversineKm([current.lng, current.lat], [place.lng, place.lat]);
      if (km < best) {
        best = km;
        next = place;
      }
    }
    current = next;
    ordered.push(current);
    unused.delete(current.id);
  }
  return ordered;
}

function titleFor(group: Place[], regionTitles: Map<string, string>, used: Map<string, number>) {
  const regionIds = [...new Set(group.map((place) => place.regionId).filter(Boolean))] as string[];
  let title =
    regionIds.length === 0
      ? group.length === 1
        ? group[0].name
        : `${group[0].name} to ${group[group.length - 1].name}`
      : regionIds.map((id) => regionTitles.get(id) ?? group[0].name).join(" · ");
  const count = (used.get(title) ?? 0) + 1;
  used.set(title, count);
  if (count > 1) title = `${title} · ${group[0].name}`;
  return title;
}

export function daysFromGroups(
  groups: Place[][],
  legs: Record<string, LngLat[]>,
  regionTitles: Map<string, string>,
  regionSummaries: Map<string, string>,
): DayPlan[] {
  const used = new Map<string, number>();
  return groups.map((group, index) => {
    const regionIds = [...new Set(group.map((place) => place.regionId).filter(Boolean))] as string[];
    const summary =
      regionIds.length === 1 && regionSummaries.get(regionIds[0])
        ? regionSummaries.get(regionIds[0])!
        : group.map((place) => place.name).join(", ");
    return {
      day: index + 1,
      title: titleFor(group, regionTitles, used),
      summary,
      placeIds: group.map((place) => place.id),
      route: routeThrough(group, legs),
    };
  });
}

export function buildDemoItinerary(
  slug: string,
  selectedIds: string[],
  dayCount: number,
  variant = 0,
): DayPlan[] {
  const demo = getDemo(slug);
  if (!demo) throw new Error("Unknown demo destination.");
  assertDayCount(dayCount);
  const selected = new Set(selectedIds);
  const places = demo.places
    .filter((place) => selected.has(place.id))
    .slice()
    .sort((a, b) => (a.visitOrder ?? 0) - (b.visitOrder ?? 0));
  if (places.length === 0) throw new Error("Select at least one place.");
  const days = Math.min(dayCount, places.length);
  const byRegion = new Map<string, Place[]>();
  for (const place of places) {
    const key = place.regionId ?? place.id;
    const list = byRegion.get(key) ?? [];
    list.push(place);
    byRegion.set(key, list);
  }
  const groups = demo.regions
    .map((region) => byRegion.get(region.id) ?? [])
    .filter((group) => group.length > 0);
  const packed = packByGeography(groups.length ? groups : [places], days, variant);
  const titles = new Map(demo.regions.map((region) => [region.id, region.title]));
  const summaries = new Map(demo.regions.map((region) => [region.id, region.summary]));
  return daysFromGroups(packed, demo.legs, titles, summaries);
}

export function buildGeographicItinerary(places: Place[], dayCount: number, variant = 0): DayPlan[] {
  assertDayCount(dayCount);
  if (places.length === 0) throw new Error("Select at least one place.");
  const ordered = orderByNearest(places);
  const days = Math.min(dayCount, ordered.length);
  const packed = packByGeography([ordered], days, variant);
  return daysFromGroups(packed, {}, new Map(), new Map());
}

export function attachRoutes(days: DayPlan[], places: Place[], legs: Record<string, LngLat[]> = {}) {
  const byId = new Map(places.map((place) => [place.id, place]));
  return days.map((day) => {
    const stops = day.placeIds.map((id) => byId.get(id)).filter((place): place is Place => Boolean(place));
    return { ...day, route: routeThrough(stops, legs) };
  });
}

export function validateCluster(raw: unknown, places: Place[], dayCount: number): DayPlan[] {
  const days = (raw as { days?: unknown })?.days;
  if (!Array.isArray(days) || days.length === 0) {
    throw new Error("The model did not return a day plan.");
  }
  const known = new Set(places.map((place) => place.id));
  const seen = new Set<string>();
  const parsed: DayPlan[] = [];
  for (const entry of days) {
    if (!entry || typeof entry !== "object") continue;
    const record = entry as Record<string, unknown>;
    const ids = Array.isArray(record.placeIds)
      ? record.placeIds.map((id) => asString(id)).filter((id) => known.has(id) && !seen.has(id))
      : [];
    ids.forEach((id) => seen.add(id));
    if (ids.length === 0) continue;
    parsed.push({
      day: parsed.length + 1,
      title: asString(record.title, `Around ${ids[0]}`),
      summary: asString(record.summary),
      placeIds: ids,
      route: { type: "LineString", coordinates: [] },
    });
  }
  const missing = places.filter((place) => !seen.has(place.id));
  if (missing.length) {
    const ordered = orderByNearest(missing);
    for (const place of ordered) {
      let target = parsed[0];
      let best = Infinity;
      const point: LngLat = [place.lng, place.lat];
      for (const day of parsed) {
        const stops = day.placeIds
          .map((id) => places.find((item) => item.id === id))
          .filter((item): item is Place => Boolean(item));
        const km = haversineKm(point, centroid(stops));
        if (km < best) {
          best = km;
          target = day;
        }
      }
      if (target) target.placeIds.push(place.id);
      else {
        parsed.push({
          day: parsed.length + 1,
          title: place.name,
          summary: place.why,
          placeIds: [place.id],
          route: { type: "LineString", coordinates: [] },
        });
      }
    }
  }
  const fitted =
    parsed.length === Math.min(dayCount, places.length)
      ? parsed
      : buildGeographicItinerary(places, dayCount);
  return attachRoutes(fitted, places);
}

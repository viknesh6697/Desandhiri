import { NextResponse } from "next/server";
import { matchDemo, discoverPrompt, parseModelJson, sanitizeDiscoveredPlaces, VIBE_IDS } from "@/lib/planner";
import { complete } from "@/lib/server/claude";
import { geocode, mapboxToken, wikiPhotos } from "@/lib/server/mapbox";
import type { LngLat, Place, VibeId } from "@/lib/types";

export const dynamic = "force-dynamic";

const MISSING_MAPBOX =
  "Custom trips need MAPBOX_TOKEN or NEXT_PUBLIC_MAPBOX_TOKEN so place names can be geocoded. Kashmir, Kerala, and Rajasthan already include coordinates.";

export async function POST(request: Request) {
  let body: { destination?: string; vibes?: string[]; dayCount?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Send a destination, a day count, and at least one vibe." }, { status: 400 });
  }

  const destination = body.destination?.trim() ?? "";
  const dayCount = body.dayCount;
  const vibes = (body.vibes ?? []).filter((vibe): vibe is VibeId => VIBE_IDS.includes(vibe as VibeId));
  if (!destination || !dayCount || vibes.length === 0) {
    return NextResponse.json({ error: "Add a destination, a valid date range, and at least one vibe." }, { status: 400 });
  }

  const demo = matchDemo(destination);
  if (demo) {
    return NextResponse.json({
      destination: demo.name,
      center: demo.center,
      demoSlug: demo.slug,
      places: demo.places,
    });
  }

  const token = mapboxToken();
  if (!token) return NextResponse.json({ error: MISSING_MAPBOX }, { status: 400 });

  try {
    const text = await complete(discoverPrompt(destination, vibes, dayCount));
    const seeds = sanitizeDiscoveredPlaces(parseModelJson(text));
    const center = (await geocode(destination, token)) ?? ([78.6, 22.5] as LngLat);
    const places: Place[] = [];
    for (const seed of seeds) {
      const point = await geocode(`${seed.name}, ${destination}`, token, center);
      if (!point) continue;
      const photos = await wikiPhotos(seed.name);
      places.push({ ...seed, lng: point[0], lat: point[1], photos });
    }
    if (places.length < 8) {
      return NextResponse.json(
        { error: `Only ${places.length} places could be located on the map. Try a more specific destination.` },
        { status: 422 },
      );
    }
    return NextResponse.json({
      destination,
      center,
      demoSlug: null,
      places,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not find places.";
    const status = message.includes("ANTHROPIC_API_KEY") ? 400 : 502;
    return NextResponse.json({ error: message }, { status });
  }
}

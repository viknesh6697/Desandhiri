import { NextResponse } from "next/server";
import {
  assertDayCount,
  attachRoutes,
  buildGeographicItinerary,
  clusterPrompt,
  parseModelJson,
  validateCluster,
} from "@/lib/planner";
import { routeThrough } from "@/lib/geo";
import { complete } from "@/lib/server/claude";
import { mapboxToken, routeGeometry } from "@/lib/server/mapbox";
import type { DayPlan, LngLat, Place } from "@/lib/types";

export const dynamic = "force-dynamic";

function isPlace(value: unknown): value is Place {
  if (!value || typeof value !== "object") return false;
  const place = value as Place;
  return (
    typeof place.id === "string" &&
    typeof place.name === "string" &&
    typeof place.lng === "number" &&
    typeof place.lat === "number" &&
    Number.isFinite(place.lng) &&
    Number.isFinite(place.lat)
  );
}

async function withRoads(days: DayPlan[], places: Place[], token: string) {
  const byId = new Map(places.map((place) => [place.id, place]));
  const next: DayPlan[] = [];
  for (const day of days) {
    const stops = day.placeIds.map((id) => byId.get(id)).filter((place): place is Place => Boolean(place));
    const points = stops.map((place) => [place.lng, place.lat] as LngLat);
    const road = token ? await routeGeometry(points, token) : null;
    next.push({
      ...day,
      route: road ? { type: "LineString", coordinates: road } : routeThrough(stops, {}),
    });
  }
  return next;
}

export async function POST(request: Request) {
  let body: {
    destination?: string;
    dayCount?: number;
    places?: unknown[];
    previous?: { day: number; title: string; placeIds: string[] }[];
    instructions?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Send the selected places and a day count." }, { status: 400 });
  }

  const destination = body.destination?.trim() || "the trip";
  const dayCount = body.dayCount;
  const places = (body.places ?? []).filter(isPlace).slice(0, 15);
  if (!dayCount || places.length === 0) {
    return NextResponse.json({ error: "Select at least one place." }, { status: 400 });
  }
  try {
    assertDayCount(dayCount);
  } catch (error) {
    const message = error instanceof Error ? error.message : "That date range is too long.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const token = mapboxToken();
  try {
    const instructions = typeof body.instructions === "string" ? body.instructions.slice(0, 600) : undefined;
    const text = await complete(clusterPrompt(destination, dayCount, places, body.previous, instructions));
    let days: DayPlan[];
    let clusteredBy: "model" | "geography" = "model";
    try {
      days = validateCluster(parseModelJson(text), places, dayCount);
    } catch {
      days = buildGeographicItinerary(places, dayCount);
      clusteredBy = "geography";
    }
    days = await withRoads(days, places, token);
    return NextResponse.json({ days, clusteredBy });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not group these days.";
    if (message.includes("ANTHROPIC_API_KEY")) {
      return NextResponse.json({ error: message }, { status: 400 });
    }
    const days = await withRoads(attachRoutes(buildGeographicItinerary(places, dayCount), places), places, token);
    return NextResponse.json({
      days,
      clusteredBy: "geography",
      note: "Days were grouped by distance because Claude did not return a usable plan.",
    });
  }
}

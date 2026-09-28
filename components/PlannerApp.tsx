"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import DiscoverScreen from "./DiscoverScreen";
import ItineraryScreen from "./ItineraryScreen";
import SetupScreen from "./SetupScreen";
import TripMap, { type MapPlace, type MapRoute, type TripMapHandle } from "./TripMap";
import { getDemo } from "@/lib/demo-trips";
import {
  buildDemoItinerary,
  dayCountFromRange,
  defaultDateRange,
  scorePlace,
  matchDemo,
} from "@/lib/planner";
import type { DayPlan, LngLat, Place, VibeId } from "@/lib/types";

const DEMO_VIBES: Record<string, VibeId[]> = {
  kashmir: ["scenic", "spiritual", "hiking"],
  kerala: ["slow", "scenic", "culinary"],
  rajasthan: ["cultural", "educational", "scenic"],
};

type Screen = "setup" | "flying" | "discover" | "building" | "itinerary";

export default function PlannerApp({ initialDemo }: { initialDemo?: string }) {
  const seeded = getDemo(initialDemo);
  const seededDays = seeded ? buildDemoItinerary(seeded.slug, seeded.places.map((place) => place.id), 4) : [];
  const seededRange = defaultDateRange(4);

  const [screen, setScreen] = useState<Screen>(seeded ? "itinerary" : "setup");
  const [destination, setDestination] = useState(seeded?.name ?? "");
  const [startDate, setStartDate] = useState(seeded ? seededRange.startDate : "");
  const [endDate, setEndDate] = useState(seeded ? seededRange.endDate : "");
  const [vibes, setVibes] = useState<VibeId[]>(seeded ? DEMO_VIBES[seeded.slug] ?? ["scenic"] : []);
  const [places, setPlaces] = useState<Place[]>(seeded?.places ?? []);
  const [selected, setSelected] = useState<string[]>(seeded?.places.map((place) => place.id) ?? []);
  const [days, setDays] = useState<DayPlan[]>(seededDays);
  const [activeDay, setActiveDay] = useState<number | null>(null);
  const [drawToken, setDrawToken] = useState(0);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [demoSlug, setDemoSlug] = useState<string | null>(seeded?.slug ?? null);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(seeded ? "Cached journey. No live geocoding." : null);
  const [variant, setVariant] = useState(0);
  const [regenerating, setRegenerating] = useState(false);
  const [instructions, setInstructions] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const mapRef = useRef<TripMapHandle>(null);
  const framed = useRef(false);
  const [narrow, setNarrow] = useState(false);
  const dayCount = dayCountFromRange(startDate, endDate);
  const openPad = narrow ? 28 : { top: 54, right: 42, bottom: 54, left: 500 };

  const split = screen === "discover" || screen === "building" || screen === "itinerary";

  const mapPlaces: MapPlace[] = useMemo(() => {
    if (screen === "itinerary") {
      return days.flatMap((day) =>
        day.placeIds.map((id, index) => {
          const place = places.find((item) => item.id === id);
          if (!place) return null;
          const focused = activeDay == null || activeDay === day.day;
          return {
            id: place.id,
            name: place.name,
            lng: place.lng,
            lat: place.lat,
            selected: focused,
            dimmed: !focused,
            open: detailId === place.id,
            label: String(index + 1),
            showName: activeDay === day.day,
          };
        }),
      ).filter((place): place is MapPlace => Boolean(place));
    }
    if (screen === "discover" || screen === "building") {
      return places.map((place) => ({
        id: place.id,
        name: place.name,
        lng: place.lng,
        lat: place.lat,
        selected: selected.includes(place.id),
        dimmed: false,
        open: false,
        label: "",
        showName: false,
      }));
    }
    return [];
  }, [screen, places, selected, days, activeDay, detailId]);

  const drawRouteId = activeDay == null ? null : `day-${activeDay}`;
  const mapRoutes: MapRoute[] = useMemo(() => {
    if (screen !== "itinerary") return [];
    return days.map((day) => ({
      id: `day-${day.day}`,
      coordinates: day.route.coordinates,
      role: activeDay == null ? "single" : activeDay === day.day ? "focus" : "quiet",
    }));
  }, [screen, days, activeDay]);

  function applyDemo(slug: string) {
    const trip = getDemo(slug);
    if (!trip) return;
    const range = defaultDateRange(4);
    setDestination(trip.name);
    setStartDate(range.startDate);
    setEndDate(range.endDate);
    setVibes(DEMO_VIBES[slug] ?? ["scenic"]);
    setError(null);
  }

  function toggleVibe(vibe: VibeId) {
    setVibes((current) => (current.includes(vibe) ? current.filter((item) => item !== vibe) : [...current, vibe]));
  }

  function togglePlace(id: string) {
    setSelected((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }

  function revealDiscover(nextPlaces: Place[], slug: string | null) {
    setPlaces(nextPlaces);
    setSelected(nextPlaces.map((place) => place.id));
    setDemoSlug(slug);
    setDays([]);
    setActiveDay(null);
    setDetailId(null);
    setDrawToken(0);
    setVariant(0);
    setNote(slug ? "Cached journey. No live geocoding." : null);
    setScreen("discover");
    setStatus(null);
    window.setTimeout(() => mapRef.current?.resize(), 60);
  }

  async function findPlaces() {
    setError(null);
    if (!destination.trim()) {
      setError("Add a destination.");
      return;
    }
    if (!startDate || !endDate) {
      setError("Choose an arrival and a departure. Days are counted from those dates.");
      return;
    }
    if (dayCount == null) {
      setError("Departure is before arrival.");
      return;
    }
    if (dayCount > 12) {
      setError("Trips here run up to 12 days. Shorten the date range.");
      return;
    }
    if (vibes.length === 0) {
      setError("Choose at least one vibe.");
      return;
    }

    const matched = matchDemo(destination);
    setScreen("flying");
    setStatus(matched ? `Opening ${matched.name}` : `Finding places in ${destination.trim()}`);

    let settled = false;
    const backup = window.setTimeout(() => {
      if (settled || !matched) return;
      settled = true;
      const sorted = [...matched.places].sort((a, b) => scorePlace(b, vibes) - scorePlace(a, vibes));
      revealDiscover(sorted, matched.slug);
    }, 7500);

    if (matched) {
      const sorted = [...matched.places].sort((a, b) => scorePlace(b, vibes) - scorePlace(a, vibes));
      const coords = sorted.map((place) => [place.lng, place.lat] as LngLat);
      mapRef.current?.flyToBounds(coords, { duration: 4600, pitch: 46, salt: 2, padding: openPad }, () => {
        if (settled) return;
        settled = true;
        window.clearTimeout(backup);
        revealDiscover(sorted, matched.slug);
      });
      return;
    }

    try {
      const response = await fetch("/api/discover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ destination: destination.trim(), vibes, dayCount }),
      });
      const body = (await response.json()) as { error?: string; places?: Place[]; demoSlug?: string | null; center?: LngLat };
      if (!response.ok || !body.places) throw new Error(body.error || "Could not find places.");
      const nextPlaces = body.places;
      const coords = nextPlaces.map((place) => [place.lng, place.lat] as LngLat);
      setStatus(`Opening ${destination.trim()}`);
      mapRef.current?.flyToBounds(
        coords,
        { duration: 4600, pitch: 46, salt: 3, padding: openPad },
        () => {
          if (settled) return;
          settled = true;
          window.clearTimeout(backup);
          revealDiscover(nextPlaces, body.demoSlug ?? null);
        },
      );
    } catch (caught) {
      settled = true;
      window.clearTimeout(backup);
      setStatus(null);
      setScreen("setup");
      setError(caught instanceof Error ? caught.message : "Could not find places.");
    }
  }

  async function buildItinerary() {
    if (dayCount == null || selected.length === 0) return;
    setError(null);
    setScreen("building");
    setStatus("Grouping places into days");
    setDetailId(null);
    setActiveDay(null);
    try {
      let nextDays: DayPlan[];
      let nextNote: string | null = null;
      if (demoSlug) {
        nextDays = buildDemoItinerary(demoSlug, selected, dayCount, 0);
        nextNote = "Cached routes. Days stay in geographic order.";
        await new Promise((resolve) => window.setTimeout(resolve, 350));
      } else {
        const response = await fetch("/api/itinerary", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            destination,
            dayCount,
            places: places.filter((place) => selected.includes(place.id)),
          }),
        });
        const body = (await response.json()) as { error?: string; days?: DayPlan[]; note?: string; clusteredBy?: string };
        if (!response.ok || !body.days) throw new Error(body.error || "Could not build the days.");
        nextDays = body.days;
        nextNote =
          body.note ??
          (body.clusteredBy === "geography" ? "Days were grouped by distance because Claude did not return a usable plan." : null);
      }
      setDays(nextDays);
      setVariant(0);
      setNote(nextNote);
      setScreen("itinerary");
      setStatus(null);
      const coords = nextDays.flatMap((day) => day.route.coordinates);
      window.setTimeout(() => mapRef.current?.flyToBounds(coords, { duration: 800, pitch: 36, padding: openPad }), 40);
    } catch (caught) {
      setStatus(null);
      setScreen("discover");
      setError(caught instanceof Error ? caught.message : "Could not build the days.");
    }
  }

  async function regenerate() {
    if (dayCount == null) return;
    setRegenerating(true);
    setError(null);
    const nextVariant = variant + 1;
    const note = instructions.trim();
    try {
      if (demoSlug && !note) {
        setDays(buildDemoItinerary(demoSlug, selected, dayCount, nextVariant));
        setNote("Regrouped from the cached places. Still ordered by geography.");
      } else {
        const response = await fetch("/api/itinerary", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            destination,
            dayCount,
            places: places.filter((place) => selected.includes(place.id)),
            previous: days.map((day) => ({ day: day.day, title: day.title, placeIds: day.placeIds })),
            instructions: note,
          }),
        });
        const body = (await response.json()) as { error?: string; days?: DayPlan[]; note?: string; clusteredBy?: string };
        if (!response.ok || !body.days) throw new Error(body.error || "Could not regroup the days.");
        setDays(body.days);
        setNote(
          body.note ??
            (note
              ? "Regenerated with your notes."
              : body.clusteredBy === "geography"
                ? "Grouped by distance."
                : "Regenerated from the same places."),
        );
      }
      setVariant(nextVariant);
      setActiveDay(null);
      setDrawToken(0);
      setDetailId(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not regroup the days.");
    } finally {
      setRegenerating(false);
    }
  }

  function focusDay(dayNumber: number) {
    const day = days.find((item) => item.day === dayNumber);
    if (!day) return;
    setActiveDay(dayNumber);
    setDrawToken((token) => token + 1);
    setDetailId(null);
    mapRef.current?.flyToBounds(day.route.coordinates, { duration: 2600, pitch: 50, salt: dayNumber, padding: openPad });
  }

  function openStop(id: string) {
    const day = days.find((item) => item.placeIds.includes(id));
    const place = places.find((item) => item.id === id);
    setDetailId(id);
    if (day) {
      setActiveDay(day.day);
      setDrawToken((token) => token + 1);
    }
    if (place) mapRef.current?.flyToPoint([place.lng, place.lat]);
  }

  function onMapPlace(id: string) {
    if (screen === "discover" || screen === "building") togglePlace(id);
    else if (screen === "itinerary") openStop(id);
  }

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setDetailId(null);
    };
    window.addEventListener("keydown", onKey);
    const query = window.matchMedia("(max-width: 860px)");
    const apply = () => setNarrow(query.matches);
    apply();
    query.addEventListener("change", apply);
    return () => {
      window.removeEventListener("keydown", onKey);
      query.removeEventListener("change", apply);
    };
  }, []);

  return (
    <div className={split ? "app is-split" : "app"}>
      <div className="map-slot">
        <TripMap
          ref={mapRef}
          places={mapPlaces}
          routes={mapRoutes}
          drawToken={drawToken}
          drawRouteId={drawRouteId}
          initialCenter={seeded?.center ?? [24, 16]}
          initialZoom={seeded ? seeded.zoom : 1.4}
          onPlaceClick={onMapPlace}
          onReady={() => {
            if (framed.current || !seeded) return;
            framed.current = true;
            const coords = seededDays.flatMap((day) => day.route.coordinates);
            mapRef.current?.flyToBounds(coords, {
              duration: 0,
              pitch: 28,
              padding: window.matchMedia("(max-width: 860px)").matches ? 28 : { top: 54, right: 42, bottom: 54, left: 500 },
            });
          }}
        />
        {screen === "itinerary" ? <p className="map-hint">Click a day to fly its route</p> : null}
      </div>

      {screen === "setup" ? (
        <SetupScreen
          destination={destination}
          startDate={startDate}
          endDate={endDate}
          vibes={vibes}
          error={error}
          onDestination={setDestination}
          onStart={setStartDate}
          onEnd={setEndDate}
          onToggleVibe={toggleVibe}
          onDemo={applyDemo}
          onSubmit={() => void findPlaces()}
        />
      ) : null}

      {(screen === "flying" || screen === "building") && status ? (
        <div className="status" role="status">
          <span className="status-bar" />
          <p>{status}</p>
        </div>
      ) : null}

      {(screen === "discover" || screen === "building") && dayCount != null ? (
        <DiscoverScreen
          destination={matchDemo(destination)?.name ?? destination}
          startDate={startDate}
          endDate={endDate}
          dayCount={dayCount}
          vibes={vibes}
          places={places}
          selected={selected}
          demoSlug={demoSlug}
          busy={screen === "building"}
          error={error}
          onToggle={togglePlace}
          onBack={() => {
            setScreen("setup");
            setError(null);
          }}
          onBuild={() => void buildItinerary()}
        />
      ) : null}

      {screen === "itinerary" && dayCount != null ? (
        <ItineraryScreen
          destination={matchDemo(destination)?.name ?? destination}
          startDate={startDate}
          endDate={endDate}
          dayCount={dayCount}
          days={days}
          places={places}
          activeDay={activeDay}
          detailId={detailId}
          note={note}
          regenerating={regenerating}
          instructions={instructions}
          onInstructions={setInstructions}
          onDay={focusDay}
          onStop={openStop}
          onCloseDetail={() => setDetailId(null)}
          onBack={() => {
            setScreen("discover");
            setActiveDay(null);
            setDetailId(null);
            setDrawToken(0);
            setError(null);
          }}
          onRegenerate={() => void regenerate()}
        />
      ) : null}

      {screen === "itinerary" && error ? <p className="float-alert">{error}</p> : null}
    </div>
  );
}

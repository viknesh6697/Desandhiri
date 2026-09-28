"use client";

import { DEMO_TRIPS } from "@/lib/demo-trips";
import { VIBES, dayCountFromRange } from "@/lib/planner";
import type { VibeId } from "@/lib/types";

type Props = {
  destination: string;
  startDate: string;
  endDate: string;
  vibes: VibeId[];
  error: string | null;
  onDestination: (value: string) => void;
  onStart: (value: string) => void;
  onEnd: (value: string) => void;
  onToggleVibe: (vibe: VibeId) => void;
  onDemo: (slug: string) => void;
  onSubmit: () => void;
};

export default function SetupScreen({
  destination,
  startDate,
  endDate,
  vibes,
  error,
  onDestination,
  onStart,
  onEnd,
  onToggleVibe,
  onDemo,
  onSubmit,
}: Props) {
  const days = dayCountFromRange(startDate, endDate);
  const rangeInvalid = Boolean(startDate && endDate && days == null);

  return (
    <div className="setup">
      <form
        className="setup-card"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
      >
        <p className="eyebrow">Desandhiri</p>
        <h1>Where should we go?</h1>
        <p className="lede">
          A destination and a range of dates. The number of days comes from that range, then places are scored against the way you like to travel.
        </p>

        <label className="field">
          <span>Destination</span>
          <input
            value={destination}
            onChange={(event) => onDestination(event.target.value)}
            placeholder="Kashmir, Kochi, a city, a region"
            autoComplete="off"
          />
        </label>

        <div className="dates">
          <label className="field">
            <span>Arrive</span>
            <input type="date" value={startDate} onChange={(event) => onStart(event.target.value)} />
          </label>
          <label className="field">
            <span>Depart</span>
            <input type="date" value={endDate} onChange={(event) => onEnd(event.target.value)} />
          </label>
          <p className={`day-pill${rangeInvalid ? " is-bad" : ""}`} aria-live="polite">
            {days == null ? (rangeInvalid ? "Dates run backward" : "Days") : `${days} ${days === 1 ? "day" : "days"}`}
          </p>
        </div>

        <fieldset className="vibes">
          <legend>Vibe</legend>
          <div className="chips">
            {VIBES.map((vibe) => {
              const on = vibes.includes(vibe.id);
              return (
                <button
                  key={vibe.id}
                  type="button"
                  className={on ? "chip is-on" : "chip"}
                  aria-pressed={on}
                  onClick={() => onToggleVibe(vibe.id)}
                >
                  {vibe.label}
                </button>
              );
            })}
          </div>
        </fieldset>

        {error ? <p className="alert">{error}</p> : null}

        <button className="primary" type="submit">
          Find places
        </button>

        <div className="demo-block">
          <div className="demo-head">
            <p>Offline demos</p>
            <span>Skip Claude and live geocoding</span>
          </div>
          <div className="demos">
            {DEMO_TRIPS.map((trip) => {
              const on = destination.trim().toLowerCase() === trip.name.toLowerCase();
              return (
                <button
                  key={trip.slug}
                  type="button"
                  className={on ? "demo-card is-on" : "demo-card"}
                  onClick={() => onDemo(trip.slug)}
                >
                  <strong>{trip.name}</strong>
                  <span>{trip.blurb}</span>
                </button>
              );
            })}
          </div>
          <p className="fine">
            Or open a map directly:{" "}
            <a href="/demo/kashmir">Kashmir</a>, <a href="/demo/kerala">Kerala</a>, <a href="/demo/rajasthan">Rajasthan</a>.
          </p>
        </div>
      </form>
    </div>
  );
}

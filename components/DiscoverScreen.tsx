"use client";

import { motion } from "framer-motion";
import PlacePhoto from "./PlacePhoto";
import { formatRange, scorePlace } from "@/lib/planner";
import type { Place, VibeId } from "@/lib/types";

type Props = {
  destination: string;
  startDate: string;
  endDate: string;
  dayCount: number;
  vibes: VibeId[];
  places: Place[];
  selected: string[];
  demoSlug: string | null;
  busy: boolean;
  error: string | null;
  onToggle: (id: string) => void;
  onBack: () => void;
  onBuild: () => void;
};

export default function DiscoverScreen({
  destination,
  startDate,
  endDate,
  dayCount,
  vibes,
  places,
  selected,
  demoSlug,
  busy,
  error,
  onToggle,
  onBack,
  onBuild,
}: Props) {
  const count = selected.length;
  return (
    <aside className="panel">
      <header className="panel-head">
        <button type="button" className="text-btn" onClick={onBack}>
          Edit trip
        </button>
        <p className="eyebrow">Places</p>
        <h2>{destination}</h2>
        <p className="lede tight">
          {formatRange(startDate, endDate)} · {dayCount} {dayCount === 1 ? "day" : "days"}
          {demoSlug ? " · offline library" : ""}
        </p>
      </header>
      <div className="panel-scroll">
        {places.length === 0 ? <p className="alert">No places came back for this search.</p> : null}
        <ul className="card-list">
          {places.map((place, index) => {
            const on = selected.includes(place.id);
            const matched = scorePlace(place, vibes);
            return (
              <motion.li
                key={place.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(index, 8) * 0.04, duration: 0.35 }}
              >
                <button type="button" className={on ? "place-card is-on" : "place-card"} onClick={() => onToggle(place.id)} aria-pressed={on}>
                  <PlacePhoto place={place} />
                  <span className="place-copy">
                    <span className="place-name">
                      {place.name}
                      <i>{on ? "Kept" : "Skip"}</i>
                    </span>
                    <span className="tags">
                      {place.vibeTags.map((tag) => (
                        <em key={tag} className={vibes.includes(tag) ? "tag is-on" : "tag"}>
                          {tag}
                        </em>
                      ))}
                      {matched > 0 ? <em className="tag score">{matched} match</em> : null}
                    </span>
                    <span className="why">{place.why}</span>
                  </span>
                </button>
              </motion.li>
            );
          })}
        </ul>
      </div>
      <footer className="panel-foot">
        {error ? <p className="alert">{error}</p> : null}
        <button type="button" className="primary" disabled={count === 0 || busy} onClick={onBuild}>
          Build my itinerary
        </button>
        <p className="count">
          {count} {count === 1 ? "place" : "places"} · {dayCount} {dayCount === 1 ? "day" : "days"}
        </p>
      </footer>
    </aside>
  );
}

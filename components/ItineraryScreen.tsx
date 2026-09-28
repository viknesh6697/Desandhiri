"use client";

import { motion } from "framer-motion";
import DetailPanel from "./DetailPanel";
import { formatRange } from "@/lib/planner";
import type { DayPlan, Place } from "@/lib/types";

type Props = {
  destination: string;
  startDate: string;
  endDate: string;
  dayCount: number;
  days: DayPlan[];
  places: Place[];
  activeDay: number | null;
  detailId: string | null;
  note: string | null;
  regenerating: boolean;
  instructions: string;
  onInstructions: (value: string) => void;
  onDay: (day: number) => void;
  onStop: (id: string) => void;
  onCloseDetail: () => void;
  onBack: () => void;
  onRegenerate: () => void;
};

export default function ItineraryScreen({
  destination,
  startDate,
  endDate,
  dayCount,
  days,
  places,
  activeDay,
  detailId,
  note,
  regenerating,
  instructions,
  onInstructions,
  onDay,
  onStop,
  onCloseDetail,
  onBack,
  onRegenerate,
}: Props) {
  const byId = new Map(places.map((place) => [place.id, place]));
  const detail = places.find((place) => place.id === detailId) ?? null;
  const dates = startDate && endDate ? formatRange(startDate, endDate) : null;

  return (
    <aside className="panel">
      <header className="panel-head">
        <div className="head-row">
          <button type="button" className="text-btn" onClick={onBack}>
            Back to places
          </button>
          <button type="button" className="text-btn" onClick={onRegenerate} disabled={regenerating}>
            {regenerating ? "Regrouping…" : "Regenerate days"}
          </button>
        </div>
        <p className="eyebrow">Itinerary</p>
        <h2>{destination}</h2>
        <p className="lede tight">
          {dates ? `${dates} · ` : ""}
          {days.length} {days.length === 1 ? "day" : "days"} on the map
          {dayCount > days.length ? ` · dates span ${dayCount}` : ""}
        </p>
        {note ? <p className="fine">{note}</p> : null}
      </header>
      <div className="panel-scroll">
        <form
          className="plan-form"
          onSubmit={(event) => {
            event.preventDefault();
            onRegenerate();
          }}
        >
          <label htmlFor="plan-instructions">Add details for the plan</label>
          <textarea
            id="plan-instructions"
            value={instructions}
            onChange={(event) => onInstructions(event.target.value)}
            maxLength={600}
            rows={3}
            placeholder="Keep the lake on day 1, leave a slow morning, and put the shrine at sunset."
          />
          <button type="submit" className="primary" disabled={regenerating}>
            {regenerating ? "Regrouping…" : "Regenerate with these notes"}
          </button>
        </form>
        <ol className="day-list">
          {days.map((day, index) => {
            const active = activeDay === day.day;
            return (
              <motion.li
                key={`${day.day}-${day.placeIds.join("-")}`}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05, duration: 0.35 }}
              >
                <article className={active ? "day is-active" : "day"}>
                  <button type="button" className="day-hit" onClick={() => onDay(day.day)}>
                    <span className="kicker">Day {day.day}</span>
                    <strong>{day.title}</strong>
                    <span>{day.summary}</span>
                  </button>
                  <p className="route-line">
                    <span>Route</span>
                    {day.placeIds
                      .map((id) => byId.get(id)?.name)
                      .filter((name): name is string => Boolean(name))
                      .join(" → ")}
                  </p>
                  <ol>
                    {day.placeIds.map((id, stopIndex) => {
                      const place = byId.get(id);
                      if (!place) return null;
                      const open = detailId === id;
                      return (
                        <li key={id}>
                          <button
                            type="button"
                            className={open ? "stop is-open" : "stop"}
                            onClick={() => onStop(id)}
                          >
                            <span>{stopIndex + 1}</span>
                            <span>
                              <strong>{place.name}</strong>
                              <em>{place.timeToSpend}</em>
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ol>
                </article>
              </motion.li>
            );
          })}
        </ol>
      </div>
      <DetailPanel place={detail} onClose={onCloseDetail} />
    </aside>
  );
}

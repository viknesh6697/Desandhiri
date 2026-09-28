"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import PlacePhoto from "./PlacePhoto";
import type { Place } from "@/lib/types";

function useNarrow() {
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(max-width: 860px)");
    const apply = () => setNarrow(query.matches);
    apply();
    query.addEventListener("change", apply);
    return () => query.removeEventListener("change", apply);
  }, []);
  return narrow;
}

export default function DetailPanel({ place, onClose }: { place: Place | null; onClose: () => void }) {
  const narrow = useNarrow();
  return (
    <AnimatePresence>
      {place ? (
        <motion.aside
          key={place.id}
          className="detail"
          role="dialog"
          aria-label={place.name}
          initial={narrow ? { y: 48, opacity: 0 } : { x: 40, opacity: 0 }}
          animate={narrow ? { y: 0, opacity: 1 } : { x: 0, opacity: 1 }}
          exit={narrow ? { y: 36, opacity: 0 } : { x: 28, opacity: 0 }}
          transition={{ type: "spring", stiffness: 380, damping: 36 }}
        >
          <div className="detail-bar">
            <button type="button" className="text-btn" onClick={onClose}>
              Close
            </button>
            <p className="eyebrow">Stop</p>
          </div>
          <div className="detail-scroll">
            <PlacePhoto place={place} className="photo-hero" />
            {place.photos.length > 1 ? (
              <div className="photo-row">
                {place.photos.slice(1, 3).map((src) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={src} src={src} alt="" />
                ))}
              </div>
            ) : null}
            <h2>{place.name}</h2>
            <div className="tags">
              {place.vibeTags.map((tag) => (
                <em key={tag} className="tag is-on">
                  {tag}
                </em>
              ))}
            </div>
            <p className="why standout">{place.why}</p>
            <p className="body">{place.description}</p>
            <h3>While you are there</h3>
            <ul className="activities">
              {place.activities.map((activity) => (
                <li key={activity}>{activity}</li>
              ))}
            </ul>
            <dl className="meta-grid">
              <div>
                <dt>Time to spend</dt>
                <dd>{place.timeToSpend}</dd>
              </div>
              <div>
                <dt>Best time to visit</dt>
                <dd>{place.bestTimeToVisit}</dd>
              </div>
            </dl>
          </div>
        </motion.aside>
      ) : null}
    </AnimatePresence>
  );
}

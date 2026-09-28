"use client";

import { useState } from "react";
import type { Place } from "@/lib/types";

export default function PlacePhoto({ place, className = "" }: { place: Place; className?: string }) {
  const [broken, setBroken] = useState(0);
  const src = place.photos[broken];
  const hue = [...place.id].reduce((sum, char) => sum + char.charCodeAt(0), 0) % 36;
  return (
    <div
      className={`photo ${className}`.trim()}
      style={{
        background: `linear-gradient(150deg, hsl(${18 + hue} 52% 46%), hsl(${28 + hue} 32% 16%))`,
      }}
    >
      {src ? (
        // Remote travel photos are optional; a gradient remains if they fail.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" onError={() => setBroken((count) => count + 1)} />
      ) : (
        <span>{place.name}</span>
      )}
    </div>
  );
}

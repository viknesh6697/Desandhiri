"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import type { LngLat } from "@/lib/types";
import "mapbox-gl/dist/mapbox-gl.css";
import "maplibre-gl/dist/maplibre-gl.css";

export type MapPlace = {
  id: string;
  name: string;
  lng: number;
  lat: number;
  selected: boolean;
  dimmed: boolean;
  open: boolean;
  label: string;
  showName: boolean;
};

export type MapRoute = {
  id: string;
  coordinates: LngLat[];
  role: "quiet" | "focus" | "single";
};

export type FlyOptions = {
  duration?: number;
  pitch?: number;
  salt?: number;
  padding?: number | { top: number; right: number; bottom: number; left: number };
};

export type TripMapHandle = {
  flyToRegion: (center: LngLat, zoom: number, onDone?: () => void) => void;
  flyToBounds: (coordinates: LngLat[], options?: FlyOptions, onDone?: () => void) => void;
  flyToPoint: (center: LngLat) => void;
  resize: () => void;
};

type Props = {
  places: MapPlace[];
  routes: MapRoute[];
  drawToken: number;
  drawRouteId: string | null;
  initialCenter: LngLat;
  initialZoom: number;
  onPlaceClick: (id: string) => void;
  onReady?: () => void;
};

type MapLike = {
  on: (event: string, handler: () => void) => void;
  once: (event: string, handler: () => void) => void;
  off: (event: string, handler: () => void) => void;
  flyTo: (options: Record<string, unknown>) => void;
  resize: () => void;
  remove: () => void;
  addSource: (id: string, source: unknown) => void;
  addLayer: (layer: unknown) => void;
  getSource: (id: string) => { setData: (data: unknown) => void } | undefined;
  addControl: (control: unknown, position?: string) => void;
  cameraForBounds: (bounds: unknown, options?: unknown) => { center: LngLat; zoom: number } | null | undefined;
  setProjection?: (projection: unknown) => void;
  setFog?: (fog: unknown) => void;
  getZoom: () => number;
  loaded: () => boolean;
};

type MarkerLike = {
  setLngLat: (lngLat: LngLat) => MarkerLike;
  addTo: (map: MapLike) => MarkerLike;
  remove: () => void;
};

type GLNS = {
  Map: new (options: Record<string, unknown>) => MapLike;
  Marker: new (options: { element: HTMLElement; anchor: string }) => MarkerLike;
  LngLatBounds: new () => { extend: (lngLat: LngLat) => void };
  NavigationControl: new (options?: Record<string, unknown>) => unknown;
  accessToken?: string;
};

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function routeCollection(routes: MapRoute[], drawRouteId: string | null, revealed: number) {
  return {
    type: "FeatureCollection",
    features: routes
      .filter((route) => route.coordinates.length > 0)
      .map((route) => {
        const drawing = route.id === drawRouteId && revealed < route.coordinates.length;
        const coordinates = drawing ? route.coordinates.slice(0, Math.max(2, revealed)) : route.coordinates;
        return {
          type: "Feature",
          properties: { role: route.role, id: route.id },
          geometry: { type: "LineString", coordinates },
        };
      }),
  };
}

const TripMap = forwardRef<TripMapHandle, Props>(function TripMap(
  { places, routes, drawToken, drawRouteId, initialCenter, initialZoom, onPlaceClick, onReady },
  ref,
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLike | null>(null);
  const glRef = useRef<GLNS | null>(null);
  const readyRef = useRef(false);
  const queueRef = useRef<Array<() => void>>([]);
  const markersRef = useRef(new Map<string, { marker: MarkerLike; el: HTMLButtonElement }>());
  const onClickRef = useRef(onPlaceClick);
  const onReadyRef = useRef(onReady);
  const routesRef = useRef(routes);
  const drawIdRef = useRef(drawRouteId);
  const revealedRef = useRef(10_000);
  const rafRef = useRef(0);
  const [mapReady, setMapReady] = useState(false);
  onClickRef.current = onPlaceClick;
  onReadyRef.current = onReady;
  routesRef.current = routes;
  drawIdRef.current = drawRouteId;

  const paint = () => {
    const source = mapRef.current?.getSource("routes");
    source?.setData(routeCollection(routesRef.current, drawIdRef.current, revealedRef.current));
  };

  const whenReady = (fn: () => void) => {
    if (readyRef.current && mapRef.current) fn();
    else queueRef.current.push(fn);
  };

  useImperativeHandle(ref, () => ({
    resize() {
      mapRef.current?.resize();
    },
    flyToRegion(center, zoom, onDone) {
      let started = false;
      whenReady(() => {
        started = true;
        const map = mapRef.current;
        if (!map) {
          onDone?.();
          return;
        }
        let settled = false;
        const finish = () => {
          if (settled) return;
          settled = true;
          onDone?.();
        };
        const duration = prefersReducedMotion() ? 0 : 4600;
        map.once("moveend", finish);
        map.flyTo({
          center,
          zoom,
          bearing: -20,
          pitch: 46,
          duration,
          curve: 1.75,
          essential: true,
        });
        window.setTimeout(finish, duration + 700);
      });
      window.setTimeout(() => {
        if (!started) onDone?.();
      }, 8000);
    },
    flyToBounds(coordinates, options, onDone) {
      let started = false;
      whenReady(() => {
        started = true;
        const map = mapRef.current;
        const gl = glRef.current;
        if (!map || !gl || coordinates.length === 0) {
          onDone?.();
          return;
        }
        const bounds = new gl.LngLatBounds();
        coordinates.forEach((point) => bounds.extend(point));
        const padding = options?.padding ?? 72;
        const camera = map.cameraForBounds(bounds, { padding });
        const duration = options?.duration ?? (prefersReducedMotion() ? 0 : 2500);
        const salt = options?.salt ?? 1;
        let settled = false;
        const finish = () => {
          if (settled) return;
          settled = true;
          onDone?.();
        };
        if (!camera) {
          finish();
          return;
        }
        map.once("moveend", finish);
        map.flyTo({
          center: camera.center,
          zoom: Math.min((camera.zoom ?? 10) - 0.15, 13.4),
          bearing: (salt % 5) * 16 - 28,
          pitch: options?.pitch ?? 48,
          duration,
          curve: duration > 3000 ? 1.7 : 1.25,
          essential: true,
        });
        window.setTimeout(finish, duration + 700);
      });
      window.setTimeout(() => {
        if (!started) onDone?.();
      }, 8000);
    },
    flyToPoint(center) {
      whenReady(() => {
        const map = mapRef.current;
        if (!map) return;
        map.flyTo({
          center,
          zoom: Math.max(map.getZoom(), 12.2),
          pitch: 52,
          duration: prefersReducedMotion() ? 0 : 1500,
          essential: true,
        });
      });
    },
  }));

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container.style.position = "absolute";
    container.style.inset = "0";
    container.style.width = "100%";
    container.style.height = "100%";
    let dead = false;
    let map: MapLike | null = null;

    const boot = async () => {
      const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN?.trim();
      let gl: GLNS;
      let style: string;
      if (token) {
        const mod = await import("mapbox-gl");
        gl = mod.default as unknown as GLNS;
        gl.accessToken = token;
        style = "mapbox://styles/mapbox/satellite-streets-v12";
      } else {
        const mod = await import("maplibre-gl");
        gl = mod.default as unknown as GLNS;
        style = "https://tiles.openfreemap.org/styles/liberty";
      }
      if (dead) return;
      glRef.current = gl;
      map = new gl.Map({
        container,
        style,
        center: initialCenter,
        zoom: initialZoom,
        pitch: initialZoom < 3 ? 0 : 30,
        bearing: initialZoom < 3 ? 0 : -12,
        projection: "globe",
        attributionControl: true,
        fadeDuration: 0,
      });
      mapRef.current = map;
      map.addControl(new gl.NavigationControl({ showCompass: true, visualizePitch: true }), "bottom-right");
      map.on("load", () => {
        if (dead || !map) return;
        try {
          map.setProjection?.({ type: "globe" });
        } catch {
          /* mercator still flies */
        }
        if (token) {
          map.setFog?.({
            color: "rgb(214, 226, 236)",
            "high-color": "rgb(92, 140, 196)",
            "horizon-blend": 0.08,
            "space-color": "rgb(9, 12, 28)",
            "star-intensity": 0.45,
          });
        }
        map.addSource("routes", {
          type: "geojson",
          data: routeCollection(routesRef.current, drawIdRef.current, revealedRef.current),
        });
        map.addLayer({
          id: "route-casing",
          type: "line",
          source: "routes",
          layout: { "line-cap": "round", "line-join": "round" },
          paint: {
            "line-color": "#1a1714",
            "line-width": ["match", ["get", "role"], "focus", 7.5, "quiet", 3.5, 5],
            "line-opacity": ["match", ["get", "role"], "focus", 0.85, "quiet", 0.2, 0.45],
          },
        });
        map.addLayer({
          id: "route-core",
          type: "line",
          source: "routes",
          layout: { "line-cap": "round", "line-join": "round" },
          paint: {
            "line-color": ["match", ["get", "role"], "focus", "#e36a3a", "quiet", "#5c564e", "#c4512c"],
            "line-width": ["match", ["get", "role"], "focus", 3.6, "quiet", 1.8, 2.6],
            "line-opacity": ["match", ["get", "role"], "focus", 1, "quiet", 0.35, 0.92],
          },
        });
        readyRef.current = true;
        paint();
        const queued = queueRef.current.splice(0);
        queued.forEach((fn) => fn());
        setMapReady(true);
        onReadyRef.current?.();
      });
    };

    void boot();
    const observer = new ResizeObserver(() => mapRef.current?.resize());
    observer.observe(container);
    return () => {
      dead = true;
      readyRef.current = false;
      setMapReady(false);
      cancelAnimationFrame(rafRef.current);
      observer.disconnect();
      markersRef.current.forEach((entry) => entry.marker.remove());
      markersRef.current.clear();
      map?.remove();
      mapRef.current = null;
    };
    // The map is created once. Later camera moves go through the imperative handle.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const gl = glRef.current;
    if (!map || !gl || !mapReady) return;
    const live = new Set(places.map((place) => place.id));
    for (const [id, entry] of markersRef.current) {
      if (!live.has(id)) {
        entry.marker.remove();
        markersRef.current.delete(id);
      }
    }
    for (const place of places) {
      let entry = markersRef.current.get(place.id);
      if (!entry) {
        const el = document.createElement("button");
        el.type = "button";
        el.className = "pin";
        el.addEventListener("click", (event) => {
          event.preventDefault();
          event.stopPropagation();
          onClickRef.current(el.dataset.id || "");
        });
        const marker = new gl.Marker({ element: el, anchor: "center" })
          .setLngLat([place.lng, place.lat])
          .addTo(map);
        entry = { marker, el };
        markersRef.current.set(place.id, entry);
      }
      entry.el.dataset.id = place.id;
      entry.marker.setLngLat([place.lng, place.lat]);
      entry.el.classList.add("pin");
      entry.el.classList.toggle("is-selected", place.selected);
      entry.el.classList.toggle("is-dim", place.dimmed);
      entry.el.classList.toggle("is-open", place.open);
      entry.el.replaceChildren();
      if (place.showName) {
        const index = document.createElement("span");
        index.className = "pin-index";
        index.textContent = place.label;
        const name = document.createElement("span");
        name.className = "pin-name";
        name.textContent = place.name;
        entry.el.append(index, name);
      } else {
        entry.el.textContent = place.label;
      }
      entry.el.setAttribute("aria-label", place.name);
      entry.el.title = place.name;
    }
  }, [places, mapReady]);

  const routeSignature = routes.map((route) => `${route.id}:${route.role}:${route.coordinates.length}`).join("|");

  useEffect(() => {
    routesRef.current = routes;
    drawIdRef.current = drawRouteId;
    cancelAnimationFrame(rafRef.current);
    const target = routes.find((route) => route.id === drawRouteId);
    if (!drawRouteId || !target || target.coordinates.length < 2) {
      revealedRef.current = 10_000;
      paint();
      return;
    }
    if (prefersReducedMotion()) {
      revealedRef.current = target.coordinates.length;
      paint();
      return;
    }
    revealedRef.current = 2;
    const total = target.coordinates.length;
    const step = () => {
      const chunk = Math.max(1, Math.ceil(total / 42));
      revealedRef.current = Math.min(total, revealedRef.current + chunk);
      paint();
      if (revealedRef.current < total) rafRef.current = requestAnimationFrame(step);
    };
    paint();
    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
    // drawToken retriggers the stroke even when the same day is chosen again.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeSignature, drawToken, drawRouteId, mapReady]);

  return (
    <>
      <div ref={containerRef} className="trip-map" />
      {mapReady ? null : (
        <p className="map-wait" role="status">
          Loading the globe…
        </p>
      )}
    </>
  );
});

export default TripMap;

/**
 * Fills lib/demo-geo.json with Wikipedia photos and road legs.
 * Safe to re-run. Keeps a fallback coordinate if geocoding drifts.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const geoPath = join(root, "lib", "demo-geo.json");
const geo = JSON.parse(readFileSync(geoPath, "utf8"));

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function haversine(a, b) {
  const R = 6371;
  const dLat = ((b[1] - a[1]) * Math.PI) / 180;
  const dLng = ((b[0] - a[0]) * Math.PI) / 180;
  const lat1 = (a[1] * Math.PI) / 180;
  const lat2 = (b[1] * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

function pathKm(coords) {
  let km = 0;
  for (let i = 1; i < coords.length; i++) km += haversine(coords[i - 1], coords[i]);
  return km;
}

function arc(a, b) {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const d = Math.hypot(dx, dy) || 1;
  const bow = Math.min(0.09, Math.max(0.004, d * 0.14));
  const cx = (a[0] + b[0]) / 2 + (-dy / d) * bow;
  const cy = (a[1] + b[1]) / 2 + (dx / d) * bow;
  const steps = Math.max(10, Math.min(56, Math.round(d * 48)));
  const pts = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const omt = 1 - t;
    pts.push([
      Math.round((omt * omt * a[0] + 2 * omt * t * cx + t * t * b[0]) * 1e6) / 1e6,
      Math.round((omt * omt * a[1] + 2 * omt * t * cy + t * t * b[1]) * 1e6) / 1e6,
    ]);
  }
  return pts;
}

function simplify(points, eps) {
  if (points.length < 3) return points;
  let max = 0;
  let idx = 0;
  const a = points[0];
  const b = points[points.length - 1];
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  for (let i = 1; i < points.length - 1; i++) {
    const p = points[i];
    let dist;
    if (dx === 0 && dy === 0) dist = Math.hypot(p[0] - a[0], p[1] - a[1]);
    else {
      const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / (dx * dx + dy * dy)));
      dist = Math.hypot(p[0] - (a[0] + t * dx), p[1] - (a[1] + t * dy));
    }
    if (dist > max) {
      max = dist;
      idx = i;
    }
  }
  if (max > eps) {
    const left = simplify(points.slice(0, idx + 1), eps);
    const right = simplify(points.slice(idx), eps);
    return left.slice(0, -1).concat(right);
  }
  return [a, b];
}

async function nominatim(query) {
  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(query)}`;
  const res = await fetch(url, {
    headers: { "User-Agent": "DesandhiriTripPlanner/1.0 (demo cache; local pitch)" },
  });
  if (!res.ok) return null;
  const data = await res.json();
  if (!data[0]) return null;
  return {
    lat: Number(data[0].lat),
    lng: Number(data[0].lon),
    name: data[0].display_name,
  };
}

function biggerThumb(url) {
  if (!url) return null;
  return url.replace(/\/\d+px-/, "/960px-");
}

async function wikiPhotos(title) {
  const url =
    "https://en.wikipedia.org/w/api.php?action=query&prop=pageimages|images&format=json&piprop=thumbnail|original&pithumbsize=1200&titles=" +
    encodeURIComponent(title);
  const res = await fetch(url, {
    headers: { "User-Agent": "DesandhiriTripPlanner/1.0 (demo cache; local pitch)" },
  });
  if (!res.ok) return [];
  const data = await res.json();
  const pages = Object.values(data.query?.pages ?? {});
  const photos = [];
  for (const page of pages) {
    const thumb = biggerThumb(page.thumbnail?.source) || page.original?.source;
    if (thumb) photos.push(thumb);
  }
  const titles = (pages[0]?.images ?? [])
    .map((img) => img.title)
    .filter((t) => /\.(jpe?g|png|webp)$/i.test(t))
    .filter((t) => !/map|logo|icon|flag|locator|svg/i.test(t))
    .slice(0, 4);
  for (const imageTitle of titles) {
    if (photos.length >= 3) break;
    await sleep(250);
    const infoUrl =
      "https://en.wikipedia.org/w/api.php?action=query&format=json&prop=imageinfo&iiprop=url&iiurlwidth=1200&titles=" +
      encodeURIComponent(imageTitle);
    const infoRes = await fetch(infoUrl, {
      headers: { "User-Agent": "DesandhiriTripPlanner/1.0 (demo cache; local pitch)" },
    });
    if (!infoRes.ok) continue;
    const info = await infoRes.json();
    const page = Object.values(info.query?.pages ?? {})[0];
    const src = page?.imageinfo?.[0]?.thumburl || page?.imageinfo?.[0]?.url;
    if (src && !photos.includes(src)) photos.push(src);
  }
  return photos.slice(0, 3);
}

async function osrm(a, b) {
  const path = `${a[0]},${a[1]};${b[0]},${b[1]}`;
  for (const profile of ["driving", "foot"]) {
    const url = `https://router.project-osrm.org/route/v1/${profile}/${path}?overview=full&geometries=geojson`;
    try {
      const res = await fetch(url);
      if (!res.ok) continue;
      const data = await res.json();
      const coords = data.routes?.[0]?.geometry?.coordinates;
      if (data.code === "Ok" && coords?.length >= 2) return coords;
    } catch {
      /* try the other profile */
    }
  }
  return null;
}

const entries = Object.entries(geo.places);
for (const [id, place] of entries) {
  if (place.q) {
    try {
      const hit = await nominatim(place.q);
      if (hit) {
        const driftLng = Math.abs(hit.lng - place.lng);
        const driftLat = Math.abs(hit.lat - place.lat);
        const expected = (place.expect ?? "").toLowerCase();
        const namedOk = !expected || hit.name.toLowerCase().includes(expected);
        if (namedOk && driftLng < 0.45 && driftLat < 0.45) {
          place.lng = Math.round(hit.lng * 1e6) / 1e6;
          place.lat = Math.round(hit.lat * 1e6) / 1e6;
          place.resolved = hit.name;
          console.log("coord", id, place.lng, place.lat);
        } else {
          console.log("keep", id, hit.name);
        }
      } else {
        console.log("miss", id);
      }
    } catch (error) {
      console.log("coord-err", id, error.message);
    }
    await sleep(1100);
  }
  if (place.wiki) {
    try {
      const photos = await wikiPhotos(place.wiki);
      if (photos.length) {
        place.photos = photos;
        console.log("photos", id, photos.length);
      }
    } catch (error) {
      console.log("wiki-err", id, error.message);
    }
    await sleep(400);
  }
}

geo.legs = geo.legs ?? {};
for (const ids of Object.values(geo.order)) {
  for (let i = 0; i < ids.length - 1; i++) {
    const aId = ids[i];
    const bId = ids[i + 1];
    const key = `${aId}>${bId}`;
    const a = geo.places[aId];
    const b = geo.places[bId];
    const straight = [a.lng, a.lat];
    const end = [b.lng, b.lat];
    const road = await osrm(straight, end);
    const straightKm = haversine(straight, end);
    if (road && pathKm(road) < Math.max(8, straightKm * 2.6)) {
      let simplified = simplify(road, 0.0012);
      if (simplified.length > 160) simplified = simplify(road, 0.0025);
      geo.legs[key] = simplified.map(([lng, lat]) => [
        Math.round(lng * 1e5) / 1e5,
        Math.round(lat * 1e5) / 1e5,
      ]);
      console.log("road", key, geo.legs[key].length);
    } else {
      geo.legs[key] = arc(straight, end);
      console.log("arc", key, road ? "detour" : "no-route");
    }
    await sleep(200);
  }
}

writeFileSync(geoPath, JSON.stringify(geo, null, 2));
console.log("wrote", geoPath);

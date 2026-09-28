# Desandhiri

A trip planner that starts from a destination and a way of traveling, then puts the days on a map. Pick dates and vibes, watch the globe fly into the region, choose the places that fit, and get a day-wise route that stays in one area instead of zigzagging across it.

![Kerala demo: setup, place discovery, and a day-wise route on the map](kerala-demo.gif)

## What it changes

Most travel products still hand you a search box and a list. You collect hotels, sights, and blog posts, then you are the one who has to decide that Fort Kochi is a morning and Munnar is a different day. The map, when there is one, is a pin dump.

Desandhiri treats the map as the plan.

- **The trip is a feeling, not a form.** Destination, a date range, and vibe chips (solo, spiritual, scenic, hiking, cultural, and others). The number of days is the span of those dates, so the form cannot disagree with itself.
- **Places arrive already argued for.** Claude suggests a short list scored against the vibes you chose, each with a one-line why, a description, activities, how long to stay, and when to go. You keep or drop them on the map. Selected markers change color.
- **Days follow the ground.** The selected places are clustered by geography, so a day is a neighborhood or a valley, not a tour that crosses the region twice. Click a day and the camera flies to that leg while the route draws. Click a stop and the detail panel opens from content that was written with the place, not fetched on the click.
- **Coordinates come from the map, not the model.** Place names are geocoded with Mapbox. The model never supplies the pin.
- **You can still steer it.** On the itinerary, a note such as “keep the lake on day 1” is sent back as the prompt for a new grouping. There is no drag-and-drop editor. Regeneration is the edit.

For a travel platform, that is a different job than search. The product can sell a shaped journey — a few honest places, a route you can see, and a reason for each stop — instead of an infinite catalog the traveler has to finish themselves.

## Try it without keys

Kashmir, Kerala, and Rajasthan are bundled: places, coordinates, day clusters, and road geometries. They never call Claude or live geocoding. Type the name on the setup screen, or open a demo directly:

- [http://localhost:3000/demo/kashmir](http://localhost:3000/demo/kashmir)
- [http://localhost:3000/demo/kerala](http://localhost:3000/demo/kerala)
- [http://localhost:3000/demo/rajasthan](http://localhost:3000/demo/rajasthan)

Any other destination uses the live path: Claude writes the places and the day grouping, Mapbox geocodes the names and fetches a route per day.

## Setup

Node.js 22 or newer.

```bash
npm install
cp .env.example .env
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Demo destinations work with an empty `.env`. The map uses a free globe style until a Mapbox token is set.

| Variable | Required | Used for |
| --- | --- | --- |
| `ANTHROPIC_API_KEY` | Custom destinations | Place discovery and day clustering. Server only. |
| `ANTHROPIC_MODEL` | No | Defaults to `claude-sonnet-4-5`. |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | No | Satellite globe, `flyTo`, and markers in the browser. |
| `MAPBOX_TOKEN` | Custom destinations | Geocoding and directions. Falls back to the public token. |

Copy the names from `.env.example`. Do not commit `.env`.

## Docker

The image is a production build (`next start` via the standalone server). Demo trips are inside the image. Pass secrets when you run the container, not by copying `.env` into the build.

`NEXT_PUBLIC_MAPBOX_TOKEN` is compiled into the browser bundle, so it has to be present at build time. `ANTHROPIC_API_KEY`, `MAPBOX_TOKEN`, and `ANTHROPIC_MODEL` are read when the server handles a request.

```bash
docker build -t desandhiri --build-arg NEXT_PUBLIC_MAPBOX_TOKEN=pk.your_token .

docker run --rm -p 3000:3000 \
  -e ANTHROPIC_API_KEY=sk-ant-your-key \
  -e MAPBOX_TOKEN=pk.your_token \
  -e ANTHROPIC_MODEL=claude-sonnet-4-5 \
  desandhiri
```

Omit the build arg and the `-e` flags if you only need the three offline demos. Then open [http://localhost:3000](http://localhost:3000).

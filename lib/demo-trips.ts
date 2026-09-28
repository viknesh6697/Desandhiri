import geoFile from "./demo-geo.json";
import type { LngLat, Place, VibeId } from "./types";

type GeoFile = {
  places: Record<string, { lng: number; lat: number; photos?: string[] }>;
  order: Record<string, string[]>;
  legs: Record<string, LngLat[]>;
};

const geo = geoFile as unknown as GeoFile;

export type DemoRegion = {
  id: string;
  title: string;
  summary: string;
};

export type DemoTrip = {
  slug: string;
  name: string;
  blurb: string;
  aliases: string[];
  center: LngLat;
  zoom: number;
  regions: DemoRegion[];
  places: Place[];
  legs: Record<string, LngLat[]>;
};

type Seed = {
  id: string;
  name: string;
  regionId: string;
  vibeTags: VibeId[];
  why: string;
  description: string;
  activities: string[];
  timeToSpend: string;
  bestTimeToVisit: string;
};

function materialize(seeds: Seed[]): Place[] {
  return seeds.map((seed, index) => {
    const point = geo.places[seed.id];
    if (!point) throw new Error(`Missing coordinates for ${seed.id}`);
    return {
      ...seed,
      visitOrder: index,
      lng: point.lng,
      lat: point.lat,
      photos: point.photos ?? [],
    };
  });
}

const kashmirPlaces = materialize([
  {
    id: "dal",
    name: "Dal Lake",
    regionId: "srinagar",
    vibeTags: ["scenic", "slow", "solo"],
    why: "The city arranges itself around this water, and a shikara hour is the easiest way to see it.",
    description:
      "Hire a shikara from Dal Gate and let the boatman take the inner channels rather than the open lake. Houseboats, floating gardens, and the boulevard all read more clearly from the water than from the road.",
    activities: ["Shikara through the inner channels", "Walk the boulevard at dusk", "Tea on a houseboat verandah"],
    timeToSpend: "2–3 hours",
    bestTimeToVisit: "Early morning, before the day boats crowd the ghat",
  },
  {
    id: "hazratbal",
    name: "Hazratbal Shrine",
    regionId: "srinagar",
    vibeTags: ["spiritual", "cultural"],
    why: "A working shrine on the lake’s north shore, calmer than the boulevard and central to Srinagar’s religious life.",
    description:
      "The white marble dome sits directly on the water. Fridays draw the largest congregation; other mornings you can walk the courtyard and the lakeside path without being hurried.",
    activities: ["Courtyard and dome from the lakeside path", "Walk the north shore back toward the gardens"],
    timeToSpend: "45–75 minutes",
    bestTimeToVisit: "Morning, outside Friday prayer",
  },
  {
    id: "shankaracharya",
    name: "Shankaracharya Temple",
    regionId: "srinagar",
    vibeTags: ["spiritual", "scenic", "hiking"],
    why: "A short climb above the city, with the whole lake laid out below the shrine.",
    description:
      "The temple sits on the Takht-i-Sulaiman hill. The stepped path is the point: Srinagar, Dal Lake, and the Zabarwan ridge come into view in that order.",
    activities: ["Climb the hill path", "Look back over Dal Lake from the terrace"],
    timeToSpend: "1–1.5 hours",
    bestTimeToVisit: "Late afternoon, when the stone has cooled",
  },
  {
    id: "nishat",
    name: "Nishat Bagh",
    regionId: "srinagar",
    vibeTags: ["scenic", "cultural", "slow"],
    why: "Terraced Mughal water channels aimed straight at the lake — the scenic stop that is also a history lesson.",
    description:
      "Twelve terraces step down toward Dal Lake, each with a channel and a view. Go past the first lawn; the upper terraces are quieter and the sightline to the water is cleaner.",
    activities: ["Walk the terraces from the lake upward", "Sit on an upper lawn facing the water"],
    timeToSpend: "1–1.5 hours",
    bestTimeToVisit: "Morning, before tour coaches fill the lower gates",
  },
  {
    id: "gondola",
    name: "Gulmarg Gondola",
    regionId: "gulmarg",
    vibeTags: ["scenic", "hiking"],
    why: "The ride out of the meadow is the simplest high-country hour in the valley.",
    description:
      "Phase 1 lifts you from the Gulmarg bowl toward Kongdori. Buy the ticket early in season; even a single stage is enough if the weather is sitting on the ridge.",
    activities: ["Ride Phase 1 to Kongdori", "Walk the meadow at the top if the cloud lifts"],
    timeToSpend: "2–3 hours",
    bestTimeToVisit: "First gondola of the morning",
  },
  {
    id: "stmary",
    name: "St. Mary's Church",
    regionId: "gulmarg",
    vibeTags: ["cultural", "educational", "scenic"],
    why: "A small wooden church in the meadow, a quiet counterweight to the gondola queues.",
    description:
      "Built in the early twentieth century for the British summer station, the church sits among firs just off the main green. It takes little time and explains the hill station better than the shops do.",
    activities: ["Walk the green around the church", "Read the hillside as a former summer station"],
    timeToSpend: "30–45 minutes",
    bestTimeToVisit: "Midday, between gondola rides",
  },
  {
    id: "khilanmarg",
    name: "Khilanmarg",
    regionId: "gulmarg",
    vibeTags: ["hiking", "scenic", "solo"],
    why: "The meadow above the gondola, with the valley on one side and peaks on the other.",
    description:
      "From the Phase 1 station, the path onto Khilanmarg is a walk, not a trek, in clear weather. Turn around often: the Gulmarg bowl drops away behind you.",
    activities: ["Walk out onto the meadow", "Pick out the valley road you drove in on"],
    timeToSpend: "1.5–2 hours",
    bestTimeToVisit: "Late morning, once the cloud has a chance to lift",
  },
  {
    id: "pahalgam",
    name: "Pahalgam",
    regionId: "pahalgam",
    vibeTags: ["scenic", "slow", "hiking"],
    why: "The Lidder runs through town, and every trail day starts from this bend in the river.",
    description:
      "Stay long enough to walk the river path rather than only the taxi stand. The town is the hinge between Betaab to the east and Aru up the side valley.",
    activities: ["Walk the Lidder bank", "Sort the next valley from town before you drive it"],
    timeToSpend: "1.5–2 hours",
    bestTimeToVisit: "Late afternoon, when the day-trippers leave",
  },
  {
    id: "betaab",
    name: "Betaab Valley",
    regionId: "pahalgam",
    vibeTags: ["scenic", "hiking"],
    why: "A wide green floor under steep slopes, an easy scenic walk from the Pahalgam road.",
    description:
      "The valley opens suddenly after a short drive east of town. Most people stop at the first meadow; walking ten minutes farther up the stream gets you out of the parking lot.",
    activities: ["Walk upstream from the car park", "Photograph the valley walls, not only the meadow"],
    timeToSpend: "1.5–2 hours",
    bestTimeToVisit: "Morning, before the meadow fills",
  },
  {
    id: "aru",
    name: "Aru Valley",
    regionId: "pahalgam",
    vibeTags: ["hiking", "scenic", "solo"],
    why: "Higher and quieter than Betaab, and the trailhead if you want to keep walking.",
    description:
      "Aru is a village at the end of a side road, with the Lidder still young beside it. Shepherds’ paths continue toward the lakes; even an hour above the village changes the scale.",
    activities: ["Walk above the village", "Follow the river path back down to the road"],
    timeToSpend: "2–3 hours",
    bestTimeToVisit: "Morning to early afternoon",
  },
  {
    id: "sonamarg",
    name: "Sonamarg",
    regionId: "sonamarg",
    vibeTags: ["scenic", "hiking"],
    why: "The last broad meadow before the Zoji La, and a destination in its own right.",
    description:
      "The Sindh runs through a pale valley floor with peaks close on both sides. The drive from Srinagar is the long part; once you are here, the meadow itself is an easy wander.",
    activities: ["Walk the meadow beside the Sindh", "Watch the road toward the pass without committing to it"],
    timeToSpend: "2 hours",
    bestTimeToVisit: "Late morning, after the night mist has left the valley",
  },
  {
    id: "thajiwas",
    name: "Thajiwas Glacier",
    regionId: "sonamarg",
    vibeTags: ["hiking", "scenic", "educational"],
    why: "A short pony or foot trail from the meadow to the snout of a glacier you can actually stand near.",
    description:
      "Thajiwas sits in a side valley just south of the bazaar. The path is popular and still short enough to pair with the meadow on the same day. In early summer the snowfield comes down to meet the trail.",
    activities: ["Walk or ride to the glacier viewpoint", "Turn back before the ice if the path is soft"],
    timeToSpend: "2–3 hours",
    bestTimeToVisit: "Morning, while the trail is firm",
  },
]);

const keralaPlaces = materialize([
  {
    id: "nets",
    name: "Chinese fishing nets",
    regionId: "kochi",
    vibeTags: ["scenic", "cultural", "slow"],
    why: "The harbour’s working cantilever nets, best seen when a crew actually hauls one.",
    description:
      "The nets along the Fort Kochi shore are still operated by hand. Stay for a lift rather than a photograph from the moving car; the counterweight stones and the crew’s timing are the whole story.",
    activities: ["Watch a net being raised", "Walk the jetty toward the Chinese-net beach"],
    timeToSpend: "45–60 minutes",
    bestTimeToVisit: "Late afternoon, when boats come in",
  },
  {
    id: "synagogue",
    name: "Paradesi Synagogue",
    regionId: "kochi",
    vibeTags: ["cultural", "educational", "spiritual"],
    why: "A 16th-century synagogue in Jew Town, still the clearest window onto Kochi’s Jewish history.",
    description:
      "Hand-painted Chinese floor tiles, Belgian chandeliers, and a street of spice warehouses outside the door. Read the clocks in the courtyard — they are set to different cities on purpose.",
    activities: ["See the tiled floor and the copper plates", "Walk Jew Town’s warehouse street"],
    timeToSpend: "45–60 minutes",
    bestTimeToVisit: "Morning, soon after opening",
  },
  {
    id: "palace-kochi",
    name: "Mattancherry Palace",
    regionId: "kochi",
    vibeTags: ["cultural", "educational"],
    why: "Murals of the Ramayana in a palace the Portuguese built and the rajas actually used.",
    description:
      "The upper rooms hold Kerala’s densest mural cycle: dense, unrestored in places, and better seen slowly. The palace is small. Give the murals the time instead of rushing the courtyard.",
    activities: ["Trace the Ramayana murals upstairs", "Compare the palace with the street plan outside"],
    timeToSpend: "1 hour",
    bestTimeToVisit: "Late morning, before the midday tour groups",
  },
  {
    id: "munnar",
    name: "Munnar town",
    regionId: "munnar",
    vibeTags: ["scenic", "slow", "culinary"],
    why: "The tea-town crossroads, where the hills, the market, and the day’s drives all meet.",
    description:
      "Munnar proper is a small grid in a bowl of estates. Use it to eat, to look up the valley from the old town bridge, and to decide which ridge road is clear.",
    activities: ["Walk the old town and the river bridge", "Drink tea that was grown on the slope you can see"],
    timeToSpend: "1–1.5 hours",
    bestTimeToVisit: "Late afternoon, once you are back from the ridges",
  },
  {
    id: "tea-museum",
    name: "KDHP Tea Museum",
    regionId: "munnar",
    vibeTags: ["educational", "culinary", "cultural"],
    why: "The working story of the estates: rollers, fermenting floors, and a cup at the end.",
    description:
      "The museum sits in an old factory above town and explains how a hillside becomes a blend. The machines are the point; the tasting at the end tells you what you were looking at.",
    activities: ["Follow the factory floor from withering to packing", "Taste two grades side by side"],
    timeToSpend: "1–1.5 hours",
    bestTimeToVisit: "Morning, with the factory light",
  },
  {
    id: "eravikulam",
    name: "Eravikulam National Park",
    regionId: "munnar",
    vibeTags: ["wildlife", "hiking", "scenic"],
    why: "Nilgiri tahr on an open high grassland, a short walk from the Rajamala gate.",
    description:
      "Visitors walk a paved path through the Rajamala side of the park. Tahr graze close to the trail in season. The Anamudi massif fills the skyline; this is the wildlife stop that does not require a jeep safari.",
    activities: ["Walk the Rajamala path", "Watch the slopes for tahr rather than only the viewpoint"],
    timeToSpend: "2–3 hours",
    bestTimeToVisit: "When the park opens, before the path crowds",
  },
  {
    id: "mattupetty",
    name: "Mattupetty Dam",
    regionId: "munnar",
    vibeTags: ["scenic", "slow"],
    why: "A high reservoir road with tea on one side and water on the other.",
    description:
      "The dam holds back a lake tucked into the hills south of town. Walk the bund, then continue a little toward Echo Point if you want the valley to answer you.",
    activities: ["Walk the dam bund", "Continue toward Echo Point for the valley call"],
    timeToSpend: "1–1.5 hours",
    bestTimeToVisit: "Afternoon, when the wind is on the water",
  },
  {
    id: "periyar",
    name: "Periyar Lake",
    regionId: "thekkady",
    vibeTags: ["wildlife", "scenic", "educational"],
    why: "A boat morning on a lake that is also a wildlife sanctuary.",
    description:
      "The Kerala Forest Department boats leave from the jetty below the Thekkady dam. You are looking for movement on the shore — elephant, gaur, otter — more than a jungle cruise. Binoculars help more than a second circuit.",
    activities: ["Take the morning boat from the jetty", "Scan the dead trees in the water for birds"],
    timeToSpend: "2–3 hours",
    bestTimeToVisit: "First boat, when the banks are still active",
  },
  {
    id: "kumily",
    name: "Kumily spice market",
    regionId: "thekkady",
    vibeTags: ["culinary", "cultural", "educational"],
    why: "The town on the park gate, where pepper and cardamom are still sold by the sack.",
    description:
      "Kumily is the bazaar for the high range. A spice shop with a small garden out back will show you the plants behind the powders. Buy pepper only after you have smelled it whole.",
    activities: ["Walk a spice garden behind a shop", "Compare pepper, cardamom, and vanilla on the stem"],
    timeToSpend: "1–1.5 hours",
    bestTimeToVisit: "Late morning, when the shops have opened the sacks",
  },
  {
    id: "alappuzha-beach",
    name: "Alappuzha Beach",
    regionId: "alleppey",
    vibeTags: ["slow", "scenic", "solo"],
    why: "A working beach at the end of the canal town, wide and a little rough, which is the charm.",
    description:
      "The pier and the lighthouse mark the spot where the backwaters meet the Arabian Sea. It is not a resort bay. Walk the sand, watch the fishing boats, and leave time to rinse the salt off.",
    activities: ["Walk the pier and the lighthouse ground", "Watch boats come through the sea mouth"],
    timeToSpend: "1 hour",
    bestTimeToVisit: "Late afternoon",
  },
  {
    id: "punnamada",
    name: "Punnamada backwaters",
    regionId: "alleppey",
    vibeTags: ["slow", "scenic"],
    why: "The broad reach where houseboats actually travel, just east of town.",
    description:
      "Punnamada is the lake Alappuzha’s houseboats use, including the snake-boat course. A short cruise or a walk along the finishing point shows the scale of the water better than the canal in town.",
    activities: ["Take a short cruise onto the lake", "Walk the snake-boat finishing point"],
    timeToSpend: "2–3 hours",
    bestTimeToVisit: "Morning, before the houseboat traffic stacks up",
  },
  {
    id: "marari",
    name: "Marari Beach",
    regionId: "alleppey",
    vibeTags: ["slow", "solo", "scenic"],
    why: "A fishing beach north of Alappuzha with room to do very little.",
    description:
      "Marari is a village beach: nets drying, a few paths through the coconut line, and a long horizon. It is the slow ending to a hill trip, not a sight to tick.",
    activities: ["Walk the sand past the fishing boats", "Sit under the coconut line and stop scheduling"],
    timeToSpend: "2 hours",
    bestTimeToVisit: "Late afternoon into sunset",
  },
]);

const rajasthanPlaces = materialize([
  {
    id: "hawa",
    name: "Hawa Mahal",
    regionId: "jaipur",
    vibeTags: ["cultural", "scenic", "educational"],
    why: "The city’s most famous facade, and a window onto the bazaar it was built to watch.",
    description:
      "The Palace of Winds is a screen, not a residence: five storeys of jali looking onto the street. Climb it for the bazaar view, then come back out and see the facade from the square the way it was meant to be seen.",
    activities: ["Climb to the upper jali windows", "See the facade from the bazaar side"],
    timeToSpend: "45–75 minutes",
    bestTimeToVisit: "Opening time, before the square heats up",
  },
  {
    id: "city-palace",
    name: "City Palace",
    regionId: "jaipur",
    vibeTags: ["cultural", "educational"],
    why: "Still a royal seat, with courtyards that explain how Jaipur was actually governed.",
    description:
      "The complex is a set of courts, not a single hall. The textile galleries and the arms room are stronger than the first courtyard suggests. Give it a full hour and skip the gift shop until the end.",
    activities: ["Walk the inner courtyards in order", "Spend time in the textile and arms galleries"],
    timeToSpend: "1.5–2 hours",
    bestTimeToVisit: "Morning, right as the gates open",
  },
  {
    id: "jantar",
    name: "Jantar Mantar",
    regionId: "jaipur",
    vibeTags: ["educational", "cultural"],
    why: "Masonry observatory instruments, large enough to walk through, next door to the palace.",
    description:
      "Jai Singh II’s observatory is a set of stone instruments for tracking the sun and fixing local time. The Samrat Yantra is the one to understand; a guide or the audio stops are worth it here in a way they are not at the palace.",
    activities: ["Read the Samrat Yantra’s shadow", "Compare two instruments rather than photographing all of them"],
    timeToSpend: "1 hour",
    bestTimeToVisit: "Late morning, when the shadow is easy to read",
  },
  {
    id: "jal",
    name: "Jal Mahal",
    regionId: "amber",
    vibeTags: ["scenic", "cultural"],
    why: "The lake palace you see from the causeway on the way to Amber, best as a view rather than a tour.",
    description:
      "Jal Mahal sits in Man Sagar. You do not go inside on an ordinary visit. Stop on the road, walk the near shore, and look at how the waterline meets the terraces.",
    activities: ["Walk the Man Sagar shore", "Frame the palace from the causeway"],
    timeToSpend: "30–45 minutes",
    bestTimeToVisit: "Morning, on the drive up to Amber",
  },
  {
    id: "amber",
    name: "Amber Fort",
    regionId: "amber",
    vibeTags: ["cultural", "educational", "scenic"],
    why: "The fort-palace above the lake, room after mirrored room, and the reason this day leaves the city.",
    description:
      "Amber is a palace complex more than a ruined fort. The Sheesh Mahal and the ramp up from the lake are the two sequences to do slowly. The elephant queue is optional; the walking path is the better arrival.",
    activities: ["Walk up from the lake instead of riding", "See the mirrored Sheesh Mahal"],
    timeToSpend: "2–3 hours",
    bestTimeToVisit: "Opening time, before coach parties reach the mirrors",
  },
  {
    id: "nahargarh",
    name: "Nahargarh Fort",
    regionId: "amber",
    vibeTags: ["scenic", "hiking", "cultural"],
    why: "The ridge fort that looks back over the whole of Jaipur.",
    description:
      "Nahargarh was the city’s northern watch. The ramparts give you Amber, the old city, and the hills in one turn. Come for the view and the wind, not for another museum.",
    activities: ["Walk the ramparts facing the city", "Pick out Hawa Mahal in the pink grid below"],
    timeToSpend: "1–1.5 hours",
    bestTimeToVisit: "Late afternoon, with the city turning colour",
  },
  {
    id: "pushkar-lake",
    name: "Pushkar Lake",
    regionId: "pushkar",
    vibeTags: ["spiritual", "scenic", "slow"],
    why: "Fifty-two ghats around one small lake, the town’s entire map.",
    description:
      "Walk the parikrama instead of stopping at the first ghat with a priest. The lake is the town: temples, steps, and the desert hills just beyond the roofs.",
    activities: ["Circumambulate the lake", "Sit on a quiet ghat away from the main steps"],
    timeToSpend: "1.5–2 hours",
    bestTimeToVisit: "Dawn or dusk",
  },
  {
    id: "brahma",
    name: "Brahma Temple",
    regionId: "pushkar",
    vibeTags: ["spiritual", "cultural", "educational"],
    why: "One of the very few temples to Brahma, standing just off the lake.",
    description:
      "The temple is active and compact. Notice the marble tortoise set into the floor and the fact that the town’s identity hangs on this one shrine as much as on the camel fair.",
    activities: ["Visit the sanctum when the queue is short", "Walk back to the lake through the bazaar lane"],
    timeToSpend: "30–45 minutes",
    bestTimeToVisit: "Morning darshan",
  },
  {
    id: "savitri",
    name: "Savitri Temple",
    regionId: "pushkar",
    vibeTags: ["spiritual", "hiking", "scenic"],
    why: "A hilltop temple above the lake, reached by a long stair with the town at your back.",
    description:
      "Savitri sits on the hill west of the lake. The steps are the visit: each landing opens a wider view of Pushkar, the desert, and the road you came in on.",
    activities: ["Climb the steps at a pace that leaves you breath for the view", "Look back at the lake from the temple court"],
    timeToSpend: "1.5–2 hours",
    bestTimeToVisit: "Late afternoon, so the descent is in cooler air",
  },
  {
    id: "mehrangarh",
    name: "Mehrangarh Fort",
    regionId: "jodhpur",
    vibeTags: ["cultural", "educational", "scenic"],
    why: "A fort that still feels like a fort: gates, courtyards, and a drop to the blue city.",
    description:
      "Enter from the bottom and walk up through the gates rather than driving to the top car park if you can. The palaces inside are excellent; the rampart view over the blue houses is why people remember it.",
    activities: ["Climb through the gates", "Walk the rampart above the blue city"],
    timeToSpend: "2–3 hours",
    bestTimeToVisit: "Opening time",
  },
  {
    id: "jaswant",
    name: "Jaswant Thada",
    regionId: "jodhpur",
    vibeTags: ["cultural", "scenic", "spiritual"],
    why: "A white marble memorial just below the fort, quiet in a way the fort is not.",
    description:
      "The cenotaph of Maharaja Jaswant Singh II sits on the ridge between Mehrangarh and the city. The marble is thin enough that the sun comes through it. It takes less than an hour and deserves not to be skipped on the way down.",
    activities: ["Walk the terraces around the main cenotaph", "Look from the marble back up at the fort"],
    timeToSpend: "45–60 minutes",
    bestTimeToVisit: "Mid-morning, when the marble is bright but the stone is still cool",
  },
  {
    id: "clock",
    name: "Ghanta Ghar",
    regionId: "jodhpur",
    vibeTags: ["culinary", "cultural", "solo"],
    why: "The clock tower in the middle of Sardar Market, where the fort day comes back down to street level.",
    description:
      "The market around the clock tower is for spice, textiles, and a glass of makhaniya lassi. Use it as the last stop, not a detour: you are already in the old city after the fort.",
    activities: ["Circle the clock tower once before you buy anything", "Eat in the market rather than back at the hotel"],
    timeToSpend: "1–1.5 hours",
    bestTimeToVisit: "Late afternoon, when the market is fully open",
  },
]);

function trip(partial: Omit<DemoTrip, "places" | "legs"> & { places: Place[] }): DemoTrip {
  const ids = new Set(partial.places.map((place) => place.id));
  const legs: Record<string, LngLat[]> = {};
  for (const [key, line] of Object.entries(geo.legs)) {
    const [from, to] = key.split(">");
    if (ids.has(from) && ids.has(to)) legs[key] = line;
  }
  return { ...partial, legs };
}

export const DEMO_TRIPS: DemoTrip[] = [
  trip({
    slug: "kashmir",
    name: "Kashmir",
    blurb: "Lake, meadow, and two high valleys.",
    aliases: ["kashmir", "srinagar", "gulmarg", "pahalgam", "sonamarg"],
    center: [74.95, 34.14],
    zoom: 7.2,
    regions: [
      {
        id: "srinagar",
        title: "Lakeside Srinagar",
        summary: "The lake, a shrine on its shore, a hill above it, and a Mughal garden aimed at the water.",
      },
      {
        id: "gulmarg",
        title: "Above Gulmarg",
        summary: "Gondola, a wooden church in the meadow, and the grassland at the top of the first lift.",
      },
      {
        id: "pahalgam",
        title: "The Lidder valleys",
        summary: "Pahalgam on the river, then Betaab and Aru while you are already up the road.",
      },
      {
        id: "sonamarg",
        title: "Sonamarg",
        summary: "The meadow before the pass, and the glacier in the side valley beside it.",
      },
    ],
    places: kashmirPlaces,
  }),
  trip({
    slug: "kerala",
    name: "Kerala",
    blurb: "Harbour, tea hills, a lake sanctuary, then the coast.",
    aliases: ["kerala", "kochi", "cochin", "fort kochi", "munnar", "thekkady", "alleppey", "alappuzha"],
    center: [76.75, 9.85],
    zoom: 6.8,
    regions: [
      {
        id: "kochi",
        title: "Fort Kochi",
        summary: "Nets on the harbour, then Jew Town’s synagogue and the mural palace beside it.",
      },
      {
        id: "munnar",
        title: "Munnar",
        summary: "Tea town, the factory that explains it, tahr on the high grass, and a dam road.",
      },
      {
        id: "thekkady",
        title: "Thekkady",
        summary: "A morning on Periyar Lake and the spice town at the gate.",
      },
      {
        id: "alleppey",
        title: "Alappuzha",
        summary: "The beach, the houseboat reach, and a fishing village shore.",
      },
    ],
    places: keralaPlaces,
  }),
  trip({
    slug: "rajasthan",
    name: "Rajasthan",
    blurb: "Jaipur’s old city, the Amber ridge, Pushkar, then Jodhpur.",
    aliases: ["rajasthan", "jaipur", "amber", "pushkar", "jodhpur"],
    center: [74.5, 26.65],
    zoom: 6.4,
    regions: [
      {
        id: "jaipur",
        title: "Pink City",
        summary: "Hawa Mahal, the palace, and the observatory — one neighbourhood, walked.",
      },
      {
        id: "amber",
        title: "Amber ridge",
        summary: "The lake palace from the shore, the fort above it, and Nahargarh looking back at the city.",
      },
      {
        id: "pushkar",
        title: "Pushkar",
        summary: "The lake circuit, the Brahma temple, and the hill that sees both.",
      },
      {
        id: "jodhpur",
        title: "Jodhpur",
        summary: "Mehrangarh, the marble memorial under it, and the market clock in the blue city.",
      },
    ],
    places: rajasthanPlaces,
  }),
];

export function getDemo(slug: string | null | undefined) {
  if (!slug) return null;
  return DEMO_TRIPS.find((trip) => trip.slug === slug) ?? null;
}

export function matchDemo(destination: string) {
  const value = destination.trim().toLowerCase();
  if (!value) return null;
  return (
    DEMO_TRIPS.find((trip) =>
      trip.aliases.some((alias) => value === alias || value.includes(alias)),
    ) ?? null
  );
}

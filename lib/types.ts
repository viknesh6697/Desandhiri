export type LngLat = [number, number];

export type LineStringGeometry = {
  type: "LineString";
  coordinates: LngLat[];
};

export type VibeId =
  | "solo"
  | "spiritual"
  | "scenic"
  | "hiking"
  | "cultural"
  | "educational"
  | "culinary"
  | "wildlife"
  | "slow";

export type Place = {
  id: string;
  name: string;
  description: string;
  activities: string[];
  timeToSpend: string;
  bestTimeToVisit: string;
  vibeTags: VibeId[];
  why: string;
  photos: string[];
  lng: number;
  lat: number;
  regionId?: string;
  visitOrder?: number;
};

export type DayPlan = {
  day: number;
  title: string;
  summary: string;
  placeIds: string[];
  route: LineStringGeometry;
};

export type TripDraft = {
  destination: string;
  startDate: string;
  endDate: string;
  dayCount: number;
  vibes: VibeId[];
  demoSlug: string | null;
  center: LngLat;
};

export type DiscoverResponse = {
  destination: string;
  center: LngLat;
  demoSlug: string | null;
  places: Place[];
};

export type ItineraryResponse = {
  days: DayPlan[];
  clusteredBy: "cache" | "model" | "geography";
};

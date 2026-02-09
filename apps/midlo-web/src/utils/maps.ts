// src/utils/maps.ts

export type MapsLinks = {
  google: string;
  apple: string;
  waze: string;
};

function f(n: number): string {
  return Number.isFinite(n) ? n.toFixed(6) : "0";
}

function encode(v: string): string {
  return encodeURIComponent(v);
}

function withQuery(baseUrl: string, params: Record<string, string | number | null | undefined>): string {
  const entries = Object.entries(params).filter(([, v]) => v !== null && v !== undefined && String(v).length > 0);
  if (entries.length === 0) return baseUrl;
  const qs = entries.map(([k, v]) => `${encode(k)}=${encode(String(v))}`).join("&");
  return `${baseUrl}?${qs}`;
}

export function mapsLinks(lat: number, lng: number): MapsLinks {
  const ll = `${f(lat)},${f(lng)}`;

  return {
    google: `https://www.google.com/maps/search/?api=1&query=${encode(ll)}`,
    // Keep ll explicit so Apple Maps is anchored at the coordinate.
    apple: withQuery("https://maps.apple.com/", { ll, q: "Midpoint", z: "18" }),
    // Prefer search view so a human label is shown.
    waze: withQuery("https://waze.com/ul", { ll, q: "Midpoint", navigate: "yes" }),
  };
}

export function mapsLinksWithPlaceId(
  lat: number,
  lng: number,
  placeId: string
) {
  const encoded = `${f(lat)},${f(lng)}`;
  const encodedId = encodeURIComponent(placeId);

  return {
    google: `https://www.google.com/maps/search/?api=1&query=${encoded}&query_place_id=${encodedId}`,
    // Apple Maps does not understand Google Place IDs; anchor by coordinate.
    apple: withQuery("https://maps.apple.com/", { ll: encoded, q: "Point of interest", z: "18" }),
    waze: withQuery("https://waze.com/ul", { ll: encoded, q: "Point of interest", navigate: "yes" }),
  };
}

export type PlaceMapsArgs = {
  name?: string | null;
  formattedAddress?: string | null;
  lat: number;
  lng: number;
  placeId?: string | null;
};

function normalizeText(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

/**
 * Builds links that try to resolve to the *place* (POI name) rather than a
 * coordinate-only pin. This is the closest web equivalent to searching inside
 * Apple Maps / Waze.
 */
export function mapsLinksForPlace(args: PlaceMapsArgs): MapsLinks {
  const placeName = normalizeText(args.name);
  const address = normalizeText(args.formattedAddress);
  const ll = `${f(args.lat)},${f(args.lng)}`;
  const label = placeName || "Point of interest";

  const google = args.placeId
    ? `https://www.google.com/maps/search/?api=1&query=${encode(placeName || ll)}&query_place_id=${encode(args.placeId)}`
    : `https://www.google.com/maps/search/?api=1&query=${encode(placeName || address || ll)}`;

  // Apple Maps web: using `q` anchored by `ll` makes it behave like a POI search.
  const apple = withQuery("https://maps.apple.com/", {
    q: placeName || address || label,
    ll,
    z: "18",
  });

  // Waze web: use POI search near the coordinate.
  const waze = placeName
    ? withQuery("https://waze.com/ul", {
        q: placeName,
        navigate: "yes",
      })
    : withQuery("https://waze.com/ul", {
        q: address || label,
        ll,
        navigate: "yes",
      });

  return { google, apple, waze };
}

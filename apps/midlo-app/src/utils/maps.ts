export type MapsLinks = {
  google: string;
  apple: string;
  waze: string;
};

function f(n: number): string {
  // Keep URLs stable and readable.
  return Number.isFinite(n) ? n.toFixed(6) : '0';
}

export function mapsLinks(lat: number, lng: number): MapsLinks {
  const q = `${f(lat)},${f(lng)}`;

  return {
    // Google Maps Search API
    google: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`,
    // Apple Maps
    apple: `http://maps.apple.com/?ll=${encodeURIComponent(q)}`,
    // Waze
    waze: `https://waze.com/ul?ll=${encodeURIComponent(q)}&navigate=yes`,
  };
}

export function mapsLinksWithPlaceId(lat: number, lng: number, placeId: string): MapsLinks {
  const q = `${f(lat)},${f(lng)}`;

  // Google supports an explicit placeId with query_place_id
  const google = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}&query_place_id=${encodeURIComponent(
    placeId,
  )}`;

  // Apple/Waze don't have a direct placeId parameter; use lat/lng.
  const base = mapsLinks(lat, lng);

  return {
    google,
    apple: base.apple,
    waze: base.waze,
  };
}

export type PlaceMapsArgs = {
  name?: string | null;
  formattedAddress?: string | null;
  lat: number;
  lng: number;
  placeId?: string | null;
};

function joinNonEmpty(parts: Array<string | null | undefined>): string {
  return parts
    .map((p) => (typeof p === "string" ? p.trim() : ""))
    .filter(Boolean)
    .join(", ");
}

/**
 * Builds deep links that resolve to the actual place (name/address), not just a
 * lat/lng pin.
 */
export function mapsLinksForPlace(args: PlaceMapsArgs): MapsLinks {
  const { name, formattedAddress, lat, lng, placeId } = args;
  const query = joinNonEmpty([name ?? null, formattedAddress ?? null]) || `${f(lat)},${f(lng)}`;

  // Google: prefer placeId so it resolves to the canonical listing.
  const google = placeId
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}&query_place_id=${encodeURIComponent(
        placeId,
      )}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;

  // Apple Maps: prefer q= (search string) so it shows the place/address.
  const apple = `http://maps.apple.com/?q=${encodeURIComponent(query)}&ll=${encodeURIComponent(
    `${f(lat)},${f(lng)}`,
  )}`;

  // Waze: use q= for search and include ll= as a hint.
  const waze = `https://waze.com/ul?q=${encodeURIComponent(query)}&ll=${encodeURIComponent(
    `${f(lat)},${f(lng)}`,
  )}&navigate=yes`;

  return { google, apple, waze };
}

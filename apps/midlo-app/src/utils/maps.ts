export type MapsLinks = {
  google: string;
  apple: string;
  waze: string;
};

function toQueryString(
  params: Record<string, string | number | null | undefined>,
): string {
  const entries = Object.entries(params).filter(
    ([, v]) => v !== null && v !== undefined && String(v).length > 0,
  );
  if (entries.length === 0) return "";
  return entries
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join("&");
}

function withQuery(
  baseUrl: string,
  params: Record<string, string | number | null | undefined>,
): string {
  const qs = toQueryString(params);
  return qs ? `${baseUrl}?${qs}` : baseUrl;
}

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
    apple: `https://maps.apple.com/?ll=${encodeURIComponent(q)}&q=${encodeURIComponent("Midpoint")}&z=18`,
    // Waze
    waze: `https://waze.com/ul?ll=${encodeURIComponent(q)}&q=${encodeURIComponent("Midpoint")}&navigate=yes`,
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
  const placeName = typeof name === "string" ? name.trim() : "";
  const address = typeof formattedAddress === "string" ? formattedAddress.trim() : "";
  // Never fall back to a raw "lat,lng" query for places. If we don't have an
  // address, prefer the place name (still shows a place label in Apple/Waze).
  const query =
    joinNonEmpty([placeName || null, address || null]) ||
    placeName ||
    "Point of interest";

  // Visible label: MUST be the place name (never address, never coordinates).
  // If name is missing, fall back to a neutral label rather than showing an address.
  const labelQuery = placeName || "Point of interest";

  // Google: prefer placeId so it resolves to the canonical listing.
  const google = placeId
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}&query_place_id=${encodeURIComponent(
        placeId,
      )}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;

  // Apple Maps:
  // Avoid using `address=` because it commonly re-labels the destination to a
  // street address. Prefer `q` anchored with `ll` so the visible label is the
  // place name when available.
  const apple = (() => {
    const ll = `${f(lat)},${f(lng)}`;
    const q = placeName || address || labelQuery;
    return withQuery("https://maps.apple.com/", {
      q,
      ll,
      z: "18",
    });
  })();

  // Waze:
  // Prefer search-style link (q) over ll-navigation to avoid coordinate-only UIs.
  const waze = (() => {
    if (placeName) {
      // Name-only so Waze shows the POI label instead of a reverse-geocoded street.
      return withQuery("https://waze.com/ul", {
        q: placeName,
        navigate: "yes",
      });
    }

    const wazeQuery = address || labelQuery;
    return withQuery("https://waze.com/ul", {
      q: wazeQuery,
      ll: `${f(lat)},${f(lng)}`,
      navigate: "yes",
    });
  })();

  // Keep lat/lng referenced so callers can pass them consistently; useful for
  // future enhancements without changing call sites.
  void lat;
  void lng;

  return { google, apple, waze };
}

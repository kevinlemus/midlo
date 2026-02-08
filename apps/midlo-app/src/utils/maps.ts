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
  // - Use q as a *pin label* by explicitly defining ll.
  //   Apple docs: q can be used as a label if location is explicitly defined in ll.
  // - Avoid sll/near here to reduce search-mode behavior that can surface an address label.
  const apple = (() => {
    const u = new URL("https://maps.apple.com/");
    u.searchParams.set("q", labelQuery);
    u.searchParams.set("ll", `${f(lat)},${f(lng)}`);
    u.searchParams.set("z", "18");
    return u.toString();
  })();

  // Waze:
  // - q=<place name> so it displays the name (not an address)
  // - If we include ll=, Waze can prefer the reverse-geocoded address label.
  //   When we have a name, omit ll and let Waze resolve the POI by name.
  //   If we don't have a name, fall back to ll navigation.
  const waze = (() => {
    const u = new URL("https://waze.com/ul");
    u.searchParams.set("q", labelQuery);
    if (!placeName) {
      u.searchParams.set("ll", `${f(lat)},${f(lng)}`);
    }
    u.searchParams.set("navigate", "yes");
    return u.toString();
  })();

  // Keep lat/lng referenced so callers can pass them consistently; useful for
  // future enhancements without changing call sites.
  void lat;
  void lng;

  return { google, apple, waze };
}

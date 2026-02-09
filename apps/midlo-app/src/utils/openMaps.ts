import { Linking, Platform } from "react-native";
import type { PlaceMapsArgs } from "./maps";
import { openAppleMapsPOI, openAppleMapsPlace } from "midlo-apple-maps";

export type MapsProvider = "google" | "apple" | "waze";

export type PointMapsArgs = {
  lat: number;
  lng: number;
  /** Optional label to show in providers that support it. */
  label?: string | null;
};

async function openFirstWorkingUrl(urls: string[]): Promise<boolean> {
  for (const url of urls) {
    try {
      // eslint-disable-next-line no-await-in-loop
      await Linking.openURL(url);
      return true;
    } catch {
      // try next
    }
  }
  return false;
}

function f(n: number): string {
  return Number.isFinite(n) ? n.toFixed(6) : "0";
}

function encode(v: string): string {
  return encodeURIComponent(v);
}

function normalizeText(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

/**
 * Opens a specific place in a map provider.
 *
 * Goal: behave like "Open in Maps" from other apps (show the place name).
 * We prefer native app schemes when available, then fall back to universal links.
 */
export async function openPlaceInMaps(provider: MapsProvider, args: PlaceMapsArgs) {
  const placeName = normalizeText(args.name);
  const formattedAddress = normalizeText(args.formattedAddress);
  const label = placeName || "Point of interest";
  const ll = `${f(args.lat)},${f(args.lng)}`;

  // Apple Maps and Waze often display a reverse-geocoded street label when you
  // open a raw lat/lng pin. To match "search in maps" behavior (showing the
  // POI name like "McDonald's"), we open them using a POI search near the
  // place coordinates whenever we have a name.
  if (provider === "apple") {
    // iOS: Use MapKit via a tiny native module so the POI label is the place
    // name (Apple URL schemes frequently re-label pins to the street address).
    if (Platform.OS === "ios" && placeName) {
      const openedPOI = await openAppleMapsPOI(placeName, args.lat, args.lng);
      if (openedPOI) return true;
      const opened = await openAppleMapsPlace(placeName, args.lat, args.lng);
      if (opened) return true;
    }

    const urls: string[] = [];

    // Prefer label anchored to the exact coordinate (keeps the pin at ll).
    if (placeName) {
      if (Platform.OS === "ios") {
        urls.push(`maps://?q=${encode(placeName)}&ll=${encode(ll)}&z=18`);
      }
      urls.push(`https://maps.apple.com/?q=${encode(placeName)}&ll=${encode(ll)}&z=18`);
    }

    // Next: POI-style search near coordinate (more likely to show the POI name
    // like "McDonald's" rather than a street address label).
    const searchQuery = placeName || formattedAddress || label;
    if (Platform.OS === "ios") {
      urls.push(`maps://?q=${encode(searchQuery)}&near=${encode(ll)}`);
    }
    urls.push(`https://maps.apple.com/?q=${encode(searchQuery)}&near=${encode(ll)}`);

    // Last-resort: directions to the coordinate.
    if (Platform.OS === "ios") {
      urls.push(`maps://?daddr=${encode(ll)}&dirflg=d`);
    }
    urls.push(`https://maps.apple.com/?daddr=${encode(ll)}&dirflg=d`);

    return openFirstWorkingUrl(urls);
  }

  if (provider === "waze") {
    const urls: string[] = [];

    // Waze:
    // If we include `ll`, Waze commonly prefers a reverse-geocoded street/coordinate
    // label over the POI name. To match Google/Apple (show the place name), we
    // first try a name-only search/navigation. If that fails, we fall back to
    // anchoring the search near the coordinate.
    const wazeQuery = placeName || formattedAddress || label;

    if (placeName) {
      urls.push(`waze://?q=${encode(placeName)}&navigate=yes`);
      urls.push(`https://waze.com/ul?q=${encode(placeName)}&navigate=yes`);
      urls.push(`waze://?q=${encode(placeName)}`);
      urls.push(`https://waze.com/ul?q=${encode(placeName)}`);
    }

    // Prefer Waze's "search then navigate" flow anchored near the coordinate.
    urls.push(`waze://?q=${encode(wazeQuery)}&ll=${encode(ll)}&navigate=yes`);
    urls.push(`https://waze.com/ul?q=${encode(wazeQuery)}&ll=${encode(ll)}&navigate=yes`);

    // Fallback: show POI results near the coordinate.
    urls.push(`waze://?q=${encode(wazeQuery)}&ll=${encode(ll)}`);
    urls.push(`https://waze.com/ul?q=${encode(wazeQuery)}&ll=${encode(ll)}`);

    // Next: search without ll.
    urls.push(`waze://?q=${encode(wazeQuery)}`);
    urls.push(`https://waze.com/ul?q=${encode(wazeQuery)}`);

    // Last-resort: coordinate navigation (can show "Dropped pin").
    urls.push(`waze://?ll=${encode(ll)}&navigate=yes`);
    urls.push(`https://waze.com/ul?ll=${encode(ll)}&navigate=yes`);
    return openFirstWorkingUrl(urls);
  }

  // Google
  const query = placeName
    ? placeName
    : typeof args.formattedAddress === "string" && args.formattedAddress.trim()
      ? args.formattedAddress.trim()
      : ll;

  const urls: string[] = [];
  // Native Google Maps scheme on iOS/Android (if installed).
  urls.push(`comgooglemaps://?q=${encode(query)}&center=${encode(ll)}`);
  if (args.placeId) {
    urls.push(
      `https://www.google.com/maps/search/?api=1&query=${encode(query)}&query_place_id=${encode(args.placeId)}`,
    );
  }
  urls.push(`https://www.google.com/maps/search/?api=1&query=${encode(query)}`);

  return openFirstWorkingUrl(urls);
}

/**
 * Opens an exact lat/lng point in a map provider.
 *
 * Use this for midpoints / dropped pins where accuracy matters more than
 * resolving to a nearby reverse-geocoded address.
 */
export async function openPointInMaps(provider: MapsProvider, args: PointMapsArgs) {
  const ll = `${f(args.lat)},${f(args.lng)}`;
  const label = normalizeText(args.label) || "Dropped pin";

  if (provider === "apple") {
    const urls: string[] = [];

    // Prefer the native Apple Maps scheme on iOS so we don't bounce through
    // Safari (which can briefly search/reverse-geocode and drift).
    if (Platform.OS === "ios") {
      // Keep ll explicit so the pin is anchored at the exact coordinate.
      urls.push(`maps://?ll=${encode(ll)}&q=${encode(label)}&z=18`);
      urls.push(`maps://?ll=${encode(ll)}&z=18`);
    }

    urls.push(`https://maps.apple.com/?ll=${encode(ll)}&q=${encode(label)}&z=18`);
    urls.push(`https://maps.apple.com/?ll=${encode(ll)}&z=18`);
    return openFirstWorkingUrl(urls);
  }

  if (provider === "waze") {
    const urls: string[] = [];

    // Prefer Waze's documented "search then navigate" flow.
    urls.push(`waze://?q=${encode(label)}&ll=${encode(ll)}&navigate=yes`);
    urls.push(`https://waze.com/ul?q=${encode(label)}&ll=${encode(ll)}&navigate=yes`);

    // Last-resort: direct navigation to the coordinate.
    urls.push(`waze://?ll=${encode(ll)}&navigate=yes`);
    urls.push(`https://waze.com/ul?ll=${encode(ll)}&navigate=yes`);

    // Final fallback: show search results (no navigation) in case navigate is ignored.
    urls.push(`waze://?q=${encode(label)}&ll=${encode(ll)}`);
    urls.push(`https://waze.com/ul?q=${encode(label)}&ll=${encode(ll)}`);
    urls.push(`waze://?q=${encode(label)}`);
    urls.push(`https://waze.com/ul?q=${encode(label)}`);
    return openFirstWorkingUrl(urls);
  }

  // Google
  const urls: string[] = [];
  urls.push(`comgooglemaps://?q=${encode(ll)}&center=${encode(ll)}`);
  urls.push(`https://www.google.com/maps/search/?api=1&query=${encode(ll)}`);
  return openFirstWorkingUrl(urls);
}

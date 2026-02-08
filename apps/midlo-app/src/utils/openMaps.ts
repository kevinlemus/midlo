import { Linking, Platform } from "react-native";
import type { PlaceMapsArgs } from "./maps";

export type MapsProvider = "google" | "apple" | "waze";

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
    const urls: string[] = [];

    const query = placeName || formattedAddress || ll;
    // Use search + near hint to resolve a POI by name (vs. labeling a pin).
    // Apple docs: q is treated like user-typed search; near biases results.
    if (Platform.OS === "ios") {
      urls.push(`maps://?q=${encode(query)}&near=${encode(ll)}`);
    }
    urls.push(`https://maps.apple.com/?q=${encode(query)}&near=${encode(ll)}`);
    return openFirstWorkingUrl(urls);
  }

  if (provider === "waze") {
    const urls: string[] = [];
    const query = placeName || formattedAddress || ll;
    // Waze deep links support combining q (search terms) and ll (search center).
    // This helps resolve a specific POI near the known coordinate and keeps the
    // UI labeled by place name rather than a street address.
    if (placeName) {
      urls.push(`waze://?q=${encode(placeName)}&ll=${encode(ll)}&navigate=yes`);
      urls.push(`https://waze.com/ul?q=${encode(placeName)}&ll=${encode(ll)}&navigate=yes`);
    } else {
      urls.push(`waze://?q=${encode(query)}&navigate=yes`);
      urls.push(`https://waze.com/ul?q=${encode(query)}&navigate=yes`);
    }
    // Last-resort coordinate navigation.
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

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

/**
 * Opens a specific place in a map provider.
 *
 * Goal: behave like "Open in Maps" from other apps (show the place name).
 * We prefer native app schemes when available, then fall back to universal links.
 */
export async function openPlaceInMaps(provider: MapsProvider, args: PlaceMapsArgs) {
  const placeName = typeof args.name === "string" ? args.name.trim() : "";
  const label = placeName || "Point of interest";
  const ll = `${f(args.lat)},${f(args.lng)}`;

  // Note: we intentionally avoid passing destination addresses for Apple/Waze,
  // because those UIs tend to display the address label.
  if (provider === "apple") {
    const urls: string[] = [];
    // iOS native scheme tends to open directly in Maps.
    if (Platform.OS === "ios") {
      urls.push(`maps://?q=${encode(label)}&ll=${encode(ll)}&z=18`);
    }
    urls.push(`https://maps.apple.com/?q=${encode(label)}&ll=${encode(ll)}&z=18`);
    return openFirstWorkingUrl(urls);
  }

  if (provider === "waze") {
    const urls: string[] = [];
    // Prefer name-only so Waze shows the name, not a reverse-geocoded address.
    urls.push(`waze://?q=${encode(label)}&navigate=yes`);
    urls.push(`https://waze.com/ul?q=${encode(label)}&navigate=yes`);
    // If the app can't resolve by name (rare), last-resort coordinate navigation.
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

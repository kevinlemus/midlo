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

    const namePlusAddress = placeName && formattedAddress ? `${placeName}, ${formattedAddress}` : "";

    // Prefer DIRECTIONS links over dropped-pin links.
    // In practice, Apple Maps will often replace a dropped-pin label with the
    // reverse-geocoded street address after a moment. Using daddr tends to behave
    // more like "Get Directions" to a named POI.
    const destination = namePlusAddress || placeName || formattedAddress || ll;
    if (Platform.OS === "ios") {
      urls.push(`maps://?daddr=${encode(destination)}&dirflg=d`);
    }
    urls.push(`https://maps.apple.com/?daddr=${encode(destination)}&dirflg=d`);

    // Fallback: try a name-biased POI search near the coordinate.
    // (Useful when a provider doesn't resolve the destination string well.)
    if (placeName) {
      if (Platform.OS === "ios") {
        urls.push(`maps://?q=${encode(placeName)}&sll=${encode(ll)}`);
      }
      urls.push(`https://maps.apple.com/?q=${encode(placeName)}&sll=${encode(ll)}`);
    }

    // Last-resort: label at coordinate.
    if (placeName) {
      if (Platform.OS === "ios") {
        urls.push(`maps://?q=${encode(placeName)}&ll=${encode(ll)}&z=18`);
      }
      urls.push(`https://maps.apple.com/?q=${encode(placeName)}&ll=${encode(ll)}&z=18`);
    }

    return openFirstWorkingUrl(urls);
  }

  if (provider === "waze") {
    const urls: string[] = [];

    const wazeQuery =
      placeName && formattedAddress ? `${placeName}, ${formattedAddress}` : placeName || formattedAddress || ll;

    // Prefer name-first navigation so Waze resolves the POI and labels it by name.
    if (placeName) {
      urls.push(`waze://?q=${encode(placeName)}&navigate=yes`);
      urls.push(`https://waze.com/ul?q=${encode(placeName)}&navigate=yes`);
    }

    // If needed, disambiguate with address (helps chains / multi-tenant addresses).
    urls.push(`waze://?q=${encode(wazeQuery)}&navigate=yes`);
    urls.push(`https://waze.com/ul?q=${encode(wazeQuery)}&navigate=yes`);

    // If Waze can't resolve by query, bias the search to the known coordinate.
    urls.push(`waze://?q=${encode(wazeQuery)}&ll=${encode(ll)}&navigate=yes`);
    urls.push(`https://waze.com/ul?q=${encode(wazeQuery)}&ll=${encode(ll)}&navigate=yes`);

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

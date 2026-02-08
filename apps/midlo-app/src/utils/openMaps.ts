import { Linking, Platform } from "react-native";
import type { PlaceMapsArgs } from "./maps";
import { openAppleMapsPlace } from "midlo-apple-maps";

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
    // iOS: Use MapKit via a tiny native module so the POI label is the place
    // name (Apple URL schemes frequently re-label pins to the street address).
    if (Platform.OS === "ios" && placeName) {
      const opened = await openAppleMapsPlace(placeName, args.lat, args.lng);
      if (opened) return true;
    }

    const urls: string[] = [];

    const namePlusAddress = placeName && formattedAddress ? `${placeName}, ${formattedAddress}` : "";

    // Best-effort to keep the *pin label* as the place name:
    // Apple docs: q can be used as a label if the location is explicitly defined
    // in ll OR address. In practice, defining an explicit address tends to avoid
    // the brief coordinate pin that later re-labels to the street address.
    if (placeName && formattedAddress) {
      if (Platform.OS === "ios") {
        urls.push(`maps://?q=${encode(placeName)}&address=${encode(formattedAddress)}`);
      }
      urls.push(`https://maps.apple.com/?q=${encode(placeName)}&address=${encode(formattedAddress)}`);
    }

    // Next: label at coordinate.
    if (placeName) {
      if (Platform.OS === "ios") {
        urls.push(`maps://?q=${encode(placeName)}&ll=${encode(ll)}&z=18`);
      }
      urls.push(`https://maps.apple.com/?q=${encode(placeName)}&ll=${encode(ll)}&z=18`);
    }

    // Next: search near the coordinate (user-typed search behavior).
    const searchQuery = namePlusAddress || placeName || formattedAddress || ll;
    if (Platform.OS === "ios") {
      urls.push(`maps://?q=${encode(searchQuery)}&near=${encode(ll)}`);
    }
    urls.push(`https://maps.apple.com/?q=${encode(searchQuery)}&near=${encode(ll)}`);

    // Last-resort: directions to the destination string.
    const destination = searchQuery;
    if (Platform.OS === "ios") {
      urls.push(`maps://?daddr=${encode(destination)}&dirflg=d`);
    }
    urls.push(`https://maps.apple.com/?daddr=${encode(destination)}&dirflg=d`);

    return openFirstWorkingUrl(urls);
  }

  if (provider === "waze") {
    const urls: string[] = [];

    const wazeQuery =
      placeName && formattedAddress ? `${placeName}, ${formattedAddress}` : placeName || formattedAddress || ll;

    // Waze cannot be forced to show a custom label for ll-based navigation.
    // To avoid coordinate/address-only destinations, open a POI SEARCH view first.
    // User can then tap the named result and start navigation.
    if (placeName) {
      urls.push(`waze://?q=${encode(placeName)}`);
      urls.push(`https://waze.com/ul?q=${encode(placeName)}`);
    }
    urls.push(`waze://?q=${encode(wazeQuery)}`);
    urls.push(`https://waze.com/ul?q=${encode(wazeQuery)}`);

    // Bias search near the coordinate (still search, not navigate).
    urls.push(`waze://?q=${encode(wazeQuery)}&ll=${encode(ll)}`);
    urls.push(`https://waze.com/ul?q=${encode(wazeQuery)}&ll=${encode(ll)}`);

    // Last-resort: coordinate navigation (may show coordinates/address).
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

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

    // 1) Prefer "label at coordinate" mode.
    // Apple docs: q can be used as a label if location is explicitly defined in ll.
    // This tends to avoid the "X places at this address" card.
    if (placeName) {
      if (Platform.OS === "ios") {
        urls.push(`maps://?q=${encode(placeName)}&ll=${encode(ll)}&z=18`);
      }
      urls.push(`https://maps.apple.com/?q=${encode(placeName)}&ll=${encode(ll)}&z=18`);
    }

    // 2) If Apple still resolves to an address, fall back to a POI search near ll
    // with a tighter query (name + address).
    const searchQuery = namePlusAddress || placeName || formattedAddress || ll;
    if (Platform.OS === "ios") {
      urls.push(`maps://?q=${encode(searchQuery)}&near=${encode(ll)}`);
    }
    urls.push(`https://maps.apple.com/?q=${encode(searchQuery)}&near=${encode(ll)}`);

    return openFirstWorkingUrl(urls);
  }

  if (provider === "waze") {
    const urls: string[] = [];

    const wazeQuery =
      placeName && formattedAddress ? `${placeName}, ${formattedAddress}` : placeName || formattedAddress || ll;

    // Waze supports combining q (search terms) and ll (search center).
    // Including address in q helps disambiguate chains (e.g., multiple 7‑Eleven).
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

import { Platform } from "react-native";
import Constants from "expo-constants";

export type Midpoint = { lat: number; lng: number };

export type AutocompleteSuggestion = {
  placeId: string;
  description: string;
};

export type Place = {
  placeId: string;
  name: string;
  distance: string;
  lat: number;
  lng: number;
};

export type PlacePhoto = {
  name: string;
  widthPx: number | null;
  heightPx: number | null;
};

export type PlaceDetails = {
  placeId: string;
  name: string | null;
  formattedAddress: string | null;
  lat: number;
  lng: number;
  rating: number | null;
  userRatingCount: number | null;
  googleMapsUri: string | null;
  websiteUri: string | null;
  internationalPhoneNumber: string | null;
  openNow: boolean | null;
  weekdayDescriptions: string[] | null;
  photos: PlacePhoto[] | null;
};

function getDevServerHost(): string | null {
  const expoConfig: any = (Constants as any).expoConfig;
  const manifest: any = (Constants as any).manifest;
  const hostUri: string | undefined =
    expoConfig?.hostUri ??
    expoConfig?.debuggerHost ??
    expoConfig?.extra?.expoClient?.hostUri ??
    manifest?.debuggerHost ??
    (Constants as any)?.linkingUri ??
    (Constants as any)?.experienceUrl;

  if (!hostUri) return null;

  let normalized = hostUri.trim();
  normalized = normalized.replace(/^[a-zA-Z]+:\/\//, "");
  const hostPart = normalized.split(":")[0]?.trim();
  const isValidHost =
    /^(localhost|\d{1,3}(?:\.\d{1,3}){3}|[a-zA-Z0-9.-]+)$/.test(hostPart || "");
  return isValidHost && hostPart ? hostPart : null;
}

function normalizeHttpBaseUrl(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return null;
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") return null;
  if (!url.hostname || !url.hostname.trim()) return null;
  return url.toString().replace(/\/$/, "");
}

function resolveApiBaseUrl(): string {
  // Expo supports EXPO_PUBLIC_* env vars via process.env at runtime, but RN TS projects
  // often don't include Node typings. Read from globalThis to keep typecheck clean.
  const env = (globalThis as any)?.process?.env?.EXPO_PUBLIC_API_BASE_URL as
    | string
    | undefined;
  if (env && env.trim()) {
    const normalized = normalizeHttpBaseUrl(env);
    if (normalized) return normalized;
  }

  const host = getDevServerHost();
  if (host) return `http://${host}:8080`;

  if (Platform.OS === "android") return "http://10.0.2.2:8080";

  if (typeof window !== "undefined" && window.location?.hostname) {
    return `http://${window.location.hostname}:8080`;
  }
  return "http://localhost:8080";
}

export const API_BASE_URL = resolveApiBaseUrl();

async function postJson<T>(
  path: string,
  body: unknown,
  signal?: AbortSignal,
): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`API error ${res.status}: ${text || res.statusText}`);
  }

  return (await res.json()) as T;
}

async function getJson<T>(path: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, { signal });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`API error ${res.status}: ${text || res.statusText}`);
  }
  return (await res.json()) as T;
}

export const api = {
  autocomplete: async (
    input: string,
    signal?: AbortSignal,
  ): Promise<AutocompleteSuggestion[]> => {
    if (!input || input.trim().length < 3) return [];
    const suggestions = await getJson<AutocompleteSuggestion[]>(
      `/autocomplete?input=${encodeURIComponent(input)}`,
      signal,
    );
    return suggestions.filter((s) => Boolean(s?.description)).slice(0, 8);
  },

  getMidpoint: (addressA: string, addressB: string) =>
    postJson<Midpoint>("/midpoint", { addressA, addressB }),

  getPlaces: (lat: number, lng: number) =>
    postJson<Place[]>("/places", { lat, lng }),

  getPlaceDetails: (placeId: string) =>
    getJson<PlaceDetails>(`/places/${encodeURIComponent(placeId)}`),
};

export function placePhotoUrl(photoName: string, maxWidthPx = 1200): string {
  const url = new URL("/place-photo", API_BASE_URL);
  url.searchParams.set("name", photoName);
  url.searchParams.set("maxWidthPx", String(maxWidthPx));
  return url.toString();
}

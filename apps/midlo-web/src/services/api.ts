import type { Midpoint, Place, PlaceDetails } from "../types";

export type AutocompleteSuggestion = {
  placeId: string;
  description: string;
};

function apiBaseUrl() {
  const env = (import.meta as any).env;
  const v = env?.VITE_API_BASE_URL as string | undefined;
  if (v && v.trim()) return v.trim().replace(/\/$/, "");

  // In local dev, call the API by relative path and let Vite proxy it.
  if ((import.meta as any).env?.DEV) return "";

  return typeof window !== "undefined"
    ? `http://${window.location.hostname}:8080`
    : "http://localhost:8080";
}

const API_BASE_URL = apiBaseUrl();

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
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
  autocomplete: async (input: string, signal?: AbortSignal): Promise<AutocompleteSuggestion[]> => {
    if (!input || input.trim().length < 3) return [];
    const suggestions = await getJson<AutocompleteSuggestion[]>(
      `/autocomplete?input=${encodeURIComponent(input)}`,
      signal,
    );

    // Hardening: backend should return these, but keep UI stable.
    return Array.isArray(suggestions)
      ? suggestions.filter((s) => Boolean(s?.description))
      : [];
  },

  getMidpoint: (addressA: string, addressB: string) =>
    postJson<Midpoint>("/midpoint", { addressA, addressB }),

  getPlaces: (lat: number, lng: number) =>
    postJson<Place[]>("/places", { lat, lng }),

  getPlaceDetails: (placeId: string) =>
    getJson<PlaceDetails>(`/places/${encodeURIComponent(placeId)}`),
};

export function placePhotoUrl(photoName: string, maxWidthPx = 1600) {
  if (!API_BASE_URL) {
    const url = new URL("/place-photo", window.location.origin);
    url.searchParams.set("name", photoName);
    url.searchParams.set("maxWidthPx", String(maxWidthPx));
    return url.toString();
  }

  const url = new URL("/place-photo", API_BASE_URL);
  url.searchParams.set("name", photoName);
  url.searchParams.set("maxWidthPx", String(maxWidthPx));
  return url.toString();
}

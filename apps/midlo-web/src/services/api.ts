import type { Midpoint, Place, PlaceDetails } from "../types";

export type AutocompleteSuggestion = {
  placeId: string;
  description: string;
};

function apiBaseUrl() {
  const v = import.meta.env.VITE_API_URL;
  if (!v || !v.trim()) throw new Error("Missing VITE_API_URL");
  return v.trim().replace(/\/+$/, "");
}

const API_BASE_URL = apiBaseUrl();

function toApiUrl(path: string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
}

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(toApiUrl(path), {
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
  const res = await fetch(toApiUrl(path), { signal });
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
  const url = new URL("/place-photo", API_BASE_URL);
  url.searchParams.set("name", photoName);
  url.searchParams.set("maxWidthPx", String(maxWidthPx));
  return url.toString();
}

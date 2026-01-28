import type { Midpoint, Place, PlaceDetails } from "../types";

function apiBaseUrl() {
  const env = (import.meta as any).env;
  const v = env?.VITE_API_BASE_URL as string | undefined;
  if (v && v.trim()) return v.trim().replace(/\/$/, "");
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

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`);
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`API error ${res.status}: ${text || res.statusText}`);
  }
  return (await res.json()) as T;
}

export const api = {
  autocomplete: async (input: string): Promise<string[]> => {
    if (!input || input.trim().length < 3) return [];
    const suggestions = await getJson<Array<{ description: string }>>(
      `/autocomplete?input=${encodeURIComponent(input)}`,
    );
    return suggestions.map((s) => s.description).filter(Boolean);
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

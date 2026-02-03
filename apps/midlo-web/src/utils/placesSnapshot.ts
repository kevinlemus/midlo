import type { Place } from "../types";

type PlaceSnapshot = Pick<Place, "placeId" | "name" | "distance" | "lat" | "lng">;

export function encodePlacesSnapshotParam(places: Place[]): string {
  const snapshot: PlaceSnapshot[] = (places ?? []).slice(0, 5).map((p) => ({
    placeId: p.placeId,
    name: p.name,
    distance: p.distance,
    lat: p.lat,
    lng: p.lng,
  }));
  return JSON.stringify(snapshot);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export function decodePlacesSnapshotParam(raw: string | null): Place[] | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return null;

    const places: Place[] = [];
    for (const item of parsed) {
      const p = item as any;
      if (typeof p?.placeId !== "string" || !p.placeId) return null;
      if (typeof p?.name !== "string" || !p.name) return null;
      if (typeof p?.distance !== "string") return null;
      if (!isFiniteNumber(p?.lat) || !isFiniteNumber(p?.lng)) return null;
      places.push({
        placeId: p.placeId,
        name: p.name,
        distance: p.distance,
        lat: p.lat,
        lng: p.lng,
      });
    }

    return places.length ? places.slice(0, 5) : null;
  } catch {
    return null;
  }
}

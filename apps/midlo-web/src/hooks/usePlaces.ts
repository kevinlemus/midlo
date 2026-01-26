import { useState } from "react";
import type { Place } from "../types";

/**
 * Frontend-only places state.
 * Matches the mock data used in Home.tsx.
 */
export function usePlaces() {
  const [places, setPlaces] = useState<Place[]>([]);

  return {
    places,
    setPlaces,
  };
}

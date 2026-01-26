import { useState } from "react";
import type { Midpoint } from "../types";

/**
 * Frontend-only midpoint state.
 * Later, this can be replaced with real logic or backend calls.
 */
export function useMidpoint() {
  const [midpoint, setMidpoint] = useState<Midpoint | null>(null);

  return {
    midpoint,
    setMidpoint,
  };
}

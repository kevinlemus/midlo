import Constants from "expo-constants";
import type { Place } from "../services/api";

function normalizeHttpsBaseUrl(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return null;
  }

  if (url.protocol !== "https:" && url.protocol !== "http:") return null;
  if (!url.hostname) return null;
  return url.toString().replace(/\/+$/, "");
}

export function webBaseUrl(): string {
  // Prefer explicit env var for Expo Go + EAS builds.
  const env = (globalThis as any)?.process?.env?.EXPO_PUBLIC_WEB_BASE_URL as
    | string
    | undefined;
  const normalized = env ? normalizeHttpsBaseUrl(env) : null;
  if (normalized) return normalized;

  // Optional: allow setting via app config extras.
  const extra: any = (Constants as any)?.expoConfig?.extra;
  const fromExtra =
    typeof extra?.webBaseUrl === "string"
      ? normalizeHttpsBaseUrl(extra.webBaseUrl)
      : null;
  if (fromExtra) return fromExtra;

  // Production default.
  return "https://midlo.ai";
}

export function midpointShareUrl(
  locationA: string,
  locationB: string,
  places?: Place[],
): string {
  const u = new URL("/share/midpoint", webBaseUrl());
  if (locationA) u.searchParams.set("a", locationA);
  if (locationB) u.searchParams.set("b", locationB);
  // IMPORTANT: do not embed a places snapshot in the URL.
  // Some apps (notably Instagram) fail to send very long links.
  return u.toString();
}

export function placeShareUrl(placeId: string): string {
  const u = new URL(
    `/share/place/${encodeURIComponent(placeId)}`,
    webBaseUrl(),
  );
  return u.toString();
}

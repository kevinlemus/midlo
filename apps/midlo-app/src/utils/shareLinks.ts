import Constants from "expo-constants";
import type { Place } from "../services/api";

function normalizeHttpsBaseUrl(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (!/^https?:\/\//i.test(trimmed)) return null;

  const withoutTrailingSlash = trimmed.replace(/\/+$/, "");
  const hostMatch = withoutTrailingSlash.match(
    /^https?:\/\/([^\/:?#]+)(?::\d+)?(?:[/?#]|$)/i,
  );
  const hostname = hostMatch?.[1]?.trim();
  if (!hostname) return null;
  return withoutTrailingSlash;
}

function toQueryString(
  params: Record<string, string | number | null | undefined>,
): string {
  const entries = Object.entries(params).filter(
    ([, v]) => v !== null && v !== undefined && String(v).length > 0,
  );
  if (entries.length === 0) return "";
  return entries
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join("&");
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
  placeIdBatches?: string[][],
  startBatchIndex?: number,
): string {
  const base = `${webBaseUrl()}/share/midpoint`;
  const params: Record<string, string> = {};
  if (locationA) params.a = locationA;
  if (locationB) params.b = locationB;

  // When sharing from an earlier batch, open the shared page on that batch
  // while still including all already-loaded batches.
  if (Number.isFinite(startBatchIndex)) {
    const idx = Math.max(0, Math.floor(startBatchIndex as number));
    params.bi = String(idx);
  }

  // Share *all* batches scanned so far, but keep it compact (place IDs only).
  // Format: batch1Id,batch1Id|batch2Id,...
  if (Array.isArray(placeIdBatches) && placeIdBatches.length > 0) {
    const cleaned = placeIdBatches
      .map((batch) => (Array.isArray(batch) ? batch.filter(Boolean) : []))
      .filter((batch) => batch.length > 0);
    if (cleaned.length > 0) {
      params.p = cleaned.map((b) => b.join(",")).join("|");
    }
  }

  const qs = toQueryString(params);
  return qs ? `${base}?${qs}` : base;
}

export function placeShareUrl(placeId: string): string {
  return `${webBaseUrl()}/share/place/${encodeURIComponent(placeId)}`;
}

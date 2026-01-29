// midlo-web/src/services/analytics.ts

export type AnalyticsEvent =
  | "midpoint_searched"
  | "midpoint_shared"
  | "place_opened"
  | "directions_clicked";

export function track(event: AnalyticsEvent, props?: Record<string, any>) {
  // Stub for now — safe no-op
  // Later: Mixpanel / Amplitude / PostHog
  // Example:
  // mixpanel.track(event, props);

  if (process.env.NODE_ENV === "development") {
    console.log("[analytics]", event, props ?? {});
  }
}

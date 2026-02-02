import React, { useEffect, useRef, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { track } from "../services/analytics";
import type { Midpoint, Place } from "../types";

export default function ResultsPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const initialA = params.get("a") ?? "";
  const initialB = params.get("b") ?? "";

  const [locationA, setLocationA] = useState(initialA);
  const [locationB, setLocationB] = useState(initialB);

  const [midpoint, setMidpoint] = useState<Midpoint | null>(null);
  const [places, setPlaces] = useState<Place[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRescanning, setIsRescanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resultsRef = useRef<HTMLDivElement | null>(null);

  const isDisabled = !locationA || !locationB || isLoading || isRescanning;

  useEffect(() => {
    if (initialA && initialB) {
      void handleFindMidpoint(true);
    }
  }, []);

  const handleFindMidpoint = async (fromQuery = false) => {
    if (!locationA || !locationB) {
      setError("Add both locations to find a fair midpoint.");
      return;
    }

    setIsLoading(true);
    setIsRescanning(false);
    setError(null);
    setMidpoint(null);
    setPlaces([]);

    try {
      const mp = await api.getMidpoint(locationA, locationB);
      const nearby = await api.getPlaces(mp.lat, mp.lng);

      setMidpoint(mp);
      setPlaces(nearby);

      track("midpoint_searched", {
        locationA,
        locationB,
        placesCount: nearby.length,
        source: fromQuery ? "query_params" : "inline",
      });

      setTimeout(() => {
        if (resultsRef.current) {
          const rect = resultsRef.current.getBoundingClientRect();
          const top = window.scrollY + rect.top - 24;
          window.scrollTo({ top, behavior: "smooth" });
        }
      }, 120);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRescanPlaces = async () => {
    if (!midpoint) return;

    setIsRescanning(true);
    setError(null);

    try {
      const nearby = await api.getPlaces(midpoint.lat, midpoint.lng);
      setPlaces(nearby);

      track("places_rescanned" as Parameters<typeof track>[0], {
        locationA,
        locationB,
        placesCount: nearby.length,
        source: "results_rescan",
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn’t refresh options. Try again.");
    } finally {
      setIsRescanning(false);
    }
  };

  const handleShareMidpoint = async () => {
    const url = new URL("/share/midpoint", window.location.origin);
    if (locationA) url.searchParams.set("a", locationA);
    if (locationB) url.searchParams.set("b", locationB);

    const urlString = url.toString();

    try {
      await navigator.clipboard.writeText(urlString);
      alert("Link copied to clipboard.");
    } catch {
      alert("Here’s your link:\n\n" + urlString);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "var(--color-bg)",
        display: "flex",
        justifyContent: "center",
        padding: "var(--space-xl) var(--space-lg)",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 960,
          display: "grid",
          gridTemplateColumns: "minmax(0, 1.2fr) minmax(0, 1.4fr)",
          gap: "var(--space-xl)",
        }}
      >
        {/* LEFT COLUMN */}
        <div>
          <div
            style={{
              padding: "var(--space-sm) var(--space-md)",
              borderRadius: "var(--radius-pill)",
              backgroundColor: "var(--color-highlight)",
              display: "inline-flex",
              alignItems: "center",
              marginBottom: "var(--space-md)",
            }}
          >
            <span
              style={{
                fontSize: "var(--font-size-caption)",
                color: "var(--color-primary-dark)",
                fontWeight: 500,
                letterSpacing: 0.5,
                textTransform: "uppercase",
              }}
            >
              Meet in the middle
            </span>
          </div>

          <h1
            style={{
              fontSize: "var(--font-size-heading)",
              color: "var(--color-primary-dark)",
              margin: 0,
              marginBottom: "var(--space-sm)",
            }}
          >
            A fair place to meet, in seconds.
          </h1>

          <p
            style={{
              fontSize: "var(--font-size-body)",
              color: "var(--color-text-secondary)",
              marginBottom: "var(--space-lg)",
            }}
          >
            Drop in two locations and we’ll find a friendly halfway spot that feels fair to both
            sides—plus nearby places that actually feel good to meet at.
          </p>

          {/* INPUTS */}
          <div style={{ display: "grid", gap: "var(--space-md)" }}>
            <div>
              <div
                style={{
                  fontSize: "var(--font-size-caption)",
                  color: "var(--color-text-secondary)",
                  marginBottom: "var(--space-xs)",
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                }}
              >
                Location A
              </div>
              <input
                value={locationA}
                onChange={(e) => setLocationA(e.target.value)}
                placeholder="Enter first location"
                className="midlo-input"
              />
            </div>

            <div>
              <div
                style={{
                  fontSize: "var(--font-size-caption)",
                  color: "var(--color-text-secondary)",
                  marginBottom: "var(--space-xs)",
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                }}
              >
                Location B
              </div>
              <input
                value={locationB}
                onChange={(e) => setLocationB(e.target.value)}
                placeholder="Enter second location"
                className="midlo-input"
              />
            </div>

            <button
              type="button"
              onClick={() => void handleFindMidpoint(false)}
              disabled={isDisabled}
              className="midlo-button midlo-button-primary"
            >
              {isLoading ? "Finding midpoint…" : "Find midpoint"}
            </button>

            {error && (
              <div
                style={{
                  marginTop: "var(--space-sm)",
                  padding: "var(--space-md)",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid #FCA5A5",
                  backgroundColor: "#FEF2F2",
                  color: "var(--color-danger)",
                  fontSize: "var(--font-size-caption)",
                }}
              >
                {error}
              </div>
            )}

            <p
              style={{
                fontSize: "var(--font-size-caption)",
                color: "var(--color-muted)",
                marginTop: "var(--space-sm)",
              }}
            >
              No accounts. No friction. Just a fair place to meet.
            </p>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div ref={resultsRef}>
          {/* MAP PLACEHOLDER */}
          <div
            style={{
              width: "100%",
              height: 260,
              borderRadius: "var(--radius-lg)",
              border: "1px solid var(--color-divider)",
              background:
                "radial-gradient(circle at 20% 20%, #E8F5E9 0, #F3F4F6 40%, #FFFFFF 100%)",
              marginBottom: "var(--space-lg)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--color-text-secondary)",
              fontSize: "var(--font-size-caption)",
            }}
          >
            {midpoint
              ? "Map centered on your midpoint and nearby options."
              : "Your midpoint map will appear here."}
          </div>

          {midpoint && (
            <div
              style={{
                marginBottom: "var(--space-md)",
                padding: "var(--space-sm)",
                borderRadius: "var(--radius-pill)",
                backgroundColor: "var(--color-highlight)",
                textAlign: "center",
              }}
            >
              <span
                style={{
                  fontSize: "var(--font-size-caption)",
                  color: "var(--color-primary-dark)",
                }}
              >
                Midpoint · Lat {midpoint.lat.toFixed(4)} · Lng {midpoint.lng.toFixed(4)}
              </span>
            </div>
          )}

          {/* RESULTS */}
          {places.length > 0 && (
            <div>
              {/* HEADER + RESCAN */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "var(--space-xs)",
                }}
              >
                <div
                  style={{
                    fontSize: "var(--font-size-subheading)",
                    color: "var(--color-primary-dark)",
                    fontWeight: 500,
                  }}
                >
                  Nearby options
                </div>

                <button
                  type="button"
                  onClick={handleRescanPlaces}
                  disabled={isRescanning}
                  className="midlo-button midlo-button-secondary"
                  style={{
                    padding: "6px 12px",
                    fontSize: "var(--font-size-caption)",
                    borderRadius: "var(--radius-pill)",
                    whiteSpace: "nowrap",
                  }}
                >
                  {isRescanning ? "Finding new options…" : "See different options"}
                </button>
              </div>

              <div
                style={{
                  fontSize: "var(--font-size-caption)",
                  color: "var(--color-muted)",
                  marginBottom: "var(--space-md)",
                }}
              >
                A few places that make meeting in the middle actually feel good.
              </div>

              {/* LIST */}
              <div style={{ display: "grid", gap: "var(--space-sm)" }}>
                {places.map((p) => (
                  <button
                    key={p.placeId}
                    type="button"
                    onClick={() => navigate(`/p/${encodeURIComponent(p.placeId)}`)}
                    style={{
                      textAlign: "left",
                      padding: "var(--space-md)",
                      borderRadius: "var(--radius-md)",
                      border: "1px solid var(--color-divider)",
                      backgroundColor: "var(--color-surface)",
                      cursor: "pointer",
                      boxShadow: "var(--shadow-card)",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "var(--font-size-body)",
                        color: "var(--color-text)",
                        fontWeight: 500,
                        marginBottom: "var(--space-xs)",
                      }}
                    >
                      {p.name}
                    </div>
                    <div
                      style={{
                        fontSize: "var(--font-size-caption)",
                        color: "var(--color-muted)",
                      }}
                    >
                      {p.distance} from midpoint
                    </div>
                  </button>
                ))}
              </div>

              {/* SHARE BUTTON — MOVED DOWN */}
              <button
                type="button"
                onClick={handleShareMidpoint}
                className="midlo-button midlo-button-secondary"
                style={{
                  marginTop: "var(--space-lg)",
                  width: "100%",
                }}
              >
                Share this midpoint & list
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

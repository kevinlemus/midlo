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
  const [error, setError] = useState<string | null>(null);

  const resultsRef = useRef<HTMLDivElement | null>(null);

  const isDisabled = !locationA || !locationB || isLoading;

  useEffect(() => {
    if (initialA && initialB) {
      void handleFindMidpoint(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFindMidpoint = async (fromQuery = false) => {
    if (!locationA || !locationB) {
      setError("Add both locations to find a fair midpoint.");
      return;
    }

    setIsLoading(true);
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

      // Smoothly scroll to results once they’re ready
      setTimeout(() => {
        if (resultsRef.current) {
          resultsRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 120);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleShareMidpoint = async () => {
    const url = new URL("/share/midpoint", window.location.origin);
    if (locationA) url.searchParams.set("a", locationA);
    if (locationB) url.searchParams.set("b", locationB);

    try {
      await navigator.clipboard.writeText(url.toString());
      alert("Link copied to clipboard.");
    } catch {
      alert("Here’s your link:\n\n" + url.toString());
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
        {/* Left column – inputs and hero copy */}
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
              margin: 0,
              marginBottom: "var(--space-lg)",
            }}
          >
            Drop in two locations and we’ll find a friendly halfway spot that feels fair to both
            sides—plus nearby places that actually feel good to meet at.
          </p>

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

            <div style={{ display: "grid", gap: "var(--space-sm)" }}>
              <button
                type="button"
                onClick={() => void handleFindMidpoint(false)}
                disabled={isDisabled}
                className="midlo-button midlo-button-primary"
              >
                {isLoading ? "Finding midpoint…" : "Find midpoint"}
              </button>

              {midpoint && (
                <button
                  type="button"
                  onClick={handleShareMidpoint}
                  className="midlo-button midlo-button-secondary"
                >
                  Share link
                </button>
              )}
            </div>

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

        {/* Right column – map + results */}
        <div ref={resultsRef}>
          {/* Map shell / placeholder – your existing Map component can live here */}
          <div
            style={{
              width: "100%",
              height: 260,
              borderRadius: "var(--radius-lg)",
              border: "1px solid var(--color-divider)",
              background:
                "radial-gradient(circle at 20% 20%, #E8F5E9 0, #F3F4F6 40%, #FFFFFF 100%)",
              marginBottom: "var(--space-lg)",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* You can swap this with your real Map component */}
            <div
              style={{
                position: "absolute",
                inset: 0,
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

          {isLoading && !places.length && (
            <div style={{ display: "grid", gap: "var(--space-sm)" }}>
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  style={{
                    padding: "var(--space-md)",
                    borderRadius: "var(--radius-md)",
                    backgroundColor: "#E5E7EB",
                    opacity: 0.7,
                  }}
                >
                  <div
                    style={{
                      width: "60%",
                      height: 14,
                      borderRadius: 999,
                      backgroundColor: "#CBD5F5",
                      marginBottom: "var(--space-xs)",
                    }}
                  />
                  <div
                    style={{
                      width: "40%",
                      height: 10,
                      borderRadius: 999,
                      backgroundColor: "#D1D5DB",
                    }}
                  />
                </div>
              ))}
            </div>
          )}

          {places.length > 0 && (
            <div>
              <div
                style={{
                  fontSize: "var(--font-size-subheading)",
                  color: "var(--color-primary-dark)",
                  fontWeight: 500,
                  marginBottom: "var(--space-xs)",
                }}
              >
                Nearby options
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

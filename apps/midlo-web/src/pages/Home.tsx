import React, { useEffect, useRef, useState } from "react";
import "../styles/theme.css";
import "../styles/globals.css";
import SearchBar from "../components/SearchBar";
import Button from "../components/Button";
import MapView from "../components/MapView";
import PlaceCard from "../components/PlaceCard";
import OpenInAppBanner from "../components/OpenInAppBanner";
import { api } from "../services/api";
import type { Place } from "../types";
import { useNavigate, useSearchParams } from "react-router-dom";
import { track } from "../services/analytics";

import midloLogo from "../assets/midlo_logo.png";

export default function Home() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [aText, setAText] = useState("");
  const [bText, setBText] = useState("");

  const [midpoint, setMidpoint] = useState<null | { lat: number; lng: number }>(null);
  const [places, setPlaces] = useState<Place[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isDisabled = !aText || !bText;

  // Scroll target for results
  const resultsRef = useRef<HTMLDivElement | null>(null);
  const fromQueryRef = useRef(false);

  // ⭐ On load: if URL has ?a= & ?b=, load results + scroll.
  // If URL has NO params, clear everything (fresh home).
  useEffect(() => {
    const a = searchParams.get("a") ?? "";
    const b = searchParams.get("b") ?? "";

    const hasQuery = Boolean(a && b);

    if (!hasQuery) {
      // Fresh home page → clean slate
      setAText("");
      setBText("");
      setMidpoint(null);
      setPlaces([]);
      return;
    }

    // If query params exist → load results
    setAText(a);
    setBText(b);
    fromQueryRef.current = true;

    (async () => {
      try {
        setIsLoading(true);
        setError(null);
        const mp = await api.getMidpoint(a, b);
        setMidpoint(mp);
        const pl = await api.getPlaces(mp.lat, mp.lng);
        setPlaces(pl);

        // Auto-scroll to results
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
    })();
  }, []);

  // ⭐ Inline search
  const handleFind = async () => {
    if (isDisabled || isLoading) return;
    setIsLoading(true);
    setError(null);
    setPlaces([]);
    setMidpoint(null);
    fromQueryRef.current = false;

    try {
      const mp = await api.getMidpoint(aText, bText);
      const pl = await api.getPlaces(mp.lat, mp.lng);

      track("midpoint_searched", {
        locationA: aText,
        locationB: bText,
        placesCount: pl.length,
      });

      setMidpoint(mp);
      setPlaces(pl);

      // Update URL
      setSearchParams({ a: aText, b: bText }, { replace: true });

      // Scroll to results
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

  // ⭐ Share midpoint
  const handleShare = async () => {
    const shareUrl = new URL("/share/midpoint", window.location.origin);
    if (aText) shareUrl.searchParams.set("a", aText);
    if (bText) shareUrl.searchParams.set("b", bText);

    const urlString = shareUrl.toString();

    track("midpoint_shared", { shareUrl: urlString });

    // Clean share (URL only)
    if ((navigator as any).share) {
      try {
        await (navigator as any).share({
          title: "Meet in the middle with Midlo",
          url: urlString,
        });
        return;
      } catch {}
    }

    try {
      await navigator.clipboard.writeText(urlString);
      alert("Link copied to clipboard.");
    } catch {
      alert("Here’s your link:\n\n" + urlString);
    }
  };

  // ⭐ Clear button
  const handleClear = () => {
    setAText("");
    setBText("");
    setMidpoint(null);
    setPlaces([]);
    setSearchParams({}, { replace: true });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        backgroundColor: "var(--color-bg)",
        color: "var(--color-text)",
        padding: "var(--space-xl) var(--space-lg)",
      }}
    >
      <main
        style={{
          width: "100%",
          maxWidth: 520,
          backgroundColor: "var(--color-surface)",
          borderRadius: "var(--radius-lg)",
          padding: "var(--space-xl)",
          border: "1px solid var(--color-divider)",
          boxShadow: "var(--shadow-card)",
        }}
      >
        <OpenInAppBanner context="home" />

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "var(--space-lg)" }}>
          <div
            style={{
              display: "inline-flex",
              justifyContent: "center",
              alignItems: "center",
              padding: "4px 12px",
              borderRadius: "var(--radius-pill)",
              backgroundColor: "var(--color-highlight)",
              color: "var(--color-primary-dark)",
              fontSize: "var(--font-size-caption)",
              letterSpacing: 0.5,
              textTransform: "uppercase",
              marginBottom: "var(--space-sm)",
            }}
          >
            Meet in the middle
          </div>

          <img
            src={midloLogo}
            alt="Midlo"
            style={{
              width: 140,
              height: "auto",
              marginBottom: "var(--space-sm)",
              objectFit: "contain",
              marginLeft: "auto",
              marginRight: "auto",
            }}
          />

          <h1
            style={{
              fontSize: "var(--font-size-heading)",
              color: "var(--color-primary-dark)",
              margin: 0,
              marginBottom: "var(--space-xs)",
            }}
          >
            A fair place to meet, in seconds.
          </h1>

          <p
            style={{
              fontSize: "var(--font-size-body)",
              color: "var(--color-text-secondary)",
              margin: 0,
            }}
          >
            Drop in two locations and we’ll find a friendly halfway spot that feels fair to both
            sides—plus a few places that actually feel good to meet at.
          </p>
        </div>

        {/* Inputs */}
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
            <SearchBar placeholder="Enter first location" value={aText} onChange={setAText} />
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
            <SearchBar placeholder="Enter second location" value={bText} onChange={setBText} />
          </div>

          <div style={{ marginTop: "var(--space-sm)", display: "grid", gap: "var(--space-sm)" }}>
            <Button
              title={isLoading ? "Finding midpoint…" : "Find midpoint"}
              onClick={handleFind}
              disabled={isDisabled || isLoading}
            />

            {midpoint && (
              <>
                <Button title="Share link" onClick={handleShare} variant="secondary" />
                <Button title="Clear" onClick={handleClear} variant="secondary" />
              </>
            )}
          </div>

          {error && (
            <div
              style={{
                marginTop: "var(--space-sm)",
                padding: "var(--space-md)",
                borderRadius: "var(--radius-md)",
                border: "1px solid #ffb4b4",
                backgroundColor: "#2a0f0f",
                color: "#ffd2d2",
                fontSize: "var(--font-size-caption)",
              }}
            >
              <div style={{ marginBottom: "var(--space-xs)" }}>{error}</div>

              <button
                type="button"
                onClick={handleFind}
                style={{
                  padding: "6px 10px",
                  borderRadius: "var(--radius-pill)",
                  border: "1px solid #ffb4b4",
                  backgroundColor: "transparent",
                  color: "#ffd2d2",
                  cursor: "pointer",
                  fontSize: "var(--font-size-caption)",
                }}
              >
                Try again
              </button>
            </div>
          )}

          <p
            style={{
              fontSize: "var(--font-size-caption)",
              color: "var(--color-muted)",
              textAlign: "center",
              marginTop: "var(--space-xs)",
              marginBottom: 0,
            }}
          >
            No accounts. No friction. Just a fair place to meet.
          </p>
        </div>

        {/* Midpoint + map + results */}
        <div ref={resultsRef} style={{ marginTop: "var(--space-lg)" }}>
          <MapView height={240} hasMidpoint={Boolean(midpoint)} placesCount={places.length} />

          {midpoint && (
            <div
              style={{
                marginTop: "var(--space-sm)",
                padding: "var(--space-sm)",
                borderRadius: "var(--radius-md)",
                backgroundColor: "var(--color-highlight)",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontSize: "var(--font-size-subheading)",
                  color: "var(--color-primary-dark)",
                  fontWeight: 500,
                }}
              >
                Midpoint found
              </div>
              <div
                style={{
                  fontSize: "var(--font-size-caption)",
                  color: "var(--color-text-secondary)",
                  marginTop: "var(--space-xs)",
                }}
              >
                Lat {midpoint.lat.toFixed(4)} · Lng {midpoint.lng.toFixed(4)}
              </div>
            </div>
          )}

          {/* Skeletons */}
          {isLoading && !places.length && (
            <div
              style={{
                marginTop: "var(--space-md)",
                display: "grid",
                gap: "var(--space-sm)",
              }}
            >
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  style={{
                    padding: "var(--space-md)",
                    borderRadius: "var(--radius-md)",
                    backgroundColor: "#E5E7EB",
                    opacity: 0.6,
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

          {/* Places */}
          {places.length > 0 && (
            <div style={{ marginTop: "var(--space-lg)" }}>
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
                  marginBottom: "var(--space-sm)",
                }}
              >
                A few places that make meeting in the middle actually feel good.
              </div>

              <div style={{ display: "grid", gap: "var(--space-sm)" }}>
                {places.map((p, idx) => (
                  <PlaceCard
                    key={p.placeId ?? String(idx)}
                    title={p.name}
                    distance={p.distance}
                    onClick={() => {
                      track("place_opened", { placeId: p.placeId });

                      if (p.placeId) {
                        const url = new URL(window.location.href);
                        const a = aText || "";
                        const b = bText || "";
                        if (a) url.searchParams.set("a", a);
                        if (b) url.searchParams.set("b", b);
                        navigate(`/p/${encodeURIComponent(p.placeId)}${url.search}`, {
                          replace: false,
                        });
                      }
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {!midpoint && !places.length && !isLoading && (
            <div
              style={{
                marginTop: "var(--space-md)",
                fontSize: "var(--font-size-caption)",
                color: "var(--color-muted)",
                textAlign: "center",
              }}
            >
              Add two locations above and see where you should meet in the middle.
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

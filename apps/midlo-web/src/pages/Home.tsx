import React, { useEffect, useState } from "react";
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

  // On mount: hydrate from URL (?a=...&b=...)
  useEffect(() => {
    const a = searchParams.get("a") ?? "";
    const b = searchParams.get("b") ?? "";

    if (a || b) {
      setAText(a);
      setBText(b);

      if (a && b && !midpoint && !places.length) {
        (async () => {
          try {
            setIsLoading(true);
            setError(null);
            const mp = await api.getMidpoint(a, b);
            setMidpoint(mp);
            const pl = await api.getPlaces(mp.lat, mp.lng);
            setPlaces(pl);
          } catch (e) {
            setError(e instanceof Error ? e.message : "Something went wrong. Try again.");
          } finally {
            setIsLoading(false);
          }
        })();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFind = async () => {
    if (isDisabled || isLoading) return;
    setIsLoading(true);
    setError(null);
    setPlaces([]);
    setMidpoint(null);

    try {
      const mp = await api.getMidpoint(aText, bText);
      setMidpoint(mp);
      const pl = await api.getPlaces(mp.lat, mp.lng);
      setPlaces(pl);

      // Update URL for shareability and back-restore
      setSearchParams({ a: aText, b: bText }, { replace: true });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleShare = async () => {
    const url = new URL(window.location.href);
    if (aText && bText) {
      url.searchParams.set("a", aText);
      url.searchParams.set("b", bText);
    }
    const shareUrl = url.toString();

    const message = midpoint
      ? `Meet in the middle with Midlo\n\nA: ${aText}\nB: ${bText}\nMidpoint: (${midpoint.lat.toFixed(
          4,
        )}, ${midpoint.lng.toFixed(4)})\n\n${shareUrl}`
      : `Meet in the middle with Midlo\n\nA: ${aText}\nB: ${bText}\n\n${shareUrl}`;

    if ((navigator as any).share) {
      try {
        await (navigator as any).share({
          title: "Meet in the middle with Midlo",
          text: message,
          url: shareUrl,
        });
        return;
      } catch {
        // fall through to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      alert("Link copied to clipboard.");
    } catch {
      alert("Here’s your link:\n\n" + shareUrl);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "var(--color-bg)",
        color: "var(--color-text)",
        padding: "24px 16px",
      }}
    >
      <main
        style={{
          width: "100%",
          maxWidth: 520,
          backgroundColor: "var(--color-surface)",
          borderRadius: "var(--radius-lg)",
          padding: 24,
          border: "1px solid var(--color-divider)",
          boxShadow: "var(--shadow-card)",
        }}
      >
        <OpenInAppBanner context="home" />

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              padding: "4px 12px",
              borderRadius: "var(--radius-pill)",
              backgroundColor: "var(--color-highlight)",
              color: "var(--color-primary-dark)",
              fontSize: "var(--font-size-caption)",
              letterSpacing: 0.5,
              textTransform: "uppercase",
              marginBottom: 10,
              width: "100%",
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
              marginBottom: 8,
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
              marginBottom: 4,
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
            Drop in two locations and we’ll find a friendly halfway spot that feels fair to both sides—plus a few places
            that actually feel good to meet at.
          </p>
        </div>

        {/* Inputs */}
        <div style={{ display: "grid", gap: 12 }}>
          <div>
            <div
              style={{
                fontSize: "var(--font-size-caption)",
                color: "var(--color-text-secondary)",
                marginBottom: 4,
                textTransform: "uppercase",
                letterSpacing: 0.5,
              }}
            >
              Location A
            </div>
            <SearchBar
              placeholder="Enter first location"
              value={aText}
              onChange={setAText}
            />
          </div>

          <div>
            <div
              style={{
                fontSize: "var(--font-size-caption)",
                color: "var(--color-text-secondary)",
                marginBottom: 4,
                textTransform: "uppercase",
                letterSpacing: 0.5,
              }}
            >
              Location B
            </div>
            <SearchBar
              placeholder="Enter second location"
              value={bText}
              onChange={setBText}
            />
          </div>

          <div style={{ marginTop: 8, display: "grid", gap: 8 }}>
            <Button
              title={isLoading ? "Finding midpoint…" : "Find midpoint"}
              onClick={handleFind}
              disabled={isDisabled || isLoading}
            />
            {midpoint && (
              <Button
                title="Share link"
                onClick={handleShare}
                variant="secondary"
              />
            )}
          </div>

          {error && (
            <div
              style={{
                marginTop: 8,
                padding: 12,
                borderRadius: "var(--radius-md)",
                border: "1px solid #ffb4b4",
                backgroundColor: "#2a0f0f",
                color: "#ffd2d2",
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
              textAlign: "center",
              marginTop: 4,
              marginBottom: 0,
            }}
          >
            No accounts. No friction. Just a fair place to meet.
          </p>
        </div>

        {/* Midpoint + map */}
        <div style={{ marginTop: 20 }}>
          <MapView
            height={240}
            hasMidpoint={Boolean(midpoint)}
            placesCount={places.length}
          />

          {midpoint && (
            <div
              style={{
                marginTop: 10,
                padding: 10,
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
                  marginTop: 2,
                }}
              >
                Lat {midpoint.lat.toFixed(4)} · Lng {midpoint.lng.toFixed(4)}
              </div>
            </div>
          )}
        </div>

        {/* Places */}
        {places.length > 0 && (
          <div style={{ marginTop: 20 }}>
            <div
              style={{
                fontSize: "var(--font-size-subheading)",
                color: "var(--color-primary-dark)",
                fontWeight: 500,
                marginBottom: 4,
              }}
            >
              Nearby options
            </div>
            <div
              style={{
                fontSize: "var(--font-size-caption)",
                color: "var(--color-muted)",
                marginBottom: 10,
              }}
            >
              A few places that make meeting in the middle actually feel good.
            </div>

            <div style={{ display: "grid", gap: 8 }}>
              {places.map((p, idx) => (
                <PlaceCard
                  key={p.placeId ?? String(idx)}
                  title={p.name}
                  distance={p.distance}
                  onClick={() => {
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
              marginTop: 16,
              fontSize: "var(--font-size-caption)",
              color: "var(--color-muted)",
              textAlign: "center",
            }}
          >
            Add two locations above and see where you should meet in the middle.
          </div>
        )}
      </main>
    </div>
  );
}

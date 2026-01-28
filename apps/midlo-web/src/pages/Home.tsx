import React, { useState } from "react";
import "../styles/theme.css";
import SearchBar from "../components/SearchBar";
import Button from "../components/Button";
import MapView from "../components/MapView";
import PlaceCard from "../components/PlaceCard";
import { api } from "../services/api";
import type { Place } from "../types";
import { useNavigate } from "react-router-dom";

import midloLogo from "../assets/midlo_logo.png";

export default function Home() {
  const navigate = useNavigate();
  const [aText, setAText] = useState("");
  const [bText, setBText] = useState("");

  // MVP: results only appear AFTER pressing the button
  const [midpoint, setMidpoint] = useState<null | { lat: number; lng: number }>(null);
  const [places, setPlaces] = useState<Place[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isDisabled = !aText || !bText;

  const handleFind = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const mp = await api.getMidpoint(aText, bText);
      setMidpoint(mp);
      const pl = await api.getPlaces(mp.lat, mp.lng);
      setPlaces(pl);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "var(--color-bg)",
        color: "var(--color-text)",
        padding: 24,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 480,
          backgroundColor: "var(--color-surface)",
          borderRadius: "var(--radius-lg)",
          padding: 24,
          border: "1px solid var(--color-accent)",
          boxShadow: "var(--shadow-card)",
        }}
      >
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <img
            src={midloLogo}
            alt="Midlo"
            style={{
              width: 140,
              height: "auto",
              marginBottom: 8,
              objectFit: "contain",
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
            Meet in the middle with Midlo
          </h1>
          <p
            style={{
              fontSize: "var(--font-size-body)",
              color: "var(--color-text-secondary)",
              margin: 0,
            }}
          >
            Drop in two locations and we’ll find a fair, friendly halfway spot.
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

          <div style={{ marginTop: 12 }}>
            <Button
              title="Find midpoint"
              onClick={handleFind}
              disabled={isDisabled || isLoading}
            />
          </div>

          {error && (
            <div
              style={{
                marginTop: 12,
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

        {/* Midpoint Result */}
        {midpoint && (
          <div style={{ marginTop: 24 }}>
            <div
              style={{
                marginBottom: 12,
                padding: 12,
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
                Midpoint
              </div>
              <div
                style={{
                  fontSize: "var(--font-size-body)",
                  color: "var(--color-text-secondary)",
                }}
              >
                Lat {midpoint.lat.toFixed(4)} · Lng {midpoint.lng.toFixed(4)}
              </div>
            </div>

            <MapView />
          </div>
        )}

        {/* Places */}
        {places.length > 0 && (
          <div style={{ marginTop: 24 }}>
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
                marginBottom: 12,
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
                    if (p.placeId) navigate(`/p/${encodeURIComponent(p.placeId)}`);
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

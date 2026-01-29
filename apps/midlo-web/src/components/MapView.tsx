import React from "react";
import "../styles/theme.css";

type Props = {
  height?: number;
  hasMidpoint?: boolean;
  placesCount?: number;
};

export default function MapView({
  height = 240,
  hasMidpoint = false,
  placesCount = 0,
}: Props) {
  const label = hasMidpoint
    ? placesCount > 0
      ? `Midpoint with ${placesCount} nearby spot${placesCount === 1 ? "" : "s"}`
      : "Midpoint found"
    : "Your midpoint map will appear here";

  return (
    <div
      style={{
        width: "100%",
        height,
        border: "1px solid var(--color-divider)",
        borderRadius: "var(--radius-lg)",
        background:
          "radial-gradient(circle at 30% 30%, #e8f5e9 0%, #f1f8f2 40%, #ffffff 100%)",
        position: "relative",
        overflow: "hidden",
        boxShadow: "var(--shadow-card)",
      }}
    >
      {/* Grid */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.22,
          backgroundImage:
            "linear-gradient(90deg, rgba(0,0,0,0.08) 1px, transparent 1px), linear-gradient(180deg, rgba(0,0,0,0.08) 1px, transparent 1px)",
          backgroundSize: "36px 36px",
        }}
      />

      {/* Midpoint pin + radius */}
      {hasMidpoint && (
        <>
          {/* Pulse radius */}
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              width: 120,
              height: 120,
              marginLeft: -60,
              marginTop: -60,
              borderRadius: "50%",
              backgroundColor: "rgba(76, 175, 80, 0.12)",
              border: "2px solid rgba(76, 175, 80, 0.25)",
              animation: "map-pulse 2.4s ease-out infinite",
            }}
          />

          {/* Static radius ring */}
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              width: 80,
              height: 80,
              marginLeft: -40,
              marginTop: -40,
              borderRadius: "50%",
              border: "2px dashed rgba(76, 175, 80, 0.4)",
            }}
          />

          {/* Midpoint pin */}
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              width: 18,
              height: 18,
              marginLeft: -9,
              marginTop: -9,
              borderRadius: "50%",
              backgroundColor: "var(--color-bright)",
              border: "2px solid white",
              boxShadow: "0 0 4px rgba(0,0,0,0.25)",
            }}
          />
        </>
      )}

      {/* Label */}
      <div
        style={{
          position: "absolute",
          bottom: 12,
          left: "50%",
          transform: "translateX(-50%)",
          padding: "6px 14px",
          borderRadius: "var(--radius-pill)",
          backgroundColor: "rgba(255,255,255,0.9)",
          border: "1px solid var(--color-accent)",
          fontSize: "var(--font-size-caption)",
          color: "var(--color-primary-dark)",
          boxShadow: "var(--shadow-card)",
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </div>
    </div>
  );
}

import React from "react";
import "../styles/theme.css";

type Props = {
  title?: string;
  distance?: string;
  onClick?: () => void;
};

export default function PlaceCard({ title = "Place", distance, onClick }: Props) {
  const clickable = Boolean(onClick);

  return (
    <div
      role={clickable ? "button" : undefined}
      tabIndex={clickable ? 0 : undefined}
      onClick={onClick}
      onKeyDown={(e) => {
        if (!onClick) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      style={{
        padding: "12px",
        border: "1px solid var(--color-divider)",
        borderRadius: "var(--radius-md)",
        backgroundColor: "var(--color-surface)",
        color: "var(--color-text)",
        boxShadow: "var(--shadow-card)",
        cursor: clickable ? "pointer" : "default",
        transition:
          "transform 0.08s ease-out, box-shadow 0.08s ease-out, background-color 0.08s ease-out",
      }}
      onMouseDown={(e) => {
        if (!clickable) return;
        (e.currentTarget as HTMLDivElement).style.transform = "scale(0.98)";
      }}
      onMouseUp={(e) => {
        if (!clickable) return;
        (e.currentTarget as HTMLDivElement).style.transform = "scale(1)";
      }}
      onMouseLeave={(e) => {
        if (!clickable) return;
        (e.currentTarget as HTMLDivElement).style.transform = "scale(1)";
      }}
    >
      <div
        style={{
          fontSize: "var(--font-size-body)",
          fontWeight: 500,
          marginBottom: distance ? 4 : 0,
        }}
      >
        {title}
      </div>
      {distance && (
        <div
          style={{
            fontSize: "var(--font-size-caption)",
            color: "var(--color-muted)",
          }}
        >
          {distance} from midpoint
        </div>
      )}
    </div>
  );
}

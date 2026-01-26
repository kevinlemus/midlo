import React from "react";

type Props = {
  title: string;
  description: string;
  icon?: React.ReactNode;
};

export default function FeatureCard({ title, description, icon }: Props) {
  return (
    <div
      style={{
        padding: 24,
        borderRadius: "var(--radius-lg)",
        backgroundColor: "var(--color-surface)",
        border: "1px solid var(--color-divider)",
        boxShadow: "var(--shadow-card)",
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      {icon && <div style={{ fontSize: 32 }}>{icon}</div>}

      <h3
        style={{
          margin: 0,
          fontSize: "var(--font-size-subheading)",
          color: "var(--color-primary-dark)",
          fontWeight: 600,
        }}
      >
        {title}
      </h3>

      <p
        style={{
          margin: 0,
          fontSize: "var(--font-size-body)",
          color: "var(--color-text-secondary)",
        }}
      >
        {description}
      </p>
    </div>
  );
}

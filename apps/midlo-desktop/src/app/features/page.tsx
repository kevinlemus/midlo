import React from "react";
import FeatureCard from "../../components/FeatureCard";

export default function FeaturesPage() {
  return (
    <>
      <section
        style={{
          padding: "64px 24px",
          backgroundColor: "var(--color-bg)",
          borderBottom: "1px solid var(--color-divider)",
        }}
      >
        <div
          style={{
            maxWidth: "var(--max-width)",
            margin: "0 auto",
            textAlign: "center",
          }}
        >
          <h1
            style={{
              fontSize: "var(--font-size-heading)",
              color: "var(--color-primary-dark)",
              marginBottom: 12,
            }}
          >
            Features
          </h1>
          <p
            style={{
              fontSize: "var(--font-size-body)",
              color: "var(--color-text-secondary)",
              maxWidth: 600,
              margin: "0 auto",
            }}
          >
            Everything you need to meet in the middle — fairly, quickly, and
            without friction.
          </p>
        </div>
      </section>

      <section
        style={{
          maxWidth: "var(--max-width)",
          margin: "48px auto",
          padding: "0 24px",
          display: "grid",
          gap: 24,
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
        }}
      >
        <FeatureCard
          title="Instant midpoint"
          description="Drop in two locations and get a fair midpoint instantly."
          icon="📍"
        />
        <FeatureCard
          title="Nearby places"
          description="Coffee shops, parks, restaurants — curated options that feel good."
          icon="☕"
        />
        <FeatureCard
          title="Zero accounts"
          description="No sign‑ups. No friction. Just a place to meet."
          icon="⚡"
        />
        <FeatureCard
          title="Cross‑platform"
          description="Use Midlo on mobile, web, or desktop — your choice."
          icon="💻"
        />
        <FeatureCard
          title="Shareable results"
          description="Send a midpoint to friends instantly."
          icon="🔗"
        />
        <FeatureCard
          title="Future AI features"
          description="Smart suggestions, vibes, group midpoints — coming soon."
          icon="🤖"
        />
      </section>
    </>
  );
}

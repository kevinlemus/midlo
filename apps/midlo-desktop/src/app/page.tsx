import React from "react";
import Hero from "../components/Hero";
import FeatureCard from "../components/FeatureCard";

export default function Home() {
  return (
    <>
      <Hero />

      {/* Section: What you can do */}
      <section
        style={{
          maxWidth: "var(--max-width)",
          margin: "64px auto",
          padding: "0 24px",
          textAlign: "center",
        }}
      >
        <h2
          style={{
            fontSize: "var(--font-size-heading)",
            color: "var(--color-primary-dark)",
            marginBottom: 24,
          }}
        >
          What you can do
        </h2>

        <div
          style={{
            display: "grid",
            gap: 24,
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          }}
        >
          <FeatureCard
            title="Midpoint Search"
            description="Discover places between two locations"
            icon="📍"
          />
        </div>
      </section>

      {/* Section: Call to action */}
      <section
        style={{
          maxWidth: "var(--max-width)",
          margin: "64px auto",
          padding: "0 24px",
          textAlign: "center",
        }}
      >
        <h2
          style={{
            fontSize: "var(--font-size-heading)",
            color: "var(--color-primary-dark)",
            marginBottom: 16,
          }}
        >
          Try Midlo now
        </h2>

        <p
          style={{
            fontSize: "var(--font-size-body)",
            color: "var(--color-text-secondary)",
            marginBottom: 24,
          }}
        >
          No accounts. No friction. Just a fair place to meet.
        </p>

        <a
          href="https://midlo.ai"
          style={{
            display: "inline-block",
            padding: "12px 24px",
            backgroundColor: "var(--color-primary)",
            color: "white",
            borderRadius: "var(--radius-md)",
            fontWeight: 600,
          }}
        >
          Open Midlo
        </a>
      </section>
    </>
  );
}

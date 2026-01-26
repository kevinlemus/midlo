import React from "react";

export default function ApiPage() {
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
            Midlo API
          </h1>

          <p
            style={{
              fontSize: "var(--font-size-body)",
              color: "var(--color-text-secondary)",
              maxWidth: 640,
              margin: "0 auto",
            }}
          >
            Soon, developers will be able to integrate Midlo’s midpoint engine
            directly into their apps, platforms, and workflows.
          </p>
        </div>
      </section>

      <section
        style={{
          maxWidth: "var(--max-width)",
          margin: "48px auto",
          padding: "0 24px",
          fontSize: "var(--font-size-body)",
          color: "var(--color-text-secondary)",
          lineHeight: 1.6,
        }}
      >
        <p>
          The Midlo API will allow you to calculate midpoints, fetch nearby
          places, and build collaborative meeting tools into your own products.
        </p>

        <p>
          Whether you're building a social app, a travel planner, a team
          coordination tool, or something entirely new — Midlo will help your
          users meet in the middle.
        </p>

        <p>
          Full documentation, SDKs, and examples are coming soon.
        </p>
      </section>
    </>
  );
}

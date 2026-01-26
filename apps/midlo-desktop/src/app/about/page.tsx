import React from "react";

export default function AboutPage() {
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
            About Midlo
          </h1>

          <p
            style={{
              fontSize: "var(--font-size-body)",
              color: "var(--color-text-secondary)",
              maxWidth: 640,
              margin: "0 auto",
            }}
          >
            Midlo was created to solve a simple problem: meeting up shouldn’t be
            unfair or complicated. Whether you’re catching up with a friend,
            planning a date, or coordinating a team meetup, Midlo finds a fair,
            friendly midpoint that works for everyone.
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
          We believe meeting in the middle should feel good — not like a
          negotiation. That’s why Midlo focuses on fairness, simplicity, and
          delightful design.
        </p>

        <p>
          As we grow, we’re building features that help groups, teams, and
          communities find places that feel balanced and welcoming. And soon,
          Midlo will expand into AI‑powered suggestions, vibes, and even
          reservations.
        </p>

        <p>
          This is just the beginning. Thanks for being part of the journey.
        </p>
      </section>
    </>
  );
}

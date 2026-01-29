import React from "react";

export default function ContactPage() {
  return (
    <>
      <section
        style={{
          maxWidth: "var(--max-width)",
          margin: "48px auto",
          padding: "0 24px",
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
          Contact
        </h1>

        <p
          style={{
            fontSize: "var(--font-size-body)",
            color: "var(--color-text-secondary)",
            marginBottom: 24,
          }}
        >
          Have questions, feedback, or partnership ideas? We’d love to hear from you.
        </p>

        <p
          style={{
            fontSize: "var(--font-size-body)",
            color: "var(--color-text-secondary)",
            marginBottom: 16,
          }}
        >
          Reach us anytime at:
        </p>

        <a
          href="mailto:hello@midlo.ai"
          style={{
            fontSize: "var(--font-size-subheading)",
            color: "var(--color-primary-dark)",
            fontWeight: 600,
          }}
        >
          hello@midlo.ai
        </a>
      </section>
    </>
  );
}

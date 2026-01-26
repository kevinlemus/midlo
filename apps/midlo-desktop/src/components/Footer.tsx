import React from "react";

export default function Footer() {
  return (
    <footer
      style={{
        width: "100%",
        padding: "32px 24px",
        backgroundColor: "var(--color-surface)",
        borderTop: "1px solid var(--color-divider)",
      }}
    >
      <div
        style={{
          maxWidth: "var(--max-width)",
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          gap: 12,
          textAlign: "center",
          color: "var(--color-text-secondary)",
          fontSize: "var(--font-size-caption)",
        }}
      >
        <div>© {new Date().getFullYear()} Midlo</div>

        <div style={{ display: "flex", gap: 16, justifyContent: "center" }}>
          <a href="/about">About</a>
          <a href="/features">Features</a>
          <a href="/api">API</a>
          <a href="/contact">Contact</a>
        </div>

        <div>Meet in the middle — fairly.</div>
      </div>
    </footer>
  );
}

import React from "react";
import Image from "next/image";

export default function Hero() {
  return (
    <section
      style={{
        width: "100%",
        padding: "80px 24px",
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
        <Image
          src="/midlo_hero_logo.png"
          alt="Midlo"
          width={180} // slightly larger for hero presence
          height={220}
          style={{ objectFit: "contain", marginBottom: 28 }}
        />

        <h1
          style={{
            fontSize: "var(--font-size-heading-xl)",
            color: "var(--color-primary-dark)",
            margin: 0,
            marginBottom: 16,
            fontWeight: 700,
          }}
        >
          Meet in the middle with Midlo
        </h1>

        <p
          style={{
            fontSize: "var(--font-size-subheading)",
            color: "var(--color-text-secondary)",
            maxWidth: 640,
            margin: "0 auto",
            lineHeight: 1.5,
          }}
        >
          A fair, friendly midpoint finder that makes meeting up actually feel
          good. No accounts. No friction. Just a place that works for everyone.
        </p>
      </div>
    </section>
  );
}

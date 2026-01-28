"use client";

import Link from "next/link";
import Image from "next/image";

export default function Navbar() {
  return (
    <nav
      style={{
        width: "100%",
        height: "var(--nav-height)",
        borderBottom: "1px solid var(--color-divider)",
        backgroundColor: "var(--color-surface)",
      }}
    >
      <div
        style={{
          maxWidth: "var(--max-width)",
          margin: "0 auto",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 24px",
        }}
      >
        <Link
          href="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <Image src="/midlo_logo.png" alt="Midlo" width={110} height={32} style={{ objectFit: "contain" }} />
        </Link>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 20,
            fontSize: "var(--font-size-body)",
            color: "var(--color-text-secondary)",
          }}
        >
          <Link href="/features">Features</Link>
          <Link href="/api">API</Link>
          <Link href="/about">About</Link>
          <Link href="/contact">Contact</Link>
        </div>
      </div>
    </nav>
  );
}

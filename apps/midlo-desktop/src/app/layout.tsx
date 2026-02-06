import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export const metadata: Metadata = {
  title: "Midlo — Meet in the middle",
  description:
    "Midlo finds fair, friendly midpoints between people so meeting up actually feels good.",
  openGraph: {
    title: "Midlo — Meet in the middle",
    description:
      "Midlo finds fair, friendly midpoints between people so meeting up actually feels good.",
    url: "https://midlo.ai",
    type: "website",
    siteName: "Midlo",
    images: [
      {
        url: "https://midlo.ai/og/og.png",
        width: 1200,
        height: 630,
        alt: "Midlo — Meet in the middle",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Midlo — Meet in the middle",
    description:
      "Midlo finds fair, friendly midpoints between people so meeting up actually feels good.",
    images: ["https://midlo.ai/og/og.png"],
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          backgroundColor: "var(--color-bg)",
          color: "var(--color-text)",
          display: "flex",
          flexDirection: "column",
          minHeight: "100vh",
        }}
      >
        <Navbar />
        <main style={{ flex: 1 }}>{children}</main>
        <Footer />
      </body>
    </html>
  );
}

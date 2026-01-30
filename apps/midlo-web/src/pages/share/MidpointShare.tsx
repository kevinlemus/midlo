import React from "react";
import { useSearchParams } from "react-router-dom";

export default function MidpointShare() {
  const [params] = useSearchParams();
  const a = params.get("a") ?? "";
  const b = params.get("b") ?? "";

  const title = "Meet in the middle • Midlo";
  const description =
    a && b
      ? `A fair place to meet between ${a} and ${b}.`
      : "Find a friendly halfway point that feels fair to both sides.";

  const image = "/og/midpoint.png";

  const target = (() => {
    const u = new URL("/", window.location.origin);
    if (a) u.searchParams.set("a", a);
    if (b) u.searchParams.set("b", b);
    return u.toString();
  })();

  return (
    <html>
      <head>
        <title>{title}</title>

        {/* Open Graph */}
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:image" content={image} />
        <meta property="og:image:alt" content="Midlo midpoint preview" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Midlo" />
        <meta property="og:url" content={window.location.href} />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={image} />

        {/* Fallback meta description */}
        <meta name="description" content={description} />

        {/* Instant redirect for humans tapping the link */}
        <meta httpEquiv="refresh" content={`0;url=${target}`} />
      </head>
      <body />
    </html>
  );
}

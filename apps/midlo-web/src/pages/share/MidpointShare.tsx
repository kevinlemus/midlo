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

  // IMPORTANT: absolute URL
  const image = "https://midlo.ai/og/midpoint.png?v=2";

  // Redirect target for humans
  const target = (() => {
    const u = new URL("/", window.location.origin);
    for (const [k, v] of params.entries()) {
      if (!k) continue;
      u.searchParams.set(k, v);
    }
    return u.toString();
  })();

  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />

        <title>{title}</title>
        <link rel="canonical" href={window.location.href} />

        {/* OpenGraph */}
        <meta property="og:locale" content="en_US" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Midlo" />
        <meta property="og:url" content={window.location.href} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />

        <meta property="og:image" content={image} />
        <meta property="og:image:secure_url" content={image} />
        <meta property="og:image:type" content="image/png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content="Midlo midpoint preview" />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={image} />

        {/* Fallback */}
        <meta name="description" content={description} />

        {/* Instant redirect for humans */}
        <meta httpEquiv="refresh" content={`0;url=${target}`} />
      </head>
      <body />
    </html>
  );
}

import React, { useEffect } from "react";

export default function MidpointShare() {
  const title = "Meet in the middle • Midlo";
  const description =
    "Drop in two locations and we’ll find a friendly halfway spot that feels fair to both sides.";

  const image = "https://midlo.ai/og/midpoint.png?v=2";
  const pageUrl = "https://midlo.ai/share/midpoint";

  useEffect(() => {
    try {
      const hash = window.location.hash.startsWith("#")
        ? window.location.hash.slice(1)
        : window.location.hash;

      if (!hash) {
        // No data, just send to home.
        window.location.replace("/");
        return;
      }

      const json = atob(decodeURIComponent(hash));
      const payload = JSON.parse(json) as { a?: string; b?: string };

      const url = new URL("/", window.location.origin);
      if (payload.a) url.searchParams.set("a", payload.a);
      if (payload.b) url.searchParams.set("b", payload.b);

      window.location.replace(url.toString());
    } catch {
      // If anything goes wrong, just send them home.
      window.location.replace("/");
    }
  }, []);

  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />

        <title>{title}</title>
        <link rel="canonical" href={pageUrl} />

        {/* OpenGraph */}
        <meta property="og:locale" content="en_US" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Midlo" />
        <meta property="og:url" content={pageUrl} />
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
      </head>
      <body />
    </html>
  );
}

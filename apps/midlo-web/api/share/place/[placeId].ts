export const config = { runtime: "edge" };

type PlaceSummary = {
  name?: string;
  formattedAddress?: string;
  rating?: number;
  userRatingCount?: number;
  photoName?: string;
  websiteUri?: string;
  googleMapsUri?: string;
};

type HtmlParts = {
  title: string;
  description: string;
  imageUrl: string;
  canonicalUrl: string;
  shareUrl: string;
  redirectTo: string;
};

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function clamp(input: string, max: number): string {
  const trimmed = input.trim();
  return trimmed.length <= max
    ? trimmed
    : `${trimmed.slice(0, Math.max(0, max - 1)).trim()}…`;
}

function renderHtml({
  title,
  description,
  imageUrl,
  canonicalUrl,
  shareUrl,
  redirectTo,
}: HtmlParts): string {
  const t = escapeHtml(title);
  const d = escapeHtml(description);
  const img = escapeHtml(imageUrl);
  const canon = escapeHtml(canonicalUrl);
  const share = escapeHtml(shareUrl);
  const redirect = escapeHtml(redirectTo);

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>${t}</title>

    <link rel="canonical" href="${canon}" />

    <meta property="og:site_name" content="Midlo" />
    <meta property="og:type" content="website" />
    <meta property="og:title" content="${t}" />
    <meta property="og:description" content="${d}" />
    <meta property="og:image" content="${img}" />
    <meta property="og:url" content="${share}" />

    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${t}" />
    <meta name="twitter:description" content="${d}" />
    <meta name="twitter:image" content="${img}" />

    <meta http-equiv="refresh" content="0;url=${redirect}" />
    <script>
      // Redirect real browsers; crawlers will read the meta tags above.
      window.location.replace(${JSON.stringify(redirectTo)});
    </script>
    <style>
      body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;margin:0;padding:24px;background:#0b1f12;color:#eaffef}
      a{color:#b6ffcc}
      .card{max-width:560px;margin:0 auto;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);border-radius:16px;padding:18px}
      .muted{opacity:.8;font-size:14px;line-height:1.4}
    </style>
  </head>
  <body>
    <div class="card">
      <div style="font-weight:700;letter-spacing:.2px">${t}</div>
      <div class="muted" style="margin-top:6px">${d}</div>
      <div class="muted" style="margin-top:12px">Redirecting… If nothing happens, <a href="${canon}">tap here</a>.</div>
    </div>
  </body>
</html>`;
}

function safeNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  return undefined;
}

function readApiBaseUrl(): string {
  const env =
    process.env.VITE_API_URL ||
    process.env.API_URL ||
    process.env.MIDLO_API_URL;
  if (!env) {
    throw new Error("Missing API base URL (expected VITE_API_URL or API_URL)");
  }
  return env.trim().replace(/\/+$/, "");
}

function toApiUrl(apiBaseUrl: string, path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${apiBaseUrl}${normalizedPath}`;
}

async function fetchPlaceSummary(
  apiBaseUrl: string,
  placeId: string,
): Promise<PlaceSummary | null> {
  // Best-effort: try a couple likely endpoints. If neither works, we still serve a nice fallback card.
  const candidates = [
    `/places/${encodeURIComponent(placeId)}`,
    `/place/${encodeURIComponent(placeId)}`,
  ];

  for (const path of candidates) {
    try {
      const res = await fetch(toApiUrl(apiBaseUrl, path), {
        headers: { accept: "application/json" },
        // Edge runtime cache hints (Vercel): keep it fairly fresh.
        // If unsupported, it's ignored.
        cache: "no-store",
      });

      if (!res.ok) continue;

      const json = (await res.json()) as any;
      // Try to adapt to a few shapes without coupling too tightly.
      const place = (json?.place ?? json) as any;

      return {
        name: typeof place?.name === "string" ? place.name : undefined,
        formattedAddress:
          typeof place?.formattedAddress === "string"
            ? place.formattedAddress
            : typeof place?.address === "string"
              ? place.address
              : undefined,
        rating: safeNumber(place?.rating),
        userRatingCount: safeNumber(place?.userRatingCount),
        photoName:
          typeof place?.photos?.[0]?.name === "string"
            ? place.photos[0].name
            : typeof place?.photoName === "string"
              ? place.photoName
              : undefined,
        websiteUri:
          typeof place?.websiteUri === "string" ? place.websiteUri : undefined,
        googleMapsUri:
          typeof place?.googleMapsUri === "string"
            ? place.googleMapsUri
            : typeof place?.googleMapsUrl === "string"
              ? place.googleMapsUrl
              : undefined,
      };
    } catch {
      // ignore and try next
    }
  }

  return null;
}

export default async function handler(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const origin = url.origin;

  // On Vercel, dynamic params are not available via Request in Edge functions; parse from path.
  // Expected: /api/share/place/:placeId
  const segments = url.pathname.split("/").filter(Boolean);
  const placeId = segments[segments.length - 1] ?? "";

  const canonicalUrl = new URL(`/p/${encodeURIComponent(placeId)}`, origin);
  const redirectTo = new URL(canonicalUrl.toString());
  redirectTo.search = url.search;
  const shareUrl = new URL(
    `/share/place/${encodeURIComponent(placeId)}`,
    origin,
  );
  // Preserve optional query params so messaging apps can force re-scrapes.
  shareUrl.search = url.search;

  let title = "Restaurant • Midlo";
  let description = "Open this place in Midlo.";
  let imageUrl = `${origin}/og/place.png`;

  try {
    const apiBaseUrl = readApiBaseUrl();
    const place = placeId ? await fetchPlaceSummary(apiBaseUrl, placeId) : null;

    if (place?.name) {
      title = clamp(`${place.name} • Midlo`, 70);
    }

    const bits: string[] = [];
    if (place?.formattedAddress) bits.push(place.formattedAddress);
    if (typeof place?.rating === "number") {
      const ratings =
        typeof place.userRatingCount === "number"
          ? ` (${place.userRatingCount})`
          : "";
      bits.push(`⭐ ${place.rating.toFixed(1)}${ratings}`);
    }

    description = clamp(bits.filter(Boolean).join(" • ") || description, 160);

    if (place?.photoName) {
      // Use the app backend photo proxy to get a real, fetchable image.
      // Note: OG scrapers need an absolute URL.
      const u = new URL("/place-photo", apiBaseUrl);
      u.searchParams.set("name", place.photoName);
      // Some scrapers prefer explicit width for caching variants.
      u.searchParams.set("maxWidthPx", "1200");
      imageUrl = u.toString();
    }
  } catch {
    // If API base URL isn't configured, fall back to static OG image + generic text.
  }

  const html = renderHtml({
    title,
    description,
    imageUrl,
    canonicalUrl: canonicalUrl.toString(),
    shareUrl: shareUrl.toString(),
    redirectTo: redirectTo.toString(),
  });

  // Allow caching briefly: place data changes rarely, but keep it fresh.
  return new Response(html, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control":
        "public, max-age=0, s-maxage=600, stale-while-revalidate=86400",
    },
  });
}

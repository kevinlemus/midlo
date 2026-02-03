export const config = { runtime: "edge" };

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

export default async function handler(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const origin = url.origin;

  const a = url.searchParams.get("a") ?? "";
  const b = url.searchParams.get("b") ?? "";

  const title = "Meet in the middle • Midlo";
  const description =
    a && b
      ? clamp(`A fair place to meet between ${a} and ${b}.`, 160)
      : "Find a friendly halfway point that feels fair to both sides.";

  const imageUrl = `${origin}/og/midpoint.png`;

  const canonicalUrl = new URL("/", origin);
  if (a) canonicalUrl.searchParams.set("a", a);
  if (b) canonicalUrl.searchParams.set("b", b);

  const shareUrl = new URL("/share/midpoint", origin);
  // Keep A/B params (and allow optional extras like v= for cache busting).
  shareUrl.search = canonicalUrl.search;
  for (const [k, v] of url.searchParams.entries()) {
    if (k === "a" || k === "b") continue;
    shareUrl.searchParams.set(k, v);
  }

  // Redirect real users to the app home *with* any extra params preserved (e.g. pl= snapshot).
  const redirectTo = new URL("/", origin);
  if (a) redirectTo.searchParams.set("a", a);
  if (b) redirectTo.searchParams.set("b", b);
  for (const [k, v] of url.searchParams.entries()) {
    if (k === "a" || k === "b") continue;
    redirectTo.searchParams.set(k, v);
  }

  const html = renderHtml({
    title,
    description,
    imageUrl,
    canonicalUrl: canonicalUrl.toString(),
    shareUrl: shareUrl.toString(),
    redirectTo: redirectTo.toString(),
  });

  // Avoid caching user-provided address text for long periods.
  return new Response(html, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

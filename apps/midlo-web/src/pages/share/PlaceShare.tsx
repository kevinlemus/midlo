import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../../services/api";

type PlaceDetails = {
  name: string | null;
  formattedAddress: string | null;
};

export default function PlaceShare() {
  const { placeId } = useParams();
  const [details, setDetails] = useState<PlaceDetails | null>(null);

  useEffect(() => {
    if (!placeId) return;
    api
      .getPlaceDetails(placeId)
      .then((d) =>
        setDetails({
          name: d.name,
          formattedAddress: d.formattedAddress,
        })
      )
      .catch(() => {
        // Silent fail for preview
      });
  }, [placeId]);

  const title = details?.name
    ? `${details.name} • Midlo`
    : "A place worth meeting at • Midlo";

  const description = details?.formattedAddress
    ? details.formattedAddress
    : "Find a friendly halfway spot that feels fair to both sides.";

  // IMPORTANT: absolute URL
  const image = "https://midlo.ai/og/place.png?v=2";

  const target = placeId
    ? new URL(`/p/${encodeURIComponent(placeId)}`, window.location.origin).toString()
    : window.location.origin;

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
        <meta property="og:image:alt" content="Midlo place preview" />

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

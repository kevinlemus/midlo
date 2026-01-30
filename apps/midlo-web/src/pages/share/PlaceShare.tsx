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
        }),
      )
      .catch(() => {
        // Fail silently for preview; fall back to generic copy.
      });
  }, [placeId]);

  const title = details?.name
    ? `${details.name} • Midlo`
    : "A place worth meeting at • Midlo";

  const description = details?.formattedAddress
    ? details.formattedAddress
    : "Find a friendly halfway spot that feels fair to both sides.";

  const image = "/og/place.png";

  const target = placeId
    ? new URL(`/p/${encodeURIComponent(placeId)}`, window.location.origin).toString()
    : window.location.origin;

  useEffect(() => {
    // No JS redirect; meta refresh handles humans.
  }, []);

  return (
    <html>
      <head>
        <title>{title}</title>

        {/* Open Graph */}
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:image" content={image} />
        <meta property="og:image:alt" content="Midlo place preview" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Midlo" />
        <meta property="og:url" content={window.location.href} />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={image} />

        {/* Meta description for fallback */}
        <meta name="description" content={description} />

        {/* Instant redirect for humans tapping the link */}
        <meta httpEquiv="refresh" content={`0;url=${target}`} />
      </head>
      <body />
    </html>
  );
}

// src/pages/share/PlaceShare.tsx
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../../services/api";

export default function PlaceShare() {
  const { placeId } = useParams();
  const [details, setDetails] = useState<any>(null);

  useEffect(() => {
    if (!placeId) return;
    api.getPlaceDetails(placeId).then(setDetails).catch(() => {});
  }, [placeId]);

  const title = details?.name
    ? `${details.name} • Midlo`
    : "A place worth meeting at • Midlo";

  const description = details?.formattedAddress
    ? details.formattedAddress
    : "Find a friendly halfway spot that feels fair to both sides.";

  const image = "/og/place.png";

  useEffect(() => {
    if (!placeId) return;
    const target = `/p/${encodeURIComponent(placeId)}`;
    window.location.replace(target);
  }, [placeId]);

  return (
    <html>
      <head>
        <title>{title}</title>

        {/* Open Graph */}
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:image" content={image} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={window.location.href} />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={image} />
      </head>
      <body />
    </html>
  );
}

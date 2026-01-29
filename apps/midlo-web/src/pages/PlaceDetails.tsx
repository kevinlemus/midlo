import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import "../styles/theme.css";
import "../styles/globals.css";
import { api, placePhotoUrl } from "../services/api";
import type { PlaceDetails, PlacePhoto } from "../types";
import { mapsLinksWithPlaceId } from "../utils/maps";
import OpenInAppBanner from "../components/OpenInAppBanner";

function mapsLinks(lat: number, lng: number, placeId?: string | null) {
  const ll = `${lat},${lng}`;

  if (placeId) {
    return mapsLinksWithPlaceId(lat, lng, placeId);
  }

  return {
    google: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ll)}`,
    apple: `https://maps.apple.com/?daddr=${encodeURIComponent(ll)}`,
    waze: `https://www.waze.com/ul?ll=${encodeURIComponent(ll)}&navigate=yes`,
  };
}

export default function PlaceDetailsPage() {
  const { placeId } = useParams();
  const navigate = useNavigate();

  const [details, setDetails] = React.useState<PlaceDetails | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [selectedPhoto, setSelectedPhoto] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!placeId) return;

    setLoading(true);
    setError(null);

    api
      .getPlaceDetails(placeId)
      .then((d) => {
        setDetails(d);
        const photos: PlacePhoto[] = (d?.photos ?? []).filter(
          (p): p is PlacePhoto => Boolean(p?.name),
        );
        if (photos[0]?.name) {
          setSelectedPhoto(photos[0].name);
        }
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, [placeId]);

  const photos: PlacePhoto[] = (details?.photos ?? []).filter(
    (p): p is PlacePhoto => Boolean(p?.name),
  );
  const hero = selectedPhoto ?? photos[0]?.name ?? null;
  const extraPhotos = photos.slice(1, 6);

  const lat =
    details?.lat ?? (details as any)?.location?.latitude ?? (details as any)?.location?.lat ?? null;
  const lng =
    details?.lng ?? (details as any)?.location?.longitude ?? (details as any)?.location?.lng ?? null;

  const hasLatLng = typeof lat === "number" && typeof lng === "number";

  const priceLevel = (details as any)?.priceLevel as number | undefined;
  const primaryType =
    (details as any)?.primaryType ??
    (Array.isArray((details as any)?.types) ? (details as any).types[0] : undefined);

  const formatPrice = (level?: number) => {
    if (typeof level !== "number") return null;
    return "$".repeat(Math.min(Math.max(level, 1), 4));
  };

  const formatType = (t?: string) => {
    if (!t) return null;
    return t.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const handleBack = () => {
    navigate(-1);
  };

  const handleShare = async () => {
    const url = new URL(window.location.href);
    const message = details
      ? `Meet in the middle with Midlo\n\n${details.name ?? "Place"}\n${
          details.formattedAddress ?? ""
        }\n\n${url.toString()}`
      : url.toString();

    if ((navigator as any).share) {
      try {
        await (navigator as any).share({
          title: details?.name ?? "Midlo place",
          text: message,
          url: url.toString(),
        });
        return;
      } catch {
        // fall through
      }
    }

    try {
      await navigator.clipboard.writeText(url.toString());
      alert("Link copied to clipboard.");
    } catch {
      alert("Here’s your link:\n\n" + url.toString());
    }
  };

  const renderDirections = () => {
    if (!hasLatLng) return null;

    const links = mapsLinks(lat as number, lng as number, placeId ?? undefined);
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const defaultUrl = isIOS ? links.apple : links.google;

    return (
      <div
        style={{
          marginTop: 16,
          padding: 16,
          borderRadius: "var(--radius-lg)",
          border: "1px solid var(--color-divider)",
          backgroundColor: "var(--color-surface)",
        }}
      >
        <div
          style={{
            fontWeight: 600,
            color: "var(--color-primary-dark)",
            marginBottom: 8,
            fontSize: "var(--font-size-subheading)",
          }}
        >
          Directions
        </div>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 8,
            alignItems: "center",
          }}
        >
          <button
            type="button"
            onClick={() => window.open(defaultUrl, "_blank")}
            style={{
              padding: "10px 14px",
              borderRadius: "var(--radius-pill)",
              border: "1px solid var(--color-primary)",
              backgroundColor: "var(--color-bright)",
              color: "var(--color-surface)",
              cursor: "pointer",
              fontSize: "var(--font-size-body)",
              fontWeight: 500,
            }}
          >
            Get directions
          </button>

          <button
            type="button"
            onClick={() => window.open(links.google, "_blank")}
            style={{
              padding: "6px 10px",
              borderRadius: "var(--radius-pill)",
              border: "1px solid var(--color-accent)",
              backgroundColor: "var(--color-surface)",
              color: "var(--color-primary-dark)",
              cursor: "pointer",
              fontSize: "var(--font-size-caption)",
            }}
          >
            Google Maps
          </button>

          <button
            type="button"
            onClick={() => window.open(links.apple, "_blank")}
            style={{
              padding: "6px 10px",
              borderRadius: "var(--radius-pill)",
              border: "1px solid var(--color-accent)",
              backgroundColor: "var(--color-surface)",
              color: "var(--color-primary-dark)",
              cursor: "pointer",
              fontSize: "var(--font-size-caption)",
            }}
          >
            Apple Maps
          </button>

          <button
            type="button"
            onClick={() => window.open(links.waze, "_blank")}
            style={{
              padding: "6px 10px",
              borderRadius: "var(--radius-pill)",
              border: "1px solid var(--color-accent)",
              backgroundColor: "var(--color-surface)",
              color: "var(--color-primary-dark)",
              cursor: "pointer",
              fontSize: "var(--font-size-caption)",
            }}
          >
            Waze
          </button>
        </div>
      </div>
    );
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "var(--color-bg)",
        color: "var(--color-text)",
        padding: 24,
      }}
    >
      <div style={{ maxWidth: 980, margin: "0 auto" }}>
        <OpenInAppBanner context="place" />

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 8,
            marginBottom: 12,
          }}
        >
          <button
            type="button"
            onClick={handleBack}
            style={{
              padding: "8px 10px",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--color-divider)",
              backgroundColor: "var(--color-surface)",
              color: "var(--color-text)",
              cursor: "pointer",
              fontSize: "var(--font-size-caption)",
            }}
          >
            ← Back
          </button>

          <button
            type="button"
            onClick={handleShare}
            style={{
              padding: "8px 10px",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--color-accent)",
              backgroundColor: "var(--color-surface)",
              color: "var(--color-primary-dark)",
              cursor: "pointer",
              fontSize: "var(--font-size-caption)",
            }}
          >
            Share
          </button>
        </div>

        {loading && (
          <div
            style={{
              marginTop: 18,
              padding: 16,
              borderRadius: "var(--radius-lg)",
              border: "1px solid var(--color-divider)",
              backgroundColor: "var(--color-surface)",
              fontSize: "var(--font-size-body)",
              color: "var(--color-text-secondary)",
            }}
          >
            Loading place details…
          </div>
        )}

        {error && (
          <div
            style={{
              marginTop: 18,
              padding: 16,
              borderRadius: "var(--radius-lg)",
              border: "1px solid #fca5a5",
              backgroundColor: "#fef2f2",
              color: "var(--color-danger)",
              fontSize: "var(--font-size-caption)",
            }}
          >
            {error}
          </div>
        )}

        {!loading && !error && details && (
          <>
            <div style={{ marginTop: 18 }}>
              <h1
                style={{
                  margin: 0,
                  color: "var(--color-primary-dark)",
                  fontSize: "var(--font-size-heading)",
                }}
              >
                {details.name ?? "Place"}
              </h1>
              {details.formattedAddress && (
                <div
                  style={{
                    marginTop: 6,
                    color: "var(--color-text-secondary)",
                    fontSize: "var(--font-size-body)",
                  }}
                >
                  {details.formattedAddress}
                </div>
              )}

              <div
                style={{
                  display: "flex",
                  gap: 10,
                  alignItems: "center",
                  flexWrap: "wrap",
                  marginTop: 10,
                }}
              >
                {typeof details.rating === "number" && (
                  <div
                    style={{
                      padding: "6px 10px",
                      borderRadius: 999,
                      border: "1px solid var(--color-divider)",
                      backgroundColor: "rgba(255,255,255,0.7)",
                      fontSize: "var(--font-size-caption)",
                    }}
                  >
                    {details.rating.toFixed(1)} ★
                    {typeof details.userRatingCount === "number"
                      ? ` (${details.userRatingCount})`
                      : ""}
                  </div>
                )}

                {typeof details.openNow === "boolean" && (
                  <div
                    style={{
                      padding: "6px 10px",
                      borderRadius: 999,
                      border: "1px solid var(--color-divider)",
                      backgroundColor: details.openNow
                        ? "rgba(16,185,129,0.14)"
                        : "rgba(239,68,68,0.14)",
                      fontSize: "var(--font-size-caption)",
                    }}
                  >
                    {details.openNow ? "Open now" : "Closed"}
                  </div>
                )}

                {formatPrice(priceLevel) && (
                  <div
                    style={{
                      padding: "6px 10px",
                      borderRadius: 999,
                      border: "1px solid var(--color-divider)",
                      fontSize: "var(--font-size-caption)",
                    }}
                  >
                    {formatPrice(priceLevel)}
                  </div>
                )}

                {formatType(primaryType) && (
                  <div
                    style={{
                      padding: "6px 10px",
                      borderRadius: 999,
                      border: "1px solid var(--color-divider)",
                      fontSize: "var(--font-size-caption)",
                    }}
                  >
                    {formatType(primaryType)}
                  </div>
                )}
              </div>
            </div>

            {hero && (
              <div
                style={{
                  marginTop: 16,
                  borderRadius: "var(--radius-lg)",
                  overflow: "hidden",
                  border: "1px solid var(--color-divider)",
                  backgroundColor: "var(--color-surface)",
                  boxShadow: "var(--shadow-card)",
                }}
              >
                <img
                  src={placePhotoUrl(hero, 1600)}
                  alt={details.name ?? "Place photo"}
                  style={{
                    width: "100%",
                    height: 380,
                    objectFit: "cover",
                    display: "block",
                  }}
                />
              </div>
            )}

            {extraPhotos.length > 0 && (
              <div
                style={{
                  marginTop: 12,
                  display: "flex",
                  gap: 8,
                  overflowX: "auto",
                  paddingBottom: 4,
                }}
              >
                {extraPhotos.map((p) => (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() => setSelectedPhoto(p.name)}
                    style={{
                      minWidth: 140,
                      height: 90,
                      borderRadius: "var(--radius-md)",
                      overflow: "hidden",
                      border: `2px solid ${
                        selectedPhoto === p.name
                          ? "var(--color-primary)"
                          : "var(--color-divider)"
                      }`,
                      padding: 0,
                      backgroundColor: "var(--color-surface)",
                      cursor: "pointer",
                    }}
                  >
                    <img
                      src={placePhotoUrl(p.name, 600)}
                      alt={details.name ?? "Place photo"}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        display: "block",
                      }}
                    />
                  </button>
                ))}
              </div>
            )}

            {details.weekdayDescriptions?.length ? (
              <div
                style={{
                  marginTop: 16,
                  padding: 16,
                  borderRadius: "var(--radius-lg)",
                  border: "1px solid var(--color-divider)",
                  backgroundColor: "var(--color-surface)",
                }}
              >
                <div
                  style={{
                    fontWeight: 600,
                    color: "var(--color-primary-dark)",
                    marginBottom: 8,
                    fontSize: "var(--font-size-subheading)",
                  }}
                >
                  Hours
                </div>
                <div
                  style={{
                    display: "grid",
                    gap: 6,
                    color: "var(--color-text-secondary)",
                    fontSize: "var(--font-size-body)",
                  }}
                >
                  {details.weekdayDescriptions.map((line) => (
                    <div key={line}>{line}</div>
                  ))}
                </div>
              </div>
            ) : null}

            {renderDirections()}
          </>
        )}
      </div>
    </div>
  );
}

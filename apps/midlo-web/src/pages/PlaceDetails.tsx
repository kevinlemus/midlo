import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import '../styles/theme.css';
import { api, placePhotoUrl } from '../services/api';
import type { PlaceDetails, PlacePhoto } from '../types';

export default function PlaceDetailsPage() {
  const { placeId } = useParams();
  const navigate = useNavigate();

  const [details, setDetails] = React.useState<PlaceDetails | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!placeId) return;

    setLoading(true);
    setError(null);

    api
      .getPlaceDetails(placeId)
      .then((d) => setDetails(d))
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, [placeId]);

  const photos: PlacePhoto[] = (details?.photos ?? []).filter((p): p is PlacePhoto => Boolean(p?.name));
  const hero = photos[0]?.name ?? null;

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--color-bg)',
        color: 'var(--color-text)',
        padding: 24,
      }}
    >
      <div style={{ maxWidth: 980, margin: '0 auto' }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            padding: '10px 12px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-accent)',
            backgroundColor: 'transparent',
            color: 'var(--color-text)',
            cursor: 'pointer',
            fontSize: 'var(--font-size-caption)',
          }}
        >
          ← Back
        </button>

        {loading && (
          <div
            style={{
              marginTop: 18,
              padding: 16,
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--color-accent)',
              backgroundColor: 'var(--color-surface)',
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
              borderRadius: 'var(--radius-lg)',
              border: '1px solid #ffb4b4',
              backgroundColor: '#2a0f0f',
              color: '#ffd2d2',
            }}
          >
            {error}
          </div>
        )}

        {!loading && !error && details && (
          <>
            <div style={{ marginTop: 18 }}>
              <h1 style={{ margin: 0, color: 'var(--color-primary-dark)' }}>{details.name ?? 'Place'}</h1>
              {details.formattedAddress && (
                <div style={{ marginTop: 6, color: 'var(--color-text-secondary)' }}>{details.formattedAddress}</div>
              )}

              <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginTop: 10 }}>
                {typeof details.rating === 'number' && (
                  <div
                    style={{
                      padding: '6px 10px',
                      borderRadius: 999,
                      border: '1px solid var(--color-accent)',
                      backgroundColor: 'rgba(255,255,255,0.04)',
                      fontSize: 'var(--font-size-caption)',
                    }}
                  >
                    {details.rating.toFixed(1)} ★{typeof details.userRatingCount === 'number' ? ` (${details.userRatingCount})` : ''}
                  </div>
                )}

                {typeof details.openNow === 'boolean' && (
                  <div
                    style={{
                      padding: '6px 10px',
                      borderRadius: 999,
                      border: '1px solid var(--color-accent)',
                      backgroundColor: details.openNow ? 'rgba(16,185,129,0.14)' : 'rgba(239,68,68,0.14)',
                      fontSize: 'var(--font-size-caption)',
                    }}
                  >
                    {details.openNow ? 'Open now' : 'Closed'}
                  </div>
                )}
              </div>
            </div>

            {hero && (
              <div
                style={{
                  marginTop: 16,
                  borderRadius: 'var(--radius-lg)',
                  overflow: 'hidden',
                  border: '1px solid var(--color-accent)',
                  backgroundColor: 'var(--color-surface)',
                  boxShadow: 'var(--shadow-card)',
                }}
              >
                <img
                  src={placePhotoUrl(hero, 1600)}
                  alt={details.name ?? 'Place photo'}
                  style={{ width: '100%', height: 380, objectFit: 'cover', display: 'block' }}
                />
              </div>
            )}

            {details.weekdayDescriptions?.length ? (
              <div
                style={{
                  marginTop: 16,
                  padding: 16,
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--color-accent)',
                  backgroundColor: 'var(--color-surface)',
                }}
              >
                <div style={{ fontWeight: 600, color: 'var(--color-primary-dark)' }}>Hours</div>
                <div style={{ marginTop: 8, display: 'grid', gap: 6, color: 'var(--color-text-secondary)' }}>
                  {details.weekdayDescriptions.map((line) => (
                    <div key={line}>{line}</div>
                  ))}
                </div>
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}

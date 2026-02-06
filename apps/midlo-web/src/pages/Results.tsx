import React, { useEffect, useRef, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { track } from "../services/analytics";
import type { Midpoint, Place } from "../types";

export default function ResultsPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const MAX_RESCANS_PER_SEARCH = 5;
  const TOTAL_BATCHES = MAX_RESCANS_PER_SEARCH + 1;

  const initialA = params.get("a") ?? "";
  const initialB = params.get("b") ?? "";

  const [locationA, setLocationA] = useState(initialA);
  const [locationB, setLocationB] = useState(initialB);

  const [midpoint, setMidpoint] = useState<Midpoint | null>(null);
  const [batches, setBatches] = useState<Place[][]>([]);
  const [activeBatchIndex, setActiveBatchIndex] = useState(0);
  const places = batches[activeBatchIndex] ?? [];

  const [isLoading, setIsLoading] = useState(false);
  const [isRescanning, setIsRescanning] = useState(false);
  const [rescanCount, setRescanCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [noMoreOptionsMessage, setNoMoreOptionsMessage] = useState<
    string | null
  >(null);

  const resultsRef = useRef<HTMLDivElement | null>(null);
  const seenPlaceKeysRef = useRef<Set<string>>(new Set());

  const placeKey = (p: Place) => p.placeId || `${p.name}__${p.distance}`;

  const lastBatchIndex = Math.max(0, batches.length - 1);
  const canGoPrev = activeBatchIndex > 0;
  const canGoNextStored = activeBatchIndex < lastBatchIndex;
  const isOnLastBatch = activeBatchIndex === lastBatchIndex;
  const canRescanMore = batches.length < TOTAL_BATCHES;

  const isDisabled = !locationA || !locationB || isLoading || isRescanning;

  useEffect(() => {
    if (initialA && initialB) {
      void handleFindMidpoint(true);
    }
  }, []);

  const shuffleWithSeed = <T,>(items: T[], seed: number): T[] => {
    const rand = (() => {
      let t = seed >>> 0;
      return () => {
        t += 0x6d2b79f5;
        let r = Math.imul(t ^ (t >>> 15), 1 | t);
        r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
        return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
      };
    })();

    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  };

  const pickFiveUnique = (
    candidates: Place[],
    exclude: Place[],
    seed: number,
  ) => {
    const excludeKeys = new Set(exclude.map(placeKey));
    const uniq: Place[] = [];
    const seen = new Set<string>();

    const randomized = shuffleWithSeed(candidates, seed);

    for (const p of randomized) {
      const k = placeKey(p);
      if (excludeKeys.has(k)) continue;
      if (seen.has(k)) continue;
      seen.add(k);
      uniq.push(p);
      if (uniq.length >= 5) break;
    }

    return uniq;
  };

  const jitterLatLng = (
    lat: number,
    lng: number,
    seed: number,
    attempt: number,
  ) => {
    const angle = ((seed + attempt * 997) % 360) * (Math.PI / 180);
    const radiusDeg = 0.0015 + attempt * 0.001;
    const latDelta = Math.cos(angle) * radiusDeg;
    const lngDelta =
      (Math.sin(angle) * radiusDeg) /
      Math.max(0.2, Math.cos((lat * Math.PI) / 180));
    return { lat: lat + latDelta, lng: lng + lngDelta };
  };

  const handlePrevBatch = () => {
    if (!canGoPrev) return;
    setNoMoreOptionsMessage(null);
    setActiveBatchIndex((i) => Math.max(0, i - 1));
  };

  const handleNextBatch = () => {
    if (!canGoNextStored) return;
    setNoMoreOptionsMessage(null);
    setActiveBatchIndex((i) => Math.min(lastBatchIndex, i + 1));
  };

  const handleSeeDifferentOptions = async () => {
    if (!midpoint) return;

    if (!isOnLastBatch) {
      handleNextBatch();
      return;
    }

    if (isOnLastBatch && canRescanMore) {
      setNoMoreOptionsMessage(null);
      await handleRescanPlaces();
      return;
    }

    setNoMoreOptionsMessage("Try adjusting your locations for more options.");
  };

  const handleFindMidpoint = async (fromQuery = false) => {
    if (!locationA || !locationB) {
      setError("Add both locations to find a fair midpoint.");
      return;
    }

    setIsLoading(true);
    setIsRescanning(false);
    setRescanCount(0);
    setError(null);
    setMidpoint(null);
    setBatches([]);
    setActiveBatchIndex(0);
    seenPlaceKeysRef.current = new Set();
    setNoMoreOptionsMessage(null);

    try {
      const mp = await api.getMidpoint(locationA, locationB);
      const nearby = await api.getPlaces(mp.lat, mp.lng);

      setMidpoint(mp);
      const first = nearby.slice(0, 5);
      setBatches([first]);
      setActiveBatchIndex(0);
      seenPlaceKeysRef.current = new Set(first.map(placeKey));

      track("midpoint_searched", {
        locationA,
        locationB,
        placesCount: nearby.length,
        source: fromQuery ? "query_params" : "inline",
      });

      setTimeout(() => {
        if (resultsRef.current) {
          const rect = resultsRef.current.getBoundingClientRect();
          const top = window.scrollY + rect.top - 24;
          window.scrollTo({ top, behavior: "smooth" });
        }
      }, 120);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Something went wrong. Try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleRescanPlaces = async () => {
    if (!midpoint) return;
    if (rescanCount >= MAX_RESCANS_PER_SEARCH) return;

    setIsRescanning(true);
    setError(null);

    try {
      const seed = Date.now();
      const current = batches[batches.length - 1] ?? places;
      const seenKeys = new Set(seenPlaceKeysRef.current);

      let pool: Place[] = [];

      for (let attempt = 0; attempt < 8; attempt++) {
        const coords =
          attempt === 0
            ? { lat: midpoint.lat, lng: midpoint.lng }
            : jitterLatLng(midpoint.lat, midpoint.lng, seed, attempt);

        const batch = await api.getPlaces(coords.lat, coords.lng);
        pool = pool.concat(batch);

        const next = pickFiveUnique(pool, current, seed).filter(
          (p) => !seenKeys.has(placeKey(p)),
        );

        if (next.length >= 5) {
          const chosen = next.slice(0, 5);
          const nextIndex = batches.length;
          setBatches((prev) => [...prev, chosen]);
          setActiveBatchIndex(nextIndex);
          for (const p of chosen) seenPlaceKeysRef.current.add(placeKey(p));
          setRescanCount((c) => c + 1);

          track("places_rescanned" as Parameters<typeof track>[0], {
            locationA,
            locationB,
            placesCount: 5,
            source: "results_rescan",
          });

          return;
        }
      }

      setNoMoreOptionsMessage("Try adjusting your locations for more options.");
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Couldn’t refresh options. Try again.",
      );
    } finally {
      setIsRescanning(false);
    }
  };

  const handleShareMidpoint = async () => {
    if (!locationA || !locationB) {
      alert("Add both locations before sharing.");
      return;
    }

    const shareUrl = new URL("/share/midpoint", window.location.origin);
    shareUrl.searchParams.set("a", locationA);
    shareUrl.searchParams.set("b", locationB);

    const urlString = shareUrl.toString();

    if ((navigator as any).share) {
      try {
        await (navigator as any).share({
          title: "Meet in the middle with Midlo",
          url: urlString,
        });
        return;
      } catch {}
    }

    try {
      await navigator.clipboard.writeText(urlString);
      alert("Link copied to clipboard.");
    } catch {
      alert("Here’s your link:\n\n" + urlString);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "var(--color-bg)",
        display: "flex",
        justifyContent: "center",
        padding: "var(--space-xl) var(--space-lg)",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 960,
          display: "grid",
          gridTemplateColumns: "minmax(0, 1.2fr) minmax(0, 1.4fr)",
          gap: "var(--space-xl)",
        }}
      >
        {/* LEFT COLUMN */}
        <div>
          <div
            style={{
              padding: "var(--space-sm) var(--space-md)",
              borderRadius: "var(--radius-pill)",
              backgroundColor: "var(--color-highlight)",
              display: "inline-flex",
              alignItems: "center",
              marginBottom: "var(--space-md)",
            }}
          >
            <span
              style={{
                fontSize: "var(--font-size-caption)",
                color: "var(--color-primary-dark)",
                fontWeight: 500,
                letterSpacing: 0.5,
                textTransform: "uppercase",
              }}
            >
              Meet in the middle
            </span>
          </div>

          <h1
            style={{
              fontSize: "var(--font-size-heading)",
              color: "var(--color-primary-dark)",
              margin: 0,
              marginBottom: "var(--space-sm)",
            }}
          >
            A fair place to meet, in seconds.
          </h1>

          <p
            style={{
              fontSize: "var(--font-size-body)",
              color: "var(--color-text-secondary)",
              marginBottom: "var(--space-lg)",
            }}
          >
            Drop in two locations and we’ll find a friendly halfway spot that
            feels fair to both sides—plus nearby places that actually feel good
            to meet at.
          </p>

          {/* INPUTS */}
          <div style={{ display: "grid", gap: "var(--space-md)" }}>
            <div>
              <div
                style={{
                  fontSize: "var(--font-size-caption)",
                  color: "var(--color-text-secondary)",
                  marginBottom: "var(--space-xs)",
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                }}
              >
                Location A
              </div>
              <input
                value={locationA}
                onChange={(e) => setLocationA(e.target.value)}
                placeholder="Enter first location"
                className="midlo-input"
              />
            </div>

            <div>
              <div
                style={{
                  fontSize: "var(--font-size-caption)",
                  color: "var(--color-text-secondary)",
                  marginBottom: "var(--space-xs)",
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                }}
              >
                Location B
              </div>
              <input
                value={locationB}
                onChange={(e) => setLocationB(e.target.value)}
                placeholder="Enter second location"
                className="midlo-input"
              />
            </div>

            <button
              type="button"
              onClick={() => void handleFindMidpoint(false)}
              disabled={isDisabled}
              className="midlo-button midlo-button-primary"
            >
              {isLoading ? "Finding midpoint…" : "Find midpoint"}
            </button>

            {error && (
              <div
                style={{
                  marginTop: "var(--space-sm)",
                  padding: "var(--space-md)",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid #FCA5A5",
                  backgroundColor: "#FEF2F2",
                  color: "var(--color-danger)",
                  fontSize: "var(--font-size-caption)",
                }}
              >
                {error}
              </div>
            )}

            <p
              style={{
                fontSize: "var(--font-size-caption)",
                color: "var(--color-muted)",
                marginTop: "var(--space-sm)",
              }}
            >
              No accounts. No friction. Just a fair place to meet.
            </p>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div
          ref={resultsRef}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "var(--space-lg)",
          }}
        >
          {/* MAP PLACEHOLDER */}
          <div
            style={{
              width: "100%",
              height: 260,
              borderRadius: "var(--radius-lg)",
              border: "1px solid var(--color-divider)",
              background:
                "radial-gradient(circle at 20% 20%, #E8F5E9 0, #F3F4F6 40%, #FFFFFF 100%)",
              marginBottom: "var(--space-lg)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--color-text-secondary)",
              fontSize: "var(--font-size-caption)",
            }}
          >
            {midpoint
              ? "Map centered on your midpoint and nearby options."
              : "Your midpoint map will appear here."}
          </div>

          {midpoint && (
            <div
              style={{
                marginBottom: "var(--space-md)",
                padding: "var(--space-sm)",
                borderRadius: "var(--radius-pill)",
                backgroundColor: "var(--color-highlight)",
                textAlign: "center",
              }}
            >
              <span
                style={{
                  fontSize: "var(--font-size-caption)",
                  color: "var(--color-primary-dark)",
                }}
              >
                Midpoint · Lat {midpoint.lat.toFixed(4)} · Lng{" "}
                {midpoint.lng.toFixed(4)}
              </span>
            </div>
          )}

          {/* RESULTS */}
          {places.length > 0 && (
            <div>
              {/* HEADER */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "stretch",
                  gap: "var(--space-md)",
                  marginBottom: "var(--space-md)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center" }}>
                  <div
                    style={{
                      fontSize: "var(--font-size-subheading)",
                      color: "var(--color-primary-dark)",
                      fontWeight: 500,
                      lineHeight: 1.1,
                    }}
                  >
                    Nearby options
                  </div>
                </div>

                {/* NAVIGATION CLUSTER */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    flexShrink: 0,
                    gap: 6,
                  }}
                >
                  {/* CARD-DECK CONTROLLER (stable, never shifts) */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                      padding: 7,
                      height: 46,
                      borderRadius: "var(--radius-pill)",
                      border: "1px solid var(--color-divider)",
                      backgroundColor: "var(--color-surface)",
                      boxShadow: "var(--shadow-card)",
                      flexWrap: "nowrap",
                      width: "fit-content",
                      maxWidth: "100%",
                    }}
                  >
                    {/* PREVIOUS */}
                    <button
                      type="button"
                      onClick={handlePrevBatch}
                      disabled={!canGoPrev}
                      className="midlo-button midlo-button-secondary"
                      style={{
                        height: 32,
                        minWidth: "clamp(56px, 22vw, 76px)",
                        padding: "0 clamp(10px, 3.2vw, 14px)",
                        fontSize: "var(--font-size-caption)",
                        borderRadius: "var(--radius-pill)",
                        fontWeight: 600,
                        letterSpacing: 0.2,
                        opacity: canGoPrev ? 1 : 0.42,
                        transition: "opacity 180ms ease",
                      }}
                    >
                      Prev
                    </button>

                    {/* NEXT */}
                    <button
                      type="button"
                      onClick={handleNextBatch}
                      disabled={!canGoNextStored}
                      className="midlo-button midlo-button-secondary"
                      style={{
                        height: 32,
                        minWidth: "clamp(56px, 22vw, 76px)",
                        padding: "0 clamp(10px, 3.2vw, 14px)",
                        fontSize: "var(--font-size-caption)",
                        borderRadius: "var(--radius-pill)",
                        fontWeight: 600,
                        letterSpacing: 0.2,
                        opacity: canGoNextStored ? 1 : 0.42,
                        transition: "opacity 180ms ease",
                      }}
                    >
                      Next
                    </button>

                    {/* RESCAN — stays visible, just disables */}
                    <button
                      type="button"
                      onClick={() => void handleSeeDifferentOptions()}
                      disabled={
                        !isOnLastBatch || !canRescanMore || isRescanning
                      }
                      className="midlo-button midlo-button-secondary"
                      style={{
                        height: 32,
                        minWidth: "clamp(104px, 42vw, 148px)",
                        padding: "0 clamp(10px, 3.2vw, 14px)",
                        fontSize: "var(--font-size-caption)",
                        borderRadius: "var(--radius-pill)",
                        fontWeight: 600,
                        letterSpacing: 0.2,
                        opacity:
                          isOnLastBatch && canRescanMore && !isRescanning
                            ? 1
                            : 0.42,
                        transition: "opacity 180ms ease",
                      }}
                    >
                      {isRescanning ? "Refreshing…" : "New options"}
                    </button>
                  </div>

                  {/* MESSAGE ROW — fixed height, fades in/out without layout shift */}
                  <div
                    style={{
                      height: 20,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      overflow: "hidden",
                      width: "100%",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "var(--font-size-caption)",
                        color: "var(--color-muted)",
                        opacity: isOnLastBatch && !canRescanMore ? 1 : 0,
                        transition: "opacity 180ms ease",
                        whiteSpace: "nowrap",
                        textAlign: "center",
                        willChange: "opacity",
                      }}
                    >
                      {noMoreOptionsMessage ??
                        "Try adjusting your locations for more options."}
                    </span>
                  </div>

                  <div
                    style={{
                      fontSize: "var(--font-size-caption)",
                      color: "var(--color-muted)",
                      textAlign: "center",
                      maxWidth: 520,
                    }}
                  >
                    A few places that make meeting in the middle actually feel good.
                  </div>
                </div>
              </div>

              {/* PLACES LIST */}
              <div
                style={{
                  display: "grid",
                  gap: "var(--space-sm)",
                  marginTop: "var(--space-sm)",
                  opacity: isRescanning ? 0.6 : 1,
                  transition: "opacity 0.25s ease",
                  pointerEvents: isRescanning ? "none" : "auto",
                }}
              >
                {places.map((p) => (
                  <button
                    key={placeKey(p)}
                    type="button"
                    onClick={() => {
                      if (!p.placeId) return;
                      track("place_opened", {
                        placeId: p.placeId,
                        source: "results",
                      });
                      navigate(`/p/${encodeURIComponent(p.placeId)}`);
                    }}
                    style={{
                      textAlign: "left",
                      padding: "var(--space-md)",
                      borderRadius: "var(--radius-md)",
                      border: "1px solid var(--color-divider)",
                      backgroundColor: "var(--color-surface)",
                      cursor: p.placeId ? "pointer" : "default",
                      boxShadow: "var(--shadow-card)",
                      transition: "background-color 0.2s ease",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "var(--font-size-body)",
                        color: "var(--color-text)",
                        fontWeight: 500,
                        marginBottom: "var(--space-xxs)",
                      }}
                    >
                      {p.name}
                    </div>
                    <div
                      style={{
                        fontSize: "var(--font-size-caption)",
                        color: "var(--color-muted)",
                      }}
                    >
                      {p.distance} from midpoint
                    </div>
                  </button>
                ))}
              </div>

              {/* SHARE MIDPOINT & LIST */}
              <div
                style={{
                  marginTop: "var(--space-lg)",
                  display: "flex",
                  justifyContent: "flex-end",
                }}
              >
                <button
                  type="button"
                  onClick={() => void handleShareMidpoint()}
                  className="midlo-button midlo-button-secondary"
                >
                  Share this midpoint & list
                </button>
              </div>
            </div>
          )}

          {/* EMPTY STATE */}
          {!midpoint && !places.length && !isLoading && (
            <div
              style={{
                marginTop: "var(--space-md)",
                fontSize: "var(--font-size-caption)",
                color: "var(--color-muted)",
                textAlign: "center",
              }}
            >
              Add two locations above and see where you should meet in the
              middle.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

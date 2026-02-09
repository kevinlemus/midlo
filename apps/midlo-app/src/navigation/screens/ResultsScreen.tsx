import React from "react";
import {
  SafeAreaView,
  View,
  Text,
  ScrollView,
  Share,
  Image,
  Pressable,
  Animated,
  Platform,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";

import { theme } from "theme";
import type { RootStackParamList } from "navigation";
import MidloButton from "../../components/MidloButton";
import MidloCard from "../../components/MidloCard";
import { midpointShareUrl } from "../../utils/shareLinks";
import { track } from "../../services/analytics";
import { api } from "../../services/api";

import Logo from "../../assets/images/midlo_logo.png";

type ResultsRoute = RouteProp<RootStackParamList, "Results">;

export default function ResultsScreen() {
  const navigation =
    useNavigation<
      import("@react-navigation/native").NavigationProp<RootStackParamList>
    >();
  const route = useRoute<ResultsRoute>();

  const {
    midpoint,
    places,
    locationA,
    locationB,
    resultsKey: initialResultsKey,
    resultsState,
  } = route.params;

  const MAX_RESCANS_PER_SEARCH = 5;
  const TOTAL_BATCHES = MAX_RESCANS_PER_SEARCH + 1;

  type PlaceT = (typeof places)[number];

  function placeKey(p: PlaceT) {
    return p.placeId || `${p.name}__${p.distance}`;
  }

  const uniqByKey = React.useCallback(
    (items: PlaceT[]): PlaceT[] => {
      const out: PlaceT[] = [];
      const seen = new Set<string>();
      for (const p of items) {
        const k = placeKey(p);
        if (seen.has(k)) continue;
        seen.add(k);
        out.push(p);
      }
      return out;
    },
    [],
  );

  const fillToFive = React.useCallback(
    (items: PlaceT[]): PlaceT[] => {
      const base = items.filter(Boolean);
      if (base.length === 0) return [];

      const out: PlaceT[] = [...base];
      let i = 0;
      while (out.length < 5) {
        out.push(base[i % base.length]);
        i++;
      }
      return out.slice(0, 5);
    },
    [],
  );

  const makeResultsKey = React.useCallback(() => {
    const a = (locationA ?? "").trim();
    const b = (locationB ?? "").trim();
    const lat =
      typeof midpoint?.lat === "number" ? midpoint.lat.toFixed(6) : "";
    const lng =
      typeof midpoint?.lng === "number" ? midpoint.lng.toFixed(6) : "";
    return `${a}|${b}|${lat}|${lng}`;
  }, [locationA, locationB, midpoint?.lat, midpoint?.lng]);

  const currentResultsKey = makeResultsKey();
  const hasSavedState =
    Boolean(resultsState) &&
    Boolean(initialResultsKey) &&
    initialResultsKey === currentResultsKey &&
    Array.isArray(resultsState?.batches) &&
    typeof resultsState?.activeBatchIndex === "number";

  const [batches, setBatches] = React.useState<PlaceT[][]>(() => {
    if (hasSavedState) {
      return (resultsState!.batches as PlaceT[][])
        .filter((b) => Array.isArray(b))
        .map((b) => fillToFive(b));
    }
    return [fillToFive(places.slice(0, 5))];
  });
  const [activeBatchIndex, setActiveBatchIndex] = React.useState(() => {
    if (hasSavedState) {
      const idx = resultsState!.activeBatchIndex;
      const max = Math.max(0, (resultsState!.batches?.length ?? 1) - 1);
      return Math.max(0, Math.min(max, idx));
    }
    return 0;
  });
  const currentPlaces = batches[activeBatchIndex] ?? [];
  const [isRescanning, setIsRescanning] = React.useState(false);
  const [rescanCount, setRescanCount] = React.useState(() => {
    if (hasSavedState && typeof resultsState!.rescanCount === "number") {
      return resultsState!.rescanCount;
    }
    return 0;
  });
  const [noMoreOptionsMessage, setNoMoreOptionsMessage] = React.useState<
    string | null
  >(null);

  const seenPlaceKeysRef = React.useRef<Set<string>>(
    new Set(
      (hasSavedState
        ? (resultsState!.batches as PlaceT[][]).flat().map(placeKey)
        : fillToFive(places.slice(0, 5)).map(placeKey)) as string[],
    ),
  );

  const prevResultsKeyRef = React.useRef<string | null>(null);
  React.useEffect(() => {
    if (prevResultsKeyRef.current == null) {
      prevResultsKeyRef.current = currentResultsKey;
      return;
    }
    if (prevResultsKeyRef.current === currentResultsKey) {
      return;
    }

    // New search → reset in-memory state.
    const first = fillToFive(places.slice(0, 5));
    setBatches([first]);
    setActiveBatchIndex(0);
    seenPlaceKeysRef.current = new Set(first.map(placeKey));
    setRescanCount(0);
    setNoMoreOptionsMessage(null);
    prevResultsKeyRef.current = currentResultsKey;
  }, [currentResultsKey, places, fillToFive]);

  // Persist batches + active index into route params so back-navigation restores correctly
  // even if the screen is temporarily unmounted.
  const lastPersistedRef = React.useRef<string>("");
  React.useEffect(() => {
    try {
      const payload = {
        resultsKey: currentResultsKey,
        resultsState: {
          batches,
          activeBatchIndex,
          rescanCount,
        },
      };
      const serialized = JSON.stringify(payload);
      if (serialized === lastPersistedRef.current) return;
      lastPersistedRef.current = serialized;

      navigation.setParams(payload as any);
    } catch {
      // ignore persistence failures
    }
  }, [batches, activeBatchIndex, rescanCount, currentResultsKey, navigation]);

  const lastBatchIndex = Math.max(0, batches.length - 1);
  const canGoPrev = activeBatchIndex > 0;
  const canGoNextStored = activeBatchIndex < lastBatchIndex;
  const isOnLastBatch = activeBatchIndex === lastBatchIndex;
  const canRescanMore = batches.length < TOTAL_BATCHES;

  const canPressNewOptions = !isRescanning && (canGoNextStored || canRescanMore);

  const defaultNoMoreText = "Try adjusting your locations for more options.";
  const messageText =
    noMoreOptionsMessage ?? (isOnLastBatch && !canRescanMore ? defaultNoMoreText : null);
  const shouldShowMessage = Boolean(messageText);
  const messageOpacity = React.useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    Animated.timing(messageOpacity, {
      toValue: shouldShowMessage ? 1 : 0,
      duration: 180,
      useNativeDriver: true,
    }).start();
  }, [messageOpacity, shouldShowMessage]);

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
    if (isRescanning) return;

    if (!isOnLastBatch) {
      // If a "next" batch exists but is empty for any reason, force a rescan
      // instead of advancing to a blank page.
      const maybeNext = batches[activeBatchIndex + 1];
      if (Array.isArray(maybeNext) && maybeNext.length > 0) {
        handleNextBatch();
      } else if (canRescanMore) {
        setNoMoreOptionsMessage(null);
        await handleRescan();
      }
      return;
    }

    if (isOnLastBatch && canRescanMore) {
      setNoMoreOptionsMessage(null);
      await handleRescan();
      return;
    }

    setNoMoreOptionsMessage("Try adjusting your locations for more options.");
  };

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
    candidates: typeof currentPlaces,
    exclude: typeof currentPlaces,
    seed: number,
  ) => {
    const excludeKeys = new Set(exclude.map(placeKey));
    const uniq: typeof currentPlaces = [];
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

  const handleShare = async () => {
    try {
      // Share all batches we've already loaded (not just up to the current),
      // but open the shared page on the batch the user is viewing.
      const placeIdBatches = batches
        .map((batch) => batch.map((p) => p.placeId).filter(Boolean))
        .filter((batch) => batch.length > 0);

      const url = midpointShareUrl(
        locationA,
        locationB,
        placeIdBatches,
        activeBatchIndex,
      );

      if (Platform.OS === "ios") {
        await Share.share({ url });
      } else {
        await Share.share({ message: url });
      }

      track("midpoint_shared", {
        locationA,
        locationB,
        url,
        placesCount: currentPlaces.length,
      });
    } catch {
      // ignore
    }
  };

  const handleRescan = async () => {
    if (!midpoint) return;
    if (isRescanning) return;
    if (rescanCount >= MAX_RESCANS_PER_SEARCH) return;

    setIsRescanning(true);
    try {
      const seed = Date.now();
      const current = batches[batches.length - 1] ?? currentPlaces;
      const seenKeys = new Set(seenPlaceKeysRef.current);

      let chosen: typeof currentPlaces | null = null;

      let pool: typeof currentPlaces = [];
      let hadAnySuccessfulFetch = false;
      for (let attempt = 0; attempt < 12; attempt++) {
        const coords =
          attempt === 0
            ? { lat: midpoint.lat, lng: midpoint.lng }
            : jitterLatLng(midpoint.lat, midpoint.lng, seed, attempt);

        let batch: typeof currentPlaces = [];
        try {
          // eslint-disable-next-line no-await-in-loop
          batch = await api.getPlaces(coords.lat, coords.lng);
          hadAnySuccessfulFetch = true;
        } catch {
          // Try the next jittered coordinate. We'll still guarantee a full batch
          // even if all requests fail.
          continue;
        }

        pool = pool.concat(batch);

        const next = pickFiveUnique(pool, current, seed).filter(
          (p) => !seenKeys.has(placeKey(p)),
        );

        if (next.length >= 5) {
          chosen = next.slice(0, 5);
          break;
        }
      }

      // If we couldn't find 5 brand-new unique places (common in rural areas),
      // we still must return a full batch. Relax uniqueness constraints in a
      // controlled order:
      // 1) Avoid repeating the current batch
      // 2) Allow repeats from earlier batches
      // 3) As a last resort, repeat items to fill to 5
      if (!chosen) {
        const distinctPool = uniqByKey(pool);
        const avoidCurrent = pickFiveUnique(distinctPool, current, seed);
        if (avoidCurrent.length > 0) {
          chosen = fillToFive(avoidCurrent);
        } else {
          // If the API repeatedly fails, we may have no pool at all.
          // Fall back to what we already have on-screen so the UI never stalls.
          const fallbackBase =
            distinctPool.length > 0
              ? distinctPool
              : uniqByKey(batches.flat().length > 0 ? batches.flat() : current);
          const randomized = shuffleWithSeed(fallbackBase, seed);
          chosen = fillToFive(randomized);
        }
      }

      if (chosen && chosen.length > 0) {
        setBatches((prev) => {
          const nextIndex = prev.length;
          const nextBatch = fillToFive(chosen);
          // Keep active index in sync with the actual append.
          setActiveBatchIndex(nextIndex);
          return [...prev, nextBatch];
        });
        for (const p of chosen) seenPlaceKeysRef.current.add(placeKey(p));

        setRescanCount((c) => c + 1);

        track("places_rescanned", {
          locationA,
          locationB,
          placesCount: 5,
          source: "results_rescan",
        });
      } else if (!hadAnySuccessfulFetch) {
        setNoMoreOptionsMessage(
          "Couldn’t refresh right now. Check your connection and try again.",
        );
      } else {
        setNoMoreOptionsMessage(
          "No nearby options were found for this midpoint. Try adjusting your locations and try again.",
        );
      }
    } catch {
      setNoMoreOptionsMessage(
        "Couldn’t refresh right now. Check your connection and try again.",
      );
    } finally {
      setIsRescanning(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          alignItems: "center",
          justifyContent: "center",
          padding: theme.spacing.xl,
        }}
      >
        <MidloCard>
          <View
            style={{ alignItems: "center", marginBottom: theme.spacing.xl }}
          >
            <Image
              source={Logo}
              style={{
                width: 80,
                height: 26,
                resizeMode: "contain",
                marginBottom: theme.spacing.sm,
              }}
            />
            <Text
              style={{
                fontSize: theme.typography.heading,
                color: theme.colors.primaryDark,
                fontWeight: theme.typography.weight.bold as any,
                textAlign: "center",
                marginBottom: theme.spacing.xs,
              }}
            >
              Your midpoint
            </Text>
            <Text
              style={{
                fontSize: theme.typography.body,
                color: theme.colors.textSecondary,
                textAlign: "center",
              }}
            >
              A fair spot between:
            </Text>
            <Text
              style={{
                fontSize: theme.typography.body,
                color: theme.colors.text,
                textAlign: "center",
                marginTop: theme.spacing.sm,
              }}
            >
              A: {locationA}
            </Text>
            <Text
              style={{
                fontSize: theme.typography.body,
                color: theme.colors.text,
                textAlign: "center",
              }}
            >
              B: {locationB}
            </Text>

            <View
              style={{
                marginTop: theme.spacing.lg,
                paddingVertical: theme.spacing.sm,
                paddingHorizontal: theme.spacing.lg,
                borderRadius: theme.radii.pill,
                backgroundColor: theme.colors.highlight,
              }}
            >
              <Text
                style={{
                  fontSize: theme.typography.subheading,
                  color: theme.colors.primaryDark,
                  fontWeight: theme.typography.weight.medium as any,
                  textAlign: "center",
                }}
              >
                Lat {midpoint.lat.toFixed(4)} · Lng {midpoint.lng.toFixed(4)}
              </Text>
            </View>
          </View>

          {/* NAVIGATION BUTTONS */}
          <View style={{ gap: theme.spacing.sm, marginBottom: theme.spacing.lg }}>
            <MidloButton
              title="View on map"
              onPress={() =>
                navigation.navigate("Map", { midpoint, places: currentPlaces })
              }
              variant="primary"
            />
          </View>

          {/* RESULTS LIST */}
          <View
            style={{
              borderTopWidth: 1,
              borderTopColor: theme.colors.divider,
              paddingTop: theme.spacing.lg,
            }}
          >
            <View style={{ gap: theme.spacing.lg, marginBottom: theme.spacing.lg }}>
              <Text
                style={{
                  fontSize: theme.typography.subheading,
                  color: theme.colors.primaryDark,
                  fontWeight: theme.typography.weight.medium as any,
                  textAlign: "left",
                }}
              >
                Nearby options
              </Text>

              {/* CENTERED NAV CLUSTER (stable, always visible) */}
              <View style={{ gap: theme.spacing.sm, alignItems: "center" }}>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: theme.spacing.xs,
                    padding: theme.spacing.xs,
                    height: 44,
                    borderRadius: theme.radii.pill,
                    borderWidth: 1,
                    borderColor: theme.colors.divider,
                    backgroundColor: theme.colors.surface,
                    alignSelf: "center",
                    width: "100%",
                    maxWidth: 520,
                    overflow: "hidden",
                    ...theme.shadow.card,
                  }}
                >
                  {/* PREV */}
                  <Pressable
                    onPress={handlePrevBatch}
                    disabled={!canGoPrev}
                    style={({ pressed }) => [
                      {
                        flexGrow: 1,
                        flexBasis: 0,
                        minWidth: 0,
                        paddingVertical: 8,
                        paddingHorizontal: 10,
                        borderRadius: theme.radii.pill,
                        borderWidth: 1,
                        borderColor: theme.colors.divider,
                        backgroundColor: theme.colors.surface,
                        opacity: canGoPrev ? 1 : 0.42,
                        alignItems: "center",
                        justifyContent: "center",
                      },
                      pressed && canGoPrev
                        ? { backgroundColor: theme.colors.highlight }
                        : null,
                    ]}
                  >
                    <Text
                      numberOfLines={1}
                      style={{
                        fontSize: theme.typography.caption,
                        color: theme.colors.primaryDark,
                        fontWeight: theme.typography.weight.medium as any,
                      }}
                    >
                      Prev
                    </Text>
                  </Pressable>

                  {/* NEXT */}
                  <Pressable
                    onPress={handleNextBatch}
                    disabled={!canGoNextStored}
                    style={({ pressed }) => [
                      {
                        flexGrow: 1,
                        flexBasis: 0,
                        minWidth: 0,
                        paddingVertical: 8,
                        paddingHorizontal: 10,
                        borderRadius: theme.radii.pill,
                        borderWidth: 1,
                        borderColor: theme.colors.divider,
                        backgroundColor: theme.colors.surface,
                        opacity: canGoNextStored ? 1 : 0.42,
                        alignItems: "center",
                        justifyContent: "center",
                      },
                      pressed && canGoNextStored
                        ? { backgroundColor: theme.colors.highlight }
                        : null,
                    ]}
                  >
                    <Text
                      numberOfLines={1}
                      style={{
                        fontSize: theme.typography.caption,
                        color: theme.colors.primaryDark,
                        fontWeight: theme.typography.weight.medium as any,
                      }}
                    >
                      Next
                    </Text>
                  </Pressable>

                  {/* NEW OPTIONS */}
                  <Pressable
                    onPress={() => void handleSeeDifferentOptions()}
                    disabled={!canPressNewOptions}
                    style={({ pressed }) => {
                      const enabled = canPressNewOptions;
                      return [
                        {
                          flexGrow: 1.6,
                          flexBasis: 0,
                          minWidth: 0,
                          paddingVertical: 8,
                          paddingHorizontal: 10,
                          borderRadius: theme.radii.pill,
                          borderWidth: 1,
                          borderColor: theme.colors.accent,
                          backgroundColor: theme.colors.surface,
                          opacity: enabled ? 1 : 0.42,
                          alignItems: "center",
                          justifyContent: "center",
                        },
                        pressed && enabled
                          ? { backgroundColor: theme.colors.highlight }
                          : null,
                      ];
                    }}
                  >
                    <Text
                      numberOfLines={1}
                      style={{
                        fontSize: theme.typography.caption,
                        color: theme.colors.primaryDark,
                        fontWeight: theme.typography.weight.medium as any,
                      }}
                    >
                      {isRescanning ? "Refreshing…" : "New options"}
                    </Text>
                  </Pressable>
                </View>

                {/* MESSAGE ROW — fixed height, fades without shifting */}
                <View
                  style={{
                    height: 20,
                    alignItems: "center",
                    justifyContent: "center",
                    width: "100%",
                  }}
                >
                  <Animated.Text
                    style={{
                      opacity: messageOpacity,
                      fontSize: theme.typography.caption,
                      color: theme.colors.muted,
                      textAlign: "center",
                    }}
                  >
                    {messageText ?? ""}
                  </Animated.Text>
                </View>
              </View>

              <Text
                style={{
                  fontSize: theme.typography.caption,
                  color: theme.colors.muted,
                  textAlign: "center",
                  marginTop: theme.spacing.md,
                }}
              >
                A few places that make meeting in the middle actually feel good.
              </Text>
            </View>

            {currentPlaces.length === 0 ? (
              <View
                style={{
                  padding: theme.spacing.md,
                  borderWidth: 1,
                  borderColor: theme.colors.divider,
                  borderRadius: theme.radii.md,
                  backgroundColor: theme.colors.surface,
                  ...theme.shadow.card,
                }}
              >
                <Text
                  style={{
                    color: theme.colors.textSecondary,
                    fontSize: theme.typography.caption,
                    textAlign: "center",
                  }}
                >
                  No nearby options were found for this midpoint. Try adjusting your locations, then tap “New options”.
                </Text>
              </View>
            ) : null}

            <View style={{ gap: theme.spacing.sm }}>
              {currentPlaces.map((p, idx) => (
                <Pressable
                  key={p.placeId ?? String(idx)}
                  onPress={() => {
                    if (p.placeId) {
                      track("place_opened", {
                        placeId: p.placeId,
                        source: "results",
                      });
                      navigation.navigate("Place", { placeId: p.placeId });
                    }
                  }}
                  style={({ pressed }) => [
                    {
                      padding: theme.spacing.md,
                      borderWidth: 1,
                      borderColor: theme.colors.divider,
                      borderRadius: theme.radii.md,
                      backgroundColor: theme.colors.surface,
                      ...theme.shadow.card,
                    },
                    pressed
                      ? { backgroundColor: theme.colors.highlight }
                      : null,
                  ]}
                >
                  <Text
                    style={{
                      color: theme.colors.text,
                      fontSize: theme.typography.body,
                      fontWeight: theme.typography.weight.medium as any,
                      marginBottom: theme.spacing.xs,
                    }}
                  >
                    {p.name}
                  </Text>
                  <Text
                    style={{
                      color: theme.colors.muted,
                      fontSize: theme.typography.caption,
                    }}
                  >
                    {p.distance} from midpoint
                  </Text>
                </Pressable>
              ))}
            </View>

            <View style={{ marginTop: theme.spacing.lg }}>
              <MidloButton
                title="Share this midpoint & list"
                onPress={handleShare}
                variant="secondary"
              />
            </View>
          </View>
        </MidloCard>
      </ScrollView>
    </SafeAreaView>
  );
}

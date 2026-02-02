import React from 'react';
import {
  SafeAreaView,
  View,
  Text,
  ScrollView,
  Share,
  Image,
  Pressable,
  Platform,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';

import { theme } from 'theme';
import type { RootStackParamList } from 'navigation';
import MidloButton from '../../components/MidloButton';
import MidloCard from '../../components/MidloCard';
import { midpointShareUrl } from '../../utils/shareLinks';
import { track } from '../../services/analytics';
import { api } from '../../services/api';

import Logo from '../../assets/images/midlo_logo.png';

type ResultsRoute = RouteProp<RootStackParamList, 'Results'>;

export default function ResultsScreen() {
  const navigation =
    useNavigation<import('@react-navigation/native').NavigationProp<RootStackParamList>>();
  const route = useRoute<ResultsRoute>();

  const { midpoint, places, locationA, locationB } = route.params;

  const MAX_RESCANS_PER_SEARCH = 3;

  const [currentPlaces, setCurrentPlaces] = React.useState(places.slice(0, 5));
  const [isRescanning, setIsRescanning] = React.useState(false);
  const [rescanCount, setRescanCount] = React.useState(0);

  const placeKey = (p: (typeof currentPlaces)[number]) => p.placeId || `${p.name}__${p.distance}`;

  const shuffleWithSeed = <T,>(items: T[], seed: number): T[] => {
    // mulberry32
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

  const pickFiveUnique = (candidates: typeof currentPlaces, exclude: typeof currentPlaces, seed: number) => {
    const excludeKeys = new Set(exclude.map(placeKey));
    const uniq: typeof currentPlaces = [];
    const seen = new Set<string>();

    for (const p of candidates) {
      const k = placeKey(p);
      if (excludeKeys.has(k)) continue;
      if (seen.has(k)) continue;
      seen.add(k);
      uniq.push(p);
      if (uniq.length >= 5) break;
    }

    if (uniq.length >= 5) return uniq;

    const shuffledFallback = shuffleWithSeed(exclude, seed).slice(0, 5);
    return uniq.length ? [...uniq, ...shuffledFallback].slice(0, 5) : shuffledFallback;
  };

  const jitterLatLng = (lat: number, lng: number, seed: number, attempt: number) => {
    const angle = ((seed + attempt * 997) % 360) * (Math.PI / 180);
    const radiusDeg = 0.0015 + attempt * 0.001;
    const latDelta = Math.cos(angle) * radiusDeg;
    const lngDelta = (Math.sin(angle) * radiusDeg) / Math.max(0.2, Math.cos((lat * Math.PI) / 180));
    return { lat: lat + latDelta, lng: lng + lngDelta };
  };

  const handleShare = async () => {
    try {
      const url = midpointShareUrl(locationA, locationB);

      if (Platform.OS === 'ios') {
        await Share.share({ url });
      } else {
        await Share.share({ message: url });
      }

      track('midpoint_shared', {
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
    if (rescanCount >= MAX_RESCANS_PER_SEARCH) return;

    setIsRescanning(true);
    try {
      const seed = Date.now();
      const current = currentPlaces;

      let pool: typeof currentPlaces = [];
      for (let attempt = 0; attempt < 4; attempt++) {
        const coords =
          attempt === 0
            ? { lat: midpoint.lat, lng: midpoint.lng }
            : jitterLatLng(midpoint.lat, midpoint.lng, seed, attempt);
        // eslint-disable-next-line no-await-in-loop
        const batch = await api.getPlaces(coords.lat, coords.lng);
        pool = pool.concat(batch);

        const next = pickFiveUnique(pool, current, seed);
        const currentKeys = new Set(current.map(placeKey));
        if (next.length === 5 && next.some((p) => !currentKeys.has(placeKey(p)))) {
          setCurrentPlaces(next);
          break;
        }
        if (attempt === 3) setCurrentPlaces(pickFiveUnique(pool, current, seed));
      }

      setRescanCount((c) => c + 1);

      track('places_rescanned', {
        locationA,
        locationB,
        placesCount: 5,
        source: 'results_rescan',
      });
    } catch {
      // ignore for now
    } finally {
      setIsRescanning(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          alignItems: 'center',
          justifyContent: 'center',
          padding: theme.spacing.xl,
        }}
      >
        <MidloCard>
          <View style={{ alignItems: 'center', marginBottom: theme.spacing.xl }}>
            <Image
              source={Logo}
              style={{
                width: 80,
                height: 26,
                resizeMode: 'contain',
                marginBottom: theme.spacing.sm,
              }}
            />
            <Text
              style={{
                fontSize: theme.typography.heading,
                color: theme.colors.primaryDark,
                fontWeight: theme.typography.weight.bold as any,
                textAlign: 'center',
                marginBottom: theme.spacing.xs,
              }}
            >
              Your midpoint
            </Text>
            <Text
              style={{
                fontSize: theme.typography.body,
                color: theme.colors.textSecondary,
                textAlign: 'center',
              }}
            >
              A fair spot between:
            </Text>
            <Text
              style={{
                fontSize: theme.typography.body,
                color: theme.colors.text,
                textAlign: 'center',
                marginTop: theme.spacing.sm,
              }}
            >
              A: {locationA}
            </Text>
            <Text
              style={{
                fontSize: theme.typography.body,
                color: theme.colors.text,
                textAlign: 'center',
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
                  textAlign: 'center',
                }}
              >
                Lat {midpoint.lat.toFixed(4)} · Lng {midpoint.lng.toFixed(4)}
              </Text>
            </View>
          </View>

          {/* Primary actions */}
          <View style={{ gap: theme.spacing.sm, marginBottom: theme.spacing.lg }}>
            <MidloButton
              title="View on map"
              onPress={() => navigation.navigate('Map', { midpoint, places: currentPlaces })}
              variant="primary"
            />
            <MidloButton
              title={
                isRescanning
                  ? 'Finding new options…'
                  : rescanCount >= MAX_RESCANS_PER_SEARCH
                    ? 'Try adjusting your locations'
                    : 'See different options'
              }
              onPress={handleRescan}
              variant="secondary"
              disabled={isRescanning || rescanCount >= MAX_RESCANS_PER_SEARCH}
            />
          </View>

          <View
            style={{
              borderTopWidth: 1,
              borderTopColor: theme.colors.divider,
              paddingTop: theme.spacing.lg,
            }}
          >
            <Text
              style={{
                fontSize: theme.typography.subheading,
                color: theme.colors.primaryDark,
                fontWeight: theme.typography.weight.medium as any,
                marginBottom: theme.spacing.sm,
              }}
            >
              Nearby options
            </Text>
            <Text
              style={{
                fontSize: theme.typography.caption,
                color: theme.colors.muted,
                marginBottom: theme.spacing.md,
              }}
            >
              A few places that make meeting in the middle actually feel good.
            </Text>

            <View style={{ gap: theme.spacing.sm }}>
              {currentPlaces.map((p, idx) => (
                <Pressable
                  key={p.placeId ?? String(idx)}
                  onPress={() => {
                    if (p.placeId) {
                      track('place_opened', { placeId: p.placeId, source: 'results' });
                      navigation.navigate('Place', { placeId: p.placeId });
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
                    pressed ? { backgroundColor: theme.colors.highlight } : null,
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

            {/* Share link – clearly associated with this list */}
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

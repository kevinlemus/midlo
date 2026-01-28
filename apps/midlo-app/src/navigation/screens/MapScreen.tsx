import React from 'react';
import { View, Text, Image, Platform } from 'react-native';
import { useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';

import MapView, { Marker } from 'react-native-maps';

import { theme } from 'theme';
import type { RootStackParamList } from 'navigation';
import MidloCard from '../../components/MidloCard';

import Logo from '../../assets/images/midlo_logo.png';

type MapRoute = RouteProp<RootStackParamList, 'Map'>;

export default function MapScreen() {
  const route = useRoute<MapRoute>();
  const { midpoint, places } = route.params ?? { midpoint: { lat: 0, lng: 0 }, places: [] };

  const mapRef = React.useRef<MapView | null>(null);

  const coords = React.useMemo(
    () => [
      { latitude: midpoint.lat, longitude: midpoint.lng },
      ...(places ?? []).map((p) => ({ latitude: p.lat, longitude: p.lng })),
    ],
    [midpoint.lat, midpoint.lng, places],
  );

  React.useEffect(() => {
    if (Platform.OS === 'web') return;
    if (!mapRef.current) return;
    if (!coords.length) return;

    // Fit after first layout pass.
    const t = setTimeout(() => {
      mapRef.current?.fitToCoordinates(coords, {
        edgePadding: { top: 70, right: 70, bottom: 70, left: 70 },
        animated: true,
      });
    }, 200);

    return () => clearTimeout(t);
  }, [coords]);

  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.bg,
        padding: theme.spacing.xl,
      }}
    >
      <MidloCard style={{ alignItems: 'center' }}>
        <Image
          source={Logo}
          style={{ width: 80, height: 26, resizeMode: 'contain', marginBottom: theme.spacing.sm }}
        />
        <Text
          style={{
            fontSize: theme.typography.heading,
            color: theme.colors.primaryDark,
            fontWeight: theme.typography.weight.bold as any,
            marginBottom: theme.spacing.md,
          }}
        >
          Map
        </Text>

        {Platform.OS === 'web' ? (
          <View
            style={{
              width: '100%',
              height: 260,
              borderWidth: 1,
              borderColor: theme.colors.divider,
              borderRadius: theme.radii.lg,
              backgroundColor: theme.colors.surface,
              alignItems: 'center',
              justifyContent: 'center',
              padding: theme.spacing.md,
            }}
          >
            <Text style={{ color: theme.colors.textSecondary, textAlign: 'center' }}>
              Map view isn’t available on web yet.
            </Text>
            <Text style={{ color: theme.colors.muted, marginTop: 6, textAlign: 'center' }}>
              Run on iOS/Android to see pins.
            </Text>
          </View>
        ) : (
          <View
            style={{
              width: '100%',
              height: 320,
              borderWidth: 1,
              borderColor: theme.colors.divider,
              borderRadius: theme.radii.lg,
              overflow: 'hidden',
              backgroundColor: theme.colors.surface,
            }}
          >
            <MapView
              ref={(r) => {
                mapRef.current = r;
              }}
              style={{ flex: 1 }}
              initialRegion={{
                latitude: midpoint.lat || 0,
                longitude: midpoint.lng || 0,
                latitudeDelta: 0.08,
                longitudeDelta: 0.08,
              }}
            >
              <Marker
                coordinate={{ latitude: midpoint.lat, longitude: midpoint.lng }}
                title="Midpoint"
                pinColor={theme.colors.primary}
              />
              {(places ?? []).map((p) => (
                <Marker
                  key={p.placeId}
                  coordinate={{ latitude: p.lat, longitude: p.lng }}
                  title={p.name}
                  description={`${p.distance} from midpoint`}
                />
              ))}
            </MapView>
          </View>
        )}

        <Text
          style={{
            marginTop: theme.spacing.lg,
            color: theme.colors.textSecondary,
            fontSize: theme.typography.body,
            textAlign: 'center',
          }}
        >
          Midpoint coordinates
        </Text>
        <Text
          style={{
            marginTop: theme.spacing.xs,
            color: theme.colors.primaryDark,
            fontSize: theme.typography.subheading,
            fontWeight: theme.typography.weight.medium as any,
            textAlign: 'center',
          }}
        >
          Lat {midpoint.lat.toFixed(4)} · Lng {midpoint.lng.toFixed(4)}
        </Text>
      </MidloCard>
    </View>
  );
}

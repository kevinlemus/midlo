import React from 'react';
import {
  SafeAreaView,
  View,
  Text,
  Image,
  ScrollView,
  Pressable,
  Platform,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import MapView, { Marker, LatLng, Polyline } from 'react-native-maps';

import { theme } from 'theme';
import type { RootStackParamList } from 'navigation';
import MidloCard from '../../components/MidloCard';
import MidloButton from '../../components/MidloButton';
import { openPointInMaps } from '../../utils/openMaps';
import { api } from '../../services/api';

import Logo from '../../assets/images/midlo_logo.png';

type MapRoute = RouteProp<RootStackParamList, 'Map'>;

export default function MapScreen() {
  const navigation =
    useNavigation<import('@react-navigation/native').NavigationProp<RootStackParamList>>();
  const route = useRoute<MapRoute>();
  const fallbackParams: RootStackParamList['Map'] = {
    midpoint: { lat: 0, lng: 0 },
    places: [],
    locationA: '',
    locationB: '',
  };
  const { midpoint, places, locationA, locationB, locationAPlaceId, locationBPlaceId } =
    route.params ?? fallbackParams;

  const mapRef = React.useRef<MapView | null>(null);

  const [locationACoords, setLocationACoords] = React.useState<
    { lat: number; lng: number } | null
  >(null);
  const [locationBCoords, setLocationBCoords] = React.useState<
    { lat: number; lng: number } | null
  >(null);

  React.useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        if (locationAPlaceId) {
          const a = await api.getPlaceDetails(locationAPlaceId);
          if (!cancelled) setLocationACoords({ lat: a.lat, lng: a.lng });
        } else if (!cancelled) {
          setLocationACoords(null);
        }
      } catch {
        if (!cancelled) setLocationACoords(null);
      }

      try {
        if (locationBPlaceId) {
          const b = await api.getPlaceDetails(locationBPlaceId);
          if (!cancelled) setLocationBCoords({ lat: b.lat, lng: b.lng });
        } else if (!cancelled) {
          setLocationBCoords(null);
        }
      } catch {
        if (!cancelled) setLocationBCoords(null);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [locationAPlaceId, locationBPlaceId]);

  // ⭐ Custom midpoint pin (Expo-safe, no PNG required)
  const midpointPin = (
    <View
      style={{
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: theme.colors.primary,
        borderWidth: 3,
        borderColor: 'white',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <View
        style={{
          width: 10,
          height: 10,
          borderRadius: 5,
          backgroundColor: 'white',
        }}
      />
    </View>
  );

  React.useEffect(() => {
    if (!mapRef.current) return;

    const coords: LatLng[] = [
      ...(locationACoords
        ? [{ latitude: locationACoords.lat, longitude: locationACoords.lng }]
        : []),
      ...(locationBCoords
        ? [{ latitude: locationBCoords.lat, longitude: locationBCoords.lng }]
        : []),
      { latitude: midpoint.lat, longitude: midpoint.lng },
      ...places.map((p) => ({ latitude: p.lat, longitude: p.lng })),
    ];

    if (coords.length === 0) return;

    mapRef.current.fitToCoordinates(coords, {
      edgePadding: { top: 60, right: 60, bottom: 60, left: 60 },
      animated: true,
    });
  }, [midpoint, places, locationACoords, locationBCoords]);

  const abPin = (label: 'A' | 'B') => (
    <View
      style={{
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: theme.colors.primaryDark,
        borderWidth: 3,
        borderColor: 'white',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <Text
        style={{
          color: 'white',
          fontSize: theme.typography.caption,
          fontWeight: theme.typography.weight.bold as any,
        }}
      >
        {label}
      </Text>
    </View>
  );

  const openDefaultDirections = React.useCallback(() => {
    void openPointInMaps(Platform.OS === 'ios' ? 'apple' : 'google', {
      lat: midpoint.lat,
      lng: midpoint.lng,
      label: 'Midpoint',
    });
  }, [midpoint.lat, midpoint.lng]);

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
        <MidloCard style={{ alignItems: 'center' }}>
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
              marginBottom: theme.spacing.md,
            }}
          >
            Map
          </Text>

          <View
            style={{
              marginBottom: theme.spacing.md,
              paddingVertical: theme.spacing.sm,
              paddingHorizontal: theme.spacing.lg,
              borderRadius: theme.radii.pill,
              backgroundColor: theme.colors.highlight,
            }}
          >
            <Text
              style={{
                color: theme.colors.primaryDark,
                fontSize: theme.typography.caption,
              }}
            >
              Midpoint · Lat {midpoint.lat.toFixed(4)} · Lng {midpoint.lng.toFixed(4)}
            </Text>
          </View>

          <View
            style={{
              width: '100%',
              height: 320,
              borderRadius: theme.radii.lg,
              overflow: 'hidden',
              borderWidth: 1,
              borderColor: theme.colors.divider,
              marginBottom: theme.spacing.lg,
            }}
          >
            <MapView
              ref={mapRef}
              style={{ flex: 1 }}
              initialRegion={{
                latitude: midpoint.lat || 0,
                longitude: midpoint.lng || 0,
                latitudeDelta: 0.05,
                longitudeDelta: 0.05,
              }}
            >
              {locationACoords && locationBCoords ? (
                <Polyline
                  coordinates={[
                    {
                      latitude: locationACoords.lat,
                      longitude: locationACoords.lng,
                    },
                    {
                      latitude: locationBCoords.lat,
                      longitude: locationBCoords.lng,
                    },
                  ]}
                  strokeColor={theme.colors.accent}
                  strokeWidth={3}
                />
              ) : null}

              {locationACoords ? (
                <Marker
                  coordinate={{
                    latitude: locationACoords.lat,
                    longitude: locationACoords.lng,
                  }}
                  title="Location A"
                  description={locationA || undefined}
                >
                  {abPin('A')}
                </Marker>
              ) : null}

              {locationBCoords ? (
                <Marker
                  coordinate={{
                    latitude: locationBCoords.lat,
                    longitude: locationBCoords.lng,
                  }}
                  title="Location B"
                  description={locationB || undefined}
                >
                  {abPin('B')}
                </Marker>
              ) : null}

              {/* ⭐ Midpoint pin (custom view) */}
              <Marker
                coordinate={{ latitude: midpoint.lat, longitude: midpoint.lng }}
                title="Midpoint"
              >
                {midpointPin}
              </Marker>

              {/* ⭐ Place pins (default markers) */}
              {places.map((p) => (
                <Marker
                  key={p.placeId}
                  coordinate={{ latitude: p.lat, longitude: p.lng }}
                  title={p.name}
                />
              ))}
            </MapView>
          </View>

          <MidloButton
            title="Get directions"
            onPress={openDefaultDirections}
          />

          <View
            style={{
              width: '100%',
              borderWidth: 1,
              borderColor: theme.colors.divider,
              borderRadius: theme.radii.lg,
              backgroundColor: theme.colors.surface,
              overflow: 'hidden',
              marginTop: theme.spacing.lg,
              marginBottom: theme.spacing.lg,
            }}
          >
            <View style={{ padding: theme.spacing.md, gap: theme.spacing.sm }}>
              <Text
                style={{
                  color: theme.colors.textSecondary,
                  fontSize: theme.typography.caption,
                  marginBottom: theme.spacing.xs,
                }}
              >
                Open midpoint in your maps app
              </Text>

              <View
                style={{
                  flexDirection: 'row',
                  gap: theme.spacing.sm,
                  flexWrap: 'wrap',
                }}
              >
                <Pressable
                  onPress={() =>
                    void openPointInMaps('google', {
                      lat: midpoint.lat,
                      lng: midpoint.lng,
                      label: 'Midpoint',
                    })
                  }
                  style={{
                    paddingVertical: 6,
                    paddingHorizontal: 10,
                    borderRadius: theme.radii.pill,
                    borderWidth: 1,
                    borderColor: theme.colors.accent,
                  }}
                >
                  <Text
                    style={{
                      color: theme.colors.primaryDark,
                      fontSize: theme.typography.caption,
                    }}
                  >
                    Google Maps
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() =>
                    void openPointInMaps('apple', {
                      lat: midpoint.lat,
                      lng: midpoint.lng,
                      label: 'Midpoint',
                    })
                  }
                  style={{
                    paddingVertical: 6,
                    paddingHorizontal: 10,
                    borderRadius: theme.radii.pill,
                    borderWidth: 1,
                    borderColor: theme.colors.accent,
                  }}
                >
                  <Text
                    style={{
                      color: theme.colors.primaryDark,
                      fontSize: theme.typography.caption,
                    }}
                  >
                    Apple Maps
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() =>
                    void openPointInMaps('waze', {
                      lat: midpoint.lat,
                      lng: midpoint.lng,
                      label: 'Midpoint',
                    })
                  }
                  style={{
                    paddingVertical: 6,
                    paddingHorizontal: 10,
                    borderRadius: theme.radii.pill,
                    borderWidth: 1,
                    borderColor: theme.colors.accent,
                  }}
                >
                  <Text
                    style={{
                      color: theme.colors.primaryDark,
                      fontSize: theme.typography.caption,
                    }}
                  >
                    Waze
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>

          <View style={{ width: '100%' }}>
            <MidloButton
              title="Back"
              onPress={() => navigation.goBack()}
              variant="secondary"
            />
          </View>
        </MidloCard>
      </ScrollView>
    </SafeAreaView>
  );
}

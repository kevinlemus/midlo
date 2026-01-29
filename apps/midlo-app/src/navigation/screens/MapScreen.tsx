import React from 'react';
import {
  SafeAreaView,
  View,
  Text,
  Image,
  ScrollView,
  Pressable,
  Linking,
  Platform,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import MapView, { Marker, LatLng } from 'react-native-maps';

import { theme } from 'theme';
import type { RootStackParamList } from 'navigation';
import MidloCard from '../../components/MidloCard';
import MidloButton from '../../components/MidloButton';
import { mapsLinks, mapsLinksWithPlaceId } from '../../utils/maps';

import Logo from '../../assets/images/midlo_logo.png';

type MapRoute = RouteProp<RootStackParamList, 'Map'>;

export default function MapScreen() {
  const navigation =
    useNavigation<import('@react-navigation/native').NavigationProp<RootStackParamList>>();
  const route = useRoute<MapRoute>();
  const fallbackParams: RootStackParamList['Map'] = {
    midpoint: { lat: 0, lng: 0 },
    places: [],
  };
  const { midpoint, places } = route.params ?? fallbackParams;

  const midpointLinks = mapsLinks(midpoint.lat, midpoint.lng);

  const mapRef = React.useRef<MapView | null>(null);

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
      { latitude: midpoint.lat, longitude: midpoint.lng },
      ...places.map((p) => ({ latitude: p.lat, longitude: p.lng })),
    ];

    if (coords.length === 0) return;

    mapRef.current.fitToCoordinates(coords, {
      edgePadding: { top: 60, right: 60, bottom: 60, left: 60 },
      animated: true,
    });
  }, [midpoint, places]);

  const defaultDirectionsUrl =
    Platform.OS === 'ios'
      ? midpointLinks.apple
      : midpointLinks.google;

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
            onPress={() => Linking.openURL(defaultDirectionsUrl)}
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
                  onPress={() => Linking.openURL(midpointLinks.google)}
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
                  onPress={() => Linking.openURL(midpointLinks.apple)}
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
                  onPress={() => Linking.openURL(midpointLinks.waze)}
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

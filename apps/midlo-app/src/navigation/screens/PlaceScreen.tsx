import React from 'react';
import { track } from '../../services/analytics';
import {
  SafeAreaView,
  View,
  Text,
  ScrollView,
  Image,
  Pressable,
  Share,
  Linking,
  ScrollView as RNScrollView,
  Platform,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';

import { theme } from 'theme';
import type { RootStackParamList } from 'navigation';
import { api, placePhotoUrl } from '../../services/api';
import type { PlacePhoto } from '../../services/api';
import MidloCard from '../../components/MidloCard';
import MidloButton from '../../components/MidloButton';
import { mapsLinksWithPlaceId } from '../../utils/maps';
import { placeShareUrl } from '../../utils/shareLinks';

type PlaceRoute = RouteProp<RootStackParamList, 'Place'>;

export default function PlaceScreen() {
  const navigation =
    useNavigation<import('@react-navigation/native').NavigationProp<RootStackParamList>>();
  const route = useRoute<PlaceRoute>();

  const placeId = route.params?.placeId;

  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [details, setDetails] =
    React.useState<Awaited<ReturnType<typeof api.getPlaceDetails>> | null>(null);
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
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, [placeId]);

  const photos: PlacePhoto[] = (details?.photos ?? []).filter(
    (p): p is PlacePhoto => Boolean(p?.name),
  );
  const hero = selectedPhoto ?? photos[0]?.name;
  const extraPhotos = photos.slice(1, 5);
  const weekdayDescriptions = details?.weekdayDescriptions ?? [];

  const lat = (details as any)?.location?.latitude ?? (details as any)?.location?.lat;
  const lng = (details as any)?.location?.longitude ?? (details as any)?.location?.lng;

  const hasLatLng = typeof lat === 'number' && typeof lng === 'number';

  const priceLevel = (details as any)?.priceLevel as number | undefined;
  const primaryType =
    (details as any)?.primaryType ??
    (Array.isArray((details as any)?.types) ? (details as any).types[0] : undefined);

  const formatPrice = (level?: number) => {
    if (typeof level !== 'number') return null;
    return '$'.repeat(Math.min(Math.max(level, 1), 4));
  };

  const formatType = (t?: string) => {
    if (!t) return null;
    return t.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const handleShare = async () => {
    if (!placeId) return;

    try {
      const url = placeShareUrl(placeId);

      const name = details?.name ?? 'Place';
      const address = details?.formattedAddress ?? '';
      const message = `Meet in the middle with Midlo:\n\n${name}${address ? `\n${address}` : ''}\n\n${url}`;

      await Share.share({ title: name, message, url });
    } catch {
      // ignore
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      <ScrollView contentContainerStyle={{ padding: theme.spacing.xl }}>
        <MidloCard>
          {/* Header Row */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              gap: theme.spacing.sm,
              marginBottom: theme.spacing.md,
            }}
          >
            <Pressable
              onPress={() => navigation.goBack()}
              style={{
                paddingVertical: 8,
                paddingHorizontal: 10,
                borderWidth: 1,
                borderColor: theme.colors.divider,
                borderRadius: theme.radii.md,
              }}
            >
              <Text
                style={{
                  color: theme.colors.text,
                  fontSize: theme.typography.caption,
                }}
              >
                ← Back
              </Text>
            </Pressable>

            {details?.googleMapsUri ? (
              <Pressable
                onPress={() => {
                  track('place_opened', { placeId });
                  Linking.openURL(details.googleMapsUri!);
                }}
                style={{
                  paddingVertical: 8,
                  paddingHorizontal: 10,
                  borderWidth: 1,
                  borderColor: theme.colors.divider,
                  borderRadius: theme.radii.md,
                }}
              >
                <Text
                  style={{
                    color: theme.colors.text,
                    fontSize: theme.typography.caption,
                  }}
                >
                  Open in Maps
                </Text>
              </Pressable>
            ) : null}
          </View>

          {/* Loading */}
          {loading && (
            <View style={{ marginTop: theme.spacing.lg }}>
              <Text style={{ color: theme.colors.textSecondary }}>
                Loading place details…
              </Text>
            </View>
          )}

          {/* Error */}
          {error && (
            <View
              style={{
                marginTop: theme.spacing.lg,
                padding: theme.spacing.md,
                borderRadius: theme.radii.md,
                borderWidth: 1,
                borderColor: '#FCA5A5',
                backgroundColor: '#FEF2F2',
              }}
            >
              <Text
                style={{
                  color: theme.colors.danger,
                  fontSize: theme.typography.caption,
                }}
              >
                {error}
              </Text>
            </View>
          )}

          {/* Content */}
          {!loading && !error && details && (
            <>
              {/* Title + Address */}
              <View style={{ marginTop: theme.spacing.lg }}>
                <Text
                  style={{
                    fontSize: theme.typography.heading,
                    color: theme.colors.primaryDark,
                    fontWeight: theme.typography.weight.bold as any,
                  }}
                >
                  {details.name ?? 'Place'}
                </Text>

                {details.formattedAddress ? (
                  <Text
                    style={{
                      marginTop: theme.spacing.xs,
                      color: theme.colors.textSecondary,
                    }}
                  >
                    {details.formattedAddress}
                  </Text>
                ) : null}

                {/* Full-width Share button */}
                <View style={{ width: '100%', marginTop: theme.spacing.md }}>
                  <MidloButton
                    title="Share this place"
                    onPress={handleShare}
                    variant="secondary"
                  />
                </View>

                {/* Chips */}
                <View
                  style={{
                    flexDirection: 'row',
                    gap: 10,
                    flexWrap: 'wrap',
                    marginTop: theme.spacing.md,
                  }}
                >
                  {typeof details.rating === 'number' && (
                    <View
                      style={{
                        paddingVertical: 6,
                        paddingHorizontal: 10,
                        borderRadius: 999,
                        borderWidth: 1,
                        borderColor: theme.colors.divider,
                      }}
                    >
                      <Text
                        style={{
                          color: theme.colors.text,
                          fontSize: theme.typography.caption,
                        }}
                      >
                        {details.rating.toFixed(1)} ★
                        {typeof details.userRatingCount === 'number'
                          ? ` (${details.userRatingCount})`
                          : ''}
                      </Text>
                    </View>
                  )}

                  {typeof details.openNow === 'boolean' && (
                    <View
                      style={{
                        paddingVertical: 6,
                        paddingHorizontal: 10,
                        borderRadius: 999,
                        borderWidth: 1,
                        borderColor: theme.colors.divider,
                        backgroundColor: details.openNow
                          ? 'rgba(16,185,129,0.14)'
                          : 'rgba(239,68,68,0.14)',
                      }}
                    >
                      <Text
                        style={{
                          color: theme.colors.text,
                          fontSize: theme.typography.caption,
                        }}
                      >
                        {details.openNow ? 'Open now' : 'Closed'}
                      </Text>
                    </View>
                  )}

                  {formatPrice(priceLevel) && (
                    <View
                      style={{
                        paddingVertical: 6,
                        paddingHorizontal: 10,
                        borderRadius: 999,
                        borderWidth: 1,
                        borderColor: theme.colors.divider,
                      }}
                    >
                      <Text
                        style={{
                          color: theme.colors.text,
                          fontSize: theme.typography.caption,
                        }}
                      >
                        {formatPrice(priceLevel)}
                      </Text>
                    </View>
                  )}

                  {formatType(primaryType) && (
                    <View
                      style={{
                        paddingVertical: 6,
                        paddingHorizontal: 10,
                        borderRadius: 999,
                        borderWidth: 1,
                        borderColor: theme.colors.divider,
                      }}
                    >
                      <Text
                        style={{
                          color: theme.colors.text,
                          fontSize: theme.typography.caption,
                        }}
                      >
                        {formatType(primaryType)}
                      </Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Hero Image */}
              {hero && (
                <View
                  style={{
                    marginTop: theme.spacing.lg,
                    borderRadius: theme.radii.lg,
                    overflow: 'hidden',
                    borderWidth: 1,
                    borderColor: theme.colors.divider,
                  }}
                >
                  <Image
                    source={{ uri: placePhotoUrl(hero, 1200) }}
                    style={{
                      width: '100%',
                      height: 220,
                      backgroundColor: theme.colors.surface,
                    }}
                    resizeMode="cover"
                  />
                </View>
              )}

              {/* Thumbnails */}
              {extraPhotos.length > 0 && (
                <View style={{ marginTop: theme.spacing.md }}>
                  <RNScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ gap: theme.spacing.sm }}
                  >
                    {extraPhotos.map((p) => (
                      <Pressable
                        key={p.name}
                        onPress={() => setSelectedPhoto(p.name)}
                        style={{
                          width: 140,
                          height: 100,
                          borderRadius: theme.radii.md,
                          overflow: 'hidden',
                          borderWidth: 1,
                          borderColor:
                            selectedPhoto === p.name
                              ? theme.colors.primary
                              : theme.colors.divider,
                        }}
                      >
                        <Image
                          source={{ uri: placePhotoUrl(p.name, 600) }}
                          style={{ width: '100%', height: '100%', backgroundColor: theme.colors.highlight }}
                          resizeMode="cover"
                        />
                      </Pressable>
                    ))}
                  </RNScrollView>
                </View>
              )}

              {/* Hours */}
              {weekdayDescriptions.length > 0 && (
                <View style={{ marginTop: theme.spacing.lg }}>
                  <Text
                    style={{
                      color: theme.colors.primaryDark,
                      fontSize: theme.typography.subheading,
                      fontWeight: theme.typography.weight.medium as any,
                    }}
                  >
                    Hours
                  </Text>

                  <View style={{ marginTop: theme.spacing.sm, gap: 6 }}>
                    {weekdayDescriptions.map((line) => (
                      <Text
                        key={line}
                        style={{
                          color: theme.colors.textSecondary,
                          fontSize: theme.typography.body,
                        }}
                      >
                        {line}
                      </Text>
                    ))}
                  </View>
                </View>
              )}

              {/* Contact */}
              {(details.websiteUri || details.internationalPhoneNumber) && (
                <View style={{ marginTop: theme.spacing.lg, gap: theme.spacing.sm }}>
                  <Text
                    style={{
                      color: theme.colors.primaryDark,
                      fontSize: theme.typography.subheading,
                      fontWeight: theme.typography.weight.medium as any,
                    }}
                  >
                    Contact
                  </Text>

                  {details.websiteUri && (
                    <MidloButton
                      title="Visit website"
                      onPress={() => Linking.openURL(details.websiteUri!)}
                      variant="secondary"
                    />
                  )}

                  {details.internationalPhoneNumber && (
                    <MidloButton
                      title={`Call ${details.internationalPhoneNumber}`}
                      onPress={() =>
                        Linking.openURL(`tel:${details.internationalPhoneNumber}`)
                      }
                      variant="secondary"
                    />
                  )}
                </View>
              )}

              {/* Directions */}
              <View style={{ marginTop: theme.spacing.lg, gap: theme.spacing.sm }}>
                <Text
                  style={{
                    color: theme.colors.primaryDark,
                    fontSize: theme.typography.subheading,
                    fontWeight: theme.typography.weight.medium as any,
                  }}
                >
                  Directions
                </Text>

                {hasLatLng && placeId ? (
                  <View
                    style={{
                      flexDirection: 'row',
                      flexWrap: 'wrap',
                      gap: theme.spacing.sm,
                    }}
                  >
                    {(() => {
                      const links = mapsLinksWithPlaceId(lat, lng, placeId);
                      const defaultUrl =
                        Platform.OS === 'ios' ? links.apple : links.google;

                      return (
                        <>
                          <MidloButton
                            title="Get directions"
                            onPress={() => {
                              track('directions_clicked', { placeId });
                              Linking.openURL(defaultUrl);
                            }}
                          />

                          <Pressable
                            onPress={() => {
                              track('directions_clicked', {
                                placeId,
                                provider: 'google',
                              });
                              Linking.openURL(links.google);
                            }}
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
                            onPress={() => {
                              track('directions_clicked', {
                                placeId,
                                provider: 'apple',
                              });
                              Linking.openURL(links.apple);
                            }}
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
                            onPress={() => {
                              track('directions_clicked', {
                                placeId,
                                provider: 'waze',
                              });
                              Linking.openURL(links.waze);
                            }}
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
                        </>
                      );
                    })()}
                  </View>
                ) : details.googleMapsUri ? (
                  <MidloButton
                    title="Get directions"
                    onPress={() => {
                      track('directions_clicked', { placeId, provider: 'google_uri' });
                      Linking.openURL(details.googleMapsUri!);
                    }}
                  />
                ) : null}
              </View>
            </>
          )}
        </MidloCard>
      </ScrollView>
    </SafeAreaView>
  );
}

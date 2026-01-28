import React from 'react';
import { SafeAreaView, View, Text, ScrollView, Image, Pressable, Linking } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';

import { theme } from 'theme';
import type { RootStackParamList } from 'navigation';
import { api, placePhotoUrl } from '../../services/api';
import type { PlacePhoto } from '../../services/api';
import MidloCard from '../../components/MidloCard';

type PlaceRoute = RouteProp<RootStackParamList, 'Place'>;

export default function PlaceScreen() {
  const navigation = useNavigation<import('@react-navigation/native').NavigationProp<RootStackParamList>>();
  const route = useRoute<PlaceRoute>();

  const placeId = route.params?.placeId;

  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [details, setDetails] = React.useState<Awaited<ReturnType<typeof api.getPlaceDetails>> | null>(null);

  React.useEffect(() => {
    if (!placeId) return;
    setLoading(true);
    setError(null);
    api
      .getPlaceDetails(placeId)
      .then(setDetails)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, [placeId]);

  const photos: PlacePhoto[] = (details?.photos ?? []).filter((p): p is PlacePhoto => Boolean(p?.name));
  const hero = photos[0]?.name;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      <ScrollView contentContainerStyle={{ padding: theme.spacing.xl }}>
        <MidloCard>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: theme.spacing.sm }}>
            <Pressable
              onPress={() => navigation.goBack()}
              style={{ paddingVertical: 8, paddingHorizontal: 10, borderWidth: 1, borderColor: theme.colors.divider, borderRadius: theme.radii.md }}
            >
              <Text style={{ color: theme.colors.text, fontSize: theme.typography.caption }}>← Back</Text>
            </Pressable>

            {details?.googleMapsUri ? (
              <Pressable
                onPress={() => Linking.openURL(details.googleMapsUri!)}
                style={{ paddingVertical: 8, paddingHorizontal: 10, borderWidth: 1, borderColor: theme.colors.divider, borderRadius: theme.radii.md }}
              >
                <Text style={{ color: theme.colors.text, fontSize: theme.typography.caption }}>Open in Maps</Text>
              </Pressable>
            ) : null}
          </View>

          {loading && (
            <View style={{ marginTop: theme.spacing.lg }}>
              <Text style={{ color: theme.colors.textSecondary }}>Loading place details…</Text>
            </View>
          )}

          {error && (
            <View
              style={{
                marginTop: theme.spacing.lg,
                padding: theme.spacing.md,
                borderRadius: theme.radii.md,
                borderWidth: 1,
                borderColor: '#ffb4b4',
                backgroundColor: '#2a0f0f',
              }}
            >
              <Text style={{ color: '#ffd2d2' }}>{error}</Text>
            </View>
          )}

          {!loading && !error && details && (
            <>
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
                  <Text style={{ marginTop: theme.spacing.xs, color: theme.colors.textSecondary }}>
                    {details.formattedAddress}
                  </Text>
                ) : null}

                <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap', marginTop: theme.spacing.md }}>
                  {typeof details.rating === 'number' ? (
                    <View style={{ paddingVertical: 6, paddingHorizontal: 10, borderRadius: 999, borderWidth: 1, borderColor: theme.colors.divider }}>
                      <Text style={{ color: theme.colors.text, fontSize: theme.typography.caption }}>
                        {details.rating.toFixed(1)} ★{typeof details.userRatingCount === 'number' ? ` (${details.userRatingCount})` : ''}
                      </Text>
                    </View>
                  ) : null}

                  {typeof details.openNow === 'boolean' ? (
                    <View
                      style={{
                        paddingVertical: 6,
                        paddingHorizontal: 10,
                        borderRadius: 999,
                        borderWidth: 1,
                        borderColor: theme.colors.divider,
                        backgroundColor: details.openNow ? 'rgba(16,185,129,0.14)' : 'rgba(239,68,68,0.14)',
                      }}
                    >
                      <Text style={{ color: theme.colors.text, fontSize: theme.typography.caption }}>
                        {details.openNow ? 'Open now' : 'Closed'}
                      </Text>
                    </View>
                  ) : null}
                </View>
              </View>

              {hero ? (
                <View style={{ marginTop: theme.spacing.lg, borderRadius: theme.radii.lg, overflow: 'hidden', borderWidth: 1, borderColor: theme.colors.divider }}>
                  <Image
                    source={{ uri: placePhotoUrl(hero, 1200) }}
                    style={{ width: '100%', height: 220, backgroundColor: theme.colors.surface }}
                    resizeMode="cover"
                  />
                </View>
              ) : null}

              {details.weekdayDescriptions?.length ? (
                <View style={{ marginTop: theme.spacing.lg }}>
                  <Text style={{ color: theme.colors.primaryDark, fontSize: theme.typography.subheading, fontWeight: theme.typography.weight.medium as any }}>
                    Hours
                  </Text>
                  <View style={{ marginTop: theme.spacing.sm, gap: 6 }}>
                    {details.weekdayDescriptions.map((line) => (
                      <Text key={line} style={{ color: theme.colors.textSecondary }}>
                        {line}
                      </Text>
                    ))}
                  </View>
                </View>
              ) : null}
            </>
          )}
        </MidloCard>
      </ScrollView>
    </SafeAreaView>
  );
}

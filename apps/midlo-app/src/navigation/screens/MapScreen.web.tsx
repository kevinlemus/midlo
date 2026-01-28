import React from 'react';
import { SafeAreaView, View, Text, Image, ScrollView, Pressable, Linking } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';

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

          <View
            style={{
              width: '100%',
              borderWidth: 1,
              borderColor: theme.colors.divider,
              borderRadius: theme.radii.lg,
              backgroundColor: theme.colors.surface,
              overflow: 'hidden',
            }}
          >
            <View
              style={{
                width: '100%',
                height: 320,
                alignItems: 'center',
                justifyContent: 'center',
                padding: theme.spacing.lg,
                backgroundColor: theme.colors.highlight,
              }}
            >
              <Text
                style={{
                  color: theme.colors.primaryDark,
                  fontSize: theme.typography.body,
                  fontWeight: theme.typography.weight.medium as any,
                  textAlign: 'center',
                  marginBottom: theme.spacing.sm,
                }}
              >
                Interactive map is available in the mobile app.
              </Text>
              <Text style={{ color: theme.colors.textSecondary, fontSize: theme.typography.caption, textAlign: 'center' }}>
                Open the midpoint in Google/Apple Maps below.
              </Text>
            </View>

            <View style={{ padding: theme.spacing.md, gap: theme.spacing.sm }}>
              <Text style={{ color: theme.colors.textSecondary, fontSize: theme.typography.caption }}>
                Open midpoint in your maps app
              </Text>
              <View style={{ flexDirection: 'row', gap: theme.spacing.sm, flexWrap: 'wrap' }}>
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
                  <Text style={{ color: theme.colors.primaryDark, fontSize: theme.typography.caption }}>Google</Text>
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
                  <Text style={{ color: theme.colors.primaryDark, fontSize: theme.typography.caption }}>Apple</Text>
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
                  <Text style={{ color: theme.colors.primaryDark, fontSize: theme.typography.caption }}>Waze</Text>
                </Pressable>
              </View>
            </View>
          </View>

          {!!places?.length && (
            <View style={{ width: '100%', marginTop: theme.spacing.lg }}>
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
              <View style={{ gap: theme.spacing.sm }}>
                {places.map((p, idx) => (
                  <View
                    key={`${p.placeId}-${idx}`}
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
                        color: theme.colors.text,
                        fontSize: theme.typography.body,
                        fontWeight: theme.typography.weight.medium as any,
                        marginBottom: theme.spacing.xs,
                      }}
                    >
                      {p.name}
                    </Text>
                    <Text style={{ color: theme.colors.muted, fontSize: theme.typography.caption }}>
                      {p.distance} from midpoint
                    </Text>

                    <View style={{ flexDirection: 'row', gap: theme.spacing.sm, marginTop: theme.spacing.sm }}>
                      <Pressable
                        onPress={() => navigation.navigate('Place', { placeId: p.placeId })}
                        style={{
                          paddingVertical: 6,
                          paddingHorizontal: 10,
                          borderRadius: theme.radii.pill,
                          borderWidth: 1,
                          borderColor: theme.colors.accent,
                          backgroundColor: theme.colors.highlight,
                        }}
                      >
                        <Text style={{ color: theme.colors.primaryDark, fontSize: theme.typography.caption }}>
                          Details
                        </Text>
                      </Pressable>
                      <Pressable
                        onPress={() => Linking.openURL(mapsLinksWithPlaceId(p.lat, p.lng, p.placeId).google)}
                        style={{
                          paddingVertical: 6,
                          paddingHorizontal: 10,
                          borderRadius: theme.radii.pill,
                          borderWidth: 1,
                          borderColor: theme.colors.accent,
                        }}
                      >
                        <Text style={{ color: theme.colors.primaryDark, fontSize: theme.typography.caption }}>
                          Google
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          <View style={{ width: '100%', marginTop: theme.spacing.lg }}>
            <MidloButton title="Back" onPress={() => navigation.goBack()} variant="secondary" />
          </View>
        </MidloCard>
      </ScrollView>
    </SafeAreaView>
  );
}

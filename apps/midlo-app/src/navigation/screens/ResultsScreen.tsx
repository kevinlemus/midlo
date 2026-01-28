import React from 'react';
import {
  SafeAreaView,
  View,
  Text,
  ScrollView,
  Share,
  Image,
  Pressable,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';

import { theme } from 'theme';
import type { RootStackParamList } from 'navigation';
import MidloButton from '../../components/MidloButton';
import MidloCard from '../../components/MidloCard';

import Logo from '../../assets/images/midlo_logo.png';

type ResultsRoute = RouteProp<RootStackParamList, 'Results'>;

export default function ResultsScreen() {
  const navigation =
    useNavigation<import('@react-navigation/native').NavigationProp<RootStackParamList>>();
  const route = useRoute<ResultsRoute>();

  const { midpoint, places, locationA, locationB } = route.params;

  const handleShare = async () => {
    try {
      const message = `Meet in the middle with Midlo:\n\nA: ${locationA}\nB: ${locationB}\nMidpoint: (${midpoint.lat.toFixed(
        4,
      )}, ${midpoint.lng.toFixed(4)})`;
      await Share.share({ message });
    } catch {
      // ignore for now
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
          <View style={{ alignItems: 'center', marginBottom: theme.spacing.lg }}>
            <Image
              source={Logo}
              style={{ width: 80, height: 26, resizeMode: 'contain', marginBottom: theme.spacing.sm }}
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
                padding: theme.spacing.md,
                borderRadius: theme.radii.md,
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

          <View style={{ gap: theme.spacing.sm, marginBottom: theme.spacing.lg }}>
            <MidloButton
              title="View on map"
              onPress={() => navigation.navigate('Map', { midpoint, places })}
              variant="primary"
            />
            <MidloButton title="Share link" onPress={handleShare} variant="secondary" />
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
              {places.map((p, idx) => (
                <Pressable
                  key={p.placeId ?? String(idx)}
                  onPress={() => {
                    if (p.placeId) navigation.navigate('Place', { placeId: p.placeId });
                  }}
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
                </Pressable>
              ))}
            </View>
          </View>
        </MidloCard>
      </ScrollView>
    </SafeAreaView>
  );
}

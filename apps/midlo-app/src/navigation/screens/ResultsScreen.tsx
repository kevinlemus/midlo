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

  const [currentPlaces, setCurrentPlaces] = React.useState(places);
  const [isRescanning, setIsRescanning] = React.useState(false);

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

    setIsRescanning(true);
    try {
      const refreshed = await api.getPlaces(midpoint.lat, midpoint.lng);
      setCurrentPlaces(refreshed);

      track('places_rescanned', {
        locationA,
        locationB,
        placesCount: refreshed.length,
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
              title={isRescanning ? 'Finding new options…' : 'See different options'}
              onPress={handleRescan}
              variant="secondary"
              disabled={isRescanning}
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

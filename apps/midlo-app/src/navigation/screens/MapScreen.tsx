import React from 'react';
import { View, Text, Image } from 'react-native';
import { useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';

import { theme } from 'theme';
import type { RootStackParamList } from 'navigation';
import MidloCard from '../../components/MidloCard';

import Logo from '../../assets/images/midlo_logo.png';

type MapRoute = RouteProp<RootStackParamList, 'Map'>;

export default function MapScreen() {
  const route = useRoute<MapRoute>();
  const { midpoint } = route.params ?? { midpoint: { lat: 0, lng: 0 } };

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
          }}
        >
          <Text style={{ color: theme.colors.muted }}>Map placeholder</Text>
        </View>

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

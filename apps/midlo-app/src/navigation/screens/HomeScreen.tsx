import React, { useState } from 'react';
import {
  Text,
  SafeAreaView,
  View,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { theme } from 'theme';
import type { RootStackParamList } from 'navigation';
import MidloButton from '../../components/MidloButton';
import MidloCard from '../../components/MidloCard';
import MidloInput from '../../components/MidloInput';

import Logo from '../../assets/images/midlo_logo.png';

type HomeNav = NativeStackNavigationProp<RootStackParamList, 'Home'>;

export default function HomeScreen() {
  const navigation = useNavigation<HomeNav>();
  const [locationA, setLocationA] = useState('');
  const [locationB, setLocationB] = useState('');

  const getMockMidpoint = () => ({
    lat: 39.7684,
    lng: -86.1581,
  });

  const getMockPlaces = () => [
    { name: 'Midpoint Coffee', distance: '0.4 mi' },
    { name: 'Neutral Ground Bistro', distance: '0.7 mi' },
    { name: 'Halfway House Bar', distance: '1.0 mi' },
  ];

  const handleFindMidpoint = () => {
    if (!locationA || !locationB) {
      alert('Please enter both locations');
      return;
    }

    const midpoint = getMockMidpoint();
    const places = getMockPlaces();

    navigation.navigate('Results', {
      midpoint,
      places,
      locationA,
      locationB,
    });
  };

  const isDisabled = !locationA || !locationB;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            padding: theme.spacing.xl,
          }}
        >
          <MidloCard>
            <View style={{ alignItems: 'center', marginBottom: theme.spacing.lg }}>
              <Image
                source={Logo}
                style={{ width: 120, height: 40, resizeMode: 'contain', marginBottom: theme.spacing.sm }}
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
                Meet in the middle with Midlo
              </Text>
              <Text
                style={{
                  fontSize: theme.typography.body,
                  color: theme.colors.textSecondary,
                  textAlign: 'center',
                }}
              >
                Drop in two locations and we’ll find a fair, friendly halfway spot.
              </Text>
            </View>

            <View style={{ gap: theme.spacing.md }}>
              <View>
                <Text
                  style={{
                    fontSize: theme.typography.caption,
                    color: theme.colors.textSecondary,
                    marginBottom: theme.spacing.xs,
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                  }}
                >
                  Location A
                </Text>
                <MidloInput
                  value={locationA}
                  onChangeText={setLocationA}
                  placeholder="Enter first location"
                />
              </View>

              <View>
                <Text
                  style={{
                    fontSize: theme.typography.caption,
                    color: theme.colors.textSecondary,
                    marginBottom: theme.spacing.xs,
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                  }}
                >
                  Location B
                </Text>
                <MidloInput
                  value={locationB}
                  onChangeText={setLocationB}
                  placeholder="Enter second location"
                />
              </View>

              <View style={{ marginTop: theme.spacing.lg }}>
                <MidloButton
                  title="Find midpoint"
                  onPress={handleFindMidpoint}
                  disabled={isDisabled}
                />
              </View>

              <Text
                style={{
                  fontSize: theme.typography.caption,
                  color: theme.colors.muted,
                  textAlign: 'center',
                  marginTop: theme.spacing.sm,
                }}
              >
                No accounts. No friction. Just a fair place to meet.
              </Text>
            </View>
          </MidloCard>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

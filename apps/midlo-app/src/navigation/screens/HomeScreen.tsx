import React, { useEffect, useRef, useState } from 'react';
import { track } from '../../services/analytics';
import {
  Text,
  SafeAreaView,
  View,
  Keyboard,
  KeyboardAvoidingView,
  LayoutAnimation,
  Platform,
  Image,
  ScrollView,
  UIManager,
  type LayoutChangeEvent,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { theme } from 'theme';
import type { RootStackParamList } from 'navigation';
import MidloButton from '../../components/MidloButton';
import MidloCard from '../../components/MidloCard';
import AddressAutocompleteInput from '../../components/AddressAutocompleteInput';
import { api } from '../../services/api';

import Logo from '../../assets/images/midlo_logo.png';

type HomeNav = NativeStackNavigationProp<RootStackParamList, 'Home'>;

export default function HomeScreen() {
  const navigation = useNavigation<HomeNav>();
  const insets = useSafeAreaInsets();
  const [locationA, setLocationA] = useState('');
  const [locationB, setLocationB] = useState('');

  const scrollRef = useRef<ScrollView | null>(null);
  const scrollYRef = useRef(0);
  const [scrollViewHeight, setScrollViewHeight] = useState(0);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const keyboardOpen = keyboardHeight > 0;
  const focusedFieldRef = useRef<'A' | 'B' | null>(null);

  const cardYRef = useRef(0);
  const formYRef = useRef(0);
  const fieldLayoutRef = useRef<{ A?: { y: number; height: number }; B?: { y: number; height: number } }>(
    {},
  );

  const ensureFieldVisible = (key: 'A' | 'B') => {
    const field = fieldLayoutRef.current[key];
    if (!field) return;
    if (!scrollRef.current) return;
    if (!scrollViewHeight) return;

    const marginTop = 12;
    const marginBottom = 12;

    // Absolute Y within ScrollView content.
    const fieldTop = cardYRef.current + formYRef.current + field.y;
    const fieldBottom = fieldTop + field.height;

    const visibleTop = scrollYRef.current + marginTop;
    // IMPORTANT: Don't subtract keyboard height here.
    // `KeyboardAvoidingView` already adjusts available space (Android: height shrinks;
    // iOS: bottom padding increases). Subtracting keyboard height again causes
    // the focused input to jump *too high* above the keyboard.
    const visibleBottom = scrollYRef.current + scrollViewHeight - marginBottom;

    let nextY: number | null = null;

    if (fieldBottom > visibleBottom) {
      nextY = scrollYRef.current + (fieldBottom - visibleBottom);
    } else if (fieldTop < visibleTop) {
      nextY = Math.max(0, fieldTop - marginTop);
    }

    if (nextY == null) return;
    if (Math.abs(nextY - scrollYRef.current) < 2) return;

    scrollRef.current.scrollTo({ y: nextY, animated: true });
  };

  useEffect(() => {
    if (
      Platform.OS === 'android' &&
      typeof UIManager.setLayoutAnimationEnabledExperimental === 'function'
    ) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }

    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent as any, (e: any) => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      const h = typeof e?.endCoordinates?.height === 'number' ? e.endCoordinates.height : 0;
      setKeyboardHeight(h);
    });
    const hideSub = Keyboard.addListener(hideEvent as any, () => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setKeyboardHeight(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  useEffect(() => {
    // When the keyboard animates in/out, re-ensure the focused field is visible.
    const key = focusedFieldRef.current;
    if (!key) return;
    requestAnimationFrame(() => ensureFieldVisible(key));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keyboardHeight, scrollViewHeight]);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFindMidpoint = async () => {
    if (!locationA || !locationB) {
      setError('Add both locations to find a fair midpoint.');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const midpoint = await api.getMidpoint(locationA, locationB);
      const places = await api.getPlaces(midpoint.lat, midpoint.lng);

      // ✅ Minimal analytics addition
      track('midpoint_searched', {
        locationA,
        locationB,
        placesCount: places.length,
      });

      navigation.navigate('Results', {
        midpoint,
        places,
        locationA,
        locationB,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const isDisabled = !locationA || !locationB || isLoading;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top : 0}
      >
        <ScrollView
          ref={(r) => {
            scrollRef.current = r;
          }}
          keyboardShouldPersistTaps="always"
          keyboardDismissMode="none"
          // Let `KeyboardAvoidingView` own keyboard avoidance.
          // Enabling iOS automatic insets here can double-apply keyboard spacing.
          automaticallyAdjustKeyboardInsets={false}
          onLayout={(e: LayoutChangeEvent) => {
            setScrollViewHeight(e.nativeEvent.layout.height);
          }}
          onScroll={(e: NativeSyntheticEvent<NativeScrollEvent>) => {
            scrollYRef.current = e.nativeEvent.contentOffset.y;
          }}
          scrollEventThrottle={16}
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: keyboardOpen ? 'flex-start' : 'center',
            alignItems: 'center',
            paddingHorizontal: theme.spacing.xl,
            paddingVertical: theme.spacing.xl,
            paddingBottom: keyboardOpen ? theme.spacing.xl : theme.spacing.xl * 2,
          }}
        >
          <View
            onLayout={(e) => {
              cardYRef.current = e.nativeEvent.layout.y;
            }}
            style={{ width: '100%' }}
          >
            <MidloCard>
            <View
              style={{
                alignItems: 'center',
                marginBottom: theme.spacing.xl,
              }}
            >
              <View
                style={{
                  paddingVertical: theme.spacing.sm,
                  paddingHorizontal: theme.spacing.lg,
                  borderRadius: theme.radii.pill,
                  backgroundColor: theme.colors.highlight,
                  marginBottom: theme.spacing.md,
                }}
              >
                <Text
                  style={{
                    fontSize: theme.typography.caption,
                    color: theme.colors.primaryDark,
                    fontWeight: theme.typography.weight.medium as any,
                    letterSpacing: 0.5,
                    textTransform: 'uppercase',
                  }}
                >
                  Meet in the middle
                </Text>
              </View>

              <Image
                source={Logo}
                style={{
                  width: 120,
                  height: 60,
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
                  marginBottom: theme.spacing.sm,
                }}
              >
                A fair place to meet, in seconds.
              </Text>
              <Text
                style={{
                  fontSize: theme.typography.body,
                  color: theme.colors.textSecondary,
                  textAlign: 'center',
                }}
              >
                Drop in two locations and we’ll find a friendly halfway spot that feels fair to both sides.
              </Text>
            </View>

            <View
              style={{ gap: theme.spacing.lg }}
              onLayout={(e) => {
                formYRef.current = e.nativeEvent.layout.y;
              }}
            >
              <View
                onLayout={(e) => {
                  fieldLayoutRef.current.A = {
                    y: e.nativeEvent.layout.y,
                    height: e.nativeEvent.layout.height,
                  };
                }}
              >
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
                <AddressAutocompleteInput
                  value={locationA}
                  onChangeText={setLocationA}
                  placeholder="Enter first location"
                  returnKeyType="next"
                  onFocus={() => {
                    focusedFieldRef.current = 'A';
                    requestAnimationFrame(() => ensureFieldVisible('A'));
                  }}
                />
              </View>

              <View
                onLayout={(e) => {
                  fieldLayoutRef.current.B = {
                    y: e.nativeEvent.layout.y,
                    height: e.nativeEvent.layout.height,
                  };
                }}
              >
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
                <AddressAutocompleteInput
                  value={locationB}
                  onChangeText={setLocationB}
                  placeholder="Enter second location"
                  returnKeyType="done"
                  onFocus={() => {
                    focusedFieldRef.current = 'B';
                    requestAnimationFrame(() => ensureFieldVisible('B'));
                  }}
                />
              </View>

              <View style={{ marginTop: theme.spacing.lg }}>
                <MidloButton
                  title={isLoading ? 'Finding midpoint…' : 'Find midpoint'}
                  onPress={handleFindMidpoint}
                  disabled={isDisabled}
                />
              </View>

              {error && (
                <View
                  style={{
                    marginTop: theme.spacing.sm,
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
                      textAlign: 'center',
                    }}
                  >
                    {error}
                  </Text>
                </View>
              )}

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
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

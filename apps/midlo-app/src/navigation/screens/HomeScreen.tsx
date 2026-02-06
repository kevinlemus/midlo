import React, { useEffect, useRef, useState } from 'react';
import { track } from '../../services/analytics';
import {
  Text,
  SafeAreaView,
  View,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Image,
  ScrollView,
  Dimensions,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

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
  const [locationA, setLocationA] = useState('');
  const [locationB, setLocationB] = useState('');

  const scrollRef = useRef<ScrollView | null>(null);
  const fieldARef = useRef<View | null>(null);
  const fieldBRef = useRef<View | null>(null);
  const scrollYRef = useRef(0);
  const keyboardHeightRef = useRef(0);
  const pendingScrollRef = useRef<React.RefObject<View | null> | null>(null);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent as any, (e: any) => {
      const h = typeof e?.endCoordinates?.height === 'number' ? e.endCoordinates.height : 0;
      keyboardHeightRef.current = h;

      // If the user just focused a field and the keyboard is now appearing,
      // perform the scroll at the right moment (after we know the keyboard height).
      const pending = pendingScrollRef.current;
      if (pending) {
        pendingScrollRef.current = null;
        requestAnimationFrame(() => {
          scrollFieldIntoView(pending);
        });
      }
    });
    const hideSub = Keyboard.addListener(hideEvent as any, () => {
      keyboardHeightRef.current = 0;
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const scrollFieldIntoView = (ref: React.RefObject<View | null>) => {
    const node = ref.current;
    const scroll = scrollRef.current;
    if (!node || !scroll || typeof (node as any).measureInWindow !== 'function') return;

    requestAnimationFrame(() => {
      (node as any).measureInWindow((_x: number, y: number, _w: number, h: number) => {
        const screenHeight = Dimensions.get('window').height;
        const kb = keyboardHeightRef.current;
        const padding = 18;

        const keyboardTop = screenHeight - kb;
        const fieldBottom = y + h;

        // Only scroll if the field would be covered by the keyboard.
        const overlap = fieldBottom + padding - keyboardTop;
        if (overlap <= 0) return;

        const nextY = Math.max(0, scrollYRef.current + overlap);
        scroll.scrollTo({ y: nextY, animated: true });
      });
    });
  };

  const handleFocusField = (ref: React.RefObject<View | null>) => {
    // If the keyboard is already visible, scroll immediately.
    if (keyboardHeightRef.current > 0) {
      scrollFieldIntoView(ref);
      return;
    }

    // Otherwise, queue it so the keyboard show event scrolls it into place.
    pendingScrollRef.current = ref;
  };

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
      >
        <ScrollView
          ref={(r) => {
            scrollRef.current = r;
          }}
          keyboardShouldPersistTaps="always"
          keyboardDismissMode="none"
          onScroll={(e: NativeSyntheticEvent<NativeScrollEvent>) => {
            scrollYRef.current = e.nativeEvent.contentOffset.y;
          }}
          scrollEventThrottle={16}
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: theme.spacing.xl,
            paddingVertical: theme.spacing.xl,
          }}
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

            <View style={{ gap: theme.spacing.lg }}>
              <View
                ref={(r) => {
                  fieldARef.current = r;
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
                  onFocus={(e) => {
                    handleFocusField(fieldARef);
                    void e;
                  }}
                />
              </View>

              <View
                ref={(r) => {
                  fieldBRef.current = r;
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
                  onFocus={(e) => {
                    handleFocusField(fieldBRef);
                    void e;
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
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

import React from 'react';
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  Keyboard,
  Platform,
  ScrollView,
  StyleSheet,
  Animated,
  Easing,
  Dimensions,
  type TextInputProps,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { theme } from 'theme';
import { api } from '../services/api';
import type { AutocompleteSuggestion } from '../services/api';
import MidloInput from './MidloInput';

type Props = Omit<TextInputProps, 'onChangeText' | 'value'> & {
  value: string;
  onChangeText: (text: string) => void;
  onSelectSuggestion?: (s: AutocompleteSuggestion) => void;
};

export default function AddressAutocompleteInput({
  value,
  onChangeText,
  onSelectSuggestion,
  style,
  ...rest
}: Props) {
  const insets = useSafeAreaInsets();
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [suggestions, setSuggestions] = React.useState<AutocompleteSuggestion[]>([]);

  const inputRowRef = React.useRef<View | null>(null);
  const [inputHeight, setInputHeight] = React.useState(0);
  const [inputWindowY, setInputWindowY] = React.useState<number | null>(null);
  const [keyboardHeight, setKeyboardHeight] = React.useState(0);

  const abortRef = React.useRef<AbortController | null>(null);
  const blurTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const committedValueRef = React.useRef<string | null>(null);

  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  const query = value.trim();

  React.useEffect(() => {
    if (blurTimerRef.current) {
      clearTimeout(blurTimerRef.current);
      blurTimerRef.current = null;
    }

    if (committedValueRef.current && query === committedValueRef.current) {
      abortRef.current?.abort();
      abortRef.current = null;
      setLoading(false);
      setError(null);
      setSuggestions([]);
      setOpen(false);
      return;
    }

    if (query.length < 3) {
      abortRef.current?.abort();
      abortRef.current = null;
      setLoading(false);
      setError(null);
      setSuggestions([]);
      setOpen(false);
      return;
    }

    const t = setTimeout(() => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setLoading(true);
      setError(null);

      api
        .autocomplete(query, controller.signal)
        .then((s) => {
          setSuggestions(s);
          if (s.length > 0) {
            setOpen(true);
            fadeAnim.setValue(0);
            Animated.timing(fadeAnim, {
              toValue: 1,
              duration: 160,
              easing: Easing.out(Easing.quad),
              useNativeDriver: true,
            }).start();
          } else {
            setOpen(false);
          }
        })
        .catch((e) => {
          if (e instanceof Error && e.name === 'AbortError') return;
          setError(e instanceof Error ? e.message : 'Failed to load suggestions');
          setSuggestions([]);
          setOpen(true);
          fadeAnim.setValue(0);
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 160,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }).start();
        })
        .finally(() => {
          setLoading(false);
        });
    }, 250);

    return () => clearTimeout(t);
  }, [query, fadeAnim]);

  React.useEffect(() => {
    return () => {
      abortRef.current?.abort();
      if (blurTimerRef.current) clearTimeout(blurTimerRef.current);
    };
  }, []);

  React.useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent as any, (e: any) => {
      const h = typeof e?.endCoordinates?.height === 'number' ? e.endCoordinates.height : 0;
      setKeyboardHeight(h);
    });
    const hideSub = Keyboard.addListener(hideEvent as any, () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const measureInput = React.useCallback(() => {
    const node = inputRowRef.current;
    if (!node || typeof (node as any).measureInWindow !== 'function') return;
    (node as any).measureInWindow((_x: number, y: number) => {
      setInputWindowY(y);
    });
  }, []);

  React.useEffect(() => {
    if (!open) return;
    // Measure after the dropdown opens and after any keyboard transition.
    const raf = requestAnimationFrame(() => measureInput());
    return () => cancelAnimationFrame(raf);
  }, [open, keyboardHeight, measureInput]);

  const pick = (s: AutocompleteSuggestion) => {
    Keyboard.dismiss();
    committedValueRef.current = (s.description ?? '').trim();
    abortRef.current?.abort();
    abortRef.current = null;
    setOpen(false);
    setError(null);
    setSuggestions([]);
    onChangeText(s.description);
    onSelectSuggestion?.(s);
  };

  const showDropdown = open && (loading || error || suggestions.length > 0);

  const windowHeight = Dimensions.get('window').height;
  const padding = 10;
  const spaceAbove =
    inputWindowY == null
      ? 0
      : Math.max(0, inputWindowY - insets.top - padding);
  const spaceBelow =
    inputWindowY == null
      ? 0
      : Math.max(
          0,
          windowHeight - keyboardHeight - (inputWindowY + inputHeight) - insets.bottom - padding,
        );

  const shouldRenderAbove = spaceBelow < 180 && spaceAbove > spaceBelow;
  const rawMax = shouldRenderAbove ? spaceAbove : spaceBelow;
  const maxHeight = Math.max(140, Math.min(260, rawMax || 260));

  return (
    <View style={[styles.wrapper, showDropdown ? styles.wrapperOpen : null, style]}>
      <View
        ref={(r) => {
          inputRowRef.current = r;
        }}
        style={styles.inputRow}
        onLayout={(e) => {
          setInputHeight(e.nativeEvent.layout.height);
          measureInput();
        }}
      >
        <MidloInput
          {...rest}
          value={value}
          onChangeText={(t) => {
            if (committedValueRef.current && t.trim() !== committedValueRef.current) {
              committedValueRef.current = null;
            }
            setOpen(true);
            onChangeText(t);
          }}
          onFocus={(e) => {
            measureInput();
            const nextOpen =
              value.trim().length >= 3 &&
              (!committedValueRef.current || value.trim() !== committedValueRef.current);
            if (nextOpen) {
              setOpen(true);
              fadeAnim.setValue(0);
              Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 160,
                easing: Easing.out(Easing.quad),
                useNativeDriver: true,
              }).start();
            }
            rest.onFocus?.(e);
          }}
          onBlur={(e) => {
            blurTimerRef.current = setTimeout(() => setOpen(false), 150);
            rest.onBlur?.(e);
          }}
          autoCorrect={false}
          autoCapitalize="words"
          style={[styles.input, (rest as any).style]}
        />

        {loading ? (
          <View style={styles.spinner} pointerEvents="none">
            <ActivityIndicator size="small" color={theme.colors.primary} />
          </View>
        ) : null}
      </View>

      {showDropdown ? (
        <Animated.View
          style={[
            styles.dropdown,
            {
              opacity: fadeAnim,
              transform: [
                {
                  translateY: fadeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-4, 0],
                  }),
                },
              ],
              maxHeight,
              top: shouldRenderAbove ? undefined : inputHeight + 8,
              bottom: shouldRenderAbove ? inputHeight + 8 : undefined,
            },
          ]}
        >
          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <ScrollView
            keyboardShouldPersistTaps="always"
            nestedScrollEnabled
            style={{ maxHeight }}
          >
            {suggestions.map((s) => (
              <Pressable
                key={s.placeId || s.description}
                onPress={() => pick(s)}
                style={({ pressed }) => [
                  styles.row,
                  pressed ? styles.rowPressed : null,
                ]}
              >
                <Text numberOfLines={2} style={styles.rowText}>
                  {s.description}
                </Text>
              </Pressable>
            ))}

            {loading && suggestions.length === 0 ? (
              <Text style={styles.hintText}>Searching…</Text>
            ) : !loading && !error && suggestions.length === 0 ? (
              <Text style={styles.hintText}>
                No matches. Try adding a street or city.
              </Text>
            ) : null}
          </ScrollView>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Powered by Google</Text>
          </View>
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    position: 'relative',
  },
  wrapperOpen: {
    zIndex: 50,
  },
  inputRow: {
    position: 'relative',
    width: '100%',
  },
  input: {
    paddingRight: 44,
  },
  spinner: {
    position: 'absolute',
    right: 12,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdown: {
    position: 'absolute',
    left: 0,
    right: 0,
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    borderColor: theme.colors.divider,
    backgroundColor: theme.colors.surface,
    overflow: 'hidden',
    zIndex: 100,
    ...theme.shadow.card,
    elevation: 20,
  },
  row: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.divider,
  },
  rowPressed: {
    backgroundColor: theme.colors.highlight,
  },
  rowText: {
    color: theme.colors.text,
    fontSize: theme.typography.body,
  },
  hintText: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    color: theme.colors.textSecondary,
    fontSize: theme.typography.caption,
  },
  errorText: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    color: theme.colors.danger,
    fontSize: theme.typography.caption,
  },
  footer: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderTopWidth: 1,
    borderTopColor: theme.colors.divider,
    backgroundColor: theme.colors.bg,
  },
  footerText: {
    fontSize: theme.typography.caption,
    color: theme.colors.muted,
    textAlign: 'right',
  },
});

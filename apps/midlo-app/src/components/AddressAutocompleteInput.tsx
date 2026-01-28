import React from 'react';
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  Keyboard,
  StyleSheet,
  type TextInputProps,
} from 'react-native';

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
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [suggestions, setSuggestions] = React.useState<AutocompleteSuggestion[]>([]);

  const abortRef = React.useRef<AbortController | null>(null);
  const blurTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const committedValueRef = React.useRef<string | null>(null);

  const query = value.trim();

  React.useEffect(() => {
    if (blurTimerRef.current) {
      clearTimeout(blurTimerRef.current);
      blurTimerRef.current = null;
    }

    // If a suggestion was just selected and the input matches it, keep the dropdown closed.
    if (committedValueRef.current && query === committedValueRef.current) {
      abortRef.current?.abort();
      abortRef.current = null;
      setLoading(false);
      setError(null);
      setSuggestions([]);
      setOpen(false);
      return;
    }

    // Only query when it feels like a real address search.
    if (query.length < 3) {
      abortRef.current?.abort();
      abortRef.current = null;
      setLoading(false);
      setError(null);
      setSuggestions([]);
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
          // Keep the dropdown feeling responsive: open when results exist.
          if (s.length > 0) setOpen(true);
        })
        .catch((e) => {
          // Abort is expected during typing.
          if (e instanceof Error && e.name === 'AbortError') return;
          setError(e instanceof Error ? e.message : 'Failed to load suggestions');
          setSuggestions([]);
        })
        .finally(() => {
          setLoading(false);
        });
    }, 250);

    return () => clearTimeout(t);
  }, [query]);

  React.useEffect(() => {
    return () => {
      abortRef.current?.abort();
      if (blurTimerRef.current) clearTimeout(blurTimerRef.current);
    };
  }, []);

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

  return (
    <View style={[styles.wrapper, style]}>
      <View style={styles.inputRow}>
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
            // Don't pop the dropdown back open for a committed selection.
            const nextOpen =
              value.trim().length >= 3 &&
              (!committedValueRef.current || value.trim() !== committedValueRef.current);
            setOpen(nextOpen);
            rest.onFocus?.(e);
          }}
          onBlur={(e) => {
            // Delay closing so a tap on a suggestion still registers.
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
        <View style={styles.dropdown}>
          {error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : null}

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
            <Text style={styles.hintText}>No matches</Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
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
    marginTop: 8,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: theme.colors.divider,
    backgroundColor: theme.colors.surface,
    overflow: 'hidden',
    maxHeight: 220,
    ...theme.shadow.card,
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
});

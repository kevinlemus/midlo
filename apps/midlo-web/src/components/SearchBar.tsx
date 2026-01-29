import React from "react";
import "../styles/theme.css";
import { api } from "../services/api";
import type { AutocompleteSuggestion } from "../services/api";

type Props = {
  placeholder?: string;
  value?: string;
  onChange?: (v: string) => void;
};

export default function SearchBar({ placeholder = "Search", value = "", onChange }: Props) {
  const [suggestions, setSuggestions] = React.useState<AutocompleteSuggestion[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [highlight, setHighlight] = React.useState<number | null>(null);

  // NEW: control dropdown visibility correctly
  const [isFocused, setIsFocused] = React.useState(false);
  const [isTyping, setIsTyping] = React.useState(false);

  const ref = React.useRef<HTMLDivElement | null>(null);
  const debounce = React.useRef<number | null>(null);
  const abortRef = React.useRef<AbortController | null>(null);
  const blurTimerRef = React.useRef<number | null>(null);
  const committedValueRef = React.useRef<string | null>(null);

  const query = value.trim();

  // NEW: Only fetch suggestions when typing AND focused
  React.useEffect(() => {
    if (!isFocused || !isTyping) {
      setSuggestions([]);
      setError(null);
      setLoading(false);
      return;
    }

    if (!query || query.length < 3) {
      abortRef.current?.abort();
      setSuggestions([]);
      setError(null);
      setLoading(false);
      return;
    }

    if (debounce.current) window.clearTimeout(debounce.current);

    setLoading(true);
    setError(null);

    debounce.current = window.setTimeout(async () => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const results = await api.autocomplete(query, controller.signal);
        setSuggestions(results);
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;
        setError(err instanceof Error ? err.message : "Failed to load suggestions");
        setSuggestions([]);
      } finally {
        setLoading(false);
        setHighlight(null);
      }
    }, 250);

    return () => {
      if (debounce.current) window.clearTimeout(debounce.current);
    };
  }, [query, isFocused, isTyping]);

  React.useEffect(() => {
    return () => {
      abortRef.current?.abort();
      if (blurTimerRef.current) window.clearTimeout(blurTimerRef.current);
      if (debounce.current) window.clearTimeout(debounce.current);
    };
  }, []);

  React.useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) {
        setIsFocused(false);
        setIsTyping(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const select = (s: AutocompleteSuggestion) => {
    const text = (s.description ?? "").trim();
    committedValueRef.current = text;

    abortRef.current?.abort();
    abortRef.current = null;

    onChange?.(text);
    setIsTyping(false);
    setSuggestions([]);
    setError(null);
    setHighlight(null);
  };

  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!shouldShowDropdown) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((prev) =>
        prev === null ? 0 : Math.min(prev + 1, suggestions.length - 1),
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((prev) =>
        prev === null ? suggestions.length - 1 : Math.max(prev - 1, 0),
      );
    } else if (e.key === "Enter") {
      if (highlight !== null && suggestions[highlight]) {
        e.preventDefault();
        select(suggestions[highlight]);
      }
    } else if (e.key === "Escape") {
      setIsTyping(false);
    }
  };

  // NEW: Correct dropdown visibility logic
  const shouldShowDropdown =
    isFocused &&
    isTyping &&
    !loading &&
    suggestions.length > 0;

  return (
    <div
      ref={ref}
      style={{
        position: "relative",
        width: "100%",
        zIndex: shouldShowDropdown ? 5000 : 1,
      }}
    >
      <input
        placeholder={placeholder}
        value={value}
        onChange={(e) => {
          const next = e.target.value;

          if (committedValueRef.current && next.trim() !== committedValueRef.current) {
            committedValueRef.current = null;
          }

          setIsTyping(true);
          onChange?.(next);
        }}
        onFocus={() => {
          setIsFocused(true);
          // Do NOT open dropdown unless typing
        }}
        onBlur={() => {
          blurTimerRef.current = window.setTimeout(() => {
            setIsFocused(false);
            setIsTyping(false);
          }, 150);
        }}
        onKeyDown={handleKey}
        autoCapitalize="none"
        autoCorrect="off"
        style={{
          padding: "11px 12px",
          border: "1px solid var(--color-accent)",
          borderRadius: "var(--radius-md)",
          backgroundColor: "var(--color-surface)",
          color: "var(--color-text)",
          fontSize: "var(--font-size-body)",
          width: "100%",
        }}
      />

      {loading && isTyping && (
        <div
          style={{
            position: "absolute",
            right: 10,
            top: "50%",
            transform: "translateY(-50%)",
            fontSize: "var(--font-size-caption)",
            color: "var(--color-muted)",
          }}
        >
          …
        </div>
      )}

      {shouldShowDropdown && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            marginTop: 4,
            zIndex: 5001,
            borderRadius: "var(--radius-lg)",
            border: "1px solid var(--color-divider)",
            backgroundColor: "var(--color-surface)",
            boxShadow: "var(--shadow-card)",
            maxHeight: 260,
            overflowY: "auto",
          }}
        >
          {suggestions.map((s, i) => {
            const active = highlight === i;
            return (
              <div
                key={(s.placeId || s.description) + i}
                onMouseDown={(e) => {
                  e.preventDefault();
                  select(s);
                }}
                onMouseEnter={() => setHighlight(i)}
                style={{
                  padding: "10px 12px",
                  fontSize: "var(--font-size-body)",
                  backgroundColor: active ? "rgba(165,214,167,0.18)" : "transparent",
                  cursor: "pointer",
                  borderBottom: "1px solid var(--color-divider)",
                }}
              >
                {s.description}
              </div>
            );
          })}

          <div
            style={{
              padding: "8px 12px",
              borderTop: "1px solid var(--color-divider)",
              fontSize: "var(--font-size-caption)",
              color: "var(--color-muted)",
              backgroundColor: "var(--color-highlight)",
              textAlign: "right",
            }}
          >
            Powered by Google
          </div>
        </div>
      )}
    </div>
  );
}

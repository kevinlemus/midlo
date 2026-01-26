export const colors = {
  primary: "#245E45", // Brand green (logo-aligned)
  primaryDark: "#163A2B", // Darker variant for headers / emphasis
  accent: "#A5D6A7", // Soft mint for borders / subtle highlights
  bright: "#4CAF50", // Strong CTA green
  text: "#263238", // Main text
  textSecondary: "#546E7A", // Secondary text
  bg: "#F3F4F6", // App background
  surface: "#FFFFFF", // Cards, surfaces
  muted: "#90A4AE", // Placeholders, helper text
  divider: "#E0E0E0", // Lines, separators
  danger: "#D32F2F", // Errors
  highlight: "#E8F5E9", // Light green emphasis background
} as const;

export type ColorName = keyof typeof colors;

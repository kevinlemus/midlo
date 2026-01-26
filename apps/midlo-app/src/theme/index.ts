import { colors as colorsTokens } from "../constants/colors";
import { spacing as spacingTokens } from "../constants/spacing";
import { typography as typographyTokens } from "../constants/typography";

export const colors = colorsTokens;
export const spacing = spacingTokens;
export const typography = typographyTokens;

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  pill: 999,
} as const;

export const shadow = {
  card: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
} as const;

export const theme = {
  colors,
  spacing,
  typography,
  radii,
  shadow,
} as const;

export type Theme = typeof theme;

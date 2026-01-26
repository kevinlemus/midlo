export const typography = {
  heading: 24,
  subheading: 20,
  body: 16,
  caption: 12,
  weight: {
    regular: "400",
    medium: "500",
    bold: "700",
  },
} as const;

export type TypographyScale = typeof typography;

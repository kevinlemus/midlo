import React from 'react';
import { Text, TouchableOpacity, StyleProp, ViewStyle } from 'react-native';
import { theme } from 'theme';

type Variant = 'primary' | 'secondary';

type Props = {
  title: string;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

export default function MidloButton({
  title,
  onPress,
  variant = 'primary',
  disabled,
  style,
}: Props) {
  const isPrimary = variant === 'primary';

  const backgroundColor = disabled
    ? theme.colors.muted
    : isPrimary
    ? theme.colors.bright
    : theme.colors.surface;

  const borderColor = isPrimary ? 'transparent' : theme.colors.accent;
  const textColor = isPrimary ? theme.colors.surface : theme.colors.primaryDark;

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      disabled={disabled}
      style={[
        {
          backgroundColor,
          paddingVertical: theme.spacing.md,
          borderRadius: theme.radii.pill,
          alignItems: 'center',
          borderWidth: 1,
          borderColor,
          ...(isPrimary && !disabled ? theme.shadow.card : {}), // polished: lift primary CTAs
        },
        style,
      ]}
    >
      <Text
        style={{
          color: textColor,
          fontSize: theme.typography.body,
          fontWeight: theme.typography.weight.medium as any,
        }}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );
}

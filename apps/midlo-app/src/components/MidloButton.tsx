import React from 'react';
import {
  Text,
  StyleProp,
  ViewStyle,
  Pressable,
  PressableStateCallbackType,
} from 'react-native';
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

  const baseBackground = isPrimary ? theme.colors.bright : theme.colors.surface;
  const baseBorderColor = isPrimary ? 'transparent' : theme.colors.accent;
  const baseTextColor = isPrimary ? theme.colors.surface : theme.colors.primaryDark;

  const getStyle = ({ pressed }: PressableStateCallbackType): StyleProp<ViewStyle> => {
    const backgroundColor = disabled
      ? theme.colors.muted
      : pressed && isPrimary
      ? theme.colors.primary
      : baseBackground;

    const scale = pressed && !disabled ? 0.97 : 1;

    return [
      {
        backgroundColor,
        paddingVertical: theme.spacing.lg,
        paddingHorizontal: theme.spacing.xl,
        borderRadius: theme.radii.pill,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: baseBorderColor,
        opacity: disabled ? 0.7 : 1,
        transform: [{ scale }],
        ...(isPrimary && !disabled ? theme.shadow.card : {}),
      },
      style,
    ];
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={getStyle}
      android_ripple={isPrimary && !disabled ? { color: '#ffffff22' } : undefined}
    >
      <Text
        style={{
          color: baseTextColor,
          fontSize: theme.typography.body,
          fontWeight: theme.typography.weight.medium as any,
        }}
      >
        {title}
      </Text>
    </Pressable>
  );
}

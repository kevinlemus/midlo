import React from 'react';
import { TextInput, TextInputProps } from 'react-native';
import { theme } from 'theme';

export default function MidloInput(props: TextInputProps) {
  return (
    <TextInput
      placeholderTextColor={theme.colors.muted}
      {...props}
      style={[
        {
          borderWidth: 1,
          borderColor: theme.colors.accent,
          borderRadius: theme.radii.lg,
          paddingHorizontal: theme.spacing.md,
          paddingVertical: theme.spacing.sm,
          backgroundColor: theme.colors.surface,
          color: theme.colors.text,
          fontSize: theme.typography.body,
        },
        props.style,
      ]}
    />
  );
}

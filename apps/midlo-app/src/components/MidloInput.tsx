import React from 'react';
import { TextInput, type TextInputProps } from 'react-native';
import { theme } from 'theme';

const MidloInput = React.forwardRef<TextInput, TextInputProps>(function MidloInput(
  props,
  ref,
) {
  return (
    <TextInput
      ref={ref}
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
});

export default MidloInput;

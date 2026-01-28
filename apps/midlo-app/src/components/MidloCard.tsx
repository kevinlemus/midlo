import React from 'react';
import { View, ViewProps, StyleProp, ViewStyle } from 'react-native';
import { theme } from 'theme';

type Props = ViewProps & {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

export default function MidloCard({ children, style, ...rest }: Props) {
  return (
    <View
      {...rest}
      style={[
        {
          width: '100%',
          maxWidth: 480,
          padding: theme.spacing.xl,
          borderRadius: theme.radii.lg,
          backgroundColor: theme.colors.surface,
          borderWidth: 1,
          borderColor: theme.colors.divider,
          ...theme.shadow.card,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

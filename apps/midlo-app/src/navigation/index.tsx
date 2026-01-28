import React from 'react';
import { Platform } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createStackNavigator } from '@react-navigation/stack';

import HomeScreen from './screens/HomeScreen';
import ResultsScreen from './screens/ResultsScreen';
import MapScreen from './screens/MapScreen';
import PlaceScreen from './screens/PlaceScreen';
import { theme } from 'theme';
import type { Place } from '../services/api';

export type RootStackParamList = {
  Home: undefined;
  Results: {
    midpoint: { lat: number; lng: number };
    places: Place[];
    locationA: string;
    locationB: string;
  };
  Map: {
    midpoint: { lat: number; lng: number };
    places: Place[];
  };
  Place: {
    placeId: string;
  };
};

const StackNavigator = Platform.OS === 'web' ? createStackNavigator : createNativeStackNavigator;
const Stack = StackNavigator<RootStackParamList>();

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: theme.colors.bg,
    primary: theme.colors.primary,
    text: theme.colors.text,
    card: theme.colors.primaryDark,
    border: theme.colors.divider,
  },
};

export default function RootNavigation() {
  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator
        id="RootStack"
        initialRouteName="Home"
        screenOptions={{
          headerStyle: { backgroundColor: theme.colors.primaryDark },
          headerTintColor: theme.colors.surface,
          headerTitleStyle: {
            fontSize: theme.typography.body,
            fontWeight: theme.typography.weight.medium as any,
          },
        }}
      >
        <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'midlo' }} />
        <Stack.Screen name="Results" component={ResultsScreen} options={{ title: 'Midpoint' }} />
        <Stack.Screen name="Map" component={MapScreen} options={{ title: 'Map' }} />
        <Stack.Screen name="Place" component={PlaceScreen} options={{ title: 'Place' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

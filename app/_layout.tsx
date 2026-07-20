import {
  NunitoSans_400Regular,
  NunitoSans_600SemiBold,
  NunitoSans_700Bold,
} from '@expo-google-fonts/nunito-sans';
import { Rubik_600SemiBold, Rubik_700Bold } from '@expo-google-fonts/rubik';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { CartProvider } from '@/features/cart/CartProvider';
import { CatalogProvider } from '@/features/catalog/CatalogProvider';
import { colors } from '@/theme/colors';

void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    NunitoSans_400Regular,
    NunitoSans_600SemiBold,
    NunitoSans_700Bold,
    Rubik_600SemiBold,
    Rubik_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      void SplashScreen.hideAsync();
    }
  }, [fontError, fontsLoaded]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <CatalogProvider>
        <CartProvider>
          <StatusBar style="dark" />
          <Stack
            screenOptions={{
              animation: 'slide_from_right',
              contentStyle: { backgroundColor: colors.canvas },
              headerShown: false,
            }}
          >
            <Stack.Screen name="index" />
            <Stack.Screen name="products/[id]" />
            <Stack.Screen name="cart" />
            <Stack.Screen name="account" />
            <Stack.Screen name="sign-in" />
            <Stack.Screen name="create-account" />
            <Stack.Screen name="checkout" />
            <Stack.Screen name="order-confirmation" options={{ gestureEnabled: false }} />
          </Stack>
        </CartProvider>
      </CatalogProvider>
    </SafeAreaProvider>
  );
}

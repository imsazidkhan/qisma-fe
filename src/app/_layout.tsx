import 'react-native-reanimated';
import '../../global.css';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { i18n } from '@/i18n';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { I18nextProvider } from 'react-i18next';
import { useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { QueryProvider } from '@/api';
import { registerForcedSignOutNavigation } from '@/features/auth/services/authForcedNavigation';
import { ThemeProvider, useThemeColors, useThemeMode } from '@/theme';

export default function RootLayout() {
  const [i18nReady, setI18nReady] = useState(() => i18n.isInitialized);

  useEffect(() => {
    if (i18n.isInitialized) {
      setI18nReady(true);
      return;
    }
    const onReady = () => setI18nReady(true);
    i18n.on('initialized', onReady);
    return () => {
      i18n.off('initialized', onReady);
    };
  }, []);

  if (!i18nReady) {
    return null;
  }

  return (
    <I18nextProvider i18n={i18n}>
      <QueryProvider>
        <ThemeProvider>
          <ThemedRoot />
        </ThemeProvider>
      </QueryProvider>
    </I18nextProvider>
  );
}

function AuthNavigationBridge() {
  const router = useRouter();
  useEffect(() => {
    return registerForcedSignOutNavigation(() => {
      router.replace('/login');
    });
  }, [router]);
  return null;
}

function ThemedRoot() {
  const colors = useThemeColors();
  const mode = useThemeMode();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <BottomSheetModalProvider>
        <AuthNavigationBridge />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.background },
            animation: 'slide_from_right',
          }}
        />
        <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
}

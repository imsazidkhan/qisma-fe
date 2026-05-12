import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BackHeaderButton, ThemeToggle } from '@/components/ui';
import { useAuthSession } from '@/features/auth/hooks';
import { useUpdateUseCase } from '@/features/home/hooks/useUpdateUseCase';
import { mapUpdateProfileError } from '@/features/onboarding/api/mapUpdateProfileError';
import type { OnboardingUseCaseSlug } from '@/features/onboarding/api/runOnboardingFlow';
import { OnboardingNameErrorBanner } from '@/features/onboarding/components/OnboardingNameErrorBanner';
import { onboardingUseCaseScreenStyles as styles } from '@/features/onboarding/components/onboardingUseCaseScreen.styles';
import { UseCaseListGroup } from '@/features/onboarding/components/UseCaseListGroup';
import { SIGNED_IN_PATHS } from '@/features/onboarding/constants/signedInPaths';
import { useNetworkStatus } from '@/hooks';
import { AUTH_USE_CASE } from '@/i18n/strings/useCaseAuth';
import { useThemeColors } from '@/theme';

export function HomeUseCaseSetupScreen() {
  const palette = useThemeColors();
  const { t } = useTranslation();
  const { accessToken } = useAuthSession();
  const { isOnline, isReady } = useNetworkStatus();
  const [pendingSlug, setPendingSlug] = useState<OnboardingUseCaseSlug | null>(null);

  const { submit, isPending, mutation } = useUpdateUseCase();

  const uiError = useMemo(
    () => (mutation.isError ? mapUpdateProfileError(mutation.error) : null),
    [mutation.isError, mutation.error],
  );

  useEffect(() => {
    if (mutation.isError) {
      setPendingSlug(null);
    }
  }, [mutation.isError]);

  useEffect(() => {
    if (!accessToken) {
      router.replace('/login');
    }
  }, [accessToken]);

  const disabled = !isOnline || isPending || !isReady || !accessToken;
  const showOffline = isReady && !isOnline;

  const handleSelect = useCallback(
    (slug: OnboardingUseCaseSlug) => {
      if (disabled) return;
      setPendingSlug(slug);
      submit(slug);
    },
    [disabled, submit],
  );

  const handleSkip = useCallback(() => {
    if (disabled) return;
    void Haptics.selectionAsync().catch(() => {});
    router.replace(SIGNED_IN_PATHS.HOME);
  }, [disabled]);

  const handleBack = useCallback(() => {
    void Haptics.selectionAsync().catch(() => {});
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace(SIGNED_IN_PATHS.HOME);
  }, []);

  const listPendingSlug = pendingSlug;

  return (
    <SafeAreaView
      edges={['top', 'bottom']}
      style={[styles.safe, { backgroundColor: palette.background }]}
    >
      <View style={styles.container}>
        <View style={styles.topBar}>
          <BackHeaderButton onPress={handleBack} accessibilityLabel={t('common.backA11y')} />
          <View style={styles.topBarSpacer} />
          <ThemeToggle />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.hero}>
            <Text style={[styles.eyebrow, { color: palette.textMuted }]}>
              {t('home.useCaseSetup.eyebrow')}
            </Text>
            <Text style={[styles.title, { color: palette.textPrimary }]}>
              {t('home.useCaseSetup.title')}
            </Text>
            <Text style={[styles.subtitle, { color: palette.textSecondary }]}>
              {t('home.useCaseSetup.subtitle')}
            </Text>
            {showOffline ? (
              <Text style={[styles.offlineLine, { color: palette.errorText }]}>
                {t('auth.useCase.offlineHint', { defaultValue: AUTH_USE_CASE.offlineHint })}
              </Text>
            ) : null}
          </View>

          <OnboardingNameErrorBanner error={uiError} />

          <UseCaseListGroup
            disabled={disabled}
            isPending={isPending}
            pendingSlug={listPendingSlug}
            onSelect={handleSelect}
          />
        </ScrollView>

        <View style={styles.footer}>
          <View style={[styles.hairline, { backgroundColor: palette.borderSubtle }]} />
          <Pressable
            onPress={handleSkip}
            disabled={disabled}
            android_ripple={{ color: palette.ripple }}
            accessibilityRole="button"
            accessibilityLabel={t('home.useCaseSetup.skipCta')}
            accessibilityHint={t('home.useCaseSetup.skipCtaHint')}
            accessibilityState={{ disabled }}
            style={({ pressed }) => [
              styles.skipButton,
              {
                backgroundColor: pressed && !disabled ? palette.surfaceOverlay : 'transparent',
              },
            ]}
          >
            <Text
              style={[
                styles.skipLabel,
                { color: disabled ? palette.textMuted : palette.textSecondary },
              ]}
            >
              {t('home.useCaseSetup.skipCta')}
            </Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

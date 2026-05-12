import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BackHeaderButton, ThemeToggle } from '@/components/ui';
import { useAuthSession } from '@/features/auth/hooks';
import { mapUpdateProfileError } from '@/features/onboarding/api/mapUpdateProfileError';
import type { OnboardingUseCaseSlug } from '@/features/onboarding/api/runOnboardingFlow';
import { OnboardingNameErrorBanner } from '@/features/onboarding/components/OnboardingNameErrorBanner';
import { onboardingUseCaseScreenStyles as styles } from '@/features/onboarding/components/onboardingUseCaseScreen.styles';
import { UseCaseListGroup } from '@/features/onboarding/components/UseCaseListGroup';
import { SIGNED_IN_PATHS } from '@/features/onboarding/constants/signedInPaths';
import { useCompleteUseCaseOnboarding } from '@/features/onboarding/hooks/useCompleteUseCaseOnboarding';
import { useEnsureSignedInPath } from '@/features/onboarding/hooks/useEnsureSignedInPath';
import { useNetworkStatus } from '@/hooks';
import { AUTH_USE_CASE } from '@/i18n/strings/useCaseAuth';
import { useThemeColors } from '@/theme';

type PendingAction = OnboardingUseCaseSlug | 'skip' | null;

export function OnboardingUseCaseScreen() {
  const palette = useThemeColors();
  const { t } = useTranslation();
  const { accessToken } = useAuthSession();
  const { isOnline, isReady } = useNetworkStatus();
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);

  useEnsureSignedInPath(SIGNED_IN_PATHS.ONBOARDING_USE_CASE);

  const { submit, isPending, mutation } = useCompleteUseCaseOnboarding();

  const uiError = useMemo(
    () => (mutation.isError ? mapUpdateProfileError(mutation.error) : null),
    [mutation.isError, mutation.error],
  );

  const disabled = !isOnline || isPending || !isReady || !accessToken;
  const showOffline = isReady && !isOnline;
  const isSkipping = pendingAction === 'skip' && isPending;

  const handleSelect = useCallback(
    (slug: OnboardingUseCaseSlug) => {
      if (disabled) return;
      setPendingAction(slug);
      submit(slug);
    },
    [disabled, submit],
  );

  const handleSkip = useCallback(() => {
    if (disabled) return;
    setPendingAction('skip');
    void Haptics.selectionAsync().catch(() => {});
    submit(null);
  }, [disabled, submit]);

  const handleBack = useCallback(() => {
    void Haptics.selectionAsync().catch(() => {});
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace(SIGNED_IN_PATHS.ONBOARDING_AVATAR);
  }, []);

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
              {t('auth.useCase.eyebrow', { defaultValue: AUTH_USE_CASE.eyebrow })}
            </Text>
            <Text style={[styles.title, { color: palette.textPrimary }]}>
              {t('auth.useCase.title', { defaultValue: AUTH_USE_CASE.title })}
            </Text>
            <Text style={[styles.subtitle, { color: palette.textSecondary }]}>
              {t('auth.useCase.subtitle', { defaultValue: AUTH_USE_CASE.subtitle })}
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
            pendingSlug={pendingAction !== null && pendingAction !== 'skip' ? pendingAction : null}
            onSelect={handleSelect}
          />
        </ScrollView>

        <View style={styles.footer}>
          <View style={[styles.hairline, { backgroundColor: palette.borderSubtle }]} />
          <Pressable
            onPress={handleSkip}
            disabled={disabled || isPending}
            android_ripple={{ color: palette.ripple }}
            accessibilityRole="button"
            accessibilityLabel={t('auth.useCase.skip', {
              defaultValue: AUTH_USE_CASE.skip,
            })}
            accessibilityHint={t('auth.useCase.skipA11y', {
              defaultValue: AUTH_USE_CASE.skipA11y,
            })}
            accessibilityState={{ disabled: disabled || isPending, busy: isSkipping }}
            style={({ pressed }) => [
              styles.skipButton,
              {
                backgroundColor:
                  pressed && !disabled && !isPending ? palette.surfaceOverlay : 'transparent',
              },
            ]}
          >
            {isSkipping ? (
              <>
                <ActivityIndicator size="small" color={palette.textSecondary} />
                <Text style={[styles.skipLabel, { color: palette.textSecondary }]}>
                  {t('auth.useCase.skipping', {
                    defaultValue: AUTH_USE_CASE.skipping,
                  })}
                </Text>
              </>
            ) : (
              <Text
                style={[
                  styles.skipLabel,
                  {
                    color: disabled || isPending ? palette.textMuted : palette.textSecondary,
                  },
                ]}
              >
                {t('auth.useCase.skip', { defaultValue: AUTH_USE_CASE.skip })}
              </Text>
            )}
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

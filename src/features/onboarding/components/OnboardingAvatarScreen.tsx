import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, ThemeToggle } from '@/components/ui';
import { useAuthSession } from '@/features/auth/hooks';
import { mapUpdateProfileError } from '@/features/onboarding/api/mapUpdateProfileError';
import { onboardingAvatarScreenStyles as styles } from '@/features/onboarding/components/onboardingAvatarScreen.styles';
import { OnboardingNameErrorBanner } from '@/features/onboarding/components/OnboardingNameErrorBanner';
import { SIGNED_IN_PATHS } from '@/features/onboarding/constants/signedInPaths';
import {
  useCompleteAvatarOnboarding,
  type PickedAvatar,
} from '@/features/onboarding/hooks/useCompleteAvatarOnboarding';
import { useEnsureSignedInPath } from '@/features/onboarding/hooks/useEnsureSignedInPath';
import { pickAvatarFromLibrary } from '@/features/onboarding/utils/pickAvatarFromLibrary';
import { useNetworkStatus } from '@/hooks';
import { AUTH_AVATAR } from '@/i18n/strings/avatarAuth';
import { space, useThemeColors } from '@/theme';

export function OnboardingAvatarScreen() {
  const palette = useThemeColors();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { accessToken } = useAuthSession();
  const { isOnline, isReady } = useNetworkStatus();
  const [picked, setPicked] = useState<PickedAvatar | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);

  const { submitWithPicked, skip, isPending, mutation } = useCompleteAvatarOnboarding();

  useEnsureSignedInPath(SIGNED_IN_PATHS.ONBOARDING_AVATAR);

  useEffect(() => {
    if (!accessToken) {
      router.replace('/login');
    }
  }, [accessToken]);

  const uiError = useMemo(() => {
    if (mutation.isError) return mapUpdateProfileError(mutation.error);
    return null;
  }, [mutation.isError, mutation.error]);

  const pickImage = useCallback(async () => {
    setPermissionDenied(false);
    if (mutation.isError) mutation.reset();

    const result = await pickAvatarFromLibrary();
    if (result.kind === 'permission_denied') {
      setPermissionDenied(true);
      return;
    }
    if (result.kind === 'cancelled') return;
    setPicked(result.asset);
  }, [mutation]);

  const handleContinue = useCallback(() => {
    if (!picked || isPending || !isOnline) return;
    void Keyboard.dismiss();
    submitWithPicked(picked);
  }, [picked, isPending, isOnline, submitWithPicked]);

  const continueDisabled = !picked || !isOnline || isPending || !isReady;
  const showOffline = isReady && !isOnline;

  return (
    <SafeAreaView
      edges={['top', 'bottom']}
      style={[styles.safe, { backgroundColor: palette.background }]}
    >
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : Math.max(insets.top, 12)}
      >
        <View style={styles.container}>
          <View style={styles.topBar}>
            <ThemeToggle />
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.hero}>
              <Text style={[styles.eyebrow, { color: palette.textMuted }]}>
                {t('auth.avatar.eyebrow', { defaultValue: AUTH_AVATAR.eyebrow })}
              </Text>
              <Text style={[styles.title, { color: palette.textPrimary }]}>
                {t('auth.avatar.title', { defaultValue: AUTH_AVATAR.title })}
              </Text>
              <Text style={[styles.subtitle, { color: palette.textSecondary }]}>
                {t('auth.avatar.subtitle', { defaultValue: AUTH_AVATAR.subtitle })}
              </Text>
              {showOffline ? (
                <Text style={[styles.offlineLine, { color: palette.errorText }]}>
                  {t('auth.avatar.offlineHint', { defaultValue: AUTH_AVATAR.offlineHint })}
                </Text>
              ) : null}
              {permissionDenied ? (
                <Text style={[styles.offlineLine, { color: palette.errorText }]}>
                  {t('auth.avatar.errors.permission', {
                    defaultValue: AUTH_AVATAR.errors.permission,
                  })}
                </Text>
              ) : null}
            </View>

            <View style={[styles.formCard, { borderColor: palette.border }]}>
              <View style={[styles.previewWrap, { borderColor: palette.border }]}>
                {picked ? (
                  <Image
                    source={{ uri: picked.uri }}
                    style={styles.previewImage}
                    contentFit="cover"
                    accessibilityLabel={t('auth.avatar.previewA11y', {
                      defaultValue: AUTH_AVATAR.previewA11y,
                    })}
                  />
                ) : (
                  <Text style={[styles.placeholderLabel, { color: palette.textMuted }]}>
                    {t('auth.avatar.choosePhoto', { defaultValue: AUTH_AVATAR.choosePhoto })}
                  </Text>
                )}
              </View>

              <Button
                variant="secondary"
                label={
                  picked
                    ? t('auth.avatar.changePhoto', { defaultValue: AUTH_AVATAR.changePhoto })
                    : t('auth.avatar.choosePhoto', { defaultValue: AUTH_AVATAR.choosePhoto })
                }
                onPress={() => void pickImage()}
                disabled={isPending}
                trailing="none"
                labelCase="none"
                accessibilityHint={t('auth.avatar.a11y.chooseHint', {
                  defaultValue: AUTH_AVATAR.a11y.chooseHint,
                })}
                haptic
              />

              <OnboardingNameErrorBanner error={uiError} />
            </View>
          </ScrollView>

          <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, space.gapSm) }]}>
            <View style={[styles.hairline, { backgroundColor: palette.borderSubtle }]} />

            <Button
              variant="primary"
              label={
                isPending
                  ? t('auth.avatar.uploading', { defaultValue: AUTH_AVATAR.uploading })
                  : t('auth.avatar.continue', { defaultValue: AUTH_AVATAR.continue })
              }
              loading={isPending}
              disabled={continueDisabled}
              onPress={handleContinue}
              trailing="none"
              labelCase="none"
              accessibilityHint={t('auth.avatar.a11y.continueHint', {
                defaultValue: AUTH_AVATAR.a11y.continueHint,
              })}
              haptic
            />

            <View style={styles.secondaryActions}>
              <Button
                variant="secondary"
                label={t('auth.avatar.skip', { defaultValue: AUTH_AVATAR.skip })}
                onPress={skip}
                disabled={isPending}
                trailing="none"
                labelCase="none"
                accessibilityHint={t('auth.avatar.a11y.skipHint', {
                  defaultValue: AUTH_AVATAR.a11y.skipHint,
                })}
                haptic
              />
            </View>
            <Pressable
              onPress={skip}
              disabled={isPending}
              accessibilityRole="button"
              accessibilityLabel={t('auth.avatar.skip', { defaultValue: AUTH_AVATAR.skip })}
              accessibilityHint={t('auth.avatar.a11y.skipHint', {
                defaultValue: AUTH_AVATAR.a11y.skipHint,
              })}
              style={({ pressed }) => [
                styles.dangerSkipAction,
                pressed && !isPending ? styles.dangerSkipActionPressed : null,
              ]}
            >
              <Text
                style={[
                  styles.dangerSkipText,
                  { color: isPending ? palette.textDisabled : palette.errorText },
                ]}
              >
                {t('auth.avatar.skip', { defaultValue: AUTH_AVATAR.skip })}
              </Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

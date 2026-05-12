import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, Input, ThemeToggle } from '@/components/ui';
import { useAuthSession } from '@/features/auth/hooks';
import { mapUpdateProfileError } from '@/features/onboarding/api/mapUpdateProfileError';
import { onboardingNameScreenStyles as styles } from '@/features/onboarding/components/onboardingNameScreen.styles';
import { OnboardingNameErrorBanner } from '@/features/onboarding/components/OnboardingNameErrorBanner';
import { SIGNED_IN_PATHS } from '@/features/onboarding/constants/signedInPaths';
import { useEnsureSignedInPath } from '@/features/onboarding/hooks/useEnsureSignedInPath';
import { useUpdateDisplayName } from '@/features/onboarding/hooks/useUpdateDisplayName';
import { useNetworkStatus } from '@/hooks';
import { AUTH_DISPLAY_NAME } from '@/i18n/strings/displayNameAuth';
import { useThemeColors } from '@/theme';

/** Client UX cap; server allows up to 80 after normalization. */
const MAX_NAME_CHARS = 30;

export function OnboardingNameScreen() {
  const palette = useThemeColors();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { accessToken } = useAuthSession();
  const { isOnline, isReady } = useNetworkStatus();
  const [name, setName] = useState('');
  const inputRef = useRef<TextInput>(null);

  const { submit, isPending, mutation } = useUpdateDisplayName();

  const trimmed = name.trim();
  const isValid = trimmed.length > 0 && trimmed.length <= MAX_NAME_CHARS;
  const submitDisabled = !isValid || !isOnline || isPending || !isReady;

  useEnsureSignedInPath(SIGNED_IN_PATHS.ONBOARDING_NAME);

  useEffect(() => {
    if (!accessToken) {
      router.replace('/login');
    }
  }, [accessToken]);

  useEffect(() => {
    const focusTimer = setTimeout(() => {
      inputRef.current?.focus?.();
    }, 120);
    return () => clearTimeout(focusTimer);
  }, []);

  const uiError = useMemo(
    () => (mutation.isError ? mapUpdateProfileError(mutation.error) : null),
    [mutation.isError, mutation.error],
  );

  const handleNameChange = useCallback(
    (text: string) => {
      setName(text);
      if (mutation.isError) mutation.reset();
    },
    [mutation],
  );

  const handleSubmit = useCallback(() => {
    if (submitDisabled) return;
    void Keyboard.dismiss();
    submit(trimmed);
  }, [submit, submitDisabled, trimmed]);

  const charCount = name.length;
  const counterAdornment = (
    <Text style={[styles.counter, { color: palette.textMuted }]} accessibilityElementsHidden>
      {charCount}/{MAX_NAME_CHARS}
    </Text>
  );

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
                {t('auth.displayName.eyebrow', { defaultValue: AUTH_DISPLAY_NAME.eyebrow })}
              </Text>
              <Text style={[styles.title, { color: palette.textPrimary }]}>
                {t('auth.displayName.title', { defaultValue: AUTH_DISPLAY_NAME.title })}
              </Text>
              <Text style={[styles.subtitle, { color: palette.textSecondary }]}>
                {t('auth.displayName.subtitle', { defaultValue: AUTH_DISPLAY_NAME.subtitle })}
              </Text>
              {isReady && !isOnline ? (
                <Text style={[styles.offlineLine, { color: palette.errorText }]}>
                  {t('auth.displayName.offlineHint', {
                    defaultValue: AUTH_DISPLAY_NAME.offlineHint,
                  })}
                </Text>
              ) : null}
            </View>

            <View style={[styles.formCard, { borderColor: palette.border }]}>
              <View style={styles.form}>
                <Input
                  ref={inputRef}
                  label={t('auth.displayName.inputLabel', {
                    defaultValue: AUTH_DISPLAY_NAME.inputLabel,
                  })}
                  accessibilityLabel={t('auth.displayName.inputLabel', {
                    defaultValue: AUTH_DISPLAY_NAME.inputLabel,
                  })}
                  value={name}
                  onChangeText={handleNameChange}
                  maxLength={MAX_NAME_CHARS}
                  autoCapitalize="words"
                  autoCorrect
                  editable={!isPending}
                  returnKeyType="done"
                  onSubmitEditing={handleSubmit}
                  helperText={t('auth.displayName.charHint', {
                    defaultValue: AUTH_DISPLAY_NAME.charHint,
                  })}
                  accessibilityHint={t('auth.displayName.a11y.inputHint', {
                    max: MAX_NAME_CHARS,
                    defaultValue: AUTH_DISPLAY_NAME.a11y.inputHint,
                  })}
                  rightAdornment={counterAdornment}
                />

                <OnboardingNameErrorBanner error={uiError} />
              </View>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <View style={[styles.hairline, { backgroundColor: palette.borderSubtle }]} />

            <Button
              variant="primary"
              label={
                isPending
                  ? t('auth.displayName.submitting', { defaultValue: AUTH_DISPLAY_NAME.submitting })
                  : t('auth.displayName.continue', { defaultValue: AUTH_DISPLAY_NAME.continue })
              }
              loading={isPending}
              disabled={submitDisabled}
              onPress={handleSubmit}
              trailing="none"
              labelCase="none"
              accessibilityHint={t('auth.displayName.a11y.continueHint', {
                defaultValue: AUTH_DISPLAY_NAME.a11y.continueHint,
              })}
              haptic
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

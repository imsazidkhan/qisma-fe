import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, StepIndicator } from '@/components/ui';
import { OtpCodeField } from '@/features/auth/components/OtpCodeField';
import { useLoginOtpVerify } from '@/features/auth/hooks/useLoginOtpVerify';
import { formatMmSs } from '@/hooks';
import { space, useThemeColors } from '@/theme';

import { LoginTopBar } from './LoginTopBar';
import { LoginVerifyErrorBanner } from './LoginVerifyErrorBanner';
import { loginScreenStyles as styles } from './loginScreen.styles';

type Props = {
  phoneE164: string;
  sessionId: string;
  expiresAt: number;
  resendAt: number;
};

export function LoginOtpCard({ phoneE164, sessionId, expiresAt, resendAt }: Props) {
  const palette = useThemeColors();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  const v = useLoginOtpVerify({ phoneE164, sessionId, expiresAt, resendAt });

  const mainColumn = (
    <View style={styles.container}>
      <LoginTopBar dotState={v.dotState} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <StepIndicator labels={['01', '02']} currentIndex={1} />
          <Text style={[styles.title, { color: palette.textPrimary }]}>
            {t('auth.verify.screenHeading')}
          </Text>
          <Text style={[styles.subtitle, { color: palette.textSecondary }]}>
            {t('auth.verify.instructionWithMaskedPhone', { phone: v.masked })}
          </Text>
        </View>

        <View style={styles.otpSection}>
          <OtpCodeField
            value={v.otp}
            onChangeText={v.onOtpChange}
            editable={!v.expired && !v.isVerifyPending}
            hasError={v.verifyMutation.isError}
            accessibilityLabel={t('auth.phone.otpLabel')}
            accessibilityHint={t('auth.phone.a11y.otpHint')}
          />

          <LoginVerifyErrorBanner error={v.uiVerifyError} />
        </View>

        <View style={[styles.ttlCard, { borderColor: palette.border }]}>
          <View style={styles.ttlRow}>
            <Text style={[styles.ttlMeta, { color: palette.textMuted }]}>
              {t('auth.verify.expiryCountdownLabel')}
            </Text>
            <Text
              style={[
                styles.ttlCountdown,
                { color: v.expired ? palette.textMuted : palette.textPrimary },
              ]}
              accessibilityLabel={
                v.expired
                  ? t('auth.phone.sentExpired')
                  : t('auth.phone.sentExpiresIn', { time: formatMmSs(v.seconds) })
              }
            >
              {formatMmSs(v.seconds)}
            </Text>
          </View>
          <View style={[styles.progressTrack, { backgroundColor: palette.borderSubtle }]}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${v.progress * 100}%`,
                  backgroundColor: v.expired ? palette.borderSubtle : palette.textPrimary,
                },
              ]}
            />
          </View>
        </View>

        <View style={styles.linkRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: !v.canResend }}
            disabled={!v.canResend}
            onPress={v.onResend}
            hitSlop={12}
            style={({ pressed }) => [
              styles.linkHit,
              pressed && v.canResend && styles.linkHitPressed,
            ]}
          >
            <Text
              style={[
                styles.linkLabel,
                {
                  color: v.canResend ? palette.textSecondary : palette.textMuted,
                },
              ]}
            >
              {v.isResendPending
                ? t('auth.phone.submitting')
                : v.resendCooldownSeconds > 0
                  ? t('auth.phone.sentResendWait', { seconds: v.resendCooldownSeconds })
                  : v.resendWaitSeconds > 0
                    ? t('auth.phone.sentResendWait', { seconds: v.resendWaitSeconds })
                    : t('auth.phone.sentResend')}
            </Text>
          </Pressable>

          <Text style={[styles.linkDivider, { color: palette.textMuted }]}>
            {t('auth.verify.secondaryLinkSeparator')}
          </Text>

          <Pressable
            accessibilityRole="button"
            accessibilityHint={t('auth.phone.a11y.changeHint')}
            onPress={() => v.reset()}
            hitSlop={12}
            style={({ pressed }) => [styles.linkHit, pressed && styles.linkHitPressed]}
          >
            <Text style={[styles.linkLabel, { color: palette.textSecondary }]}>
              {t('auth.verify.differentNumberLink')}
            </Text>
          </Pressable>
        </View>
      </ScrollView>

      <View
        style={[
          styles.footer,
          {
            marginTop: space.gapLg,
            paddingTop: space.gapMd,
            paddingBottom: space.gapSm,
            backgroundColor: palette.surfaceBase,
            borderTopWidth: 1,
            borderTopColor: palette.border,
          },
        ]}
      >
        <Button
          variant="accent"
          label={v.isVerifyPending ? t('auth.phone.sentVerifying') : t('auth.phone.sentVerify')}
          labelCase="none"
          loading={v.isVerifyPending}
          disabled={v.verifySubmitDisabled}
          onPress={v.onVerify}
          accessibilityLabel={t('auth.phone.sentVerify')}
          accessibilityHint={t('auth.phone.a11y.verifyHint')}
          haptic
          style={styles.loginCta}
        />
      </View>
    </View>
  );

  return (
    <SafeAreaView
      edges={['top', 'bottom']}
      style={[styles.safe, { backgroundColor: palette.background }]}
    >
      {Platform.OS === 'ios' ? (
        <KeyboardAvoidingView
          style={styles.flex}
          behavior="padding"
          keyboardVerticalOffset={insets.top}
        >
          {mainColumn}
        </KeyboardAvoidingView>
      ) : (
        <View style={styles.flex}>{mainColumn}</View>
      )}
    </SafeAreaView>
  );
}

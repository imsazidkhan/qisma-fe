import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  View,
  type LayoutChangeEvent,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, type StatusDotState, StepIndicator } from '@/components/ui';
import { ANALYTICS_EVENTS, DEFAULT_PHONE_REGION } from '@/constants';
import { useOtpFlowCooldown } from '@/features/auth/hooks/useOtpFlowCooldown';
import { useSendOtp } from '@/features/auth/hooks/useSendOtp';
import { selectOtpState, useOtpFlowStore } from '@/features/auth/store';
import { useNetworkStatus } from '@/hooks';
import { track } from '@/services';
import { space, useThemeColors } from '@/theme';
import { isValidPhone, normalizeToE164 } from '@/utils';
import { PhoneInput } from '../PhoneInput';

import { LoginFlowBanner } from './LoginFlowBanner';
import { LoginFootnote } from './LoginFootnote';
import { LoginTopBar } from './LoginTopBar';
import { loginScreenStyles as styles } from './loginScreen.styles';

const REGION = DEFAULT_PHONE_REGION;

/**
 * Phone + send OTP — scrollable middle + **docked footer** (pinned with
 * `position: 'absolute'` so it is always on-screen; scroll content gets
 * `paddingBottom` from measured footer height).
 */
export function LoginFormCard() {
  const palette = useThemeColors();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  const [phone, setPhone] = useState('');
  const [footerDockHeight, setFooterDockHeight] = useState(144);
  const isPhoneValid = isValidPhone(phone, REGION);

  const { isOnline } = useNetworkStatus();

  const flowState = useOtpFlowStore(selectOtpState);
  const reset = useOtpFlowStore((s) => s.reset);
  const { sendOtp, isPending } = useSendOtp();

  useEffect(() => {
    reset();
  }, [reset]);

  const { cooldownSeconds, isCooling } = useOtpFlowCooldown(flowState, reset);

  const onFooterDockLayout = useCallback((e: LayoutChangeEvent) => {
    const h = e.nativeEvent.layout.height;
    setFooterDockHeight((prev) => (prev === h ? prev : h));
  }, []);

  const dotState: StatusDotState = (() => {
    if (!isOnline) return 'offline';
    if (isPending || flowState.status === 'sending') return 'sending';
    if (flowState.status === 'error') return 'error';
    if (flowState.status === 'cooldown' || flowState.status === 'rateLimited') return 'idle';
    if (isPhoneValid) return 'online';
    return 'idle';
  })();

  const handleSubmit = useCallback(() => {
    if (!isPhoneValid || !isOnline || isPending) return;
    if (isCooling) {
      if (flowState.status === 'cooldown' || flowState.status === 'rateLimited') {
        track(ANALYTICS_EVENTS.OTP_SEND_COOLDOWN_BLOCKED, {
          secondsRemaining: cooldownSeconds,
        });
      }
      return;
    }

    const phoneE164 = normalizeToE164(phone, REGION);
    sendOtp({ phoneE164 });
  }, [
    cooldownSeconds,
    flowState.status,
    isCooling,
    isOnline,
    isPending,
    isPhoneValid,
    phone,
    sendOtp,
  ]);

  const handleChange = (next: string) => {
    setPhone(next);
    if (flowState.status === 'error' || flowState.status === 'expired') {
      reset();
    }
  };

  const submitDisabled = !isPhoneValid || !isOnline || isPending || isCooling;

  const mainColumn = (
    <View style={[styles.container, { paddingBottom: 0 }]}>
      <LoginTopBar dotState={dotState} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: footerDockHeight + space.gapMd },
        ]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <StepIndicator labels={['01', '02']} currentIndex={0} />
          <Text style={[styles.title, { color: palette.textPrimary }]}>
            {t('auth.phone.title')}
          </Text>
          <Text style={[styles.subtitle, { color: palette.textSecondary }]}>
            {t('auth.phone.subtitle')}
          </Text>
        </View>

        <View style={styles.form}>
          <PhoneInput
            label={t('auth.phone.label')}
            value={phone}
            onChangeText={handleChange}
            autoFocus
            editable={!isPending}
            showDigitCounter
          />

          <LoginFlowBanner />
        </View>
      </ScrollView>

      <View
        onLayout={onFooterDockLayout}
        style={[
          styles.footer,
          styles.footerDock,
          { backgroundColor: palette.background, paddingBottom: space.sectionGap },
        ]}
      >
        <View style={[styles.hairline, { backgroundColor: palette.borderSubtle }]} />

        <Button
          variant="primary"
          label={isPending ? t('auth.phone.submitting') : t('auth.phone.submit')}
          loading={isPending}
          disabled={submitDisabled}
          onPress={handleSubmit}
          accessibilityLabel={t('auth.phone.submit')}
          accessibilityHint={t('auth.phone.a11y.submitHint')}
          haptic
        />

        <LoginFootnote />
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

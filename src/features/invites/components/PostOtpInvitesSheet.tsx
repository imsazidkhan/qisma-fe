import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import type { ReactElement } from 'react';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { ROUTES } from '@/constants/routes';
import { Button } from '@/components/ui';
import { DotMatrixField } from '@/features/invites/components/DotMatrixField';
import { radius, space, textStyles, useThemeColors, useThemeMode } from '@/theme';

export type PostOtpInvitesSheetProps = {
  visible: boolean;
  count: number;
  onDismiss: () => void;
};

/**
 * Shown on home when the user has pending group invites and hasn’t dismissed this prompt yet.
 */
export function PostOtpInvitesSheet({
  visible,
  count,
  onDismiss,
}: PostOtpInvitesSheetProps): ReactElement {
  const { t } = useTranslation();
  const palette = useThemeColors();
  const mode = useThemeMode();

  const handleDismiss = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onDismiss();
  }, [onDismiss]);

  const handleReview = useCallback(() => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    onDismiss();
    router.push(ROUTES.HOME_INVITES);
  }, [onDismiss]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      presentationStyle="overFullScreen"
      statusBarTranslucent
      onRequestClose={handleDismiss}
    >
      <View style={[styles.backdrop, { backgroundColor: palette.scrim }]}>
        {Platform.OS !== 'web' ? (
          <BlurView
            intensity={mode === 'dark' ? 48 : 32}
            tint={mode}
            style={StyleSheet.absoluteFill}
            experimentalBlurMethod={Platform.OS === 'android' ? 'dimezisBlurView' : undefined}
          />
        ) : null}
        <Pressable
          style={StyleSheet.absoluteFill}
          accessibilityRole="button"
          accessibilityLabel={t('invites.postSignInDismissA11y')}
          onPress={handleDismiss}
        />
        <View
          style={[
            styles.sheet,
            { borderColor: palette.borderFrost, backgroundColor: palette.surfaceFloating },
          ]}
          accessibilityViewIsModal
        >
          <DotMatrixField height={56} rows={4} columns={14} dotSize={2} />
          <Text style={[textStyles.overline, { color: palette.textMuted, marginTop: space.gapMd }]}>
            {t('invites.postSignInEyebrow')}
          </Text>
          <Text style={[textStyles.h2, { color: palette.textPrimary, marginTop: space.gapSm }]}>
            {t('invites.postSignInTitle', { count })}
          </Text>
          <Text style={[textStyles.body, { color: palette.textSecondary, marginTop: space.gapMd }]}>
            {t('invites.postSignInBody')}
          </Text>
          <Button
            label={t('invites.postSignInReviewCta')}
            variant="accent"
            onPress={handleReview}
            trailing="none"
            labelCase="none"
            accessibilityLabel={t('invites.postSignInReviewCtaA11y')}
            style={{ marginTop: space.sectionGap }}
          />
          <Button
            label={t('invites.postSignInLaterCta')}
            variant="secondary"
            onPress={handleDismiss}
            trailing="none"
            labelCase="none"
            accessibilityLabel={t('invites.postSignInLaterCtaA11y')}
            style={{ marginTop: space.gapMd }}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: space.screenPadding,
  },
  sheet: {
    borderRadius: radius['3xl'],
    borderWidth: StyleSheet.hairlineWidth,
    padding: space.sectionGap,
    overflow: 'hidden',
  },
});

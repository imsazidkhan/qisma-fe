import type { ReactElement } from 'react';
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import Animated, {
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { addGroupMemberModalStyles as panelStyles } from '@/features/groups/components/addGroupMemberModal.styles';
import { duration, easing, space, useThemeColors } from '@/theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export type InviteStickyCtaProps = {
  inviteCount: number;
  disabled: boolean;
  busy: boolean;
  ctaProgress: SharedValue<number>;
  onPress: () => void;
};

export function InviteStickyCta({
  inviteCount,
  disabled,
  busy,
  ctaProgress,
  onPress,
}: InviteStickyCtaProps): ReactElement {
  const { t } = useTranslation();
  const palette = useThemeColors();
  const labelScale = useSharedValue(1);
  const prev = useRef(inviteCount);

  useEffect(() => {
    if (prev.current !== inviteCount && inviteCount > 0) {
      labelScale.value = withSequence(
        withTiming(1.03, { duration: duration.fast.ms, easing: easing.standard.rn }),
        withTiming(1, { duration: duration.normal.ms, easing: easing.standard.rn }),
      );
    }
    prev.current = inviteCount;
  }, [inviteCount, labelScale]);

  const wrapAnim = useAnimatedStyle(() => ({
    opacity: 0.52 + 0.48 * ctaProgress.value,
    transform: [{ translateY: (1 - ctaProgress.value) * 10 }],
  }));

  const labelAnim = useAnimatedStyle(() => ({
    transform: [{ scale: labelScale.value }],
  }));

  const label =
    inviteCount === 0
      ? t('groups.addMember.sendInvitesPick')
      : t('groups.addMember.sendInvitesCta', { count: inviteCount });

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel={
        inviteCount === 0
          ? t('groups.addMember.sendInvitesPickA11y')
          : t('groups.addMember.sendInvitesCtaA11y', { count: inviteCount })
      }
      accessibilityState={{ disabled: disabled || busy }}
      disabled={disabled || busy}
      onPress={onPress}
      style={[
        panelStyles.footerCta,
        wrapAnim,
        {
          borderColor: disabled ? palette.border : palette.borderFocus,
          backgroundColor: disabled ? palette.surfaceElevated : palette.textPrimary,
        },
      ]}
    >
      {busy ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.gapSm }}>
          <ActivityIndicator color={palette.textOnAccent} />
          <Text style={[panelStyles.footerCtaLabel, { color: palette.textOnAccent }]}>
            {t('groups.addMember.adding')}
          </Text>
        </View>
      ) : (
        <Animated.Text
          style={[
            panelStyles.footerCtaLabel,
            {
              color: disabled ? palette.textDisabled : palette.textOnAccent,
            },
            labelAnim,
          ]}
        >
          {label}
        </Animated.Text>
      )}
    </AnimatedPressable>
  );
}

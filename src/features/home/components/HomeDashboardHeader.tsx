import {
  duration,
  easing,
  radius,
  size,
  spacing,
  space,
  textStyles,
  typography,
  useThemeColors,
} from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import { type ReactElement, type ReactNode, useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  cancelAnimation,
  FadeIn,
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

const FAB_SIZE = size.touchMin;
const ICON_SIZE = 22;

export type HomeDashboardHeaderProps = {
  stamp: string;
  inviteBadgeCount: number;
  profileAccessibilityLabel: string;
  profileAccessibilityHint: string;
  inboxAccessibilityLabel: string;
  inboxAccessibilityHint: string;
  onProfilePress: () => void;
  onInboxPress: () => void;
};

function DashboardHeaderIconButton({
  onPress,
  accessibilityLabel,
  accessibilityHint,
  accessibilityState,
  children,
}: {
  onPress: () => void;
  accessibilityLabel: string;
  accessibilityHint?: string;
  accessibilityState?: { disabled?: boolean; busy?: boolean; selected?: boolean };
  children: ReactNode;
}): ReactElement {
  const palette = useThemeColors();
  const reduceMotion = useReducedMotion();
  const scaleSv = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleSv.value }],
  }));

  const targetPressed = reduceMotion ? 1 : 0.97;

  const handlePressIn = (): void => {
    scaleSv.value = withTiming(targetPressed, {
      duration: duration.normal.ms,
      easing: easing.standard.rn,
    });
  };

  const handlePressOut = (): void => {
    scaleSv.value = withTiming(1, {
      duration: duration.normal.ms,
      easing: easing.standard.rn,
    });
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityState={accessibilityState}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      hitSlop={spacing['2']}
    >
      <Animated.View
        style={[
          animatedStyle,
          {
            width: FAB_SIZE,
            height: FAB_SIZE,
            borderRadius: radius.full,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'transparent',
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: palette.borderSubtle,
          },
        ]}
      >
        {children}
      </Animated.View>
    </Pressable>
  );
}

function UnreadInvitePulseDot({
  visible,
  dotColor,
}: {
  visible: boolean;
  dotColor: string;
}): ReactElement | null {
  const reduceMotion = useReducedMotion();
  const opacitySv = useSharedValue(1);

  useEffect(() => {
    if (!visible || reduceMotion) {
      cancelAnimation(opacitySv);
      opacitySv.value = 1;
      return;
    }

    opacitySv.value = withRepeat(
      withSequence(
        withTiming(0.38, {
          duration: 920,
          easing: Easing.inOut(Easing.quad),
        }),
        withTiming(1, {
          duration: 920,
          easing: Easing.inOut(Easing.quad),
        }),
      ),
      -1,
      false,
    );

    return () => {
      cancelAnimation(opacitySv);
      opacitySv.value = 1;
    };
  }, [visible, reduceMotion, opacitySv]);

  const dotStyle = useAnimatedStyle(() => ({ opacity: opacitySv.value }));

  if (!visible) {
    return null;
  }

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.unreadDot, { backgroundColor: dotColor }, dotStyle]}
    />
  );
}

export function HomeDashboardHeader({
  stamp,
  inviteBadgeCount,
  profileAccessibilityLabel,
  profileAccessibilityHint,
  inboxAccessibilityLabel,
  inboxAccessibilityHint,
  onProfilePress,
  onInboxPress,
}: HomeDashboardHeaderProps): ReactElement {
  const palette = useThemeColors();
  const hasUnreadInvites = inviteBadgeCount > 0;

  return (
    <Animated.View
      entering={FadeIn.duration(duration.moderate.ms).easing(easing.standard.rn)}
      style={styles.chrome}
    >
      <View style={styles.row}>
        <View style={styles.leading} accessible={false}>
          <Text
            accessibilityRole="header"
            style={[textStyles.caption, styles.stampMeta, { color: palette.textMuted }]}
            numberOfLines={1}
          >
            {stamp}
          </Text>
        </View>

        <View style={styles.actions}>
          <DashboardHeaderIconButton
            onPress={onProfilePress}
            accessibilityLabel={profileAccessibilityLabel}
            accessibilityHint={profileAccessibilityHint}
          >
            <Ionicons name="person-outline" size={ICON_SIZE} color={palette.textPrimary} />
          </DashboardHeaderIconButton>

          <View style={styles.inboxFabWrap}>
            <DashboardHeaderIconButton
              onPress={onInboxPress}
              accessibilityLabel={inboxAccessibilityLabel}
              accessibilityHint={inboxAccessibilityHint}
            >
              <Ionicons name="mail-outline" size={ICON_SIZE} color={palette.textPrimary} />
            </DashboardHeaderIconButton>
            <UnreadInvitePulseDot visible={hasUnreadInvites} dotColor={palette.textPrimary} />
          </View>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  chrome: {
    alignSelf: 'stretch',
    marginBottom: space.gapSm,
    paddingVertical: space.paddingSm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.gapMd,
  },
  leading: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
    paddingRight: space.gapSm,
  },
  stampMeta: {
    fontFamily: typography.fontFamily.mono.regular,
    letterSpacing: typography.letterSpacing.widest,
    fontVariant: ['tabular-nums'],
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.gapSm,
  },
  inboxFabWrap: {
    position: 'relative',
  },
  unreadDot: {
    position: 'absolute',
    top: spacing['2'],
    right: spacing['2'],
    width: spacing['1.5'],
    height: spacing['1.5'],
    borderRadius: radius.full,
  },
});

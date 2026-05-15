import * as Haptics from 'expo-haptics';
import { memo, useCallback, useEffect, useState, type ReactElement } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { QISMA_TAB_BAR_LAYOUT } from '@/features/qisma/constants/tabBarLayout';
import { duration, radius, spacing, typography, useThemeColors, useThemeMode } from '@/theme';

const TAB_TIMING_EASE = Easing.inOut(Easing.ease);
/** Hover / selection polish — wallet-grade (~200ms ease-in-out). */
const TAB_HOVER_MS = duration.normal.ms;

export type QismaSideTabButtonProps = {
  accessibilityLabel: string;
  title: string;
  selected: boolean;
  onPress: () => void;
  icon: (color: string) => ReactElement;
  activeColor: string;
  idleColor: string;
  reduceMotion: boolean;
  /** Pending count for tab badge (e.g. invites inbox). `0` hides the badge. */
  badgeCount?: number;
};

function QismaSideTabButtonInner({
  accessibilityLabel,
  title,
  selected,
  onPress,
  icon,
  activeColor,
  idleColor,
  reduceMotion,
  badgeCount = 0,
}: QismaSideTabButtonProps): ReactElement {
  const palette = useThemeColors();
  const mode = useThemeMode();
  const selectedV = useSharedValue(selected ? 1 : 0);
  const hoverProgress = useSharedValue(0);
  const pressedRoot = useSharedValue(0);
  const [hovered, setHovered] = useState(false);

  const handlePress = useCallback(() => {
    if (Platform.OS === 'ios') {
      void Haptics.selectionAsync().catch(() => {});
    } else {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    onPress();
  }, [onPress]);

  useEffect(() => {
    if (!selected) {
      setHovered(false);
    }
  }, [selected]);

  useEffect(() => {
    if (reduceMotion) {
      selectedV.value = selected ? 1 : 0;
      return;
    }
    selectedV.value = withTiming(selected ? 1 : 0, {
      duration: TAB_HOVER_MS,
      easing: TAB_TIMING_EASE,
    });
  }, [selected, selectedV, reduceMotion]);

  useEffect(() => {
    if (reduceMotion) {
      hoverProgress.value = hovered && selected ? 1 : 0;
      return;
    }
    hoverProgress.value = withTiming(hovered && selected ? 1 : 0, {
      duration: TAB_HOVER_MS,
      easing: TAB_TIMING_EASE,
    });
  }, [hovered, selected, hoverProgress, reduceMotion]);

  const handlePressIn = useCallback(() => {
    if (reduceMotion) return;
    pressedRoot.value = withTiming(1, {
      duration: duration.micro.ms,
      easing: TAB_TIMING_EASE,
    });
  }, [pressedRoot, reduceMotion]);

  const handlePressOut = useCallback(() => {
    if (reduceMotion) return;
    pressedRoot.value = withTiming(0, {
      duration: TAB_HOVER_MS,
      easing: TAB_TIMING_EASE,
    });
  }, [pressedRoot, reduceMotion]);

  const pillSurface = mode === 'light' ? palette.surfaceFloating : palette.surfaceElevated;
  const hoverWash = mode === 'light' ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.05)';

  const pillStyle = useAnimatedStyle(() => {
    const sel = selectedV.value;
    return {
      opacity: interpolate(sel, [0, 1], [0, 1]),
      transform: [{ scale: interpolate(sel, [0, 1], [0.996, 1]) }],
    };
  });

  const hoverOverlayStyle = useAnimatedStyle(() => ({
    opacity: selectedV.value * hoverProgress.value,
  }));

  const columnInteractStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(pressedRoot.value, [0, 1], [1, 0.98]) }],
    opacity: interpolate(pressedRoot.value, [0, 1], [1, 0.96]),
  }));

  const glyphStyle = useAnimatedStyle(() => ({
    opacity: interpolate(selectedV.value, [0, 1], [0.93, 1]),
  }));

  const dotStyle = useAnimatedStyle(() => ({
    opacity: interpolate(selectedV.value, [0, 0.22, 1], [0, 0, 1]),
    transform: [{ scale: interpolate(selectedV.value, [0, 1], [0.88, 1]) }],
  }));

  const showBadge = badgeCount > 0;
  const badgeLabel = badgeCount > 999 ? '999+' : String(badgeCount);
  const a11yLabel =
    showBadge && accessibilityLabel
      ? `${accessibilityLabel}, ${badgeCount} ${badgeCount === 1 ? 'pending invite' : 'pending invites'}`
      : accessibilityLabel;

  const glyphColor = selected ? activeColor : idleColor;

  return (
    <Pressable
      accessibilityLabel={a11yLabel}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      hitSlop={{ top: 8, bottom: 6, left: 4, right: 4 }}
      android_ripple={{
        color: palette.overlayMedium,
        foreground: true,
      }}
      style={styles.pressable}
    >
      <Animated.View style={[styles.column, columnInteractStyle]}>
        <Animated.View
          pointerEvents="none"
          style={[
            styles.pill,
            {
              backgroundColor: pillSurface,
              borderColor: palette.borderSubtle,
              shadowColor: palette.shadow,
              borderRadius: radius.tabBarTabPill,
            },
            pillStyle,
          ]}
        />
        <Animated.View
          pointerEvents="none"
          style={[
            styles.hoverWash,
            {
              backgroundColor: hoverWash,
              borderRadius: radius.tabBarTabPill,
            },
            hoverOverlayStyle,
          ]}
        />
        <Animated.View
          pointerEvents="none"
          style={[
            styles.pillSheen,
            {
              borderColor: palette.border,
              borderRadius: radius.tabBarTabPill,
            },
            pillStyle,
          ]}
        />
        <View
          style={[styles.stack, styles.stackPadding, selected ? styles.stackSelectedMin : null]}
        >
          <Animated.View style={[styles.glyphWrap, glyphStyle]}>
            {icon(glyphColor)}
            {showBadge ? (
              <View
                pointerEvents="none"
                style={[styles.badge, { backgroundColor: palette.accent }]}
              >
                <Text
                  style={[
                    styles.badgeText,
                    {
                      fontFamily: typography.fontFamily.mono.regular,
                      color: palette.textOnAccent,
                    },
                  ]}
                  numberOfLines={1}
                >
                  {badgeLabel}
                </Text>
              </View>
            ) : null}
          </Animated.View>
          <Text
            style={[
              styles.title,
              {
                fontFamily: selected
                  ? typography.fontFamily.sans.semiBold
                  : typography.fontFamily.sans.medium,
                color: selected ? activeColor : idleColor,
                letterSpacing: typography.letterSpacing.normal,
              },
            ]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.76}
            maxFontSizeMultiplier={1.12}
            allowFontScaling
          >
            {title}
          </Text>
          <View style={styles.dotBlock}>
            <Animated.View
              style={[
                styles.dot,
                {
                  backgroundColor: activeColor,
                },
                dotStyle,
              ]}
            />
          </View>
        </View>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 0,
    alignSelf: 'stretch',
    justifyContent: 'center',
    alignItems: 'stretch',
    minWidth: 0,
  },
  column: {
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'stretch',
    width: '100%',
    minWidth: 0,
    paddingVertical: spacing.px,
  },
  pill: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: StyleSheet.hairlineWidth,
    marginHorizontal: spacing['1'],
    marginVertical: spacing['0.5'],
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.034,
        shadowRadius: 5,
      },
      default: { elevation: 0 },
    }),
  },
  /** Hover wash — same geometry as pill; opacity animated (no padding/layout shift). */
  hoverWash: {
    ...StyleSheet.absoluteFillObject,
    marginHorizontal: spacing['1'],
    marginVertical: spacing['0.5'],
  },
  pillSheen: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: StyleSheet.hairlineWidth,
    marginHorizontal: spacing['1'],
    marginVertical: spacing['0.5'],
    opacity: 0.18,
  },
  stack: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    width: '100%',
    minHeight: spacing['10'],
  },
  /** Horizontal matches dock rail (`dockPadH` = 14px); vertical 10×8 within spec band. */
  stackPadding: {
    paddingHorizontal: QISMA_TAB_BAR_LAYOUT.dockPadH,
    paddingTop: spacing['1.5'],
    paddingBottom: spacing['1'],
    gap: spacing['1.5'],
  },
  /** Keeps short labels from collapsing the chip (72–82px band). */
  stackSelectedMin: {
    minWidth: 76,
  },
  glyphWrap: {
    width: QISMA_TAB_BAR_LAYOUT.tabGlyphSize,
    height: QISMA_TAB_BAR_LAYOUT.tabGlyphSize,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: -2,
    minWidth: spacing['5'],
    height: spacing['5'],
    paddingHorizontal: spacing['1'],
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: typography.fontSize['2xs'],
    fontWeight: typography.fontWeight.medium,
    fontVariant: ['tabular-nums'],
  },
  title: {
    fontSize: typography.fontSize.xs,
    textAlign: 'center',
    alignSelf: 'stretch',
    paddingHorizontal: 0,
  },
  /** Dot row — stack `gap` applies 6px above dot; tail padding balances dock baseline. */
  dotBlock: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: spacing['1'],
    minHeight: 4,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: radius.full,
  },
});

export const QismaSideTabButton = memo(function QismaSideTabButton(
  props: QismaSideTabButtonProps,
): ReactElement {
  return <QismaSideTabButtonInner {...props} />;
});

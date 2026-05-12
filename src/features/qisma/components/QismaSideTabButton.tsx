import { PlatformPressable } from '@react-navigation/elements';
import * as Haptics from 'expo-haptics';
import { memo, useCallback, type ReactElement } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';

import { radius, spacing, textStyles, typography, useThemeColors } from '@/theme';

export type QismaSideTabButtonProps = {
  accessibilityLabel: string;
  selected: boolean;
  onPress: () => void;
  icon: (color: string) => ReactElement;
  activeColor: string;
  idleColor: string;
  /** Kept for API compatibility with the floating tab bar; PlatformPressable uses theme ripple/opacity. */
  reduceMotion: boolean;
  /** Pending count for tab badge (e.g. invites inbox). `0` hides the badge. */
  badgeCount?: number;
};

function QismaSideTabButtonInner({
  accessibilityLabel,
  selected,
  onPress,
  icon,
  activeColor,
  idleColor,
  badgeCount = 0,
}: QismaSideTabButtonProps): ReactElement {
  const palette = useThemeColors();

  const handlePress = useCallback(() => {
    if (Platform.OS === 'ios') {
      void Haptics.selectionAsync().catch(() => {});
    } else {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    onPress();
  }, [onPress]);

  const glyphColor = selected ? activeColor : idleColor;
  const showBadge = badgeCount > 0;
  const badgeLabel = badgeCount > 999 ? '999+' : String(badgeCount);
  const a11yLabel =
    showBadge && accessibilityLabel
      ? `${accessibilityLabel}, ${badgeCount} ${badgeCount === 1 ? 'pending invite' : 'pending invites'}`
      : accessibilityLabel;

  return (
    <PlatformPressable
      accessibilityLabel={a11yLabel}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={handlePress}
      hitSlop={{ top: 10, bottom: 10, left: 12, right: 12 }}
      pressColor={palette.overlayMedium}
      pressOpacity={selected ? 0.92 : 0.88}
      hoverEffect={{ color: palette.overlay, activeOpacity: 0.92 }}
      style={{
        flex: 1,
        alignSelf: 'stretch',
        justifyContent: 'center',
        alignItems: 'center',
        minWidth: 44,
      }}
    >
      <View pointerEvents="none" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <View
          style={{
            width: spacing['7'],
            height: spacing['7'],
            alignItems: 'center',
            justifyContent: 'center',
            opacity: selected ? 1 : 0.88,
          }}
        >
          {icon(glyphColor)}
          {showBadge ? (
            <View
              pointerEvents="none"
              style={{
                position: 'absolute',
                top: 0,
                right: -2,
                minWidth: spacing['5'],
                height: spacing['5'],
                paddingHorizontal: spacing['1'],
                borderRadius: radius.full,
                backgroundColor: palette.accent,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text
                style={[
                  textStyles.labelSmall,
                  {
                    fontFamily: typography.fontFamily.mono.regular,
                    color: palette.textOnAccent,
                    fontVariant: ['tabular-nums'],
                  },
                ]}
                numberOfLines={1}
              >
                {badgeLabel}
              </Text>
            </View>
          ) : null}
        </View>
        <View
          style={{
            marginTop: spacing['2'],
            width: 22,
            height: StyleSheet.hairlineWidth,
            borderRadius: 1,
            backgroundColor: selected ? palette.textPrimary : 'transparent',
          }}
        />
      </View>
    </PlatformPressable>
  );
}

/** Home / People slots — same primitive React Navigation uses for tab buttons (Fabric-safe). */
export const QismaSideTabButton = memo(function QismaSideTabButton(
  props: QismaSideTabButtonProps,
): ReactElement {
  return <QismaSideTabButtonInner {...props} />;
});

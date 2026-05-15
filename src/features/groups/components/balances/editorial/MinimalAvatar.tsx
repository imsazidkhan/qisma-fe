import { Image } from 'expo-image';
import type { ReactElement } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { radius, typography, useThemeColors } from '@/theme';

const DEFAULT_DIAMETER = 36;
const BADGE = 18;

export type MinimalAvatarProps = {
  userId: string;
  label: string;
  avatarUrl: string | null;
  /** Single-letter badge (e.g. initial) overlaid at the bottom-right. */
  cornerGlyph?: string;
  /** Outer ring diameter — balances rows use 48 (`size.avatarLg`). */
  diameter?: number;
};

export function MinimalAvatar({
  userId,
  label,
  avatarUrl,
  cornerGlyph,
  diameter = DEFAULT_DIAMETER,
}: MinimalAvatarProps): ReactElement {
  const palette = useThemeColors();
  const initial = label.replace(/^@/, '').trim().slice(0, 1).toUpperCase() || '?';

  let h = 0;
  for (let i = 0; i < userId.length; i += 1) {
    h = (h + userId.charCodeAt(i) * (i + 1)) % 1009;
  }
  const wash = Math.abs(h) % 2 === 0 ? palette.surfaceElevated : palette.surfaceRaised;

  const glyphSize = diameter <= DEFAULT_DIAMETER ? typography.fontSize.sm : typography.fontSize.md;

  const avatarInner =
    avatarUrl && avatarUrl.trim() !== '' ? (
      <View
        style={[
          styles.ring,
          { borderColor: palette.borderSubtle, width: diameter, height: diameter },
        ]}
      >
        <Image
          source={{ uri: avatarUrl }}
          style={[
            styles.img,
            {
              backgroundColor: wash,
              width: diameter - StyleSheet.hairlineWidth * 2,
              height: diameter - StyleSheet.hairlineWidth * 2,
            },
          ]}
          contentFit="cover"
          accessibilityIgnoresInvertColors
        />
      </View>
    ) : (
      <View
        style={[
          styles.ring,
          {
            borderColor: palette.borderSubtle,
            backgroundColor: wash,
            width: diameter,
            height: diameter,
          },
        ]}
      >
        <Text
          style={[styles.glyph, { color: palette.textSecondary, fontSize: glyphSize }]}
          accessibilityElementsHidden
        >
          {initial}
        </Text>
      </View>
    );

  const badge =
    cornerGlyph != null && cornerGlyph.trim() !== '' ? (
      <View
        style={[
          styles.cornerBadge,
          {
            backgroundColor: palette.surfaceFloating,
            borderColor: palette.borderSubtle,
          },
        ]}
        accessibilityElementsHidden
      >
        <Text style={[styles.cornerGlyphText, { color: palette.textPrimary }]}>
          {cornerGlyph.trim().slice(0, 1).toUpperCase()}
        </Text>
      </View>
    ) : null;

  const pad = cornerGlyph != null && cornerGlyph.trim() !== '' ? 4 : 0;

  return (
    <View style={[styles.host, { width: diameter + pad, height: diameter + pad }]}>
      {avatarInner}
      {badge}
    </View>
  );
}

const styles = StyleSheet.create({
  host: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  cornerBadge: {
    position: 'absolute',
    right: -1,
    bottom: -1,
    width: BADGE,
    height: BADGE,
    borderRadius: radius.full,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cornerGlyphText: {
    fontFamily: typography.fontFamily.mono.medium,
    fontSize: typography.fontSize.xs,
    letterSpacing: typography.letterSpacing.tight,
  },
  ring: {
    borderRadius: radius.full,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  img: {
    borderRadius: radius.full,
  },
  glyph: {
    fontFamily: typography.fontFamily.sans.semiBold,
    letterSpacing: typography.letterSpacing.tight,
  },
});

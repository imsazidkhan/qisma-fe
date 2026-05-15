import { Image } from 'expo-image';
import type { ReactElement } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { radius, typography, useThemeColors } from '@/theme';

const SIZE = 44;

export type MemberAvatarBubbleProps = {
  userId: string;
  label: string;
  avatarUrl: string | null;
};

export function MemberAvatarBubble({
  userId,
  label,
  avatarUrl,
}: MemberAvatarBubbleProps): ReactElement {
  const palette = useThemeColors();
  const initial = label.replace(/^@/, '').trim().slice(0, 1).toUpperCase() || '?';

  let h = 0;
  for (let i = 0; i < userId.length; i += 1) {
    h = (h + userId.charCodeAt(i) * (i + 1)) % 1009;
  }
  const wash = Math.abs(h) % 2 === 0 ? palette.surfaceElevated : palette.surfaceRaised;

  if (avatarUrl && avatarUrl.trim() !== '') {
    return (
      <View style={[styles.ring, { borderColor: palette.borderSubtle }]}>
        <Image
          source={{ uri: avatarUrl }}
          style={[styles.image, { backgroundColor: wash }]}
          contentFit="cover"
          accessibilityIgnoresInvertColors
        />
      </View>
    );
  }

  return (
    <View style={[styles.ring, { borderColor: palette.borderSubtle, backgroundColor: wash }]}>
      <Text style={[styles.glyph, { color: palette.textSecondary }]} accessibilityElementsHidden>
        {initial}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  ring: {
    width: SIZE,
    height: SIZE,
    borderRadius: radius.full,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: SIZE - 2,
    height: SIZE - 2,
    borderRadius: radius.full,
  },
  glyph: {
    fontFamily: typography.fontFamily.sans.semiBold,
    fontSize: typography.fontSize.lg,
    letterSpacing: typography.letterSpacing.tight,
  },
});

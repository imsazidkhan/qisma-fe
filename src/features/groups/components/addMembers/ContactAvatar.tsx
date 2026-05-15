import type { ReactElement } from 'react';
import { Text, View } from 'react-native';

import { useThemeColors } from '@/theme';

import { addMemberContactRowStyles as styles } from '@/features/groups/components/addMembers/addMemberContactRow.styles';

type Palette = ReturnType<typeof useThemeColors>;

export type ContactAvatarProps = {
  label: string;
  backgroundColor: string;
  borderColor: string;
  textColor: string;
};

export function ContactAvatar({
  label,
  backgroundColor,
  borderColor,
  textColor,
}: ContactAvatarProps): ReactElement {
  const initial = label.replace(/^@/, '').slice(0, 1).toUpperCase();

  return (
    <View style={[styles.avatar, { borderColor, backgroundColor }]}>
      <Text style={[styles.avatarGlyph, { color: textColor }]}>{initial}</Text>
    </View>
  );
}

export function useAvatarColors(
  palette: Palette,
  id: string,
): {
  backgroundColor: string;
} {
  let h = 0;
  for (let i = 0; i < id.length; i += 1) {
    h = (h + id.charCodeAt(i) * (i + 1)) % 1009;
  }
  const backgroundColor = Math.abs(h) % 2 === 0 ? palette.surfaceElevated : palette.surfaceRaised;
  return { backgroundColor };
}

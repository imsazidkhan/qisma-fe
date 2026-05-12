import { Image } from 'expo-image';
import type { ReactElement } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { GroupMemberRosterEntry } from '@/features/groups/types/groupMember.types';
import { radius, size, spacing, typography, useThemeColors } from '@/theme';

export type PeopleFaceStackProps = {
  members: GroupMemberRosterEntry[];
  /** Max visible faces before "+N" overflow badge. */
  max?: number;
};

function faceInitials(m: GroupMemberRosterEntry): string {
  const raw = m.name?.trim() || m.username?.trim() || '';
  if (raw.length >= 2) return raw.slice(0, 2).toUpperCase();
  return m.id.slice(0, 2).toUpperCase();
}

const DISC = size.avatarSm;
const OVERLAP = spacing['3'];

export function PeopleFaceStack({ members, max = 4 }: PeopleFaceStackProps): ReactElement | null {
  const palette = useThemeColors();
  const slice = members.slice(0, max);
  const overflow = members.length - max;

  if (slice.length === 0) {
    return null;
  }

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      {slice.map((m, i) => (
        <View
          key={m.id}
          style={{
            marginLeft: i === 0 ? 0 : -OVERLAP,
            zIndex: slice.length - i,
            borderRadius: radius.full,
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: palette.borderSubtle,
            backgroundColor: palette.surfaceRaised,
            overflow: 'hidden',
            width: DISC,
            height: DISC,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {m.avatar ? (
            <Image
              source={{ uri: m.avatar }}
              style={{ width: '100%', height: '100%' }}
              contentFit="cover"
              accessibilityIgnoresInvertColors
            />
          ) : (
            <Text
              style={{
                fontFamily: typography.fontFamily.mono.medium,
                fontSize: typography.fontSize['2xs'],
                color: palette.textSecondary,
              }}
            >
              {faceInitials(m)}
            </Text>
          )}
        </View>
      ))}
      {overflow > 0 ? (
        <View
          style={{
            marginLeft: -OVERLAP,
            zIndex: 0,
            borderRadius: radius.full,
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: palette.borderSubtle,
            backgroundColor: palette.surfaceOverlay,
            width: DISC,
            height: DISC,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text
            style={{
              fontFamily: typography.fontFamily.mono.medium,
              fontSize: typography.fontSize['2xs'],
              color: palette.textSecondary,
            }}
          >
            {`+${overflow}`}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

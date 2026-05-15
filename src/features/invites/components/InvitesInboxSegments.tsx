import type { ReactElement } from 'react';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { radius, space, textStyles, useThemeColors } from '@/theme';

export type InvitesInboxTab = 'pending' | 'all';

export type InvitesInboxSegmentsProps = {
  value: InvitesInboxTab;
  onChange: (next: InvitesInboxTab) => void;
  pendingBadgeCount: number;
  pendingLabel: string;
  allLabel: string;
  accessibilityHint?: string;
};

/**
 * Two-segment control — compact, outlined, mono. **All** shares the pending feed until the API exposes history.
 */
export function InvitesInboxSegments({
  value,
  onChange,
  pendingBadgeCount,
  pendingLabel,
  allLabel,
  accessibilityHint,
}: InvitesInboxSegmentsProps): ReactElement {
  const palette = useThemeColors();

  const segments = useMemo(
    () =>
      [
        { id: 'pending' as const, label: pendingLabel, badge: pendingBadgeCount },
        { id: 'all' as const, label: allLabel, badge: 0 },
      ] as const,
    [allLabel, pendingBadgeCount, pendingLabel],
  );

  return (
    <View
      style={[
        styles.track,
        {
          borderColor: palette.borderFrost,
          backgroundColor: palette.surfaceElevated,
        },
      ]}
      accessibilityRole="tablist"
      accessibilityHint={accessibilityHint}
    >
      {segments.map((s) => {
        const selected = value === s.id;
        return (
          <Pressable
            key={s.id}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            onPress={() => onChange(s.id)}
            style={({ pressed }) => [
              styles.segment,
              {
                backgroundColor: selected ? palette.surfaceFloating : 'transparent',
                borderColor: selected ? palette.borderFrost : 'transparent',
                opacity: pressed ? 0.88 : 1,
              },
            ]}
          >
            <Text
              style={[
                textStyles.labelSmall,
                {
                  fontVariant: ['tabular-nums'],
                  color: selected ? palette.textPrimary : palette.textSecondary,
                },
              ]}
              numberOfLines={1}
            >
              {s.label}
              {s.id === 'pending' && s.badge > 0 ? ` · ${s.badge > 99 ? '99+' : s.badge}` : ''}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius['2xl'],
    padding: space.gapXs,
    gap: space.gapXs,
  },
  segment: {
    flex: 1,
    borderRadius: radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: space.gapMd,
    paddingHorizontal: space.gapSm,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
});

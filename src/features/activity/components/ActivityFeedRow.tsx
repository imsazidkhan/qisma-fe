import { Image } from 'expo-image';
import { memo, useCallback, useMemo, type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';

import { activityFeedStyles as styles } from '@/features/activity/components/activityFeed.styles';
import type { ActivityFeedItem } from '@/features/activity/types/activityFeed.types';
import { getActivityFeedItemDisplay } from '@/features/activity/utils/activityFeedItemDisplay';
import { navigateForActivityFeedItem } from '@/features/activity/utils/navigateForActivityFeedItem';
import { platformShadow, useThemeColors } from '@/theme';

export type ActivityFeedRowProps = {
  item: ActivityFeedItem;
};

function ActivityFeedRowInner({ item }: ActivityFeedRowProps): ReactElement {
  const { t } = useTranslation();
  const palette = useThemeColors();

  const nav = useCallback(() => {
    navigateForActivityFeedItem(item);
  }, [item]);

  const { kindLabel, title, meta, a11yLabel } = useMemo(
    () => getActivityFeedItemDisplay(item, t),
    [item, t],
  );

  const showAvatarImage =
    item.kind === 'invite' ? Boolean(item.avatarUrl?.trim()) : Boolean(item.avatarUrl?.trim());

  const avatarUri = item.kind === 'invite' ? item.avatarUrl?.trim() : item.avatarUrl?.trim();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={a11yLabel}
      onPress={nav}
      style={({ pressed }) => [
        styles.row,
        platformShadow('sm'),
        {
          borderColor: palette.border,
          backgroundColor: palette.surfaceElevated,
          opacity: pressed ? 0.92 : 1,
        },
      ]}
    >
      <View
        style={[
          styles.avatar,
          {
            borderColor: palette.border,
            backgroundColor: palette.surfaceRaised,
          },
        ]}
      >
        {showAvatarImage && avatarUri ? (
          <Image
            source={{ uri: avatarUri }}
            accessibilityIgnoresInvertColors
            style={{ width: '100%', height: '100%' }}
          />
        ) : (
          <Text style={[styles.avatarGlyph, { color: palette.textPrimary }]}>{item.iconEmoji}</Text>
        )}
      </View>
      <View style={styles.body}>
        <Text style={[styles.kindLabel, { color: palette.textMuted }]}>{kindLabel}</Text>
        <Text style={[styles.title, { color: palette.textPrimary }]} numberOfLines={2}>
          {title}
        </Text>
        <Text style={[styles.meta, { color: palette.textSecondary }]} numberOfLines={2}>
          {meta}
        </Text>
      </View>
    </Pressable>
  );
}

export const ActivityFeedRow = memo(ActivityFeedRowInner);

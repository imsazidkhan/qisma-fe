import type { ReactElement } from 'react';
import { useMemo } from 'react';
import { View } from 'react-native';

import { activityFeedStyles as styles } from '@/features/activity/components/activityFeed.styles';
import { space, useThemeColors } from '@/theme';

/** Placeholder blocks while invites + groups load. */
export function ActivityFeedSkeleton(): ReactElement {
  const palette = useThemeColors();
  const blocks = useMemo(() => [0, 1, 2, 3], []);

  return (
    <View style={[styles.listContent, { gap: space.gap }]}>
      {blocks.map((k) => (
        <View
          key={k}
          style={[
            styles.skeletonBlock,
            {
              borderColor: palette.borderSubtle,
              backgroundColor: palette.surfaceBase,
            },
          ]}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        />
      ))}
    </View>
  );
}

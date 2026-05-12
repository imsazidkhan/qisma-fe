import { Image } from 'expo-image';
import { memo, useCallback, type ReactElement } from 'react';
import { Pressable, Text, View } from 'react-native';

import type { GroupListItem } from '@/features/groups/types/groupsList.types';
import { homeDashboardScreenStyles as styles } from '@/features/home/components/homeDashboardScreen.styles';
import { useThemeColors } from '@/theme';

export type HomeDashboardGroupRowProps = {
  group: GroupListItem;
  balanceLine: string;
  balanceColor: string;
  accessibilityHint: string;
  onPress: (groupId: string) => void;
};

function HomeDashboardGroupRowInner({
  group,
  balanceLine,
  balanceColor,
  accessibilityHint,
  onPress,
}: HomeDashboardGroupRowProps): ReactElement {
  const palette = useThemeColors();

  const handlePress = useCallback(() => {
    onPress(group.id);
  }, [group.id, onPress]);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${group.name}. ${balanceLine}`}
      accessibilityHint={accessibilityHint}
      onPress={handlePress}
      style={[
        styles.groupRow,
        {
          borderColor: palette.borderSubtle,
          backgroundColor: palette.surfaceElevated,
        },
      ]}
    >
      <View
        style={[
          styles.groupLeadMedia,
          { borderColor: palette.borderSubtle, backgroundColor: palette.surfaceBase },
        ]}
      >
        {group.avatarUrl ? (
          <Image
            source={{ uri: group.avatarUrl }}
            style={styles.groupAvatarImage}
            contentFit="cover"
            accessibilityIgnoresInvertColors
          />
        ) : (
          <Text style={styles.groupEmoji} accessibilityElementsHidden>
            {group.iconEmoji}
          </Text>
        )}
      </View>
      <View style={styles.groupBody}>
        <Text style={[styles.groupName, { color: palette.textPrimary }]} numberOfLines={1}>
          {group.name}
        </Text>
        <Text style={[styles.groupBalance, { color: balanceColor }]} numberOfLines={2}>
          {balanceLine}
        </Text>
      </View>
    </Pressable>
  );
}

export const HomeDashboardGroupRow = memo(HomeDashboardGroupRowInner);

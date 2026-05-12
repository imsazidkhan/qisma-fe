import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useCallback, type ReactElement } from 'react';
import { Pressable, Text, View } from 'react-native';

import { groupExpenseFeedRowStyles as styles } from '@/features/expenses/components/groupExpenseFeedRow.styles';
import type { GroupExpenseFeedItem } from '@/features/expenses/types/groupExpenseFeed.types';
import { getGroupExpenseFeedSplitLabel } from '@/features/expenses/utils/groupExpenseFeedSplitLabel';
import { taxonomyLabelFromExpenseFeedItem } from '@/features/expenses/utils/readExpenseStructuredWire';
import { formatExpenseMajorAmount } from '@/features/expenses/utils/formatExpenseMajorAmount';
import { pickExpenseFeedTitleEmoji } from '@/features/expenses/utils/pickExpenseFeedTitleEmoji';
import { formatGroupActivityTime } from '@/features/groups/utils/formatGroupTimestamp';
import { platformShadow, useThemeColors } from '@/theme';
import type { TFunction } from 'i18next';

export type GroupExpenseFeedRowProps = {
  groupId: string;
  item: GroupExpenseFeedItem;
  t: TFunction;
};

export function GroupExpenseFeedRow({ groupId, item, t }: GroupExpenseFeedRowProps): ReactElement {
  const palette = useThemeColors();
  const amountLabel = formatExpenseMajorAmount(item.amount, item.currency);
  const clock = formatGroupActivityTime(item.createdAt, t);
  const titleEmoji = pickExpenseFeedTitleEmoji(item.title);
  const splitLabel = getGroupExpenseFeedSplitLabel(item, t);
  const taxonomyLine = taxonomyLabelFromExpenseFeedItem(item);

  const onPress = useCallback(() => {
    void Haptics.selectionAsync().catch(() => {});
    router.push(
      `/home/group/${encodeURIComponent(groupId)}/expense/${encodeURIComponent(item.id)}`,
    );
  }, [groupId, item.id]);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('groups.detail.expenseRowOpenA11y', { title: item.title })}
      accessibilityHint={t('groups.detail.expenseRowOpenHint')}
      onPress={onPress}
      style={({ pressed }) => [{ opacity: pressed ? 0.92 : 1 }]}
    >
      <View
        style={[
          styles.card,
          platformShadow('sm'),
          {
            borderColor: palette.groupHubBorder,
            backgroundColor: palette.groupHubCard,
          },
        ]}
      >
        <View style={styles.topRow}>
          <View style={styles.titleBlock}>
            <View style={styles.titleRow}>
              <Text
                style={styles.titleEmoji}
                accessibilityElementsHidden
                importantForAccessibility="no"
              >
                {titleEmoji}
              </Text>
              <Text
                style={[styles.titleText, { color: palette.textPrimary }]}
                numberOfLines={2}
                accessibilityRole="header"
              >
                {item.title}
              </Text>
            </View>
          </View>
          <Text style={[styles.amount, { color: palette.textPrimary }]}>{amountLabel}</Text>
        </View>
        <Text style={[styles.metaLine, { color: palette.textMuted }]}>{splitLabel}</Text>
        {taxonomyLine ? (
          <Text style={[styles.metaLine, { color: palette.textSecondary }]} numberOfLines={1}>
            {taxonomyLine}
          </Text>
        ) : null}
        <Text style={[styles.clock, { color: palette.groupHubMuted }]}>{clock}</Text>
      </View>
    </Pressable>
  );
}

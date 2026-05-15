import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { memo, useCallback, useMemo, type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Platform, Pressable, Text, View } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';

import { hrefGroupAddExpense, hrefGroupAddMembers, hrefGroupBalances } from '@/constants/routes';
import { GROUP_TYPE_GLYPH, type GroupTypeId } from '@/features/groups/constants/groupTypes';
import { groupListCardStyles as styles } from '@/features/groups/components/groupListCard.styles';
import type { GroupListItem } from '@/features/groups/types/groupsList.types';
import { formatGroupLastActivityRelative } from '@/features/groups/utils/formatGroupLastActivityRelative';
import { formatMinorAsCurrency } from '@/features/groups/utils/formatMinorAsCurrency';
import { radius, typography } from '@/theme';
import { useThemeColors, useThemeMode } from '@/theme/ThemeProvider';

export type GroupListCardProps = {
  item: GroupListItem;
  onPress?: () => void;
};

const GLYPH_SZ = 20;

function GroupListCardInner({ item, onPress }: GroupListCardProps): ReactElement {
  const { t } = useTranslation();
  const palette = useThemeColors();
  const mode = useThemeMode();
  const reduceMotion = useReducedMotion();

  const typeId: GroupTypeId = item.groupType ?? 'other';

  const typeLabel = useMemo(() => {
    const key = `createGroup.types.${typeId}`;
    const tr = t(key);
    return tr !== key ? tr : typeId;
  }, [t, typeId]);

  const peopleMeta = useMemo(() => {
    if (typeof item.expenseCount === 'number') {
      return t('groups.financialCard.crewMetaWithExpenses', {
        type: typeLabel,
        members: item.memberCount,
        expenses: item.expenseCount,
      });
    }
    return t('groups.financialCard.crewPeopleMeta', { type: typeLabel, count: item.memberCount });
  }, [item.expenseCount, item.memberCount, t, typeLabel]);

  const activityIso = item.lastActivityAt?.trim();
  const activityLine = useMemo(() => {
    const preview = item.lastActivityPreview?.trim();
    if (preview) {
      return preview;
    }
    if (!activityIso) {
      return t('groups.financialCard.lastActivityUnknown');
    }
    const relative = formatGroupLastActivityRelative(activityIso, t);
    return t('groups.financialCard.lastActivityHuman', { relative });
  }, [activityIso, item.lastActivityPreview, t]);

  const { tone, amountMinor, currency } = item.balance;
  const amountFormatted = useMemo(
    () => formatMinorAsCurrency(amountMinor, currency),
    [amountMinor, currency],
  );

  const middlePrimary = useMemo(() => {
    if (tone === 'settled') {
      return t('groups.financialCard.middleSettled');
    }
    if (tone === 'you_owe') {
      return t('groups.financialCard.middleYouOwe');
    }
    return t('groups.financialCard.middleOwedToYou');
  }, [t, tone]);

  const membersFooter = useMemo(
    () => t('groups.members', { count: item.memberCount }),
    [item.memberCount, t],
  );

  const showMiddle = tone !== 'settled';
  const leadWash = mode === 'light' ? 'rgba(0,0,0,0.03)' : palette.overlayStrong;
  const glyphName = GROUP_TYPE_GLYPH[typeId];

  const a11yLabel = useMemo(() => {
    const bits = [item.name, peopleMeta, activityLine, membersFooter].filter((s) => s.length > 0);
    return bits.join('. ');
  }, [activityLine, item.name, membersFooter, peopleMeta]);

  const openQuickActions = useCallback(() => {
    if (Platform.OS === 'ios') {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    } else {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    }

    const gid = item.id;
    Alert.alert(
      item.name,
      undefined,
      [
        {
          text: t('groups.quickActions.addExpense'),
          onPress: () => router.push(hrefGroupAddExpense(gid)),
        },
        {
          text: t('groups.quickActions.settleUp'),
          onPress: () => router.push(hrefGroupBalances(gid)),
        },
        {
          text: t('groups.quickActions.inviteMembers'),
          onPress: () => router.push(hrefGroupAddMembers(gid)),
        },
        { text: t('common.cancel'), style: 'cancel' },
      ],
      { cancelable: true },
    );
  }, [item.id, item.name, t]);

  const chipNode = useMemo(() => {
    if (tone === 'settled') {
      return (
        <View
          style={[
            styles.statusPill,
            {
              backgroundColor: palette.successSubtle,
              borderWidth: 0,
            },
          ]}
        >
          <View style={styles.statusPillRow}>
            <Ionicons name="checkmark-circle-outline" size={14} color={palette.successText} />
            <Text
              style={[styles.statusPillLabel, { color: palette.successText }]}
              numberOfLines={1}
            >
              {t('groups.financialCard.settledChip')}
            </Text>
          </View>
        </View>
      );
    }

    if (tone === 'you_owe') {
      return (
        <View
          style={[
            styles.statusPill,
            {
              backgroundColor: palette.warningSubtle,
              borderWidth: 0,
            },
          ]}
        >
          <Text style={[styles.statusPillLabel, { color: palette.warningText }]} numberOfLines={1}>
            {t('groups.financialCard.chipYouOwe')}
          </Text>
          <Text style={[styles.statusPillAmount, { color: palette.warningText }]} numberOfLines={1}>
            {amountFormatted}
          </Text>
        </View>
      );
    }

    return (
      <View
        style={[
          styles.statusPill,
          {
            backgroundColor: palette.errorSubtle,
            borderWidth: 0,
          },
        ]}
      >
        <Text style={[styles.statusPillLabel, { color: palette.errorText }]} numberOfLines={1}>
          {t('groups.financialCard.chipOweToYou')}
        </Text>
        <Text style={[styles.statusPillAmount, { color: palette.errorText }]} numberOfLines={1}>
          {amountFormatted}
        </Text>
      </View>
    );
  }, [amountFormatted, palette, t, tone]);

  const inner = (
    <View
      style={[
        styles.card,
        {
          borderColor: palette.borderSubtle,
          borderLeftWidth: 2,
          borderLeftColor: palette.borderStrong,
          backgroundColor: palette.surfaceBase,
        },
      ]}
    >
      <View style={styles.topRow}>
        <View style={styles.identityCluster}>
          <View style={[styles.lead, { backgroundColor: leadWash }]}>
            {item.avatarUrl ? (
              <Image
                source={{ uri: item.avatarUrl }}
                style={styles.leadImage}
                contentFit="cover"
                accessibilityIgnoresInvertColors
              />
            ) : (
              <Ionicons name={glyphName} size={GLYPH_SZ} color={palette.textSecondary} />
            )}
          </View>
          <View style={styles.identityTextColumn}>
            <Text style={[styles.groupName, { color: palette.textPrimary }]} numberOfLines={2}>
              {item.name}
            </Text>
            <Text style={[styles.metaLine, { color: palette.textSecondary }]} numberOfLines={2}>
              {peopleMeta}
            </Text>
            {item.recentExpenseTitle ? (
              <Text
                style={[styles.recentExpenseLine, { color: palette.textMuted }]}
                numberOfLines={2}
              >
                {item.recentExpenseTitle}
              </Text>
            ) : null}
          </View>
        </View>
        {chipNode}
      </View>

      {showMiddle ? (
        <View style={styles.middleBlock}>
          <Text style={[styles.middlePrimary, { color: palette.textSecondary }]} numberOfLines={2}>
            {middlePrimary}
          </Text>
        </View>
      ) : null}

      <View style={styles.footerMetaRow}>
        <Ionicons name="time-outline" size={typography.fontSize['2xs']} color={palette.textMuted} />
        <Text style={[styles.footerMetaText, { color: palette.textMuted }]} numberOfLines={1}>
          {activityLine}
        </Text>
        <View style={[styles.footerMetaSep, { backgroundColor: palette.borderSubtle }]} />
        <Ionicons
          name="people-outline"
          size={typography.fontSize['2xs']}
          color={palette.textMuted}
        />
        <Text style={[styles.footerMetaText, { color: palette.textMuted }]} numberOfLines={1}>
          {membersFooter}
        </Text>
        {item.pendingSettlementCount != null && item.pendingSettlementCount > 0 ? (
          <>
            <View style={[styles.footerMetaSep, { backgroundColor: palette.borderSubtle }]} />
            <Text style={[styles.footerMetaText, { color: palette.textMuted }]} numberOfLines={1}>
              {t('groups.financialCard.pendingSettlements', { count: item.pendingSettlementCount })}
            </Text>
          </>
        ) : null}
      </View>
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={a11yLabel}
        accessibilityHint={t('groups.financialCard.pressHint')}
        onPress={onPress}
        onLongPress={openQuickActions}
        delayLongPress={380}
        android_ripple={{ color: palette.overlayMedium, foreground: false }}
        style={({ pressed }) => [
          { borderRadius: radius.groupsCard, overflow: 'hidden' },
          {
            opacity: pressed ? 0.97 : 1,
            transform: [{ scale: pressed && !reduceMotion ? 0.996 : 1 }],
          },
        ]}
      >
        {inner}
      </Pressable>
    );
  }

  return inner;
}

export const GroupListCard = memo(GroupListCardInner);

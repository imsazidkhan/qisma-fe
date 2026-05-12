import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { memo, useCallback, useMemo, type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Platform, Pressable, Text, View } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';

import { hrefGroupAddExpense, hrefGroupAddMembers, hrefGroupBalances } from '@/constants/routes';
import { groupListCardStyles as styles } from '@/features/groups/components/groupListCard.styles';
import type { GroupListItem } from '@/features/groups/types/groupsList.types';
import { formatGroupLastActivityRelative } from '@/features/groups/utils/formatGroupLastActivityRelative';
import { formatMinorAsCurrency } from '@/features/groups/utils/formatMinorAsCurrency';
import { radius, useThemeColors } from '@/theme';

export type GroupListCardProps = {
  item: GroupListItem;
  onPress?: () => void;
};

function GroupListCardInner({ item, onPress }: GroupListCardProps): ReactElement {
  const { t } = useTranslation();
  const palette = useThemeColors();
  const reduceMotion = useReducedMotion();

  const typeLabel = useMemo(() => {
    const id = item.groupType;
    if (!id) return t('createGroup.types.other');
    const key = `createGroup.types.${id}`;
    const tr = t(key);
    return tr !== key ? tr : id;
  }, [item.groupType, t]);

  const crewMeta = useMemo(
    () => t('groups.financialCard.crewMeta', { type: typeLabel.toUpperCase() }),
    [t, typeLabel],
  );

  const activityIso = item.lastActivityAt?.trim();
  const activityLine = useMemo(() => {
    if (!activityIso) {
      return t('groups.financialCard.lastActivityUnknown');
    }
    const relative = formatGroupLastActivityRelative(activityIso, t);
    return t('groups.financialCard.lastActivityHuman', { relative });
  }, [activityIso, t]);

  const financeLine = useMemo(() => {
    const { tone, amountMinor, currency } = item.balance;
    if (tone === 'settled') {
      return t('groups.financialCard.financeLineSettled');
    }
    const amt = formatMinorAsCurrency(amountMinor, currency);
    if (tone === 'owed_to_you') {
      return t('groups.financialCard.financeLineYouGetBack', { amount: amt });
    }
    return t('groups.financialCard.financeLineYouOwe', { amount: amt });
  }, [item.balance, t]);

  const financeTone = item.balance.tone;

  const financeColor = useMemo(() => {
    switch (financeTone) {
      case 'owed_to_you':
        return palette.successText;
      case 'you_owe':
        return palette.errorText;
      default:
        return palette.textSecondary;
    }
  }, [financeTone, palette.errorText, palette.successText, palette.textSecondary]);

  const a11yLabel = useMemo(() => {
    const bits = [item.name, crewMeta, financeLine, activityLine].filter((s) => s.length > 0);
    return bits.join('. ');
  }, [activityLine, crewMeta, financeLine, item.name]);

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

  const inner = (
    <View
      style={[
        styles.card,
        {
          borderColor: palette.borderSubtle,
          backgroundColor: palette.surfaceBase,
        },
      ]}
    >
      <View style={styles.identityRow}>
        <View
          style={[
            styles.lead,
            { borderColor: palette.borderSubtle, backgroundColor: palette.surfaceElevated },
          ]}
        >
          {item.avatarUrl ? (
            <Image
              source={{ uri: item.avatarUrl }}
              style={styles.leadImage}
              contentFit="cover"
              accessibilityIgnoresInvertColors
            />
          ) : (
            <Text
              style={[styles.glyph, { color: palette.textPrimary }]}
              accessibilityElementsHidden
            >
              {item.iconEmoji}
            </Text>
          )}
        </View>
        <View style={styles.identityTextColumn}>
          <Text style={[styles.groupName, { color: palette.textPrimary }]} numberOfLines={2}>
            {item.name}
          </Text>
          <Text style={[styles.metaCaps, { color: palette.textSecondary }]} numberOfLines={2}>
            {crewMeta}
          </Text>
        </View>
      </View>

      <View style={styles.ledgerCluster}>
        <Text style={[styles.financeStatus, { color: financeColor }]} numberOfLines={3}>
          {financeLine}
        </Text>
        <Text style={[styles.activityLine, { color: palette.textSecondary }]} numberOfLines={2}>
          {activityLine}
        </Text>
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
          { borderRadius: radius.xs, overflow: 'hidden' },
          {
            opacity: pressed ? 0.97 : 1,
            transform: [{ scale: pressed && !reduceMotion ? 0.993 : 1 }],
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

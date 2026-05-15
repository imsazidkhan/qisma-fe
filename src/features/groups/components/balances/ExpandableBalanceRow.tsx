import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import type { ReactElement } from 'react';
import { memo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { BalanceStatusChip } from '@/features/groups/components/balances/BalanceStatusChip';
import { FrostedBalanceSurface } from '@/features/groups/components/balances/FrostedBalanceSurface';
import { MemberAvatarBubble } from '@/features/groups/components/balances/MemberAvatarBubble';
import { SharedExpenseMeta } from '@/features/groups/components/balances/SharedExpenseMeta';
import type { GroupBalancesViewerEdge } from '@/features/groups/types/groupBalancesViewer.types';
import { formatMinorAsCurrencyCompact } from '@/features/groups/utils/formatMinorAsCurrency';
import { duration, radius, space, textStyles, typography, useThemeColors } from '@/theme';

function edgeDisplayName(edge: GroupBalancesViewerEdge): string {
  const u = edge.user.username?.trim();
  if (u) {
    return u.startsWith('@') ? u : `@${u}`;
  }
  const n = edge.user.name?.trim();
  return n.length > 0 ? n : '?';
}

export type ExpandableBalanceRowProps = {
  edge: GroupBalancesViewerEdge;
  currency: string;
  expanded: boolean;
  snapshotRelativeLabel: string;
  onToggleExpand: () => void;
  onSettle: () => void;
  onViewActivity: () => void;
  onRemind: () => void;
  onAddExpense: () => void;
};

export const ExpandableBalanceRow = memo(function ExpandableBalanceRowInner({
  edge,
  currency,
  expanded,
  snapshotRelativeLabel,
  onToggleExpand,
  onSettle,
  onViewActivity,
  onRemind,
  onAddExpense,
}: ExpandableBalanceRowProps): ReactElement {
  const palette = useThemeColors();
  const { t } = useTranslation();
  const name = edgeDisplayName(edge);
  const oweThem = edge.type === 'owe';
  const chipTone = oweThem ? 'owe' : 'owed';
  const chipLabel = oweThem
    ? t('groups.detail.balanceChipYouOwe')
    : t('groups.detail.balanceChipOwesYou');
  const amountStr = formatMinorAsCurrencyCompact(edge.amount, currency);
  const amountColor = oweThem ? palette.errorText : palette.successText;

  const secondaryMeta =
    edge.displayText.trim().length > 0 && edge.displayText !== amountStr
      ? edge.displayText
      : undefined;

  const primaryMeta = t('groups.detail.balanceRowSnapshotRef', { when: snapshotRelativeLabel });

  const a11y = t('groups.detail.balanceScreenRowA11y', {
    name,
    amount: `${chipLabel} ${amountStr}`,
  });

  const fireHaptic = useCallback(() => {
    void Haptics.selectionAsync().catch(() => {});
  }, []);

  return (
    <FrostedBalanceSurface dotTexture={false} style={styles.card}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={a11y}
        accessibilityState={{ expanded }}
        onPress={() => {
          fireHaptic();
          onToggleExpand();
        }}
        style={({ pressed }) => [styles.headerPress, { opacity: pressed ? 0.92 : 1 }]}
      >
        <MemberAvatarBubble userId={edge.user.id} label={name} avatarUrl={edge.user.avatarUrl} />

        <View style={styles.mid}>
          <View style={styles.topLine}>
            <View style={styles.identity}>
              <Text style={[styles.name, { color: palette.textPrimary }]} numberOfLines={1}>
                {name}
              </Text>
              <BalanceStatusChip tone={chipTone} label={chipLabel} />
            </View>
            <View style={styles.amountCluster}>
              <Text style={[styles.amount, { color: amountColor }]} numberOfLines={1}>
                {amountStr}
              </Text>
              <Ionicons
                name={expanded ? 'chevron-up' : 'chevron-down'}
                size={18}
                color={palette.iconMuted}
              />
            </View>
          </View>
          <SharedExpenseMeta dense primary={primaryMeta} secondary={secondaryMeta} />
        </View>
      </Pressable>

      {expanded ? (
        <Animated.View
          entering={FadeIn.duration(duration.normal.ms)}
          exiting={FadeOut.duration(duration.fast.ms)}
        >
          <View style={[styles.expanded, { borderTopColor: palette.borderSubtle }]}>
            <Text style={[styles.expandedKicker, { color: palette.textMuted }]}>
              {t('groups.detail.balanceRowDetailKicker')}
            </Text>
            <Text style={[styles.detailBody, { color: palette.textSecondary }]} numberOfLines={4}>
              {edge.displayText.trim().length > 0
                ? edge.displayText
                : t('groups.detail.balanceRowDetailFallback')}
            </Text>

            <View style={styles.actions}>
              <MiniAction
                label={t('groups.detail.balanceRowActionSettle')}
                onPress={() => {
                  fireHaptic();
                  onSettle();
                }}
              />
              <MiniAction
                label={t('groups.detail.balanceRowActionActivity')}
                onPress={() => {
                  fireHaptic();
                  onViewActivity();
                }}
              />
              <MiniAction
                label={t('groups.detail.balanceRowActionRemind')}
                onPress={() => {
                  fireHaptic();
                  onRemind();
                }}
              />
              <MiniAction
                label={t('groups.detail.balanceRowActionExpense')}
                onPress={() => {
                  fireHaptic();
                  onAddExpense();
                }}
              />
            </View>
          </View>
        </Animated.View>
      ) : null}
    </FrostedBalanceSurface>
  );
});

function MiniAction({ label, onPress }: { label: string; onPress: () => void }): ReactElement {
  const palette = useThemeColors();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [
        styles.mini,
        {
          opacity: pressed ? 0.82 : 1,
          borderColor: palette.border,
          backgroundColor: palette.overlay,
        },
      ]}
    >
      <Text style={[styles.miniLabel, { color: palette.textSecondary }]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: space.gapSm,
  },
  headerPress: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space.gapMd,
    paddingVertical: space.gapSm + space.gapXs,
    paddingHorizontal: space.gapMd,
    minHeight: 72,
  },
  mid: {
    flex: 1,
    minWidth: 0,
    gap: space.gapXs / 2,
  },
  topLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.gapMd,
    alignSelf: 'stretch',
  },
  identity: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: space.gapSm,
    minWidth: 0,
  },
  amountCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.gapXs,
    flexShrink: 0,
    paddingLeft: space.gapXs,
  },
  name: {
    ...textStyles.body,
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.sans.semiBold,
    flexShrink: 1,
    maxWidth: '100%',
  },
  amount: {
    ...textStyles.numeric,
    fontSize: typography.fontSize.xl,
    fontFamily: typography.fontFamily.mono.medium,
    letterSpacing: typography.letterSpacing.tight,
    fontVariant: ['tabular-nums'],
  },
  expanded: {
    paddingHorizontal: space.gapMd,
    paddingBottom: space.gapMd,
    paddingTop: space.gapSm,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: space.gapSm,
  },
  expandedKicker: {
    ...textStyles.overline,
    fontFamily: typography.fontFamily.mono.medium,
    fontSize: typography.fontSize.xs,
    letterSpacing: typography.letterSpacing.widest,
  },
  detailBody: {
    ...textStyles.body,
    fontSize: typography.fontSize.sm,
    lineHeight: typography.fontSize.sm * typography.lineHeight.relaxed,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.gapSm,
    marginTop: space.gapXs,
  },
  mini: {
    paddingVertical: space.gapSm,
    paddingHorizontal: space.gapMd,
    borderRadius: radius.sm,
    borderWidth: StyleSheet.hairlineWidth,
  },
  miniLabel: {
    ...textStyles.captionSmall,
    fontFamily: typography.fontFamily.mono.medium,
    fontSize: typography.fontSize.xs,
    letterSpacing: typography.letterSpacing.wide,
    textTransform: 'uppercase',
  },
});

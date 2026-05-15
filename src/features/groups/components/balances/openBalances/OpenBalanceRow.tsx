import * as Haptics from 'expo-haptics';
import type { ReactElement } from 'react';
import { memo, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AmountIndicator } from '@/features/groups/components/balances/openBalances/AmountIndicator';
import {
  BalanceStatusLabel,
  type BalanceRelationshipPolarity,
} from '@/features/groups/components/balances/openBalances/BalanceStatusLabel';
import { ExpandableBalanceDetails } from '@/features/groups/components/balances/openBalances/ExpandableBalanceDetails';
import { RelationshipMeta } from '@/features/groups/components/balances/openBalances/RelationshipMeta';
import { SoftDivider } from '@/features/groups/components/balances/openBalances/SoftDivider';
import { MinimalAvatar } from '@/features/groups/components/balances/editorial/MinimalAvatar';
import type { GroupBalancesViewerEdge } from '@/features/groups/types/groupBalancesViewer.types';
import { formatMinorAsCurrencyCompact } from '@/features/groups/utils/formatMinorAsCurrency';
import { formatBalanceRelativeShort } from '@/features/groups/utils/formatBalanceRelativeShort';
import { parseExpenseCountFromBalanceDisplayText } from '@/features/groups/utils/parseExpenseCountFromBalanceDisplayText';
import { size, space, textStyles, typography, useThemeColors } from '@/theme';

const SNIPPET_MAX = 56;
/** Grid: avatar column matches Nothing balances spec (`size.avatarLg`). */
const AVATAR_COL = size.avatarLg;
/** Fixed rail — tabular amounts + status align to one vertical axis. */
const AMOUNT_RAIL_W = 118;

function firstDisplaySnippet(displayText: string): string {
  const raw = displayText.trim();
  if (raw.length === 0) {
    return '';
  }
  const line = raw.split(/\r?\n/)[0]?.trim() ?? '';
  if (line.length < 4) {
    return '';
  }
  if (/^\d+\s*expenses?\b/i.test(line)) {
    return '';
  }
  return line.length > SNIPPET_MAX ? `${line.slice(0, SNIPPET_MAX - 1)}…` : line;
}

function edgeDisplayName(edge: GroupBalancesViewerEdge): string {
  const u = edge.user.username?.trim();
  if (u) {
    return u.replace(/^@/, '');
  }
  const n = edge.user.name?.trim();
  return n.length > 0 ? n : '?';
}

export type OpenBalanceRowProps = {
  edge: GroupBalancesViewerEdge;
  currency: string;
  expanded: boolean;
  snapshotIso: string;
  showSeparator: boolean;
  onToggleExpand: () => void;
  onSettle: () => void;
  onViewActivity: () => void;
  onAddExpense: () => void;
};

export const OpenBalanceRow = memo(function OpenBalanceRowInner({
  edge,
  currency,
  expanded,
  snapshotIso,
  showSeparator,
  onToggleExpand,
  onSettle,
  onViewActivity,
  onAddExpense,
}: OpenBalanceRowProps): ReactElement {
  const palette = useThemeColors();
  const { t } = useTranslation();
  const name = edgeDisplayName(edge);
  const oweThem = edge.type === 'owe';
  const polarity: BalanceRelationshipPolarity = oweThem ? 'owe' : 'owed';
  const amountStr = formatMinorAsCurrencyCompact(edge.amount, currency);

  const whenShort = useMemo(() => formatBalanceRelativeShort(snapshotIso, t), [snapshotIso, t]);

  const metaLine = useMemo(() => {
    const expenseCount = parseExpenseCountFromBalanceDisplayText(edge.displayText);
    if (expenseCount !== undefined && expenseCount >= 1) {
      return t('groups.detail.balanceRowExpenseMetaUpdated', {
        count: expenseCount,
        when: whenShort,
      });
    }
    const snippet = firstDisplaySnippet(edge.displayText);
    if (snippet.length > 0) {
      return t('groups.detail.balanceOpenMetaSnippetWhen', { snippet, when: whenShort });
    }
    return t('groups.detail.balanceOpenMetaFallback', { when: whenShort });
  }, [edge.displayText, t, whenShort]);

  const statusLabel = oweThem
    ? t('groups.detail.balanceOpenStatusYouOwe')
    : t('groups.detail.balanceOpenStatusOwesYou');

  const directionLine = oweThem
    ? t('groups.detail.balanceEditorialYouOweLine', { amount: amountStr })
    : t('groups.detail.balanceEditorialOwesYouLine', { amount: amountStr });

  const a11y = t('groups.detail.balanceScreenRowA11yOpen', {
    name,
    amount: amountStr,
    relationship: statusLabel,
    meta: metaLine,
  });

  const fireHaptic = useCallback(() => {
    void Haptics.selectionAsync().catch(() => {});
  }, []);

  const insetLeft = AVATAR_COL + space.gap;

  return (
    <View style={styles.cell}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={a11y}
        accessibilityHint={
          expanded
            ? t('groups.detail.balanceOpenRowCollapseA11y')
            : t('groups.detail.balanceOpenRowExpandA11y')
        }
        accessibilityState={{ expanded }}
        onPress={() => {
          fireHaptic();
          onToggleExpand();
        }}
        style={({ pressed }) => [styles.hit, { opacity: pressed ? 0.92 : 1 }]}
      >
        <View style={styles.row}>
          <View style={styles.avatarTrack}>
            <MinimalAvatar
              userId={edge.user.id}
              label={edge.user.username?.trim() || edge.user.name || '?'}
              avatarUrl={edge.user.avatarUrl}
              diameter={AVATAR_COL}
            />
          </View>

          <View style={styles.center}>
            <Text style={[styles.name, { color: palette.textPrimary }]} numberOfLines={1}>
              {name}
            </Text>
            <RelationshipMeta text={metaLine} dense />
          </View>

          <View style={styles.rail}>
            <AmountIndicator amountText={amountStr} align="end" />
            <BalanceStatusLabel polarity={polarity} label={statusLabel} dense trailing />
          </View>
        </View>
      </Pressable>

      {expanded ? (
        <ExpandableBalanceDetails
          counterpartyName={name}
          directionLine={directionLine}
          displayText={edge.displayText}
          hintLeadLabel={t('groups.detail.balanceOpenRecentLabel')}
          settleLabel={t('groups.detail.balanceRowActionSettle')}
          settleA11y={t('groups.detail.balanceRowActionSettle')}
          activityLabel={t('groups.detail.balanceRowActionActivity')}
          expenseLabel={t('groups.detail.balanceRowActionExpense')}
          insetLeft={insetLeft}
          onSettle={onSettle}
          onActivity={onViewActivity}
          onExpense={onAddExpense}
        />
      ) : null}

      {showSeparator ? <SoftDivider insetLeft={insetLeft} /> : null}
    </View>
  );
});

const styles = StyleSheet.create({
  cell: {
    alignSelf: 'stretch',
  },
  hit: {
    alignSelf: 'stretch',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.gap,
    paddingVertical: space.gapMd,
    minHeight: size.avatarLg + space.gapMd,
  },
  avatarTrack: {
    width: AVATAR_COL,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    flex: 1,
    minWidth: 0,
    gap: space.paddingXs,
    justifyContent: 'center',
  },
  rail: {
    width: AMOUNT_RAIL_W,
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: space.paddingXs,
  },
  name: {
    ...textStyles.body,
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.sans.medium,
    letterSpacing: typography.letterSpacing.tight,
  },
});

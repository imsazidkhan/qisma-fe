import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import type { TFunction } from 'i18next';
import { useCallback, useEffect, useMemo, useState, type ReactElement } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { CategoryIconBubble } from '@/features/expenses/components/feedCard/CategoryIconBubble';
import { ExpenseFeedMetaPill } from '@/features/expenses/components/feedCard/ExpenseFeedMetaPill';
import { expenseFeedCardStyles as styles } from '@/features/expenses/components/feedCard/expenseFeedCard.styles';
import { FrostedExpenseSurface } from '@/features/expenses/components/feedCard/FrostedExpenseSurface';
import { MemberAvatarStack } from '@/features/expenses/components/feedCard/MemberAvatarStack';
import type { GroupExpenseFeedItem } from '@/features/expenses/types/groupExpenseFeed.types';
import {
  buildExpenseFeedPayerPhrase,
  buildExpenseFeedSplitPhrase,
  formatExpenseFeedFooterInstant,
  readExpenseFeedPaidByDisplayName,
  readExpenseFeedParticipantCount,
  readExpenseFeedParticipantFaces,
  readExpenseFeedPaidByUserId,
} from '@/features/expenses/utils/expenseFeedRowFormat';
import { resolveExpenseFeedViewerImpactChip } from '@/features/expenses/utils/expenseFeedViewerImpact';
import { formatExpenseMajorAmount } from '@/features/expenses/utils/formatExpenseMajorAmount';
import { expenseFeedCardMetaCategoryLabel } from '@/features/expenses/utils/readExpenseStructuredWire';
import { resolveExpenseFeedCategoryVisual } from '@/features/expenses/utils/resolveExpenseFeedCategoryVisual';
import { duration, easing, radius, spacing, typography, useThemeColors } from '@/theme';
import { Ionicons } from '@expo/vector-icons';

export type ExpenseCardProps = {
  groupId: string;
  item: GroupExpenseFeedItem;
  t: TFunction;
  currentUserId?: string | null;
  payerDisplayName?: string | null;
  /** Group roster avatar when list rows omit `paidBy` / participant previews. */
  payerAvatarUrl?: string | null;
};

export function ExpenseCard({
  groupId,
  item,
  t,
  currentUserId,
  payerDisplayName,
  payerAvatarUrl,
}: ExpenseCardProps): ReactElement {
  const palette = useThemeColors();
  const reduceMotion = useReducedMotion();
  const scale = useSharedValue(1);
  const hoverLift = useSharedValue(0);
  const [hovered, setHovered] = useState(false);

  const animatedCard = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(hoverLift.value, [0, 1], [0, -1]) },
      { scale: scale.value },
    ],
  }));

  const avatarAmbientStyle = useAnimatedStyle(
    () => ({
      transform: [
        {
          scale: reduceMotion ? 1 : interpolate(hoverLift.value, [0, 1], [1, 1.02]),
        },
      ],
    }),
    [reduceMotion],
  );

  useEffect(() => {
    if (reduceMotion) {
      hoverLift.value = 0;
      return;
    }
    hoverLift.value = withTiming(hovered ? 1 : 0, {
      duration: duration.feedCardHover.ms,
      easing: easing.standard.rn,
    });
  }, [hovered, hoverLift, reduceMotion]);

  const categoryVisual = useMemo(() => resolveExpenseFeedCategoryVisual(item), [item]);
  const amountLabel = formatExpenseMajorAmount(item.amount, item.currency);
  const categorySubtitle = expenseFeedCardMetaCategoryLabel(item);

  const payerPhrase = useMemo(
    () =>
      buildExpenseFeedPayerPhrase(item, t, {
        currentUserId,
        payerDisplayName,
      }),
    [currentUserId, item, payerDisplayName, t],
  );

  const splitPhrase = useMemo(() => buildExpenseFeedSplitPhrase(item, t), [item, t]);

  const footerInstant = useMemo(
    () => formatExpenseFeedFooterInstant(item.createdAt ?? item.date, t),
    [item.createdAt, item.date, t],
  );

  const participantTotal = readExpenseFeedParticipantCount(item);
  const facesFromWire = useMemo(() => readExpenseFeedParticipantFaces(item), [item]);
  const faces = useMemo(() => {
    if (facesFromWire.length > 0) {
      return facesFromWire;
    }
    const payerId = readExpenseFeedPaidByUserId(item);
    if (!payerId) {
      return facesFromWire;
    }
    if (typeof participantTotal === 'number' && participantTotal > 1) {
      return facesFromWire;
    }
    const name = payerDisplayName?.trim() || readExpenseFeedPaidByDisplayName(item) || payerId;
    return [
      {
        id: payerId,
        name,
        avatarUrl: payerAvatarUrl ?? null,
      },
    ];
  }, [facesFromWire, item, participantTotal, payerAvatarUrl, payerDisplayName]);

  const viewerImpactChip = useMemo(
    () => resolveExpenseFeedViewerImpactChip(item, currentUserId, t),
    [currentUserId, item, t],
  );

  const paidByViewer = useMemo(() => {
    const payerId = readExpenseFeedPaidByUserId(item);
    return Boolean(currentUserId && payerId && payerId === currentUserId);
  }, [currentUserId, item]);

  /** Person icon + “Paid by you” when viewer paid (chip does not override). */
  const showYouPaidPersonMeta = paidByViewer && !viewerImpactChip;

  const primaryStatusLabel = viewerImpactChip?.label ?? payerPhrase;

  const inlineMeta = useMemo(
    () => `${primaryStatusLabel} • ${splitPhrase}`,
    [primaryStatusLabel, splitPhrase],
  );

  const attachmentCount =
    typeof item.attachmentCount === 'number' && item.attachmentCount > 0 ? item.attachmentCount : 0;

  const onPressIn = useCallback(() => {
    if (reduceMotion) return;
    scale.value = withTiming(0.985, {
      duration: duration.feedCardHover.ms,
      easing: easing.standard.rn,
    });
  }, [reduceMotion, scale]);

  const onPressOut = useCallback(() => {
    if (reduceMotion) return;
    scale.value = withTiming(1, {
      duration: duration.feedCardHover.ms,
      easing: easing.standard.rn,
    });
  }, [reduceMotion, scale]);

  const onPress = useCallback(() => {
    void Haptics.selectionAsync().catch(() => {});
    router.push(
      `/home/group/${encodeURIComponent(groupId)}/expense/${encodeURIComponent(item.id)}`,
    );
  }, [groupId, item.id]);

  const peopleCountA11y = useMemo(() => {
    if (typeof participantTotal !== 'number' || participantTotal <= 0) {
      return null;
    }
    return t('groups.detail.expenseFeedCardPeopleCount', { count: participantTotal });
  }, [participantTotal, t]);

  const attachmentA11y =
    attachmentCount > 0 ? t('groups.detail.expenseFeedCardHasAttachments') : null;

  const pressHitSlop = useMemo(
    () => ({
      top: spacing['2'],
      bottom: spacing['2'],
      left: spacing['2'],
      right: spacing['2'],
    }),
    [],
  );

  const a11yLabel = useMemo(() => {
    const bits = [
      item.title,
      amountLabel,
      primaryStatusLabel,
      splitPhrase,
      categorySubtitle,
      footerInstant,
      peopleCountA11y,
      attachmentA11y,
    ].filter((s) => typeof s === 'string' && s.trim().length > 0);
    return bits.join('. ');
  }, [
    amountLabel,
    categorySubtitle,
    footerInstant,
    item.title,
    peopleCountA11y,
    primaryStatusLabel,
    splitPhrase,
    attachmentA11y,
  ]);

  const showImpactTrendIcon = Boolean(
    viewerImpactChip && (viewerImpactChip.tone === 'lent' || viewerImpactChip.tone === 'owe'),
  );

  const showCategorySubtitle = Boolean(categorySubtitle?.trim());

  const titleLh = spacing['5'] + spacing['0.5'];
  const amountLh = spacing['6'];
  /** Metadata + timestamp — 13 dp tier, calm ledger rhythm. */
  const captionLh = spacing['4'];
  const footerClockGlyph = typography.fontSize.sm;

  const metaTypo = useMemo(
    () =>
      ({
        color: palette.expenseLedgerMetaInk,
        fontFamily: typography.fontFamily.sans.medium,
        fontSize: typography.fontSize.sm,
        fontWeight: typography.fontWeight.medium,
        lineHeight: captionLh,
        letterSpacing: typography.letterSpacing.ledgerCaption,
      }) as const,
    [captionLh, palette.expenseLedgerMetaInk],
  );

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={a11yLabel}
      accessibilityHint={t('groups.detail.expenseRowOpenHint')}
      hitSlop={pressHitSlop}
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={styles.pressOuter}
    >
      <Animated.View
        style={[
          animatedCard,
          {
            alignSelf: 'stretch',
            borderRadius: radius.expenseLedgerCard,
          },
        ]}
      >
        <FrostedExpenseSurface elevated={hovered && !reduceMotion} style={styles.cardBody}>
          <View style={styles.topCluster}>
            <CategoryIconBubble palette={palette} visual={categoryVisual} />
            <View style={styles.titleColumn}>
              <View style={styles.titleAmountRow}>
                <Text
                  accessibilityRole="header"
                  numberOfLines={2}
                  ellipsizeMode="tail"
                  style={[
                    styles.titleText,
                    {
                      color: palette.textPrimary,
                      fontFamily: typography.fontFamily.sans.semiBold,
                      fontSize: typography.fontSize.lg,
                      fontWeight: typography.fontWeight.semibold,
                      letterSpacing: typography.letterSpacing.walletCardTitle,
                      lineHeight: titleLh,
                    },
                  ]}
                >
                  {item.title}
                </Text>
                <View style={styles.amountChevron}>
                  {attachmentCount > 0 ? (
                    <Ionicons
                      name="attach-outline"
                      size={typography.fontSize.sm}
                      color={palette.iconMuted}
                      accessibilityElementsHidden
                      importantForAccessibility="no-hide-descendants"
                    />
                  ) : null}
                  <Text
                    style={{
                      color: palette.textPrimary,
                      fontFamily: typography.fontFamily.sans.semiBold,
                      fontSize: typography.fontSize.xl,
                      fontWeight: typography.fontWeight.semibold,
                      letterSpacing: typography.letterSpacing.walletAmount,
                      lineHeight: amountLh,
                      fontVariant: ['tabular-nums'],
                      ...(Platform.OS === 'android' ? { includeFontPadding: false } : {}),
                    }}
                    numberOfLines={1}
                  >
                    {amountLabel}
                  </Text>
                  <Ionicons
                    name="chevron-forward-outline"
                    size={typography.fontSize.sm}
                    color={palette.iconMuted}
                    accessibilityElementsHidden
                    importantForAccessibility="no-hide-descendants"
                  />
                </View>
              </View>

              {showCategorySubtitle ? (
                <Text
                  numberOfLines={1}
                  ellipsizeMode="tail"
                  style={[
                    styles.subtitleLine,
                    {
                      color: palette.expenseLedgerSubtitleInk,
                      fontFamily: typography.fontFamily.sans.medium,
                      fontSize: typography.fontSize.sm,
                      fontWeight: typography.fontWeight.medium,
                      lineHeight: captionLh,
                      letterSpacing: typography.letterSpacing.walletSubtitle,
                    },
                  ]}
                >
                  {categorySubtitle?.trim()}
                </Text>
              ) : null}
            </View>
          </View>

          <View style={styles.metaRowOuter}>
            <View style={styles.bottomGutter} />
            <View style={styles.metaPillOuter}>
              {showYouPaidPersonMeta ? (
                <ExpenseFeedMetaPill
                  tone="ledger"
                  accessibilityLabel={`${t('groups.detail.expenseFeedCardPaidByYou')}${t('groups.detail.expenseFeedCardBullet')}${splitPhrase}`}
                >
                  <View style={styles.metaPaidByPillInner}>
                    <View style={styles.metaYouPaidCluster}>
                      <Ionicons
                        name="person-outline"
                        size={typography.fontSize.sm}
                        color={palette.expenseLedgerMetaInk}
                        accessibilityElementsHidden
                        importantForAccessibility="no-hide-descendants"
                      />
                      <Text style={metaTypo} numberOfLines={1}>
                        {t('groups.detail.expenseFeedCardPaidByYou')}
                      </Text>
                    </View>
                    <View style={styles.metaSplitCluster}>
                      <Text style={metaTypo}>{t('groups.detail.expenseFeedCardBullet')}</Text>
                      <Ionicons
                        name="people-outline"
                        size={typography.fontSize.sm}
                        color={palette.expenseLedgerMetaInk}
                        accessibilityElementsHidden
                        importantForAccessibility="no-hide-descendants"
                      />
                      <Text
                        style={[metaTypo, styles.metaSplitRest]}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                      >
                        {splitPhrase}
                      </Text>
                    </View>
                  </View>
                </ExpenseFeedMetaPill>
              ) : showImpactTrendIcon ? (
                <ExpenseFeedMetaPill tone="ledger" accessibilityLabel={inlineMeta}>
                  <View style={styles.metaInlineImpactRow}>
                    <Ionicons
                      name={
                        viewerImpactChip?.tone === 'lent'
                          ? 'trending-up-outline'
                          : 'trending-down-outline'
                      }
                      size={typography.fontSize.sm}
                      color={palette.expenseLedgerMetaInk}
                      accessibilityElementsHidden
                      importantForAccessibility="no-hide-descendants"
                    />
                    <Text
                      style={[metaTypo, styles.metaImpactLabel]}
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      {inlineMeta}
                    </Text>
                  </View>
                </ExpenseFeedMetaPill>
              ) : (
                <ExpenseFeedMetaPill
                  tone="ledger"
                  label={inlineMeta}
                  accessibilityLabel={inlineMeta}
                />
              )}
            </View>
          </View>

          <View style={styles.bottomMetaOuter}>
            <View style={styles.bottomGutter} />
            <View style={styles.bottomMetaInner}>
              <View style={styles.bottomTimeRow}>
                <Ionicons
                  name="time-outline"
                  size={footerClockGlyph}
                  color={palette.textSecondary}
                  accessibilityElementsHidden
                  importantForAccessibility="no-hide-descendants"
                />
                <Text
                  ellipsizeMode="tail"
                  numberOfLines={1}
                  style={[
                    styles.timestampText,
                    {
                      color: palette.textSecondary,
                      fontFamily: typography.fontFamily.sans.medium,
                      fontSize: typography.fontSize.sm,
                      fontWeight: typography.fontWeight.medium,
                      lineHeight: captionLh,
                      letterSpacing: typography.letterSpacing.ledgerCaption,
                      fontVariant: ['tabular-nums'],
                    },
                  ]}
                >
                  {footerInstant}
                </Text>
              </View>
              <Animated.View style={[styles.avatarStackWrap, avatarAmbientStyle]}>
                <MemberAvatarStack
                  faces={faces}
                  participantTotal={participantTotal}
                  palette={palette}
                  avatarRingSurface={palette.cardBackground}
                />
              </Animated.View>
            </View>
          </View>
        </FrostedExpenseSurface>
      </Animated.View>
    </Pressable>
  );
}

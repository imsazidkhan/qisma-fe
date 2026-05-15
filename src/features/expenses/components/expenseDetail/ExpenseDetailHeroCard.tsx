import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import type { ReactElement } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AccessibilityInfo, StyleSheet, Text, View } from 'react-native';

import { DotMatrixField } from '@/features/invites/components/DotMatrixField';
import {
  formatExpenseDetailExpenseDay,
  formatExpenseDetailRecordedAt,
} from '@/features/expenses/utils/expenseDetailHeroMetadata';
import { layoutGrid, radius, textStyles, typography, useThemeColors } from '@/theme';

const META_ICON = 17;
const META_ICON_COL_W = 22;

export type ExpenseDetailHeroCardProps = {
  amountDisplay: string;
  /** Calendar expense date (`YYYY-MM-DD` from wire). */
  expenseDateYmd: string;
  /** ISO timestamp when the expense record was created — drives “recorded at” time row. */
  recordedAtIso?: string | null;
  paidByName: string;
  paidByAvatarUrl: string | null;
  notesLine: string | null;
  currency: string;
};

export function ExpenseDetailHeroCard({
  amountDisplay,
  expenseDateYmd,
  recordedAtIso,
  paidByName,
  paidByAvatarUrl,
  notesLine,
  currency,
}: ExpenseDetailHeroCardProps): ReactElement {
  const { t } = useTranslation();
  const palette = useThemeColors();
  const initial = paidByName.trim().slice(0, 1).toUpperCase() || '?';
  const [reduceSurfaceDecor, setReduceSurfaceDecor] = useState(false);

  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then(setReduceSurfaceDecor);
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceSurfaceDecor);
    return () => {
      sub.remove();
    };
  }, []);

  const expenseDayLabel = useMemo(
    () => formatExpenseDetailExpenseDay(expenseDateYmd),
    [expenseDateYmd],
  );
  const recordedLine = useMemo(() => {
    const iso = recordedAtIso?.trim();
    if (!iso) return null;
    return formatExpenseDetailRecordedAt(iso);
  }, [recordedAtIso]);

  const metaChips = useMemo(() => {
    const c = currency.trim().toUpperCase();
    return c.length > 0 ? [c] : [];
  }, [currency]);

  return (
    <View
      style={[
        styles.shell,
        {
          borderColor: palette.borderSubtle,
          backgroundColor: palette.premiumCardSurface,
        },
      ]}
    >
      <View
        style={[
          styles.textureClip,
          {
            borderTopLeftRadius: radius.inviteCard,
            borderTopRightRadius: radius.inviteCard,
          },
        ]}
      >
        {reduceSurfaceDecor ? (
          <View style={styles.texturePlaceholder} />
        ) : (
          <DotMatrixField colGap={7} columns={28} dotSize={2} height={52} rowGap={7} rows={5} />
        )}
      </View>

      <View style={styles.inner}>
        <View style={styles.amountSection}>
          <Text
            accessibilityRole="header"
            style={[
              styles.amount,
              {
                color: palette.textPrimary,
                fontFamily: typography.fontFamily.sans.medium,
                fontWeight: typography.fontWeight.medium,
                fontVariant: ['tabular-nums'],
              },
            ]}
            numberOfLines={2}
            adjustsFontSizeToFit
            minimumFontScale={0.68}
          >
            {amountDisplay}
          </Text>
        </View>

        <View style={[styles.paidSection, { borderBottomColor: palette.borderSubtle }]}>
          <View style={styles.paidRow}>
            <View
              style={[
                styles.avatarRing,
                {
                  borderColor: palette.borderSubtle,
                  backgroundColor: palette.surfaceOverlay,
                },
              ]}
            >
              {paidByAvatarUrl ? (
                <Image
                  source={{ uri: paidByAvatarUrl }}
                  style={styles.avatarImg}
                  contentFit="cover"
                  accessibilityIgnoresInvertColors
                />
              ) : (
                <Text style={[textStyles.label, { color: palette.textMuted }]}>{initial}</Text>
              )}
            </View>
            <View style={styles.paidCopy}>
              <Text
                numberOfLines={1}
                style={[
                  textStyles.labelSmall,
                  {
                    color: palette.textMuted,
                    letterSpacing: typography.letterSpacing.widest,
                    textTransform: 'uppercase',
                  },
                ]}
              >
                {t('expenses.detail.paidByEyebrow')}
              </Text>
              <Text
                numberOfLines={2}
                style={[
                  textStyles.bodyLarge,
                  {
                    color: palette.textPrimary,
                    fontFamily: typography.fontFamily.sans.medium,
                    fontWeight: typography.fontWeight.medium,
                    letterSpacing: typography.letterSpacing.tight,
                    lineHeight: typography.fontSize.base * typography.lineHeight.snug,
                  },
                ]}
              >
                {paidByName}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.metaCluster}>
          <View style={styles.metaList} accessibilityRole="summary">
            <View style={styles.metaRow} accessible accessibilityRole="text">
              <View style={styles.metaIconSlot}>
                <Ionicons name="calendar-outline" size={META_ICON} color={palette.iconMuted} />
              </View>
              <Text
                style={[
                  textStyles.captionSmall,
                  {
                    color: palette.textMuted,
                    flex: 1,
                    lineHeight: typography.fontSize.xs * typography.lineHeight.loose,
                    letterSpacing: typography.letterSpacing.normal,
                  },
                ]}
              >
                {expenseDayLabel}
              </Text>
            </View>
            {recordedLine ? (
              <View style={styles.metaRow} accessible accessibilityRole="text">
                <View style={styles.metaIconSlot}>
                  <Ionicons name="time-outline" size={META_ICON} color={palette.iconMuted} />
                </View>
                <Text
                  style={[
                    textStyles.captionSmall,
                    {
                      color: palette.textMuted,
                      flex: 1,
                      lineHeight: typography.fontSize.xs * typography.lineHeight.loose,
                      letterSpacing: typography.letterSpacing.normal,
                    },
                  ]}
                >
                  {recordedLine}
                </Text>
              </View>
            ) : null}
          </View>

          {metaChips.length > 0 ? (
            <View
              style={styles.metaChipRow}
              accessibilityRole="text"
              accessibilityLabel={metaChips.join(', ')}
            >
              {metaChips.map((label, index) => (
                <View
                  key={`${index}:${label}`}
                  style={[
                    styles.metaChip,
                    {
                      borderColor: palette.borderSubtle,
                      backgroundColor: palette.surfaceBase,
                    },
                  ]}
                >
                  <Text
                    style={[
                      textStyles.captionSmall,
                      {
                        color: palette.textSecondary,
                        fontFamily: typography.fontFamily.sans.medium,
                        fontWeight: typography.fontWeight.medium,
                        lineHeight: typography.fontSize.xs * typography.lineHeight.loose,
                        letterSpacing: typography.letterSpacing.tight,
                      },
                    ]}
                    numberOfLines={1}
                  >
                    {label}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}
        </View>

        {notesLine ? (
          <View
            style={[
              styles.notesShell,
              {
                borderColor: palette.borderSubtle,
                backgroundColor: palette.surfaceBase,
              },
            ]}
          >
            <Text style={[textStyles.overline, { color: palette.textMuted }]} numberOfLines={1}>
              {t('expenses.detail.noteEyebrow')}
            </Text>
            <Text
              style={[
                textStyles.body,
                {
                  color: palette.textSecondary,
                  marginTop: layoutGrid.sm,
                  lineHeight: typography.fontSize.md * typography.lineHeight.relaxed,
                  letterSpacing: typography.letterSpacing.normal,
                },
              ]}
            >
              {notesLine}
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const AVATAR = 48;

const styles = StyleSheet.create({
  shell: {
    alignSelf: 'stretch',
    borderRadius: radius.inviteCard,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'visible',
  },
  textureClip: {
    overflow: 'hidden',
    opacity: 0.38,
  },
  texturePlaceholder: {
    height: 52,
  },
  inner: {
    paddingHorizontal: layoutGrid.inset,
    paddingTop: layoutGrid.inset,
    paddingBottom: layoutGrid.inset,
    gap: layoutGrid.sm,
    alignSelf: 'stretch',
  },
  amountSection: {
    alignSelf: 'stretch',
    paddingVertical: layoutGrid.sm,
  },
  amount: {
    fontSize: typography.fontSize['5xl'],
    lineHeight: typography.fontSize['5xl'] * typography.lineHeight.tight,
    letterSpacing: typography.letterSpacing.tight,
    alignSelf: 'flex-start',
  },
  paidSection: {
    alignSelf: 'stretch',
    paddingBottom: layoutGrid.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  paidRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: layoutGrid.inset,
    alignSelf: 'stretch',
  },
  paidCopy: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
    gap: layoutGrid.micro,
  },
  avatarRing: {
    width: AVATAR,
    height: AVATAR,
    borderRadius: radius.full,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImg: {
    width: AVATAR,
    height: AVATAR,
  },
  metaCluster: {
    alignSelf: 'stretch',
    gap: layoutGrid.sm,
  },
  metaList: {
    alignSelf: 'stretch',
    gap: layoutGrid.micro,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: layoutGrid.sm,
    alignSelf: 'stretch',
  },
  metaIconSlot: {
    width: META_ICON_COL_W,
    minHeight: META_ICON,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 1,
  },
  metaChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: layoutGrid.sm,
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  metaChip: {
    paddingVertical: layoutGrid.micro,
    paddingHorizontal: layoutGrid.sm,
    borderRadius: radius.sm,
    borderWidth: StyleSheet.hairlineWidth,
    maxWidth: '100%',
  },
  notesShell: {
    padding: layoutGrid.inset,
    borderRadius: radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    alignSelf: 'stretch',
    gap: 0,
  },
});

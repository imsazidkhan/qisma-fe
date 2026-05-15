import { Image } from 'expo-image';
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import type { ExpenseDetailParticipantView } from '@/features/expenses/utils/expenseDetailParticipantViews';
import {
  layoutGrid,
  opacity,
  radius,
  spacing,
  textStyles,
  typography,
  useThemeColors,
} from '@/theme';

const ROW_AVATAR = 44;
/** Horizontal gap between avatar, identity column, and amount rail — matches row `gap`. */
const ROW_GAP = layoutGrid.inset;
/** Fixed numeric rail so owed / share / paid columns align across rows. */
const RIGHT_RAIL_WIDTH = spacing[24];
/** Shared row canvas — equal height, vertically centered content. */
const ROW_MIN_HEIGHT = spacing[24];

export type ExpenseDetailParticipantRowProps = {
  participant: ExpenseDetailParticipantView;
  payerLabel: string;
  /** Hairline divider below — omit on the last row inside the unified split card. */
  showDividerBelow?: boolean;
};

export function ExpenseDetailParticipantRow({
  participant,
  payerLabel,
  showDividerBelow = false,
}: ExpenseDetailParticipantRowProps): ReactElement {
  const { t } = useTranslation();
  const palette = useThemeColors();
  const isPayer = participant.isPayer;

  const handle = participant.username?.trim();
  const displayName = participant.name.trim();

  const primaryIdentity = handle
    ? `@${handle}`
    : displayName !== ''
      ? displayName
      : t('expenses.detail.memberFallback');

  const secondaryIdentity =
    handle &&
    displayName !== '' &&
    displayName.replace(/^@/, '').trim().toLowerCase() !== handle.toLowerCase()
      ? displayName
      : null;

  const initial = (handle ?? displayName.replace(/^@/, '').trim()).slice(0, 1).toUpperCase() || '?';

  const contributionLine = t('expenses.detail.participantPaidLine', {
    amount: participant.paidLabel,
  });

  const shareDisplay = participant.sharePctLabel ?? '\u2014';

  const a11yParts = [
    primaryIdentity,
    secondaryIdentity,
    isPayer ? payerLabel : null,
    participant.owedLabel,
    shareDisplay,
    contributionLine,
  ].filter(Boolean);

  const identityWeight = isPayer ? typography.fontWeight.semibold : typography.fontWeight.medium;
  const identityFamily = isPayer
    ? typography.fontFamily.sans.semiBold
    : typography.fontFamily.sans.medium;

  const amountWeight = isPayer ? typography.fontWeight.semibold : typography.fontWeight.medium;
  const amountFamily = typography.fontFamily.mono.medium;

  const dividerLeftOffset = layoutGrid.inset + ROW_AVATAR + ROW_GAP;

  return (
    <View style={styles.shell}>
      <View
        accessible
        accessibilityRole="text"
        accessibilityLabel={a11yParts.join('. ')}
        style={[styles.rowMain, isPayer ? { backgroundColor: palette.surfaceOverlay } : null]}
      >
        <View
          style={[
            styles.avatarRing,
            {
              borderColor: palette.borderSubtle,
              backgroundColor: isPayer ? palette.surfaceBase : palette.surfaceOverlay,
            },
          ]}
        >
          {participant.avatarUrl ? (
            <Image
              source={{ uri: participant.avatarUrl }}
              style={styles.avatarImg}
              contentFit="cover"
              accessibilityIgnoresInvertColors
            />
          ) : (
            <Text style={[textStyles.label, { color: palette.textMuted }]}>{initial}</Text>
          )}
        </View>

        <View style={styles.leftColumn}>
          <Text
            style={[
              textStyles.body,
              {
                color: palette.textPrimary,
                fontFamily: identityFamily,
                fontWeight: identityWeight,
              },
            ]}
            numberOfLines={1}
          >
            {primaryIdentity}
          </Text>
          <View style={styles.secondarySlot}>
            {secondaryIdentity ? (
              <Text
                style={[textStyles.captionSmall, { color: palette.textMuted }]}
                numberOfLines={1}
              >
                {secondaryIdentity}
              </Text>
            ) : null}
          </View>
          {isPayer ? (
            <View
              style={[
                styles.roleChip,
                {
                  borderColor: palette.borderSubtle,
                  backgroundColor: palette.surfaceBase,
                },
              ]}
            >
              <Text
                style={[
                  textStyles.labelSmall,
                  {
                    color: palette.textSecondary,
                    fontFamily: typography.fontFamily.mono.medium,
                    letterSpacing: typography.letterSpacing.wider,
                    textTransform: 'uppercase',
                  },
                ]}
                numberOfLines={1}
              >
                {payerLabel}
              </Text>
            </View>
          ) : (
            <View style={styles.chipPlaceholder} />
          )}
        </View>

        <View style={[styles.rightRail, { width: RIGHT_RAIL_WIDTH }]}>
          <Text
            style={[
              styles.amountOwed,
              {
                color: palette.textPrimary,
                fontFamily: amountFamily,
                fontWeight: amountWeight,
                fontVariant: ['tabular-nums'],
              },
            ]}
            numberOfLines={1}
          >
            {participant.owedLabel}
          </Text>
          <Text
            style={[
              styles.railCaption,
              textStyles.captionSmall,
              {
                color: palette.textSecondary,
                fontVariant: ['tabular-nums'],
              },
            ]}
            numberOfLines={1}
          >
            {shareDisplay}
          </Text>
          <Text
            style={[
              styles.railCaption,
              textStyles.captionSmall,
              {
                color: palette.textMuted,
                fontVariant: ['tabular-nums'],
              },
            ]}
            numberOfLines={1}
          >
            {contributionLine}
          </Text>
        </View>
      </View>

      {showDividerBelow ? (
        <View style={styles.dividerTrack}>
          <View
            style={[
              styles.dividerLine,
              {
                marginLeft: dividerLeftOffset,
                marginRight: layoutGrid.inset,
                backgroundColor: palette.borderSubtle,
                opacity: opacity.low,
              },
            ]}
          />
        </View>
      ) : null}
    </View>
  );
}

const CAPTION_LINE_H = typography.fontSize.xs * typography.lineHeight.loose;
const ROLE_CHIP_SLOT_H =
  layoutGrid.micro * 2 +
  typography.fontSize['2xs'] * typography.lineHeight.loose +
  StyleSheet.hairlineWidth * 2;

const styles = StyleSheet.create({
  shell: {
    alignSelf: 'stretch',
  },
  rowMain: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
    minHeight: ROW_MIN_HEIGHT,
    gap: ROW_GAP,
    paddingVertical: layoutGrid.inset,
    paddingHorizontal: layoutGrid.inset,
  },
  avatarRing: {
    width: ROW_AVATAR,
    height: ROW_AVATAR,
    borderRadius: radius.full,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarImg: {
    width: ROW_AVATAR,
    height: ROW_AVATAR,
  },
  leftColumn: {
    flex: 1,
    minWidth: 0,
    gap: layoutGrid.micro,
    justifyContent: 'center',
  },
  secondarySlot: {
    minHeight: CAPTION_LINE_H,
    justifyContent: 'center',
  },
  chipPlaceholder: {
    height: ROLE_CHIP_SLOT_H,
  },
  roleChip: {
    alignSelf: 'flex-start',
    paddingHorizontal: layoutGrid.sm,
    paddingVertical: layoutGrid.micro,
    borderRadius: radius.sm,
    borderWidth: StyleSheet.hairlineWidth,
  },
  rightRail: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    flexShrink: 0,
    gap: layoutGrid.micro,
  },
  amountOwed: {
    fontSize: typography.fontSize.lg,
    lineHeight: typography.fontSize.lg * typography.lineHeight.tight,
    letterSpacing: typography.letterSpacing.tight,
    textAlign: 'right',
    width: '100%',
  },
  railCaption: {
    lineHeight: CAPTION_LINE_H,
    textAlign: 'right',
    width: '100%',
  },
  dividerTrack: {
    alignSelf: 'stretch',
  },
  dividerLine: {
    height: StyleSheet.hairlineWidth,
    alignSelf: 'stretch',
  },
});

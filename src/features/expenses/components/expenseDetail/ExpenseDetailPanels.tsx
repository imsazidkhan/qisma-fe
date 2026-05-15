import { Image } from 'expo-image';
import type { TFunction } from 'i18next';
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, useWindowDimensions, View } from 'react-native';

import { Button } from '@/components/ui';
import { ExpenseDetailHeroCard } from '@/features/expenses/components/expenseDetail/ExpenseDetailHeroCard';
import { ExpenseDetailLooseRowList } from '@/features/expenses/components/expenseDetail/ExpenseDetailLooseRowList';
import { ExpenseDetailParticipantRow } from '@/features/expenses/components/expenseDetail/ExpenseDetailParticipantRow';
import { expenseDetailScreenStyles as styles } from '@/features/expenses/screens/expenseDetailScreen.styles';
import type { ExpenseDetail } from '@/features/expenses/types/expenseDetail.types';
import type { ExpenseDetailParticipantView } from '@/features/expenses/utils/expenseDetailParticipantViews';
import {
  expenseDetailHistoryLine,
  expenseDetailTitleLine,
} from '@/features/expenses/utils/expenseDetailDisplay';
import { shouldShowNonEvenSplitOverviewContext } from '@/features/expenses/utils/expenseDetailSplitInsight';
import { formatGroupTimestamp } from '@/features/groups/utils/formatGroupTimestamp';
import { layoutGrid, radius, size, textStyles, useThemeColors } from '@/theme';

export type ExpenseDetailPanelId = 'overview' | 'thread' | 'files' | 'history';

export {
  ExpenseDetailThreadComposer,
  type ExpenseDetailThreadComposerProps,
} from './ExpenseDetailThreadComposer';

function pickAttachmentUrl(row: Record<string, unknown>): string | null {
  const u =
    typeof row['url'] === 'string'
      ? row['url']
      : typeof row['uri'] === 'string'
        ? row['uri']
        : null;
  if (u && u.trim() !== '') return u;
  return null;
}

function isLikelyImageAttachmentUrl(url: string): boolean {
  return /\.(png|jpe?g|gif|webp)(\?|$)/i.test(url);
}

export type ExpenseDetailPanelsProps = {
  panel: ExpenseDetailPanelId;
  detail: ExpenseDetail;
  participantViews: ExpenseDetailParticipantView[];
  amountLabel: string;
  /** ISO — formatted inside hero metadata */
  recordedAtIso?: string;
  notesLine: string | null;
  paidByName: string;
  paidByAvatarUrl: string | null;
  splitTypeLabel: string | null;
  commentDraft: string;
  onCommentDraftChange: (text: string) => void;
  onSendComment: () => void;
  commentMutation: { isPending: boolean };
  onPickReceipt: () => void;
  receiptMutation: { isPending: boolean };
  uploadPct: number | null;
  onOpenAttachmentUrl: (url: string) => void;
};

export function ExpenseDetailPanels(props: ExpenseDetailPanelsProps): ReactElement | null {
  const { t } = useTranslation();

  switch (props.panel) {
    case 'overview':
      return <Overview {...props} t={t} />;
    case 'thread':
      return null;
    case 'files':
      return <Files {...props} t={t} />;
    case 'history':
      return <History detail={props.detail} t={t} />;
    default:
      return null;
  }
}

type OverviewProps = ExpenseDetailPanelsProps & {
  t: TFunction;
};

function Overview({
  detail,
  participantViews,
  amountLabel,
  recordedAtIso,
  notesLine,
  paidByName,
  paidByAvatarUrl,
  splitTypeLabel,
  t,
}: OverviewProps): ReactElement {
  const palette = useThemeColors();
  const { width } = useWindowDimensions();
  const useStackedSplitHeader = width < 380;

  const participantCount = participantViews.length;
  const participantsPhrase =
    participantCount === 0
      ? t('expenses.detail.splitSectionMetaEmpty')
      : t('expenses.detail.splitSectionParticipantCount', { count: participantCount });

  const splitTrimmed = splitTypeLabel?.trim();
  const splitSectionMetaRight =
    participantCount === 0
      ? participantsPhrase
      : splitTrimmed
        ? t('expenses.detail.splitSectionMetaLine', {
            participants: participantsPhrase,
            split: splitTrimmed,
          })
        : participantsPhrase;

  const showNonEvenContext =
    shouldShowNonEvenSplitOverviewContext(detail, participantCount) && Boolean(splitTrimmed);

  return (
    <>
      <ExpenseDetailHeroCard
        amountDisplay={amountLabel}
        currency={detail.currency}
        expenseDateYmd={detail.date}
        notesLine={notesLine}
        paidByAvatarUrl={paidByAvatarUrl}
        paidByName={paidByName}
        recordedAtIso={recordedAtIso}
      />

      {showNonEvenContext && splitTrimmed ? (
        <View
          style={[
            styles.overviewSplitContextStrip,
            {
              borderColor: palette.borderSubtle,
              backgroundColor: palette.surfaceElevated,
            },
          ]}
          accessibilityRole="text"
          accessibilityLabel={t('expenses.detail.splitOtherOverviewBody', { split: splitTrimmed })}
        >
          <Text style={[styles.overviewSplitContextStripLabel, { color: palette.textMuted }]}>
            {t('expenses.detail.splitOtherOverviewBody', { split: splitTrimmed })}
          </Text>
        </View>
      ) : null}

      <View style={styles.section}>
        <View
          style={[
            styles.splitSectionHeaderRow,
            useStackedSplitHeader && styles.splitSectionHeaderRowStacked,
          ]}
          accessible
          accessibilityRole="text"
          accessibilityLabel={`${t('expenses.detail.splitSectionTitle')}. ${splitSectionMetaRight}`}
        >
          <Text style={[styles.splitSectionTitle, { color: palette.textSecondary }]}>
            {t('expenses.detail.splitSectionTitle')}
          </Text>
          <Text
            style={[
              styles.splitSectionMeta,
              useStackedSplitHeader && styles.splitSectionMetaStacked,
              { color: palette.textMuted },
            ]}
            numberOfLines={useStackedSplitHeader ? 4 : 2}
          >
            {splitSectionMetaRight}
          </Text>
        </View>
        {participantViews.length === 0 ? (
          <View
            style={[
              styles.splitParticipantCard,
              {
                borderColor: palette.borderSubtle,
                backgroundColor: palette.premiumCardSurface,
              },
            ]}
            accessibilityRole="text"
          >
            <View style={styles.splitParticipantEmpty}>
              <Text style={[textStyles.captionSmall, { color: palette.textMuted }]}>
                {t('expenses.detail.emptyParticipants')}
              </Text>
              <Text
                style={[
                  textStyles.captionSmall,
                  {
                    color: palette.textMuted,
                    marginTop: layoutGrid.micro,
                  },
                ]}
              >
                {t('expenses.detail.emptyParticipantsDetail')}
              </Text>
            </View>
          </View>
        ) : (
          <View
            style={[
              styles.splitParticipantCard,
              {
                borderColor: palette.borderSubtle,
                backgroundColor: palette.premiumCardSurface,
              },
            ]}
            accessibilityRole="summary"
          >
            {participantViews.map((p, i) => (
              <ExpenseDetailParticipantRow
                key={p.key}
                participant={p}
                payerLabel={t('expenses.detail.payerBadge')}
                showDividerBelow={i !== participantViews.length - 1}
              />
            ))}
          </View>
        )}
      </View>
    </>
  );
}

type FilesProps = ExpenseDetailPanelsProps & {
  t: TFunction;
};

function Files({
  detail,
  receiptMutation,
  uploadPct,
  onPickReceipt,
  onOpenAttachmentUrl,
  t,
}: FilesProps): ReactElement {
  const palette = useThemeColors();

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionKicker, { color: palette.textMuted }]}>
        {t('expenses.detail.attachmentsSection')}
      </Text>
      {detail.attachments.length === 0 ? (
        <Text style={[textStyles.captionSmall, { color: palette.textMuted }]}>
          {t('expenses.detail.emptyAttachments')}
        </Text>
      ) : (
        <View style={{ gap: layoutGrid.sm, alignSelf: 'stretch' }}>
          {detail.attachments.map((row, index) => {
            const url = pickAttachmentUrl(row);
            const label =
              expenseDetailTitleLine(row) ??
              (url ? url.slice(0, 48) : t('expenses.detail.attachmentOpenA11y'));
            const typeLabel =
              typeof row['type'] === 'string'
                ? row['type']
                : typeof row['mimeType'] === 'string'
                  ? row['mimeType']
                  : undefined;
            const showThumb = url !== null && isLikelyImageAttachmentUrl(url);
            return (
              <Pressable
                key={`${index}-${url ?? label}`}
                accessibilityRole="link"
                accessibilityHint={t('expenses.detail.attachmentOpenHint')}
                accessibilityLabel={t('expenses.detail.attachmentOpenA11y')}
                disabled={!url}
                onPress={() => {
                  if (url) void onOpenAttachmentUrl(url);
                }}
                style={({ pressed }) => [{ opacity: !url || pressed ? 0.65 : 1 }]}
              >
                <View
                  style={[
                    styles.cardRow,
                    {
                      borderColor: palette.borderSubtle,
                      backgroundColor: palette.surfaceElevated,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: layoutGrid.sm,
                    },
                  ]}
                >
                  {showThumb && url ? (
                    <Image
                      accessibilityIgnoresInvertColors
                      contentFit="cover"
                      source={{ uri: url }}
                      style={{
                        width: size.thumbSm,
                        height: size.thumbSm,
                        borderRadius: radius.md,
                        backgroundColor: palette.surfaceOverlay,
                      }}
                    />
                  ) : null}
                  <View style={{ flex: 1, minWidth: 0, gap: layoutGrid.micro }}>
                    <Text style={[textStyles.body, { color: palette.textPrimary }]}>{label}</Text>
                    {typeLabel ? (
                      <Text style={[styles.monoMeta, { color: palette.textMuted }]}>
                        {typeLabel}
                      </Text>
                    ) : null}
                  </View>
                </View>
              </Pressable>
            );
          })}
        </View>
      )}

      <View style={{ marginTop: layoutGrid.inset, gap: layoutGrid.micro }}>
        {uploadPct !== null ? (
          <Text style={[textStyles.captionSmall, { color: palette.textMuted }]}>
            {t('expenses.receiptsUpload.progressLabel', { pct: uploadPct })}
          </Text>
        ) : null}
        <Button
          label={
            receiptMutation.isPending && uploadPct !== null
              ? t('expenses.receiptsUpload.progressLabel', { pct: uploadPct })
              : t('expenses.detail.receiptPick')
          }
          variant="secondary"
          onPress={() => void onPickReceipt()}
          disabled={receiptMutation.isPending}
          loading={receiptMutation.isPending}
          trailing="none"
          labelCase="none"
          accessibilityLabel={t('expenses.detail.receiptPickA11y')}
        />
      </View>
    </View>
  );
}

type HistoryProps = {
  detail: ExpenseDetail;
  t: TFunction;
};

function History({ detail, t }: HistoryProps): ReactElement {
  const palette = useThemeColors();

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionKicker, { color: palette.textMuted }]}>
        {t('expenses.detail.historySection')}
      </Text>
      <ExpenseDetailLooseRowList
        emptyLabel={t('expenses.detail.emptyHistory')}
        renderPrimary={(row) => expenseDetailHistoryLine(row) ?? expenseDetailTitleLine(row)}
        renderSecondary={(row) =>
          typeof row['createdAt'] === 'string'
            ? formatGroupTimestamp(row['createdAt'], t)
            : typeof row['at'] === 'string'
              ? formatGroupTimestamp(row['at'], t)
              : undefined
        }
        rows={detail.history}
      />
    </View>
  );
}

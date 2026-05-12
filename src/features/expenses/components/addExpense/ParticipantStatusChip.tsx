import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import type { ParticipantPreviewStatus } from '@/features/expenses/utils/computeParticipantPreview';
import { radius, space, typography, useThemeColors } from '@/theme';

export type ParticipantStatusChipProps = {
  status: ParticipantPreviewStatus;
};

type ChipPalette = {
  bg: string;
  fg: string;
};

/**
 * Compact mono pill, fully-rounded. No border — pulls weight from a soft
 * filled surface plus an ink/semantic text colour. Stays restrained per the
 * Nothing OS design language.
 */
export function ParticipantStatusChip({ status }: ParticipantStatusChipProps): ReactElement {
  const palette = useThemeColors();
  const { t } = useTranslation();

  const variants: Record<ParticipantPreviewStatus, ChipPalette> = {
    settled: {
      bg: palette.successSubtle,
      fg: palette.successText,
    },
    owes: {
      bg: palette.surfaceRaised,
      fg: palette.textPrimary,
    },
    pending: {
      bg: palette.warningSubtle,
      fg: palette.warningText,
    },
  };

  const label =
    status === 'settled'
      ? t('expenses.add.modern.participantStatusSettled')
      : status === 'owes'
        ? t('expenses.add.modern.participantStatusOwes')
        : t('expenses.add.modern.participantStatusOpen');

  const v = variants[status];

  return (
    <View
      accessible
      accessibilityRole="text"
      accessibilityLabel={label}
      style={{
        paddingHorizontal: space.gapSm,
        paddingVertical: space.gapXs,
        borderRadius: radius.full,
        backgroundColor: v.bg,
        alignSelf: 'flex-start',
      }}
    >
      <Text
        style={{
          fontFamily: typography.fontFamily.mono.medium,
          fontSize: typography.fontSize['2xs'],
          letterSpacing: typography.letterSpacing.widest,
          color: v.fg,
        }}
      >
        {label}
      </Text>
    </View>
  );
}

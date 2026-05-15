import { Ionicons } from '@expo/vector-icons';
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { radius, size, space, textStyles, typography, useThemeColors } from '@/theme';

const LEAD_COL = size.avatarLg;
const CHEVRON_COL = 22;

export type BalancesActivityNudgeCardProps = {
  onPress: () => void;
};

export function BalancesActivityNudgeCard({
  onPress,
}: BalancesActivityNudgeCardProps): ReactElement {
  const palette = useThemeColors();
  const { t } = useTranslation();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('groups.detail.balanceNudgeA11y')}
      onPress={onPress}
      style={({ pressed }) => [
        styles.pressable,
        {
          borderColor: palette.borderSubtle,
          backgroundColor: palette.surfaceElevated,
          opacity: pressed ? 0.88 : 1,
        },
      ]}
    >
      <View style={styles.row}>
        <View style={styles.lead}>
          <Ionicons name="trending-up-outline" size={22} color={palette.textSecondary} />
        </View>

        <View style={styles.mid}>
          <Text style={[styles.title, { color: palette.textPrimary }]}>
            {t('groups.detail.balanceNudgeTitle')}
          </Text>
          <Text style={[styles.body, { color: palette.textMuted }]} numberOfLines={2}>
            {t('groups.detail.balanceNudgeBody')}
          </Text>
        </View>

        <View style={styles.chevronRail}>
          <Ionicons
            name="chevron-forward"
            size={18}
            color={palette.iconMuted}
            accessibilityElementsHidden
          />
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    alignSelf: 'stretch',
    marginTop: space.sectionGapSm,
    marginBottom: space.gapSm,
    paddingVertical: space.gapMd,
    paddingHorizontal: 0,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.gap,
  },
  lead: {
    width: LEAD_COL,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mid: {
    flex: 1,
    minWidth: 0,
    gap: space.gapXs,
  },
  chevronRail: {
    width: CHEVRON_COL,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  title: {
    ...textStyles.body,
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.sans.semiBold,
  },
  body: {
    ...textStyles.captionSmall,
    fontFamily: typography.fontFamily.sans.regular,
    fontSize: typography.fontSize.xs,
    lineHeight: typography.fontSize.xs * typography.lineHeight.relaxed,
  },
});

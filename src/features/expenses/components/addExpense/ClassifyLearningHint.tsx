import { Ionicons } from '@expo/vector-icons';
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { radius, space, typography, useThemeColors } from '@/theme';

/** Subtle learning hint shown after classification is applied. */
export function ClassifyLearningHint(): ReactElement {
  const { t } = useTranslation();
  const palette = useThemeColors();

  return (
    <Animated.View entering={FadeIn.duration(300)}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: space.gapSm,
          paddingVertical: space.gapMd,
          paddingHorizontal: space.gapMd,
          borderRadius: radius.lg,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: palette.borderSubtle,
          backgroundColor: palette.surfaceElevated,
        }}
      >
        <Ionicons
          name="sparkles-outline"
          size={14}
          color={palette.textMuted}
          style={{ marginTop: 2 }}
        />
        <View style={{ flex: 1, gap: 2 }}>
          <Text
            style={{
              fontFamily: typography.fontFamily.sans.regular,
              fontSize: typography.fontSize.sm,
              lineHeight: typography.fontSize.sm * 1.4,
              color: palette.textSecondary,
            }}
          >
            {t('expenses.add.classifyLearningHint')}
          </Text>
          <Text
            style={{
              fontFamily: typography.fontFamily.sans.semiBold,
              fontSize: typography.fontSize.sm,
              color: palette.accent,
            }}
          >
            {t('expenses.add.learnMore')}
          </Text>
        </View>
      </View>
    </Animated.View>
  );
}

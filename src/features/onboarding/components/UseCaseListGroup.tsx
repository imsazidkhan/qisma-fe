import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import {
  ONBOARDING_USE_CASE_SLUGS,
  type OnboardingUseCaseSlug,
} from '@/features/onboarding/api/runOnboardingFlow';
import { onboardingUseCaseScreenStyles as styles } from '@/features/onboarding/components/onboardingUseCaseScreen.styles';
import { AUTH_USE_CASE } from '@/i18n/strings/useCaseAuth';
import { useThemeColors } from '@/theme';

export type UseCaseListGroupProps = {
  disabled: boolean;
  isPending: boolean;
  pendingSlug: OnboardingUseCaseSlug | null;
  onSelect: (slug: OnboardingUseCaseSlug) => void;
};

export function UseCaseListGroup({
  disabled,
  isPending,
  pendingSlug,
  onSelect,
}: UseCaseListGroupProps) {
  const palette = useThemeColors();
  const { t } = useTranslation();

  return (
    <View>
      <Text style={[styles.listSectionLabel, { color: palette.textMuted }]}>
        {t('auth.useCase.listLabel', { defaultValue: AUTH_USE_CASE.listLabel })}
      </Text>

      <View style={[styles.listGroup, { borderColor: palette.border }]}>
        {ONBOARDING_USE_CASE_SLUGS.map((slug, index) => {
          const title = t(`auth.useCase.options.${slug}`, {
            defaultValue: AUTH_USE_CASE.options[slug],
          });
          const subtitle = t(`auth.useCase.optionDescriptions.${slug}`, {
            defaultValue: AUTH_USE_CASE.optionDescriptions[slug],
          });
          const indexLabel = String(index + 1).padStart(2, '0');
          const isRowLoading = pendingSlug === slug && isPending;
          const isRowDisabled = disabled || (pendingSlug !== null && pendingSlug !== slug);

          return (
            <View key={slug}>
              {index > 0 ? (
                <View style={[styles.divider, { backgroundColor: palette.border }]} />
              ) : null}
              <Pressable
                onPress={() => {
                  void Haptics.selectionAsync().catch(() => {});
                  onSelect(slug);
                }}
                disabled={isRowDisabled || isRowLoading}
                android_ripple={{ color: palette.ripple }}
                accessibilityRole="button"
                accessibilityLabel={title}
                accessibilityHint={t('auth.useCase.optionHint', {
                  defaultValue: AUTH_USE_CASE.continueA11y,
                })}
                accessibilityState={{ disabled: isRowDisabled, busy: isRowLoading }}
                style={({ pressed }) => [
                  styles.row,
                  {
                    backgroundColor:
                      pressed && !isRowDisabled && !isRowLoading
                        ? palette.surfaceOverlay
                        : 'transparent',
                  },
                ]}
              >
                <Text style={[styles.rowIndex, { color: palette.textMuted }]}>{indexLabel}</Text>
                <View style={styles.rowBody}>
                  <Text
                    style={[
                      styles.rowTitle,
                      {
                        color: isRowDisabled ? palette.textSecondary : palette.textPrimary,
                      },
                    ]}
                    numberOfLines={1}
                  >
                    {title}
                  </Text>
                  <Text
                    style={[styles.rowSubtitle, { color: palette.textMuted }]}
                    numberOfLines={2}
                  >
                    {subtitle}
                  </Text>
                </View>
                <View style={styles.rowTrailing}>
                  {isRowLoading ? (
                    <ActivityIndicator size="small" color={palette.textPrimary} />
                  ) : (
                    <Text
                      style={[
                        styles.rowArrow,
                        {
                          color: isRowDisabled ? palette.textMuted : palette.textPrimary,
                        },
                      ]}
                    >
                      →
                    </Text>
                  )}
                </View>
              </Pressable>
            </View>
          );
        })}
      </View>
    </View>
  );
}

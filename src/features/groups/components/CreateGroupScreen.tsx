import * as Haptics from 'expo-haptics';
import { useCallback, useState, type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { BackHeaderButton, Button, Input } from '@/components/ui';
import { GroupTypeSelector } from '@/features/groups/components/GroupTypeSelector';
import { createGroupScreenStyles as styles } from '@/features/groups/components/createGroupScreen.styles';
import type { GroupTypeId } from '@/features/groups/constants/groupTypes';
import { radius, size, space, textStyles, useThemeColors } from '@/theme';

const DEFAULT_ICON_EMOJI = '👥';
const ICON_CYCLE = ['👥', '🏝️', '🎉', '💰', '🍕', '✨'] as const;

export function CreateGroupScreen({
  onBack,
  onSubmit,
}: {
  onBack: () => void;
  onSubmit: (payload: {
    name: string;
    type: GroupTypeId;
    iconEmoji: string;
  }) => void | Promise<void>;
}): ReactElement {
  const { t } = useTranslation();
  const palette = useThemeColors();
  const insets = useSafeAreaInsets();

  const [name, setName] = useState('');
  const [typeId, setTypeId] = useState<GroupTypeId>('trip');
  const [iconEmoji, setIconEmoji] = useState(DEFAULT_ICON_EMOJI);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const clearSubmitError = useCallback(() => {
    setSubmitError(null);
  }, []);

  const handleNameChange = useCallback(
    (v: string) => {
      clearSubmitError();
      setName(v);
    },
    [clearSubmitError],
  );

  const handleTypeChange = useCallback(
    (id: GroupTypeId) => {
      clearSubmitError();
      setTypeId(id);
    },
    [clearSubmitError],
  );

  const footerPad = space.screenPadding;
  const footerCtaPadV = space.paddingSm * 2;
  const footerBarHeight =
    space.sectionGapLg + footerCtaPadV + size.inputLg + footerPad + insets.bottom;
  const scrollBottomPad = footerBarHeight + space.gapMd;

  const cycleIcon = useCallback(() => {
    void Haptics.selectionAsync().catch(() => {});
    clearSubmitError();
    const idx = ICON_CYCLE.indexOf(iconEmoji as (typeof ICON_CYCLE)[number]);
    const next = ICON_CYCLE[(idx + 1) % ICON_CYCLE.length] ?? DEFAULT_ICON_EMOJI;
    setIconEmoji(next);
  }, [clearSubmitError, iconEmoji]);

  const handleSubmit = useCallback(async () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    const trimmed = name.trim();
    if (trimmed.length < 2 || isSubmitting) return;
    setSubmitError(null);
    setIsSubmitting(true);
    try {
      await onSubmit({ name: trimmed, type: typeId, iconEmoji });
    } catch {
      setSubmitError(t('createGroup.submitError'));
    } finally {
      setIsSubmitting(false);
    }
  }, [iconEmoji, isSubmitting, name, onSubmit, t, typeId]);

  const trimmedName = name.trim();
  const canSubmit = trimmedName.length >= 2 && trimmedName.length <= 50;

  return (
    <SafeAreaView edges={['top']} style={[styles.safe, { backgroundColor: palette.background }]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: scrollBottomPad, paddingHorizontal: space.screenPadding },
          ]}
        >
          <View style={styles.headerRow}>
            <BackHeaderButton onPress={onBack} accessibilityLabel={t('createGroup.backA11y')} />
          </View>

          <View style={styles.hero}>
            <Text
              style={[textStyles.displaySmall, { color: palette.textPrimary }]}
              accessibilityRole="header"
            >
              {t('createGroup.title')}
            </Text>
            <Text style={[styles.subtitle, { color: palette.textSecondary }]}>
              {t('createGroup.subtitle')}
            </Text>
          </View>

          <View style={styles.fieldStack}>
            <Text
              style={[styles.sectionEyebrow, { color: palette.textMuted }]}
              accessibilityRole="text"
            >
              {t('createGroup.sectionIcon')}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('createGroup.iconPickerA11y')}
              accessibilityHint={t('createGroup.iconHint')}
              onPress={cycleIcon}
              style={({ pressed }) => [styles.iconTap, { opacity: pressed ? 0.75 : 1 }]}
            >
              <Text
                style={[styles.iconGlyph, { color: palette.textPrimary }]}
                accessibilityElementsHidden
              >
                {iconEmoji}
              </Text>
            </Pressable>
          </View>

          <Input
            label={t('createGroup.sectionName')}
            value={name}
            onChangeText={handleNameChange}
            autoCorrect={false}
            maxLength={50}
            accessibilityLabel={t('createGroup.nameA11y')}
            containerStyle={undefined}
          />

          <View style={styles.fieldStack}>
            <Text
              style={[styles.sectionEyebrow, { color: palette.textMuted }]}
              accessibilityRole="text"
            >
              {t('createGroup.sectionType')}
            </Text>
            <GroupTypeSelector value={typeId} onChange={handleTypeChange} />
          </View>
        </ScrollView>

        <View
          pointerEvents="box-none"
          style={[
            styles.footer,
            {
              paddingBottom: insets.bottom + footerPad,
              paddingHorizontal: footerPad,
              paddingTop: space.gapMd,
              backgroundColor: palette.background,
            },
          ]}
        >
          {submitError ? (
            <Text
              style={[textStyles.caption, { color: palette.errorText, marginBottom: space.gapSm }]}
              accessibilityRole="alert"
            >
              {submitError}
            </Text>
          ) : null}
          <View style={[styles.footerCtaHost, { backgroundColor: palette.accent }]}>
            <Button
              variant="accent"
              accentSlab="parent"
              fullWidth={false}
              label={t('createGroup.cta')}
              labelCase="none"
              contentAlign="center"
              disabled={!canSubmit || isSubmitting}
              loading={isSubmitting}
              onPress={handleSubmit}
              accessibilityHint={t('createGroup.ctaHint')}
              haptic={false}
              style={[styles.cta, { borderRadius: radius.md }]}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useState, type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  type KeyboardEvent,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { GroupTypeSelector } from '@/features/groups/components/GroupTypeSelector';
import {
  CREATE_GROUP_ICON_GLYPH,
  CREATE_GROUP_ICON_KEYS,
  type CreateGroupIconKey,
} from '@/features/groups/constants/createGroupIconOptions';
import type { GroupTypeId } from '@/features/groups/constants/groupTypes';
import {
  CREATE_GROUP_LAYOUT,
  createGroupScreenStyles as styles,
} from '@/features/groups/components/createGroupScreen.styles';
import {
  opacity,
  platformShadow,
  radius,
  size,
  spacing,
  useThemeColors,
  useThemeMode,
} from '@/theme';

const ICON_RING_IDLE = 1;
const CTA_ARROW_OPACITY = 0.92;

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
  const mode = useThemeMode();
  const insets = useSafeAreaInsets();

  const [name, setName] = useState('');
  const [typeId, setTypeId] = useState<GroupTypeId | null>(null);
  const [iconKey, setIconKey] = useState<CreateGroupIconKey>(CREATE_GROUP_ICON_KEYS[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  /** Lifts the floating CTA with the keyboard — keeps it out of `KeyboardAvoidingView` so layout doesn’t jump. */
  const [keyboardLift, setKeyboardLift] = useState(0);

  useEffect(() => {
    const showEvt = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvt = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const onShow = (e: KeyboardEvent): void => {
      setKeyboardLift(e.endCoordinates.height);
    };
    const onHide = (): void => {
      setKeyboardLift(0);
    };

    const showSub = Keyboard.addListener(showEvt, onShow);
    const hideSub = Keyboard.addListener(hideEvt, onHide);
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

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
    (id: GroupTypeId | null) => {
      clearSubmitError();
      setTypeId(id);
    },
    [clearSubmitError],
  );

  const footerReserve =
    CREATE_GROUP_LAYOUT.ctaHeight +
    CREATE_GROUP_LAYOUT.dockPaddingBottom +
    insets.bottom +
    CREATE_GROUP_LAYOUT.scrollBreathingAboveCta +
    (submitError ? spacing['6'] : 0);

  const pickIcon = useCallback(
    (key: CreateGroupIconKey) => {
      void Haptics.selectionAsync().catch(() => {});
      clearSubmitError();
      setIconKey(key);
    },
    [clearSubmitError],
  );

  const handleSubmit = useCallback(async () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    const trimmed = name.trim();
    if (trimmed.length < 2 || isSubmitting) return;
    setSubmitError(null);
    setIsSubmitting(true);
    try {
      await onSubmit({ name: trimmed, type: typeId ?? 'other', iconEmoji: '' });
    } catch {
      setSubmitError(t('createGroup.submitError'));
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting, name, onSubmit, t, typeId]);

  const trimmedName = name.trim();
  const canSubmit = trimmedName.length >= 2 && trimmedName.length <= 50;

  const canvasBg = mode === 'dark' ? palette.background : palette.inviteCanvas;
  const blurTint = mode === 'dark' ? 'dark' : 'light';
  const backGlassBorder = palette.borderSubtle;
  const iconPanelBg = palette.surfaceBase;
  const iconPanelBorder = palette.border;
  const nameBorder = palette.border;
  const nameFill = palette.surfaceBase;
  const ctaFill = palette.createGroupCtaFill;
  const ctaContent = palette.createGroupCtaContent;
  const ctaForeground = isSubmitting || canSubmit ? ctaContent : `${palette.white}5C`;
  /** Selected chip: solid black disc + white glyph (`palette`; avoids any token drift). */
  const iconSelectedBg = palette.black;
  const iconSelectedFg = palette.white;
  const iconIdleRing = palette.iconMuted;
  const namePlaceholderColor = mode === 'light' ? `${palette.black}66` : `${palette.white}8F`;

  return (
    <SafeAreaView edges={['top']} style={[styles.safe, { backgroundColor: canvasBg }]}>
      <View style={styles.flex}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? spacing['2'] : 0}
        >
          <ScrollView
            style={styles.flex}
            contentContainerStyle={[styles.mainColumn, { paddingBottom: footerReserve }]}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.backRow}>
              <View
                style={[
                  styles.backBlurClip,
                  {
                    borderColor: backGlassBorder,
                    backgroundColor:
                      Platform.OS === 'web'
                        ? `${palette.white}${mode === 'dark' ? '22' : 'A8'}`
                        : undefined,
                  },
                ]}
              >
                {Platform.OS === 'web' ? null : (
                  <BlurView
                    intensity={mode === 'dark' ? 28 : 42}
                    tint={blurTint}
                    experimentalBlurMethod={
                      Platform.OS === 'android' ? 'dimezisBlurView' : undefined
                    }
                    style={StyleSheet.absoluteFill}
                  />
                )}
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t('createGroup.backA11y')}
                  onPress={onBack}
                  style={({ pressed }) => [
                    styles.backInner,
                    {
                      backgroundColor: Platform.OS === 'web' ? 'transparent' : `${palette.white}54`,
                    },
                    { opacity: pressed ? opacity.high : 1 },
                  ]}
                >
                  <Ionicons
                    color={palette.iconPrimary}
                    name="chevron-back-outline"
                    size={size.icon}
                  />
                </Pressable>
              </View>
            </View>

            <View style={styles.hero}>
              <Text
                style={[styles.heroTitle, { color: palette.textPrimary }]}
                accessibilityRole="header"
              >
                {t('createGroup.title')}
              </Text>
              <Text
                style={[styles.heroSubtitle, { color: palette.textSecondary }]}
                numberOfLines={2}
                ellipsizeMode="tail"
              >
                {t('createGroup.subtitle')}
              </Text>
            </View>

            <View style={styles.section}>
              <Text
                style={[styles.sectionLabel, { color: palette.textMuted }]}
                accessibilityRole="text"
              >
                {t('createGroup.sectionIcon')}
              </Text>
              <View
                style={[
                  styles.panelIconStrip,
                  {
                    backgroundColor: iconPanelBg,
                    borderColor: iconPanelBorder,
                  },
                  platformShadow('sm'),
                ]}
              >
                <View style={styles.iconRow} collapsable={false}>
                  {CREATE_GROUP_ICON_KEYS.map((key) => {
                    const selected = iconKey === key;
                    return (
                      <View key={key} style={styles.iconSlotOuter} collapsable={false}>
                        <Pressable
                          accessibilityRole="radio"
                          accessibilityState={{ selected, checked: selected }}
                          accessibilityLabel={t(`createGroup.iconSlot.${key}`)}
                          accessibilityHint={t('createGroup.iconHint')}
                          onPress={() => pickIcon(key)}
                          style={({ pressed }) => [
                            styles.iconSlotPressable,
                            { opacity: pressed ? opacity.high : 1 },
                          ]}
                        >
                          <View
                            pointerEvents="none"
                            collapsable={false}
                            style={[
                              styles.iconCard,
                              {
                                backgroundColor: selected ? iconSelectedBg : 'transparent',
                                borderColor: selected ? iconSelectedBg : iconIdleRing,
                                borderWidth: selected ? 0 : ICON_RING_IDLE,
                              },
                              selected && Platform.OS === 'ios' ? platformShadow('md') : null,
                            ]}
                          >
                            <Ionicons
                              color={selected ? iconSelectedFg : iconIdleRing}
                              name={CREATE_GROUP_ICON_GLYPH[key]}
                              size={22}
                            />
                          </View>
                        </Pressable>
                      </View>
                    );
                  })}
                </View>
              </View>
            </View>

            <View style={styles.section}>
              <Text
                style={[styles.sectionLabel, { color: palette.textMuted }]}
                accessibilityRole="text"
              >
                {t('createGroup.sectionName')}
              </Text>
              <View
                style={[
                  styles.nameFieldShell,
                  {
                    backgroundColor: nameFill,
                    borderColor: nameBorder,
                  },
                  platformShadow('xs'),
                ]}
              >
                <TextInput
                  value={name}
                  onChangeText={handleNameChange}
                  placeholder={t('createGroup.namePlaceholder')}
                  placeholderTextColor={namePlaceholderColor}
                  autoCorrect={false}
                  maxLength={50}
                  accessibilityLabel={t('createGroup.nameA11y')}
                  style={[styles.nameInput, { color: palette.textPrimary }]}
                />
              </View>
              <Text
                style={[styles.nameCounter, { color: palette.textMuted }]}
                accessibilityElementsHidden
              >
                {name.length}/50
              </Text>
            </View>

            <View style={[styles.section, styles.typeSection]}>
              <Text
                style={[styles.sectionLabel, { color: palette.textMuted }]}
                accessibilityRole="text"
              >
                {t('createGroup.sectionType')}
              </Text>
              <Text
                style={[styles.sectionTypeHint, { color: palette.textSecondary }]}
                accessibilityRole="text"
              >
                {t('createGroup.sectionTypeHint')}
              </Text>
              <GroupTypeSelector value={typeId} onChange={handleTypeChange} />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>

        <View
          pointerEvents="box-none"
          style={[
            styles.ctaFloatWrap,
            {
              bottom: keyboardLift,
              paddingBottom: insets.bottom + CREATE_GROUP_LAYOUT.dockPaddingBottom,
            },
          ]}
        >
          {submitError ? (
            <Text style={{ color: palette.errorText, marginBottom: spacing['3'], fontSize: 13 }}>
              {submitError}
            </Text>
          ) : null}
          <View
            style={[
              { alignSelf: 'stretch', width: '100%', borderRadius: radius.full },
              !isSubmitting ? platformShadow('createGroupCtaFloat') : null,
            ]}
            collapsable={false}
          >
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('createGroup.cta')}
              accessibilityHint={t('createGroup.ctaHint')}
              accessibilityState={{ disabled: !canSubmit || isSubmitting }}
              disabled={!canSubmit || isSubmitting}
              onPress={() => void handleSubmit()}
              style={({ pressed }) => ({
                opacity: canSubmit && !isSubmitting && pressed ? 0.94 : 1,
              })}
            >
              <View
                collapsable={false}
                style={[
                  styles.cta,
                  {
                    backgroundColor: ctaFill,
                    borderWidth: 0,
                  },
                ]}
              >
                <View style={styles.ctaInner} pointerEvents="none">
                  {isSubmitting ? (
                    <ActivityIndicator color={ctaForeground} />
                  ) : (
                    <>
                      <View style={styles.ctaRailSpacer} />
                      <Text style={[styles.ctaLabel, { color: ctaForeground }]} numberOfLines={1}>
                        {t('createGroup.cta')}
                      </Text>
                      <View style={styles.ctaArrowRail}>
                        <Ionicons
                          color={ctaForeground}
                          name="arrow-forward-outline"
                          size={20}
                          style={{
                            opacity:
                              canSubmit && !isSubmitting ? CTA_ARROW_OPACITY : opacity.medium,
                          }}
                        />
                      </View>
                    </>
                  )}
                </View>
              </View>
            </Pressable>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

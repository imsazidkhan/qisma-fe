import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState, type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { BackHeaderButton, Button, Input } from '@/components/ui';
import { ROUTES } from '@/constants/routes';
import { useAuthMe, useAuthSession } from '@/features/auth/hooks';
import { mapUpdateProfileError } from '@/features/onboarding/api/mapUpdateProfileError';
import { OnboardingNameErrorBanner } from '@/features/onboarding/components/OnboardingNameErrorBanner';
import { SIGNED_IN_PATHS } from '@/features/onboarding/constants/signedInPaths';
import { useEnsureSignedInPath } from '@/features/onboarding/hooks/useEnsureSignedInPath';
import { pickAvatarFromLibrary } from '@/features/onboarding/utils/pickAvatarFromLibrary';
import { editProfileScreenStyles as styles } from '@/features/profile/components/editProfileScreen.styles';
import type { PickedAvatarAsset } from '@/features/profile/hooks/useSaveProfile';
import { useSaveProfile } from '@/features/profile/hooks/useSaveProfile';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { platformShadow, space, textStyles, useThemeColors } from '@/theme';

/** Client UX cap; server accepts more — matches onboarding display name. */
const MAX_NAME_CHARS = 30;

function getDisplayInitials(displayName: string): string {
  const parts = displayName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '•';
  if (parts.length === 1) {
    const w = parts[0]!;
    return w.slice(0, 2).toUpperCase();
  }
  return `${parts[0]![0] ?? ''}${parts[1]![0] ?? ''}`.toUpperCase() || '•';
}

export type EditProfileScreenProps = {
  onBack: () => void;
};

export function EditProfileScreen({ onBack }: EditProfileScreenProps): ReactElement {
  const { t } = useTranslation();
  const palette = useThemeColors();
  const insets = useSafeAreaInsets();
  const { accessToken } = useAuthSession();
  const { data: me, isPending: mePending, isError: meIsError, refetch: refetchMe } = useAuthMe();
  const mutation = useSaveProfile();
  const { isOnline, isReady } = useNetworkStatus();

  useEnsureSignedInPath(SIGNED_IN_PATHS.HOME);

  useEffect(() => {
    if (!accessToken) {
      router.replace(ROUTES.LOGIN);
    }
  }, [accessToken]);

  const [name, setName] = useState('');
  const [hydrated, setHydrated] = useState(false);
  const [pickedAvatar, setPickedAvatar] = useState<PickedAvatarAsset | undefined>(undefined);
  const [nativeAvatarFailed, setNativeAvatarFailed] = useState(false);
  const baselineNameTrimmed = (me?.name ?? '').trim();
  const baselineAvatarUrl = me?.avatarUrl?.trim() ?? '';

  useEffect(() => {
    if (me && !hydrated) {
      setName(me.name?.trim() ? me.name : '');
      setHydrated(true);
    }
  }, [hydrated, me]);

  const trimmed = name.trim();
  const nameValid = trimmed.length > 0 && trimmed.length <= MAX_NAME_CHARS;
  const nameDirty = hydrated && trimmed !== baselineNameTrimmed;
  const avatarDirty = pickedAvatar !== undefined;
  const dirty = nameDirty || avatarDirty;

  const previewUri =
    pickedAvatar?.uri ??
    (!nativeAvatarFailed && baselineAvatarUrl.length > 0 ? baselineAvatarUrl : '');
  const showInitials = previewUri.length === 0 || nativeAvatarFailed;

  const displayForInitials =
    trimmed.length > 0 ? trimmed : baselineNameTrimmed || t('profile.guestName');

  const initials = useMemo(() => getDisplayInitials(displayForInitials), [displayForInitials]);

  useEffect(() => {
    setNativeAvatarFailed(false);
  }, [previewUri]);

  const uiError = useMemo(
    () => (mutation.isError ? mapUpdateProfileError(mutation.error) : null),
    [mutation.error, mutation.isError],
  );

  const handleNameChange = useCallback(
    (text: string) => {
      setName(text);
      if (mutation.isError) mutation.reset();
    },
    [mutation],
  );

  const handlePickAvatar = useCallback(async () => {
    if (mutation.isPending) return;

    Keyboard.dismiss();

    try {
      const result = await pickAvatarFromLibrary();
      if (result.kind === 'cancelled') return;
      if (result.kind === 'permission_denied') {
        Alert.alert(t('profile.edit.photoPermissionTitle'), t('profile.edit.photoPermissionBody'));
        return;
      }

      mutation.reset();

      const { uri, fileName, mimeType } = result.asset;
      setPickedAvatar({ uri, fileName, mimeType });
      setNativeAvatarFailed(false);
    } catch {
      Alert.alert(t('profile.edit.photoUnavailableTitle'), t('profile.edit.photoUnavailableBody'));
    }
  }, [mutation, t]);

  const saveDisabled =
    !hydrated || !dirty || !nameValid || !isOnline || !isReady || mutation.isPending || !me;

  const handleSave = useCallback(async () => {
    if (saveDisabled) return;
    Keyboard.dismiss();

    const patch = {
      ...(nameDirty ? { name: trimmed } : {}),
      ...(avatarDirty ? { pickedAvatar } : {}),
    };

    try {
      await mutation.mutateAsync(patch);
      router.back();
    } catch {
      /* error surfaced via mutation + banner */
    }
  }, [avatarDirty, mutation, nameDirty, pickedAvatar, saveDisabled, trimmed]);

  const counterAdornment = (
    <Text style={{ color: palette.textMuted }} accessibilityElementsHidden>
      {name.length}/{MAX_NAME_CHARS}
    </Text>
  );

  if (accessToken && !me) {
    if (mePending && !meIsError) {
      return (
        <SafeAreaView
          edges={['top']}
          style={[styles.flex, { backgroundColor: palette.background }]}
        >
          <View style={[styles.headerRow, { paddingHorizontal: space.screenPadding }]}>
            <BackHeaderButton
              accessibilityLabel={t('profile.edit.backA11y')}
              onPress={onBack}
              thinGlyph
            />
          </View>
          <View style={styles.loadingBlock}>
            <ActivityIndicator size="small" color={palette.textSecondary} />
            <Text style={[styles.subtitle, { color: palette.textMuted }]}>
              {t('profile.edit.loading')}
            </Text>
          </View>
        </SafeAreaView>
      );
    }

    if (meIsError) {
      return (
        <SafeAreaView
          edges={['top']}
          style={[styles.flex, { backgroundColor: palette.background }]}
        >
          <View style={[styles.headerRow, { paddingHorizontal: space.screenPadding }]}>
            <BackHeaderButton
              accessibilityLabel={t('profile.edit.backA11y')}
              onPress={onBack}
              thinGlyph
            />
          </View>
          <View style={[styles.errorBanner, styles.loadingBlock]}>
            <Text style={[textStyles.body, { color: palette.textPrimary }]}>
              {t('profile.loadError')}
            </Text>
            <Button
              variant="secondary"
              label={t('profile.retry')}
              onPress={() => void refetchMe()}
              trailing="none"
            />
          </View>
        </SafeAreaView>
      );
    }
  }

  if (!hydrated || !me) {
    return (
      <SafeAreaView edges={['top']} style={[styles.flex, { backgroundColor: palette.background }]}>
        <View style={[styles.headerRow, { paddingHorizontal: space.screenPadding }]}>
          <BackHeaderButton
            accessibilityLabel={t('profile.edit.backA11y')}
            onPress={onBack}
            thinGlyph
          />
        </View>
        <View style={styles.loadingBlock}>
          <ActivityIndicator size="small" color={palette.textSecondary} />
          <Text style={[styles.subtitle, { color: palette.textMuted }]}>
            {t('profile.edit.loading')}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={[styles.flex, { backgroundColor: palette.background }]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : Math.max(insets.top, 12)}
      >
        <View
          style={[
            styles.flex,
            {
              paddingHorizontal: space.screenPadding,
              paddingBottom: Math.max(insets.bottom, space.gapSm),
            },
          ]}
        >
          <View style={styles.headerRow}>
            <BackHeaderButton
              accessibilityLabel={t('profile.edit.backA11y')}
              onPress={onBack}
              thinGlyph
            />
            <View style={styles.headerTitleWrap}>
              <Text
                accessibilityRole="header"
                style={[textStyles.h3, { color: palette.textPrimary, textAlign: 'center' }]}
                numberOfLines={2}
              >
                {t('profile.edit.title')}
              </Text>
            </View>
          </View>

          <ScrollView
            style={styles.flex}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            <Text style={[styles.subtitle, { color: palette.textSecondary }]}>
              {t('profile.edit.subtitle')}
            </Text>

            {isReady && !isOnline ? (
              <Text style={[styles.subtitle, { color: palette.errorText }]}>
                {t('auth.displayName.offlineHint')}
              </Text>
            ) : null}

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('profile.edit.photoA11y')}
              accessibilityHint={t('profile.edit.photoHint')}
              disabled={mutation.isPending}
              hitSlop={12}
              onPress={() => void handlePickAvatar()}
              style={styles.avatarBlock}
            >
              <View
                style={[
                  styles.avatarRing,
                  {
                    borderColor: palette.borderSubtle,
                    backgroundColor: palette.surfaceRaised,
                    ...platformShadow('xs'),
                  },
                ]}
                accessibilityElementsHidden
              >
                {!showInitials ? (
                  <Image
                    source={{ uri: previewUri }}
                    style={styles.avatarImage}
                    contentFit="cover"
                    accessibilityIgnoresInvertColors
                    accessible={false}
                    onError={() => setNativeAvatarFailed(true)}
                  />
                ) : (
                  <Text style={[styles.avatarInitials, { color: palette.textPrimary }]}>
                    {initials}
                  </Text>
                )}
              </View>
              <Text style={[styles.changeAvatarLabel, { color: palette.textSecondary }]}>
                {pickedAvatar ? t('profile.edit.changePhotoAgain') : t('profile.edit.changePhoto')}
              </Text>
            </Pressable>

            <Input
              label={t('auth.displayName.inputLabel')}
              accessibilityLabel={t('auth.displayName.inputLabel')}
              value={name}
              onChangeText={handleNameChange}
              maxLength={MAX_NAME_CHARS}
              autoCapitalize="words"
              autoCorrect
              editable={!mutation.isPending}
              returnKeyType="done"
              onSubmitEditing={handleSave}
              helperText={t('profile.edit.nameHelper')}
              accessibilityHint={t('auth.displayName.a11y.inputHint', {
                max: MAX_NAME_CHARS,
              })}
              rightAdornment={counterAdornment}
              error={
                hydrated && trimmed.length === 0
                  ? t('profile.edit.nameRequired')
                  : hydrated && trimmed.length > MAX_NAME_CHARS
                    ? t('profile.edit.nameTooLong')
                    : undefined
              }
            />

            <OnboardingNameErrorBanner error={uiError} />
          </ScrollView>

          <View style={styles.footer}>
            <Button
              variant="accent"
              label={mutation.isPending ? t('profile.edit.saving') : t('profile.edit.save')}
              onPress={() => void handleSave()}
              disabled={saveDisabled}
              loading={mutation.isPending}
              trailing="none"
              accessibilityHint={t('profile.edit.saveHint')}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

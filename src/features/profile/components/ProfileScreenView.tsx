import Constants from 'expo-constants';
import { Image } from 'expo-image';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState, type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  Linking,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, HeaderIconButton, ThemeToggle } from '@/components/ui';
import { LEGAL_PRIVACY_URL, LEGAL_TERMS_URL, SUPPORT_HELP_CENTER_URL } from '@/constants';
import { ROUTES } from '@/constants/routes';
import { useAuthMe, useAuthSession } from '@/features/auth/hooks';
import { getWelcomeDisplayNameFromAccessToken } from '@/features/auth/services/welcomeDisplayName';
import { profileScreenStyles as styles } from '@/features/profile/components/profileScreen.styles';
import { ProfileSettingsRow } from '@/features/profile/components/ProfileSettingsRow';
import { formatProfileIdentifierForDisplay } from '@/features/profile/utils/formatProfileIdentifier';
import { getQismaTabBarContentInset } from '@/features/qisma/constants/tabBarLayout';
import { platformShadow, size, space, textStyles, useThemeColors } from '@/theme';

const PROFILE_APP_VERSION_FOOTER = ((): string => {
  const env = process.env.EXPO_PUBLIC_APP_VERSION?.trim() ?? '';
  if (env.length > 0) return env;
  return Constants.expoConfig?.version?.trim() ?? '';
})();

function getDisplayInitials(displayName: string): string {
  const parts = displayName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '•';
  if (parts.length === 1) {
    const w = parts[0]!;
    return w.slice(0, 2).toUpperCase();
  }
  return `${parts[0]![0] ?? ''}${parts[1]![0] ?? ''}`.toUpperCase() || '•';
}

export type ProfileScreenViewProps = {
  onSignOut: () => void | Promise<void>;
};

/**
 * Premium monochrome profile — full-width rows, crisp cards, no stacked “ghost” layout.
 */
export function ProfileScreenView({ onSignOut }: ProfileScreenViewProps): ReactElement {
  const { t } = useTranslation();
  const palette = useThemeColors();
  const insets = useSafeAreaInsets();
  const { accessToken } = useAuthSession();
  const { data: me, isError: meLoadError, isFetching: meFetching, refetch } = useAuthMe();

  const [avatarLoadFailed, setAvatarLoadFailed] = useState(false);

  /** Bottom padding so scroll content clears the floating tab dock. */
  const dockBottomPad = getQismaTabBarContentInset(insets.bottom);

  const displayName = useMemo(() => {
    const fromApi = me?.name?.trim();
    if (fromApi) return fromApi;
    if (accessToken) {
      const fromToken = getWelcomeDisplayNameFromAccessToken(accessToken);
      if (fromToken) return fromToken;
    }
    return t('profile.guestName');
  }, [accessToken, me?.name, t]);

  const phoneDisplay = useMemo(() => {
    const id = me?.identifier?.trim();
    if (!id) return t('profile.phoneUnknown');
    return formatProfileIdentifierForDisplay(id);
  }, [me?.identifier, t]);

  const avatarUri = me?.avatarUrl?.trim() ?? '';
  const initials = useMemo(() => getDisplayInitials(displayName), [displayName]);

  useEffect(() => {
    setAvatarLoadFailed(false);
  }, [avatarUri]);

  const showSoon = useCallback(() => {
    Alert.alert(t('profile.soonGenericTitle'), t('profile.soonGenericBody'));
  }, [t]);

  const goGroups = useCallback(() => {
    router.push(ROUTES.HOME_GROUPS);
  }, []);

  const goInvites = useCallback(() => {
    router.push(ROUTES.HOME_INVITES);
  }, []);

  const goContactsSync = useCallback(() => {
    router.push(ROUTES.HOME_CONTACTS_SYNC);
  }, []);

  const goEditProfile = useCallback(() => {
    router.push(ROUTES.HOME_EDIT_PROFILE);
  }, []);

  const openHelp = useCallback(() => {
    const u = SUPPORT_HELP_CENTER_URL.trim();
    if (!u) {
      Alert.alert(t('profile.linkUnavailableTitle'), t('profile.helpUnavailableBody'));
      return;
    }
    void Linking.openURL(u).catch(() => {});
  }, [t]);

  const openPrivacy = useCallback(() => {
    const u = LEGAL_PRIVACY_URL.trim();
    if (!u) {
      Alert.alert(t('profile.linkUnavailableTitle'), t('profile.privacyUnavailableBody'));
      return;
    }
    void Linking.openURL(u).catch(() => {});
  }, [t]);

  const openTerms = useCallback(() => {
    const u = LEGAL_TERMS_URL.trim();
    if (!u) {
      Alert.alert(t('profile.linkUnavailableTitle'), t('profile.termsUnavailableBody'));
      return;
    }
    void Linking.openURL(u).catch(() => {});
  }, [t]);

  /** High-contrast slab; skip card drop-shadow on Android (reads like a dim overlay). */
  const cardSurface = useMemo(
    () => ({
      backgroundColor: palette.surfaceBase,
      borderColor: palette.border,
    }),
    [palette.border, palette.surfaceBase],
  );

  const hairlineColor = palette.borderSubtle;

  const showBlockingProfileError = Boolean(accessToken && meLoadError && !me);

  const refreshControl = (
    <RefreshControl
      refreshing={meFetching}
      onRefresh={() => void refetch()}
      tintColor={palette.iconPrimary}
      colors={[palette.iconPrimary]}
    />
  );

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: palette.background }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingBottom: dockBottomPad + space.gapMd,
            paddingHorizontal: space.screenPadding,
          },
        ]}
        keyboardShouldPersistTaps="handled"
        refreshControl={refreshControl}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.screenHeaderRow}>
          <View style={styles.screenHeaderTitles}>
            <Text
              style={[styles.screenTitle, { color: palette.textPrimary }]}
              accessibilityRole="header"
            >
              {t('profile.title')}
            </Text>
            <Text style={[styles.screenSubtitle, { color: palette.textMuted }]}>
              {t('profile.subtitle')}
            </Text>
          </View>
          <HeaderIconButton
            accessibilityHint={t('profile.editProfileHint')}
            accessibilityLabel={t('profile.editProfile')}
            onPress={goEditProfile}
            style={{ alignSelf: 'center' }}
          >
            <Ionicons color={palette.textPrimary} name="create-outline" size={size.icon} />
          </HeaderIconButton>
        </View>

        {showBlockingProfileError ? (
          <View
            style={[styles.groupCard, cardSurface, { gap: space.gapMd, marginBottom: space.gapMd }]}
          >
            <Text
              accessibilityRole="alert"
              style={[textStyles.body, { color: palette.textPrimary }]}
              numberOfLines={4}
            >
              {t('profile.loadError')}
            </Text>
            <Button
              variant="secondary"
              label={t('profile.retry')}
              onPress={() => void refetch()}
              trailing="none"
            />
          </View>
        ) : null}

        <View style={[styles.groupCard, cardSurface, styles.heroInnerGap]}>
          <View style={styles.heroIdentityRow}>
            <View
              style={[
                styles.heroAvatarRing,
                {
                  borderColor: palette.borderSubtle,
                  backgroundColor: palette.surfaceRaised,
                  ...platformShadow('xs'),
                },
              ]}
              accessibilityRole="image"
              accessibilityLabel={t('profile.avatarA11y')}
            >
              {avatarUri.length > 0 && !avatarLoadFailed ? (
                <Image
                  source={{ uri: avatarUri }}
                  style={styles.heroAvatarImage}
                  contentFit="cover"
                  onError={() => setAvatarLoadFailed(true)}
                  accessibilityIgnoresInvertColors
                />
              ) : meFetching && !avatarUri.length && !avatarLoadFailed ? (
                <ActivityIndicator size="small" color={palette.textSecondary} />
              ) : (
                <Text style={[styles.heroAvatarInitials, { color: palette.textPrimary }]}>
                  {initials}
                </Text>
              )}
            </View>
            <View style={styles.heroTextColumn}>
              <Text style={[textStyles.overline, { color: palette.textMuted }]}>
                {t('profile.nameEyebrow')}
              </Text>
              <Text
                accessibilityRole="header"
                ellipsizeMode="tail"
                numberOfLines={2}
                style={[styles.heroDisplayName, { color: palette.textPrimary }]}
              >
                {displayName}
              </Text>
              <Text style={[styles.heroPhoneLine, { color: palette.textSecondary }]}>
                {phoneDisplay}
              </Text>
            </View>
          </View>

          <Button
            accessibilityHint={t('profile.editProfileHint')}
            accessibilityLabel={t('profile.editProfile')}
            contentAlign="center"
            label={t('profile.editProfile')}
            labelCase="none"
            leading={
              <Ionicons color={palette.textOnAccent} name="create-outline" size={size.iconSm} />
            }
            onPress={goEditProfile}
            trailing="none"
            variant="accent"
          />
        </View>

        <View style={styles.sectionGap}>
          <Text
            style={[styles.sectionLabel, { color: palette.textMuted }]}
            accessibilityRole="text"
          >
            {t('profile.sectionAccount')}
          </Text>
          <View style={[styles.groupCard, cardSurface]}>
            <ProfileSettingsRow
              icon="albums-outline"
              label={t('profile.rowGroups')}
              onPress={goGroups}
              accessibilityHint={t('profile.rowGroupsHint')}
            />
            <View style={[styles.hairline, { backgroundColor: hairlineColor }]} />
            <ProfileSettingsRow
              icon="mail-unread-outline"
              label={t('profile.rowInvites')}
              onPress={goInvites}
              accessibilityHint={t('profile.rowInvitesHint')}
            />
            <View style={[styles.hairline, { backgroundColor: hairlineColor }]} />
            <ProfileSettingsRow
              icon="person-add-outline"
              label={t('profile.rowContactsSync')}
              onPress={goContactsSync}
              accessibilityHint={t('profile.rowContactsSyncHint')}
            />
          </View>
        </View>

        <View style={styles.sectionGap}>
          <Text
            style={[styles.sectionLabel, { color: palette.textMuted }]}
            accessibilityRole="text"
          >
            {t('profile.sectionPreferences')}
          </Text>
          <View style={[styles.groupCard, cardSurface]}>
            <ProfileSettingsRow
              icon="cash-outline"
              label={t('profile.rowCurrency')}
              value={t('profile.currencyInrValue')}
              onPress={showSoon}
              accessibilityHint={t('profile.rowCurrencyHint')}
            />
            <View style={[styles.hairline, { backgroundColor: hairlineColor }]} />
            <ProfileSettingsRow
              icon="notifications-outline"
              label={t('profile.rowNotifications')}
              value={t('profile.rowNotificationsValue')}
              onPress={showSoon}
              accessibilityHint={t('profile.rowNotificationsHint')}
            />
            <View style={[styles.hairline, { backgroundColor: hairlineColor }]} />
            <View style={[styles.appearanceBlock, { backgroundColor: 'transparent' }]}>
              <Text
                style={[styles.appearanceEyebrow, { color: palette.textMuted }]}
                accessibilityRole="text"
              >
                {t('profile.appearanceEyebrow')}
              </Text>
              <ThemeToggle />
            </View>
          </View>
        </View>

        <View style={styles.sectionGap}>
          <Text
            style={[styles.sectionLabel, { color: palette.textMuted }]}
            accessibilityRole="text"
          >
            {t('profile.sectionSupport')}
          </Text>
          <View style={[styles.groupCard, cardSurface]}>
            <ProfileSettingsRow
              icon="help-circle-outline"
              label={t('profile.rowHelp')}
              onPress={openHelp}
              accessibilityHint={t('profile.rowHelpHint')}
            />
            <View style={[styles.hairline, { backgroundColor: hairlineColor }]} />
            <ProfileSettingsRow
              icon="document-text-outline"
              label={t('profile.rowTerms')}
              onPress={openTerms}
              accessibilityHint={t('profile.rowTermsHint')}
            />
            <View style={[styles.hairline, { backgroundColor: hairlineColor }]} />
            <ProfileSettingsRow
              icon="shield-checkmark-outline"
              label={t('profile.rowPrivacy')}
              onPress={openPrivacy}
              accessibilityHint={t('profile.rowPrivacyHint')}
            />
          </View>
        </View>

        <View style={styles.signOutBlock}>
          <Button
            accessibilityHint={t('profile.signOutHint')}
            accessibilityLabel={t('profile.signOut')}
            label={t('profile.signOut')}
            labelCase="none"
            onPress={() => void onSignOut()}
            trailing="none"
            variant="secondary"
          />
        </View>

        {PROFILE_APP_VERSION_FOOTER.length > 0 ? (
          <View style={styles.footerMeta}>
            <Text style={[styles.footerVersion, { color: palette.textMuted }]}>
              {t('profile.footerVersion', {
                version: PROFILE_APP_VERSION_FOOTER,
              })}
            </Text>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

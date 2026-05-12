import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState, type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, ScrollView, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, ThemeToggle } from '@/components/ui';
import { ROUTES } from '@/constants/routes';
import { useAuthMe, useAuthSession } from '@/features/auth/hooks';
import { getWelcomeDisplayNameFromAccessToken } from '@/features/auth/services/welcomeDisplayName';
import { profileScreenStyles as styles } from '@/features/profile/components/profileScreen.styles';
import { ProfileSettingsRow } from '@/features/profile/components/ProfileSettingsRow';
import { formatProfileIdentifierForDisplay } from '@/features/profile/utils/formatProfileIdentifier';
import { getQismaTabBarContentInset } from '@/features/qisma/constants/tabBarLayout';
import { platformShadow, space, useThemeColors } from '@/theme';

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
  const { data: me } = useAuthMe();

  const [avatarLoadFailed, setAvatarLoadFailed] = useState(false);

  const bottomInset = getQismaTabBarContentInset(insets.bottom);
  const scrollPadBottom = bottomInset + space.sectionGapLg;

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

  /** High-contrast slab; skip card drop-shadow on Android (reads like a dim overlay). */
  const cardSurface = useMemo(
    () => ({
      backgroundColor: palette.surfaceBase,
      borderColor: palette.border,
    }),
    [palette.border, palette.surfaceBase],
  );

  const hairlineColor = palette.borderSubtle;

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: palette.background }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: scrollPadBottom, paddingHorizontal: space.screenPadding },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.screenHeader}>
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

        <View style={styles.headerBlock}>
          <View
            style={[
              styles.avatarRing,
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
                style={styles.avatarImage}
                contentFit="cover"
                onError={() => setAvatarLoadFailed(true)}
                accessibilityIgnoresInvertColors
              />
            ) : (
              <Text style={[styles.avatarInitials, { color: palette.textPrimary }]}>
                {initials}
              </Text>
            )}
          </View>
          <Text
            style={[styles.displayName, { color: palette.textPrimary }]}
            accessibilityRole="header"
          >
            {displayName}
          </Text>
          <Text style={[styles.phoneLine, { color: palette.textSecondary }]}>{phoneDisplay}</Text>
          <Button
            variant="secondary"
            label={t('profile.editProfile')}
            onPress={showSoon}
            labelCase="none"
            trailing="none"
            contentAlign="center"
            fullWidth={false}
            style={styles.editProfileBtn}
            accessibilityHint={t('profile.editProfileHint')}
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
              icon="people-outline"
              label={t('profile.rowFriends')}
              onPress={showSoon}
              accessibilityHint={t('profile.rowFriendsHint')}
            />
            <View style={[styles.hairline, { backgroundColor: hairlineColor }]} />
            <ProfileSettingsRow
              icon="albums-outline"
              label={t('profile.rowGroups')}
              onPress={goGroups}
              accessibilityHint={t('profile.rowGroupsHint')}
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
              onPress={showSoon}
              accessibilityHint={t('profile.rowHelpHint')}
            />
            <View style={[styles.hairline, { backgroundColor: hairlineColor }]} />
            <ProfileSettingsRow
              icon="shield-checkmark-outline"
              label={t('profile.rowPrivacy')}
              onPress={showSoon}
              accessibilityHint={t('profile.rowPrivacyHint')}
            />
          </View>
        </View>

        <View style={styles.signOutWrap}>
          <Button
            variant="secondary"
            label={t('profile.signOut')}
            onPress={() => void onSignOut()}
            labelCase="none"
            trailing="none"
            accessibilityHint={t('profile.signOutHint')}
            haptic
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

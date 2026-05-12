import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, ThemeToggle } from '@/components/ui';
import {
  HomeEmptyHeroArt,
  type HomeEmptyHeroArtPalette,
} from '@/features/home/components/HomeEmptyHeroArt';
import { radius, size, space, textStyles, typography, useThemeColors, useThemeMode } from '@/theme';

export type PremiumHomeDashboardProps = {
  displayName: string | null;
  isProfileError: boolean;
  isProfileFetching: boolean;
  onRetryProfile: () => void;
  onProfilePress: () => void;
  buildMetaLine: string | null;
  onSearchPress?: () => void;
  onStartGroupPress?: () => void;
  /** When `GET /v1/groups` fails while the empty dashboard is shown. */
  isGroupsListError?: boolean;
  onRetryGroups?: () => void;
  /** Extra bottom padding when a translucent tab dock overlays the screen (e.g. Qisma bar). */
  scrollBottomPadding?: number;
};

export function PremiumHomeDashboard({
  displayName,
  isProfileError,
  isProfileFetching,
  onRetryProfile,
  onProfilePress,
  buildMetaLine,
  onSearchPress = () => {},
  onStartGroupPress = () => {},
  isGroupsListError = false,
  onRetryGroups = () => {},
  scrollBottomPadding,
}: PremiumHomeDashboardProps) {
  const palette = useThemeColors();
  const mode = useThemeMode();
  const { t } = useTranslation();

  const welcome = displayName
    ? t('home.welcomeTitle', { name: displayName })
    : t('home.welcomeBack');

  const artPalette: HomeEmptyHeroArtPalette = {
    surfaceRaised: palette.surfaceRaised,
    surfaceFloating: palette.surfaceFloating,
    surfaceElevated: palette.surfaceElevated,
    surfaceOverlay: palette.surfaceOverlay,
    borderSubtle: palette.borderSubtle,
    accentSoft: palette.accentSoft,
    textMuted: palette.textMuted,
    overlayStrong: palette.overlayStrong,
  };

  const handleSearch = () => {
    void Haptics.selectionAsync().catch(() => {});
    onSearchPress();
  };

  const handleStartGroup = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onStartGroupPress();
  };

  return (
    <SafeAreaView edges={['top']} style={[styles.safe, { backgroundColor: palette.background }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingBottom: scrollBottomPadding ?? space.sectionGapLg,
          },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topBar}>
          <View style={styles.leadingChrome}>
            <Pressable
              onPress={handleSearch}
              accessibilityRole="button"
              accessibilityLabel={t('home.searchA11y')}
              accessibilityHint={t('home.searchHint')}
              android_ripple={{ color: palette.ripple }}
              style={({ pressed }) => [
                styles.searchButton,
                {
                  borderColor: palette.borderSubtle,
                  opacity: pressed ? 0.9 : 1,
                },
              ]}
            >
              {Platform.OS === 'ios' ? (
                <BlurView
                  intensity={26}
                  tint={mode === 'dark' ? 'dark' : 'light'}
                  style={{
                    flex: 1,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name="search" size={22} color={palette.iconSecondary} />
                </BlurView>
              ) : (
                <View
                  style={{
                    flex: 1,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: palette.glassStrong,
                  }}
                >
                  <Ionicons name="search" size={22} color={palette.iconSecondary} />
                </View>
              )}
            </Pressable>
          </View>
          <View style={styles.trailingChrome}>
            <ThemeToggle />
          </View>
        </View>

        <View style={styles.welcomeBlock}>
          <Text style={[styles.welcome, { color: palette.textPrimary }]} accessibilityRole="header">
            {welcome}
          </Text>
          <Text style={[styles.tagline, { color: palette.textSecondary }]}>
            {t('home.tagline')}
          </Text>
        </View>

        {isGroupsListError ? (
          <View style={[styles.errorBanner, { borderColor: palette.border }]}>
            <Text style={[styles.errorText, { color: palette.textSecondary }]}>
              {t('groups.loadError')}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('groups.errorRetryA11y')}
              onPress={onRetryGroups}
              style={styles.retryBtn}
            >
              <Text style={[styles.retryLabel, { color: palette.accent }]}>
                {t('groups.retry')}
              </Text>
            </Pressable>
          </View>
        ) : null}

        {isProfileError ? (
          <View style={[styles.errorBanner, { borderColor: palette.border }]}>
            <Text style={[styles.errorText, { color: palette.textSecondary }]}>
              {t('home.profileSyncError')}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('home.retry')}
              onPress={onRetryProfile}
              disabled={isProfileFetching}
              style={styles.retryBtn}
            >
              <Text style={[styles.retryLabel, { color: palette.accent }]}>
                {isProfileFetching ? '…' : t('home.retry')}
              </Text>
            </Pressable>
          </View>
        ) : null}

        <View style={styles.heroStage}>
          <View
            pointerEvents="none"
            style={[
              styles.deckCard,
              styles.deckBack,
              {
                borderColor: palette.borderSubtle,
                backgroundColor: palette.surfaceBase,
              },
            ]}
          />
          <View
            pointerEvents="none"
            style={[
              styles.deckCard,
              styles.deckMid,
              {
                borderColor: palette.borderSubtle,
                backgroundColor: palette.surfaceElevated,
              },
            ]}
          />
          <HomeEmptyHeroArt palette={artPalette} />
        </View>

        <View style={styles.copyBlock}>
          <View
            style={[
              styles.primaryCtaHost,
              {
                borderRadius: radius.lg,
                backgroundColor: palette.accent,
                overflow: 'hidden',
              },
            ]}
          >
            <Button
              variant="accent"
              accentSlab="parent"
              fullWidth={false}
              label={t('home.startGroup')}
              onPress={handleStartGroup}
              labelCase="none"
              contentAlign="center"
              accessibilityHint={t('home.startGroupHint')}
              haptic={false}
              style={{
                borderRadius: radius.lg,
                minHeight: size.inputLg,
                paddingHorizontal: space.gapLg,
              }}
            />
          </View>
        </View>

        {buildMetaLine ? (
          <Text
            style={[styles.buildMeta, { color: palette.textMuted }]}
            accessibilityElementsHidden
            importantForAccessibility="no"
          >
            {buildMetaLine}
          </Text>
        ) : null}

        <View style={[styles.footerHairline, { backgroundColor: palette.borderSubtle }]} />

        <Button
          variant="secondary"
          label={t('home.profile')}
          onPress={() => {
            void Haptics.selectionAsync().catch(() => {});
            onProfilePress();
          }}
          labelCase="none"
          trailing="none"
          accessibilityHint={t('home.profileHint')}
          haptic={false}
          style={styles.secondaryFooter}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: {
    width: '100%',
    alignItems: 'stretch',
    paddingHorizontal: space.screenPadding,
    paddingTop: space.gapMd,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: space.sectionGap,
  },
  leadingChrome: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.gapSm,
    flexShrink: 0,
  },
  trailingChrome: {
    flexShrink: 0,
  },
  searchButton: {
    width: 48,
    height: 48,
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    flexShrink: 0,
  },
  welcomeBlock: {
    gap: space.gapSm,
    marginBottom: space.sectionGapLg,
  },
  welcome: {
    ...textStyles.displaySmall,
    letterSpacing: typography.letterSpacing.tight,
  },
  tagline: {
    ...textStyles.body,
    lineHeight: typography.fontSize.md * typography.lineHeight.relaxed,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.gap,
    paddingVertical: space.gapSm,
    paddingHorizontal: space.gapMd,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: space.gapLg,
  },
  errorText: {
    ...textStyles.caption,
    flex: 1,
  },
  retryBtn: {
    paddingVertical: space.paddingXs,
    paddingHorizontal: space.gapSm,
    minHeight: size.touchMin,
    justifyContent: 'center',
  },
  retryLabel: {
    ...textStyles.label,
  },
  heroStage: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 240,
    marginBottom: space.sectionGapLg,
  },
  deckCard: {
    position: 'absolute',
    width: '86%',
    maxWidth: 300,
    borderRadius: radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
  },
  deckBack: {
    height: 168,
    transform: [{ rotate: '-5deg' }, { translateY: 10 }],
    opacity: 0.55,
  },
  deckMid: {
    height: 178,
    transform: [{ rotate: '3deg' }, { translateY: 4 }],
    opacity: 0.72,
  },
  copyBlock: {
    alignSelf: 'stretch',
    width: '100%',
    marginBottom: space.sectionGapLg,
  },
  primaryCtaHost: {
    alignSelf: 'center',
    maxWidth: '100%',
    paddingHorizontal: space.gapSm,
    paddingVertical: space.gapSm,
  },
  buildMeta: {
    fontFamily: typography.fontFamily.mono.regular,
    fontSize: typography.fontSize['2xs'],
    lineHeight: typography.fontSize['2xs'] * typography.lineHeight.relaxed,
    letterSpacing: typography.letterSpacing.widest,
    textTransform: 'uppercase',
    textAlign: 'center',
    width: '100%',
    marginBottom: space.gapMd,
  },
  footerHairline: {
    height: StyleSheet.hairlineWidth,
    width: '100%',
    opacity: 0.85,
    marginBottom: space.gap,
  },
  secondaryFooter: {
    marginBottom: space.gapSm,
  },
});

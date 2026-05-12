import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { platformShadow, radius, space, useThemeColors } from '@/theme';

const SKELETON_ROWS = 3;
const AVATAR = 44;

/**
 * Placeholder rows while `GET …/group-invites` resolves (matches inbox card layout).
 */
export function InvitesInboxSkeleton(): ReactElement {
  const { t } = useTranslation();
  const palette = useThemeColors();

  return (
    <View
      style={styles.wrap}
      accessibilityRole="progressbar"
      accessibilityLabel={t('invites.loadingA11y')}
    >
      {Array.from({ length: SKELETON_ROWS }, (_, i) => (
        <View
          key={i}
          style={[styles.float, { borderRadius: radius.inviteCard }, platformShadow('sm')]}
        >
          <View
            style={[
              styles.card,
              {
                borderRadius: radius.inviteCard,
                borderColor: palette.borderSubtle,
                backgroundColor: palette.surfaceElevated,
              },
            ]}
          >
            <View style={styles.headerRow}>
              <View
                style={[
                  styles.avatar,
                  {
                    borderColor: palette.borderSubtle,
                    backgroundColor: palette.surfaceOverlay,
                  },
                ]}
                accessibilityElementsHidden
              />
              <View style={styles.headerTexts}>
                <View
                  style={[styles.titleBar, { backgroundColor: palette.surfaceOverlay }]}
                  accessibilityElementsHidden
                />
                <View
                  style={[
                    styles.lineBar,
                    { backgroundColor: palette.surfaceOverlay, width: '72%' },
                  ]}
                  accessibilityElementsHidden
                />
                <View
                  style={[
                    styles.lineBar,
                    { backgroundColor: palette.surfaceOverlay, width: '88%' },
                  ]}
                  accessibilityElementsHidden
                />
              </View>
            </View>
            <View style={styles.actions}>
              <View
                style={[styles.buttonBar, { backgroundColor: palette.surfaceOverlay, flex: 1 }]}
                accessibilityElementsHidden
              />
              <View
                style={[styles.buttonBar, { backgroundColor: palette.surfaceOverlay, flex: 1 }]}
                accessibilityElementsHidden
              />
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: space.screenPadding,
    paddingTop: space.gapMd,
    gap: space.gapLg,
  },
  float: {
    marginBottom: space.gapLg,
  },
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: space.gapLg,
    paddingVertical: space.sectionGapSm,
    gap: space.sectionGapSm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space.gapMd,
  },
  avatar: {
    width: AVATAR,
    height: AVATAR,
    borderRadius: radius.full,
    borderWidth: StyleSheet.hairlineWidth,
  },
  headerTexts: {
    flex: 1,
    gap: space.gapSm,
  },
  titleBar: {
    height: 20,
    borderRadius: radius.sm,
    width: '70%',
  },
  lineBar: {
    height: 13,
    borderRadius: radius.sm,
  },
  actions: {
    flexDirection: 'row',
    gap: space.gapMd,
    paddingTop: space.gapXs,
  },
  buttonBar: {
    height: 44,
    borderRadius: radius.md,
  },
});

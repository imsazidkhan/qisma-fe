import { router } from 'expo-router';
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import { ROUTES } from '@/constants/routes';
import { Button } from '@/components/ui';
import { DotMatrixField } from '@/features/invites/components/DotMatrixField';
import { radius, space, textStyles, useThemeColors } from '@/theme';

export type InvitesEmptyStateProps = {
  offline?: boolean;
  onRetry?: () => void;
};

export function InvitesEmptyState({ offline, onRetry }: InvitesEmptyStateProps): ReactElement {
  const { t } = useTranslation();
  const palette = useThemeColors();

  return (
    <View style={styles.wrap}>
      <DotMatrixField height={space.sectionGapLg * 2} rows={6} columns={16} />
      <Text
        style={[textStyles.h1, { color: palette.textPrimary, marginTop: space.sectionGap }]}
        accessibilityRole="header"
      >
        {t('invites.emptyHeroTitle')}
      </Text>
      <Text style={[textStyles.body, { color: palette.textSecondary, marginTop: space.gapMd }]}>
        {offline ? t('invites.offlineBanner') : t('invites.emptyHeroBody')}
      </Text>
      {offline && onRetry ? (
        <Button
          label={t('invites.retry')}
          variant="secondary"
          onPress={onRetry}
          trailing="none"
          accessibilityLabel={t('invites.retryA11y')}
          style={{ marginTop: space.sectionGap, alignSelf: 'stretch' }}
        />
      ) : null}
      <Button
        label={t('invites.emptyFindFriendsCta')}
        variant="secondary"
        onPress={() => router.push(ROUTES.HOME_CONTACTS_SYNC)}
        trailing="none"
        labelCase="none"
        accessibilityLabel={t('invites.emptyFindFriendsCtaA11y')}
        style={{ marginTop: space.gapLg, alignSelf: 'stretch' }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingVertical: space.sectionGap,
    paddingHorizontal: 0,
    borderRadius: radius['2xl'],
    alignItems: 'stretch',
  },
});

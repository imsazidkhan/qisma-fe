import { router } from 'expo-router';
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BackHeaderButton } from '@/components/ui';
import { InvitesInboxScreen } from '@/features/invites/components/InvitesInboxScreen';
import { space, useThemeColors } from '@/theme';

/** Stack route: `router.push('/home/invites')` (header inbox, deep links). */
export default function HomeInvitesRoute(): ReactElement {
  const { t } = useTranslation();
  const palette = useThemeColors();

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: palette.background }}>
      <View style={{ paddingHorizontal: space.screenPadding, paddingTop: space.gapSm }}>
        <BackHeaderButton
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
              return;
            }
            router.replace('/home');
          }}
          accessibilityLabel={t('common.backA11y')}
        />
      </View>
      <InvitesInboxScreen presentation="embedded" />
    </SafeAreaView>
  );
}

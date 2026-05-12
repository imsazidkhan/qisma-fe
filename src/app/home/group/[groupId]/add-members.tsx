import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useMemo, type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BackHeaderButton } from '@/components/ui';
import { AddGroupMembersScreen } from '@/features/groups/components/AddGroupMembersScreen';
import { groupDetailRouteStyles as styles } from '@/features/groups/components/groupDetailRoute.styles';
import { isUuid } from '@/features/groups/utils/isUuid';
import { space, textStyles, useThemeColors } from '@/theme';

function resolvedParam(value: string | string[] | undefined): string {
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value[0] ?? '';
  return '';
}

export default function HomeGroupAddMembersRoute(): ReactElement {
  const { t } = useTranslation();
  const palette = useThemeColors();
  const { groupId: rawId, userId: rawInviteUserId } = useLocalSearchParams<{
    groupId: string | string[];
    userId?: string | string[];
  }>();

  const groupId = useMemo(() => resolvedParam(rawId), [rawId]);
  const inviteUserIdParam = resolvedParam(rawInviteUserId);
  const inviteUserId = isUuid(inviteUserIdParam) ? inviteUserIdParam : undefined;

  const onBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/home');
  }, []);

  if (!isUuid(groupId)) {
    return (
      <SafeAreaView edges={['top']} style={[styles.safe, { backgroundColor: palette.background }]}>
        <View style={[styles.body, { paddingHorizontal: space.screenPadding }]}>
          <View style={styles.topRow}>
            <BackHeaderButton
              onPress={onBack}
              accessibilityLabel={t('groups.addMember.backA11y')}
            />
          </View>
          <Text
            style={[textStyles.h3, { color: palette.textPrimary, marginTop: space.sectionGap }]}
            accessibilityRole="header"
          >
            {t('groups.detail.notFoundTitle')}
          </Text>
          <Text style={[textStyles.body, { color: palette.textSecondary, marginTop: space.gapMd }]}>
            {t('groups.detail.notFoundBody')}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return <AddGroupMembersScreen groupId={groupId} onBack={onBack} initialUserId={inviteUserId} />;
}

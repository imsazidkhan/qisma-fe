import type { ReactElement } from 'react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ApiError } from '@/api';
import { BackHeaderButton } from '@/components/ui';
import { ExpenseCommentsSection } from '@/features/expenses/components/expenseComments/ExpenseCommentsSection';
import { useAuthMe } from '@/features/auth/hooks/useAuthMe';
import { useGroupMembers } from '@/features/groups/hooks/useGroupMembers';
import { layoutGrid, textStyles, useThemeColors } from '@/theme';

export type ExpenseCommentsScreenProps = {
  groupId: string;
  expenseId: string;
  onBack: () => void;
};

export function ExpenseCommentsScreen({
  groupId,
  expenseId,
  onBack,
}: ExpenseCommentsScreenProps): ReactElement {
  const { t } = useTranslation();
  const palette = useThemeColors();

  const gid = groupId.trim();
  const eid = expenseId.trim();
  const idOk = gid.length > 0 && eid.length > 0;

  const meQuery = useAuthMe();
  const rosterQuery = useGroupMembers(idOk ? gid : undefined);

  const currentUserId = meQuery.data?.id?.trim() ?? '';

  const isModerator = useMemo(() => {
    const roster = rosterQuery.data;
    if (!roster || currentUserId === '') return false;
    const self = roster.find((r) => r.id === currentUserId && r.status === 'active');
    return self?.role === 'owner' || self?.role === 'admin';
  }, [currentUserId, rosterQuery.data]);

  const memberDenied =
    rosterQuery.isError &&
    rosterQuery.error instanceof ApiError &&
    rosterQuery.error.code === 'NOT_GROUP_MEMBER';

  if (!idOk) {
    return (
      <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: palette.background }}>
        <View style={{ paddingHorizontal: layoutGrid.inset, gap: layoutGrid.sm }}>
          <BackHeaderButton accessibilityLabel={t('common.backA11y')} onPress={onBack} />
          <Text style={[textStyles.h3, { color: palette.textPrimary }]}>
            {t('expenses.comments.badRouteTitle')}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (memberDenied) {
    return (
      <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: palette.background }}>
        <View style={{ paddingHorizontal: layoutGrid.inset, gap: layoutGrid.sm }}>
          <BackHeaderButton accessibilityLabel={t('common.backA11y')} onPress={onBack} />
          <Text style={[textStyles.h3, { color: palette.textPrimary }]}>
            {t('expenses.comments.notMemberTitle')}
          </Text>
          <Text style={[textStyles.body, { color: palette.textSecondary }]}>
            {t('expenses.comments.notMemberBody')}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (meQuery.isPending || rosterQuery.isPending || currentUserId === '') {
    return (
      <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: palette.background }}>
        <View style={{ paddingHorizontal: layoutGrid.inset }}>
          <BackHeaderButton accessibilityLabel={t('common.backA11y')} onPress={onBack} />
        </View>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator
            accessibilityLabel={t('expenses.comments.loadingA11y')}
            color={palette.accent}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: palette.background }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={layoutGrid.inset}
        style={{ flex: 1 }}
      >
        <View
          style={{
            paddingHorizontal: layoutGrid.inset,
            gap: layoutGrid.sm,
            paddingBottom: layoutGrid.sm,
          }}
        >
          <BackHeaderButton accessibilityLabel={t('common.backA11y')} onPress={onBack} />
          <Text
            accessibilityRole="header"
            style={[textStyles.overline, { color: palette.textMuted }]}
          >
            {t('expenses.comments.screenEyebrow')}
          </Text>
          <Text style={[textStyles.h3, { color: palette.textPrimary }]}>
            {t('expenses.comments.screenTitle')}
          </Text>
        </View>
        <View style={{ flex: 1, paddingHorizontal: layoutGrid.inset }}>
          <ExpenseCommentsSection
            currentUserId={currentUserId}
            expenseId={eid}
            groupId={gid}
            isModerator={isModerator}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

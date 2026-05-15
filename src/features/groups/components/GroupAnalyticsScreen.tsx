import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { type ReactElement, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BackHeaderButton } from '@/components/ui';
import { GroupCategoryDonutSection } from '@/features/groups/components/groupAnalytics/GroupCategoryDonutSection';
import { useGroupAnalyticsBundle } from '@/features/groups/hooks/useGroupAnalyticsBundle';
import type { GroupAnalyticsQuery } from '@/features/groups/types/groupAnalytics.types';
import { categoryBreakdownToDonutSlices } from '@/features/groups/utils/groupAnalyticsDerived';
import { isUuid } from '@/features/groups/utils/isUuid';
import { platformShadow, radius, space, textStyles, typography, useThemeColors } from '@/theme';

export type GroupAnalyticsScreenProps = {
  groupId: string;
  onBack: () => void;
  onOpenMembers?: () => void;
};

export function GroupAnalyticsScreen({
  groupId,
  onBack,
  onOpenMembers,
}: GroupAnalyticsScreenProps): ReactElement {
  const { t } = useTranslation();
  const palette = useThemeColors();
  const query = useMemo((): GroupAnalyticsQuery => ({}), []);

  const enabled = isUuid(groupId);
  const bundle = useGroupAnalyticsBundle(enabled ? groupId : undefined, query, { enabled });

  const donutSlices = useMemo(
    () => categoryBreakdownToDonutSlices(bundle.categoryBreakdown),
    [bundle.categoryBreakdown],
  );
  const dominantSlice = donutSlices[0] ?? null;
  const dominantHeadline = dominantSlice
    ? t('groups.analytics.dominantCategory', { category: dominantSlice.label })
    : null;

  const showInitialLoader = bundle.isPending && bundle.categoryBreakdown.length === 0;

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: palette.background }}>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: space.screenPadding,
          paddingBottom: space.sectionGapLg,
          gap: space.gapMd,
        }}
        refreshControl={
          <RefreshControl
            refreshing={bundle.isFetching}
            onRefresh={() => bundle.refetchAll()}
            tintColor={palette.accent}
            colors={[palette.accent]}
          />
        }
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: space.gapXs,
            marginBottom: space.gapMd,
            alignSelf: 'stretch',
          }}
        >
          <BackHeaderButton
            onPress={onBack}
            accessibilityLabel={t('common.backA11y')}
            thinGlyph
            style={{ alignSelf: 'center', marginLeft: -space.gapSm }}
          />
          <Text
            accessibilityRole="header"
            numberOfLines={1}
            style={[textStyles.h3, { color: palette.textPrimary, flex: 1, minWidth: 0 }]}
          >
            {t('groups.analytics.title')}
          </Text>
          {onOpenMembers ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('groups.analytics.membersShortcutA11y')}
              hitSlop={12}
              onPress={() => {
                void Haptics.selectionAsync().catch(() => {});
                onOpenMembers();
              }}
              style={({ pressed }) => [
                platformShadow('xs'),
                {
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: StyleSheet.hairlineWidth,
                  borderColor: palette.borderSubtle,
                  backgroundColor: pressed ? palette.surfaceFloating : palette.surfaceElevated,
                },
              ]}
            >
              <Ionicons name="people-outline" size={22} color={palette.textPrimary} />
            </Pressable>
          ) : (
            <View style={{ width: 44, height: 44 }} />
          )}
        </View>
        {bundle.isError ? (
          <Text style={[textStyles.body, { color: palette.errorText }]}>
            {t('groups.analytics.loadError')}
          </Text>
        ) : null}

        {showInitialLoader ? <ActivityIndicator color={palette.accent} /> : null}

        {!showInitialLoader ? (
          <View style={{ gap: space.gapXs, alignSelf: 'stretch' }}>
            <Text
              style={[
                textStyles.overline,
                {
                  color: palette.textMuted,
                  letterSpacing: typography.letterSpacing.widest,
                },
              ]}
            >
              {t('groups.analytics.sectionCategories')}
            </Text>
            {donutSlices.length === 0 ? (
              <View
                style={{
                  borderRadius: radius['2xl'],
                  borderWidth: StyleSheet.hairlineWidth,
                  borderColor: palette.borderSubtle,
                  backgroundColor: palette.surfaceElevated,
                  padding: space.gapMd,
                }}
              >
                <Text style={[textStyles.caption, { color: palette.textMuted }]}>
                  {t('groups.analytics.empty')}
                </Text>
              </View>
            ) : (
              <GroupCategoryDonutSection
                compact
                dominantId={dominantSlice?.id ?? null}
                headline={dominantHeadline}
                slices={donutSlices}
              />
            )}
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

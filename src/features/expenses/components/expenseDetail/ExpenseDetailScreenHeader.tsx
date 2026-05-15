import { Ionicons } from '@expo/vector-icons';
import type { ReactElement } from 'react';
import { Text, View } from 'react-native';

import { BackHeaderButton, HeaderIconButton } from '@/components/ui';
import { ExpenseDetailMonoCategoryIcon } from '@/features/expenses/components/expenseDetail/ExpenseDetailMonoCategoryIcon';
import { expenseDetailScreenStyles as styles } from '@/features/expenses/screens/expenseDetailScreen.styles';
import type { ResolvedExpenseFeedCategoryVisual } from '@/features/expenses/utils/resolveExpenseFeedCategoryVisual';
import { size, textStyles, typography, useThemeColors } from '@/theme';

export type ExpenseDetailScreenHeaderProps = {
  title: string;
  groupTitle: string;
  /** True while group name is still fetching (placeholder row keeps layout stable). */
  groupSubtitleLoading: boolean;
  categoryVisual: ResolvedExpenseFeedCategoryVisual;
  headerSummaryA11y: string;
  backA11y: string;
  editA11y: string;
  shareA11y: string;
  offlineActionHint: string;
  showEditButton: boolean;
  actionsDisabled: boolean;
  /** Softer headline on graphite thread canvas (Nothing-style restrained contrast). */
  titleMuted?: boolean;
  onBack: () => void;
  onEdit: () => void;
  onShare: () => void;
};

export function ExpenseDetailScreenHeader({
  title,
  groupTitle,
  groupSubtitleLoading,
  categoryVisual,
  headerSummaryA11y,
  backA11y,
  editA11y,
  shareA11y,
  offlineActionHint,
  showEditButton,
  actionsDisabled,
  titleMuted = false,
  onBack,
  onEdit,
  onShare,
}: ExpenseDetailScreenHeaderProps): ReactElement {
  const palette = useThemeColors();
  const titleTrimmed = title.trim();
  const displayTitle = titleTrimmed !== '' ? titleTrimmed : '—';
  const groupPlaceholderStyle = groupSubtitleLoading ? { opacity: 0.42 } : undefined;

  return (
    <View style={styles.headerRoot}>
      <View style={styles.headerNavRow}>
        <BackHeaderButton accessibilityLabel={backA11y} thinGlyph onPress={onBack} />
        <View style={styles.headerNavSpacer} />
        <View style={styles.headerActions}>
          <HeaderIconButton
            accessibilityHint={actionsDisabled ? offlineActionHint : undefined}
            accessibilityLabel={shareA11y}
            disabled={actionsDisabled}
            onPress={onShare}
          >
            <Ionicons color={palette.iconMuted} name="share-outline" size={size.icon} />
          </HeaderIconButton>
          {showEditButton ? (
            <HeaderIconButton
              accessibilityHint={actionsDisabled ? offlineActionHint : undefined}
              accessibilityLabel={editA11y}
              disabled={actionsDisabled}
              onPress={onEdit}
            >
              <Ionicons color={palette.iconMuted} name="create-outline" size={size.icon} />
            </HeaderIconButton>
          ) : null}
        </View>
      </View>

      <View style={styles.headerIdentityRow}>
        <ExpenseDetailMonoCategoryIcon palette={palette} visual={categoryVisual} />
        <View
          accessibilityLabel={headerSummaryA11y}
          accessibilityRole="header"
          accessible
          style={styles.headerTitleColumn}
        >
          <Text
            accessible={false}
            importantForAccessibility="no"
            numberOfLines={3}
            style={[
              textStyles.h2,
              {
                color: titleMuted ? palette.textSecondary : palette.textPrimary,
                letterSpacing: typography.letterSpacing.tight,
              },
            ]}
          >
            {displayTitle}
          </Text>
          {groupSubtitleLoading || groupTitle !== '' ? (
            <Text
              accessible={false}
              importantForAccessibility="no"
              numberOfLines={1}
              style={[
                textStyles.captionSmall,
                groupPlaceholderStyle,
                {
                  color: palette.textMuted,
                  fontFamily: typography.fontFamily.mono.medium,
                  letterSpacing: typography.letterSpacing.widest,
                  textTransform: 'uppercase',
                  lineHeight: typography.fontSize.xs * typography.lineHeight.loose,
                },
              ]}
            >
              {groupSubtitleLoading ? '—' : groupTitle}
            </Text>
          ) : null}
        </View>
      </View>
    </View>
  );
}

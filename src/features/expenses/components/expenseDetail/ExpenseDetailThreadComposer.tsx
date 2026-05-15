import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import type { ReactElement } from 'react';
import { useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import type { NativeSyntheticEvent, TextInputKeyPressEventData } from 'react-native';
import { ActivityIndicator, Pressable, TextInput, View, Platform } from 'react-native';

import { EXPENSE_COMMENT_MESSAGE_MAX_LENGTH } from '@/features/expenses/constants/expenseComment';
import { expenseDetailThreadComposerStyles as styles } from '@/features/expenses/components/expenseDetail/expenseDetailThreadComposer.styles';
import { spacing, typography, useThemeColors, useThemeMode } from '@/theme';

const SEND_ICON = 18;

export type ExpenseDetailThreadComposerProps = {
  commentDraft: string;
  onCommentDraftChange: (text: string) => void;
  onSendComment: () => void;
  commentMutation: { isPending: boolean };
};

export function ExpenseDetailThreadComposer({
  commentDraft,
  onCommentDraftChange,
  onSendComment,
  commentMutation,
}: ExpenseDetailThreadComposerProps): ReactElement {
  const { t } = useTranslation();
  const palette = useThemeColors();
  const mode = useThemeMode();

  const draftEmpty = commentDraft.trim() === '';
  const isPending = commentMutation.isPending;
  const canSend = !draftEmpty && !isPending;

  /** Strip newline if Enter-to-send couldn't be cancelled (e.g. some Android paths). */
  const enterSendLeakRef = useRef(false);

  const handleChangeText = useCallback(
    (tx: string) => {
      let next = tx;
      if (enterSendLeakRef.current && next.endsWith('\n')) {
        next = next.slice(0, -1);
      }
      onCommentDraftChange(next.slice(0, EXPENSE_COMMENT_MESSAGE_MAX_LENGTH));
    },
    [onCommentDraftChange],
  );

  const handleKeyPress = useCallback(
    (e: NativeSyntheticEvent<TextInputKeyPressEventData>) => {
      // Physical Enter / Return + Shift detection is reliable on web; on iOS/Android soft
      // keyboards, Return must keep inserting newlines (Shift+Return is rarely available).
      if (Platform.OS !== 'web') return;

      const ne = e.nativeEvent as TextInputKeyPressEventData & { shiftKey?: boolean };
      const isEnter = ne.key === 'Enter' || ne.key === '\r';
      if (!isEnter || ne.shiftKey) return;

      e.preventDefault?.();
      enterSendLeakRef.current = true;
      globalThis.setTimeout(() => {
        enterSendLeakRef.current = false;
      }, 0);

      if (draftEmpty || isPending) return;
      if (canSend) onSendComment();
    },
    [canSend, draftEmpty, isPending, onSendComment],
  );

  const lineHeightPx = Math.round(
    typography.fontSize.threadComposer * typography.lineHeight.relaxed,
  );
  /** Match send control (44) and vertically center one line + placeholder on iOS (no `textAlignVertical`). */
  const inputMinH = spacing['11'];
  const iosPadY = Math.max(0, Math.floor((inputMinH - lineHeightPx) / 2));

  const sendReady =
    mode === 'light'
      ? {
          bg: palette.threadComposerSendIdle,
          fg: palette.iconPrimary,
          border: palette.borderFocus,
        }
      : {
          bg: palette.threadComposerSendActive,
          fg: palette.textPrimary,
          border: palette.borderStrong,
        };

  const sendFg = isPending || canSend ? sendReady.fg : palette.textDisabled;
  const sendBg = isPending || canSend ? sendReady.bg : 'transparent';
  const sendOutlineActive = isPending || canSend;
  const sendBorderColor = sendOutlineActive ? sendReady.border : palette.threadComposerBorder;

  return (
    <View style={styles.wrap}>
      <View
        style={[
          styles.shell,
          {
            backgroundColor: palette.threadComposerSurface,
            borderColor: palette.threadComposerBorder,
          },
        ]}
      >
        <TextInput
          accessibilityLabel={t('expenses.thread.composerPlaceholderA11y')}
          blurOnSubmit={false}
          editable={!isPending}
          {...(Platform.OS === 'android' ? { includeFontPadding: false } : {})}
          keyboardAppearance={mode === 'dark' ? 'dark' : 'light'}
          multiline
          placeholder={t('expenses.thread.composerPlaceholder')}
          placeholderTextColor={palette.threadComposerPlaceholder}
          returnKeyType="default"
          scrollEnabled={false}
          underlineColorAndroid="transparent"
          value={commentDraft}
          style={[
            styles.input,
            {
              color: palette.expenseThreadBubbleText,
              fontFamily: typography.fontFamily.sans.regular,
              fontSize: typography.fontSize.threadComposer,
              lineHeight: lineHeightPx,
              letterSpacing: typography.letterSpacing.normal,
              minHeight: inputMinH,
              ...(Platform.OS === 'ios'
                ? { paddingTop: iosPadY, paddingBottom: iosPadY }
                : { textAlignVertical: 'center' }),
            },
          ]}
          onChangeText={handleChangeText}
          onKeyPress={handleKeyPress}
        />

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            isPending
              ? t('expenses.detail.commentSendLoadingA11y')
              : t('expenses.detail.commentSendA11y')
          }
          accessibilityState={{ busy: isPending, disabled: !canSend }}
          disabled={!canSend}
          hitSlop={6}
          onPress={() => {
            if (!canSend) return;
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
            onSendComment();
          }}
          style={({ pressed }) => [
            styles.sendOuter,
            {
              backgroundColor: sendBg,
              borderColor: sendBorderColor,
              opacity: pressed && canSend ? 0.86 : 1,
            },
          ]}
        >
          {isPending ? (
            <ActivityIndicator accessibilityElementsHidden color={sendFg} size="small" />
          ) : (
            <Ionicons color={sendFg} name="arrow-up" size={SEND_ICON} />
          )}
        </Pressable>
      </View>
    </View>
  );
}

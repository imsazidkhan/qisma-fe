import type { ReactElement } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { Button } from '@/components/ui';
import { EXPENSE_COMMENT_MESSAGE_MAX_LENGTH } from '@/features/expenses/constants/expenseComment';
import { deriveCommentComposerState } from '@/features/expenses/utils/commentComposerDerived';
import { layoutGrid, radius, textStyles, typography, useThemeColors } from '@/theme';

export type CommentComposerProps = {
  draft: string;
  onDraftChange: (text: string) => void;
  onSubmit: () => void;
  busy?: boolean;
  placeholder: string;
  submitLabel: string;
  submitA11y: string;
  serverError?: string | null;
};

export function CommentComposer({
  draft,
  onDraftChange,
  onSubmit,
  busy = false,
  placeholder,
  submitLabel,
  submitA11y,
  serverError,
}: CommentComposerProps): ReactElement {
  const palette = useThemeColors();
  const derived = deriveCommentComposerState(draft);

  return (
    <View style={styles.wrap}>
      <TextInput
        accessibilityLabel={placeholder}
        multiline
        scrollEnabled={false}
        placeholder={placeholder}
        placeholderTextColor={palette.textMuted}
        value={draft}
        editable={!busy}
        onChangeText={(tx) => onDraftChange(tx.slice(0, EXPENSE_COMMENT_MESSAGE_MAX_LENGTH))}
        style={[
          styles.input,
          {
            borderColor: palette.borderSubtle,
            backgroundColor: palette.surfaceElevated,
            color: palette.textPrimary,
          },
        ]}
      />
      <View style={styles.footer}>
        <Text style={[textStyles.captionSmall, { color: palette.textMuted }]}>
          {derived.length}/{EXPENSE_COMMENT_MESSAGE_MAX_LENGTH}
        </Text>
        <Button
          accessibilityLabel={submitA11y}
          disabled={busy || !derived.canSubmit}
          label={submitLabel}
          loading={busy}
          trailing="none"
          variant="accent"
          labelCase="none"
          onPress={onSubmit}
        />
      </View>
      {serverError ? (
        <Text style={[textStyles.captionSmall, { color: palette.errorText }]}>{serverError}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: layoutGrid.sm,
    alignSelf: 'stretch',
  },
  input: {
    minHeight: 96,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.lg,
    padding: layoutGrid.sm,
    fontFamily: typography.fontFamily.sans.regular,
    textAlignVertical: 'top',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: layoutGrid.sm,
  },
});

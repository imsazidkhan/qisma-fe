import { StyleSheet } from 'react-native';

import { radius, spacing } from '@/theme';

/** Layout primitives — palettes from {@link useThemeColors}. */
export const expenseDetailThreadComposerStyles = StyleSheet.create({
  wrap: {
    alignSelf: 'stretch',
  },
  /** Row — center so first line / placeholder lines up with the send control; multiline still grows upward from composer baseline. */
  shell: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
    gap: spacing['3'],
    minHeight: spacing['11'],
    maxHeight: spacing['32'],
    paddingLeft: spacing['4'],
    paddingRight: spacing['3'],
    paddingVertical: spacing['2'],
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  input: {
    flex: 1,
    minWidth: 0,
    paddingHorizontal: 0,
    maxHeight: spacing['32'],
  },
  sendOuter: {
    width: spacing['11'],
    height: spacing['11'],
    borderRadius: radius.full,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
});

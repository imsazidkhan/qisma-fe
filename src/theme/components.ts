/**
 * Ready-to-spread component style presets.
 *
 * Each preset is a complete style object — no missing properties, no silent
 * inheritance. Spread into `StyleSheet.create()` directly.
 *
 * @example
 *   import { component } from '@/theme';
 *
 *   const styles = StyleSheet.create({
 *     primaryButton: { ...component.button.base, ...component.button.size.md, ...component.button.primary.resting },
 *   });
 */
import { colors, opacity } from './colors';
import { borders, borderWidth } from './borders';
import { radius } from './radius';
import { coloredShadow, platformShadow } from './shadows';
import { size } from './spacing';
import { textStyles } from './typography';

// ─────────────────────────────────────────────────────────────
// BUTTON
// ─────────────────────────────────────────────────────────────
const button = {
  base: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    borderRadius: radius.button,
    overflow: 'hidden' as const,
  },

  size: {
    sm: { height: size.buttonSm, paddingHorizontal: 12, gap: 6 },
    md: { height: size.button, paddingHorizontal: 20, gap: 8 },
    lg: { height: size.buttonLg, paddingHorizontal: 28, gap: 10 },
    icon: { width: size.button, height: size.button, paddingHorizontal: 0 },
    iconSm: { width: size.buttonSm, height: size.buttonSm, paddingHorizontal: 0 },
    iconLg: { width: size.buttonLg, height: size.buttonLg, paddingHorizontal: 0 },
  },

  primary: {
    resting: {
      backgroundColor: colors.accent,
      borderWidth: borderWidth.none,
      ...platformShadow('sm'),
    },
    pressed: { backgroundColor: colors.accentPress },
    disabled: { backgroundColor: colors.interactivePress, opacity: opacity.low },
    label: { ...textStyles.button, color: colors.textOnAccent },
  },

  secondary: {
    resting: { backgroundColor: colors.surface2, ...borders.default },
    pressed: { backgroundColor: colors.interactivePress, ...borders.strong },
    disabled: { backgroundColor: colors.surface, opacity: opacity.low },
    label: { ...textStyles.button, color: colors.textPrimary },
  },

  ghost: {
    resting: { backgroundColor: 'transparent', borderWidth: borderWidth.none },
    pressed: { backgroundColor: colors.overlay },
    disabled: { opacity: opacity.low },
    label: { ...textStyles.button, color: colors.textPrimary },
  },

  outline: {
    resting: { backgroundColor: 'transparent', ...borders.default },
    pressed: { backgroundColor: colors.overlay, ...borders.strong },
    disabled: { opacity: opacity.low },
    label: { ...textStyles.button, color: colors.textPrimary },
  },

  destructive: {
    resting: { backgroundColor: colors.errorSubtle, ...borders.errorSubtle },
    pressed: { backgroundColor: colors.errorPress, ...borders.error },
    disabled: { opacity: opacity.low },
    label: { ...textStyles.button, color: colors.errorText },
  },

  accent: {
    resting: {
      backgroundColor: colors.accent,
      borderWidth: borderWidth.none,
      ...platformShadow('sm'),
      ...coloredShadow.accent, // iOS-only glow
    },
    pressed: { backgroundColor: colors.accentPress },
    disabled: { opacity: opacity.low },
    label: { ...textStyles.button, color: colors.textOnAccent },
  },
} as const;

// ─────────────────────────────────────────────────────────────
// INPUT
// ─────────────────────────────────────────────────────────────
const input = {
  base: {
    width: '100%' as const,
    borderRadius: radius.input,
    paddingHorizontal: 16,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },

  size: {
    sm: { height: size.inputSm, paddingHorizontal: 12 },
    md: { height: size.input, paddingHorizontal: 16 },
    lg: { height: size.inputLg, paddingHorizontal: 20 },
  },

  resting: { backgroundColor: colors.surface2, ...borders.input },
  focus: { backgroundColor: colors.surface2, ...borders.inputFocus },
  error: { backgroundColor: colors.errorSubtle, ...borders.inputError },
  success: { backgroundColor: colors.surface2, ...borders.inputSuccess },
  disabled: { backgroundColor: colors.surface, ...borders.disabled, opacity: opacity.low },

  text: { ...textStyles.body, color: colors.textPrimary, flex: 1 },
  placeholder: { color: colors.placeholder },
  label: { ...textStyles.labelLarge, color: colors.textSecondary, marginBottom: 6 },
  helperText: { ...textStyles.captionSmall, color: colors.textMuted, marginTop: 4 },
  errorText: { ...textStyles.captionSmall, color: colors.errorText, marginTop: 4 },
} as const;

// ─────────────────────────────────────────────────────────────
// CARD
// ─────────────────────────────────────────────────────────────
const card = {
  flat: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: 20,
    ...borders.card,
  },
  raised: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: 20,
    ...borders.card,
    ...platformShadow('sm'),
  },
  elevated: {
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.cardLarge,
    padding: 24,
    ...borders.strong,
    ...platformShadow('md'),
  },
  ghost: {
    backgroundColor: 'transparent',
    borderRadius: radius.card,
    padding: 20,
  },
  interactive: {
    resting: {
      backgroundColor: colors.surface,
      borderRadius: radius.card,
      padding: 20,
      ...borders.card,
      ...platformShadow('sm'),
    },
    pressed: {
      backgroundColor: colors.surface2,
      ...platformShadow('xs'),
    },
  },

  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  body: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    borderTopWidth: borderWidth.hairline,
    borderTopColor: colors.border,
    borderStyle: 'solid' as const,
  },
} as const;

// ─────────────────────────────────────────────────────────────
// BADGE / TAG
// ─────────────────────────────────────────────────────────────
const badge = {
  base: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    alignSelf: 'flex-start' as const,
    borderRadius: radius.tag,
    paddingVertical: 3,
    paddingHorizontal: 8,
    gap: 4,
  },

  // Notification dot (counter)
  dot: {
    minWidth: 18,
    height: 18,
    borderRadius: radius.full,
    paddingHorizontal: 5,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: colors.error,
  },
  dotText: { ...textStyles.labelSmall, color: colors.white },

  default: {
    container: { backgroundColor: colors.surface3, ...borders.tag },
    text: { ...textStyles.label, color: colors.textSecondary },
  },
  success: {
    container: { backgroundColor: colors.successSubtle, ...borders.tagSuccess },
    text: { ...textStyles.label, color: colors.successText },
  },
  error: {
    container: { backgroundColor: colors.errorSubtle, ...borders.tagError },
    text: { ...textStyles.label, color: colors.errorText },
  },
  warning: {
    container: { backgroundColor: colors.warningSubtle, ...borders.tagWarning },
    text: { ...textStyles.label, color: colors.warningText },
  },
  accent: {
    container: {
      backgroundColor: colors.accentSoft,
      borderWidth: borderWidth.hairline,
      borderColor: colors.accent,
      borderStyle: 'solid' as const,
    },
    text: { ...textStyles.label, color: colors.accent },
  },
} as const;

// ─────────────────────────────────────────────────────────────
// AVATAR
// ─────────────────────────────────────────────────────────────
const avatar = {
  base: {
    borderRadius: radius.avatar,
    overflow: 'hidden' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: colors.surface3,
  },
  size: {
    xs: { width: size.avatarXs, height: size.avatarXs },
    sm: { width: size.avatarSm, height: size.avatarSm },
    md: { width: size.avatar, height: size.avatar },
    lg: { width: size.avatarLg, height: size.avatarLg },
    xl: { width: size.avatarXl, height: size.avatarXl },
    display: { width: size.avatarDisplay, height: size.avatarDisplay },
  },
  initials: {
    xs: { ...textStyles.labelSmall, color: colors.textSecondary },
    sm: { ...textStyles.label, color: colors.textSecondary },
    md: { ...textStyles.labelLarge, color: colors.textSecondary },
    lg: { ...textStyles.body, color: colors.textSecondary },
    xl: { ...textStyles.h4, color: colors.textSecondary },
  },
  ring: {
    borderWidth: borderWidth.thick,
    borderColor: colors.background,
    borderStyle: 'solid' as const,
  },
} as const;

// ─────────────────────────────────────────────────────────────
// DIVIDER
// ─────────────────────────────────────────────────────────────
const divider = {
  horizontal: {
    width: '100%' as const,
    height: borderWidth.hairline,
    backgroundColor: colors.border,
  },
  horizontalStrong: {
    width: '100%' as const,
    height: borderWidth.thin,
    backgroundColor: colors.borderStrong,
  },
  vertical: {
    width: borderWidth.hairline,
    height: '100%' as const,
    backgroundColor: colors.border,
  },
  withLabel: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 12,
  },
  label: { ...textStyles.captionSmall, color: colors.textMuted },
} as const;

// ─────────────────────────────────────────────────────────────
// LIST ITEM
// ─────────────────────────────────────────────────────────────
const listItem = {
  base: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.surface,
    gap: 12,
    minHeight: size.touchMin,
  },
  pressed: { backgroundColor: colors.interactiveHover },
  leading: {
    width: size.icon,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  content: { flex: 1, gap: 2 },
  title: { ...textStyles.bodyMedium, color: colors.textPrimary },
  subtitle: { ...textStyles.caption, color: colors.textSecondary },
  trailing: {
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  trailingText: { ...textStyles.caption, color: colors.textMuted },
} as const;

// ─────────────────────────────────────────────────────────────
// MODAL / BOTTOM SHEET / DIALOG
// ─────────────────────────────────────────────────────────────
const modal = {
  backdrop: {
    flex: 1,
    backgroundColor: colors.scrim,
    justifyContent: 'flex-end' as const,
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.modal,
    borderTopRightRadius: radius.modal,
    paddingBottom: 32,
    ...platformShadow('xl'),
  },
  handle: {
    alignSelf: 'center' as const,
    width: 36,
    height: size.bottomSheetHandle,
    borderRadius: radius.full,
    backgroundColor: colors.borderStrong,
    marginTop: 12,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: borderWidth.hairline,
    borderBottomColor: colors.border,
    borderStyle: 'solid' as const,
  },
  title: { ...textStyles.h4, color: colors.textPrimary },
  body: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  dialog: {
    backgroundColor: colors.surface,
    borderRadius: radius.modal,
    marginHorizontal: 24,
    padding: 24,
    ...platformShadow('2xl'),
  },
} as const;

// ─────────────────────────────────────────────────────────────
// TOAST / SNACKBAR
// ─────────────────────────────────────────────────────────────
const toast = {
  base: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: radius.notification,
    gap: 10,
    marginHorizontal: 16,
    ...platformShadow('lg'),
  },
  default: { backgroundColor: colors.surfaceOverlay, ...borders.strong },
  success: { backgroundColor: colors.successSubtle, ...borders.successSubtle },
  error: { backgroundColor: colors.errorSubtle, ...borders.errorSubtle },
  warning: { backgroundColor: colors.warningSubtle, ...borders.warningSubtle },
  title: { ...textStyles.bodyMedium, color: colors.textPrimary, flex: 1 },
  subtitle: { ...textStyles.caption, color: colors.textSecondary },
} as const;

// ─────────────────────────────────────────────────────────────
// SKELETON
// ─────────────────────────────────────────────────────────────
const skeleton = {
  base: { backgroundColor: colors.skeleton, overflow: 'hidden' as const },
  line: {
    height: 14,
    borderRadius: radius.skeleton,
    backgroundColor: colors.skeleton,
  },
  lineShort: {
    height: 14,
    width: '60%' as const,
    borderRadius: radius.skeleton,
    backgroundColor: colors.skeleton,
  },
  circle: {
    borderRadius: radius.skeletonCircle,
    backgroundColor: colors.skeleton,
  },
  rect: {
    borderRadius: radius.sm,
    backgroundColor: colors.skeleton,
  },
} as const;

// ─────────────────────────────────────────────────────────────
// SCREEN
// ─────────────────────────────────────────────────────────────
const screen = {
  base: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1, paddingHorizontal: 20 },
  contentNarrow: { flex: 1, paddingHorizontal: 16 },
  contentWide: { flex: 1, paddingHorizontal: 24 },
  centered: {
    flex: 1,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingHorizontal: 20,
  },
} as const;

// ─────────────────────────────────────────────────────────────
// EMPTY STATE
// ─────────────────────────────────────────────────────────────
const emptyState = {
  container: {
    flex: 1,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingHorizontal: 32,
    gap: 12,
  },
  icon: {
    width: 64,
    height: 64,
    borderRadius: radius.full,
    backgroundColor: colors.surface3,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: 4,
  },
  title: { ...textStyles.h3, color: colors.textPrimary, textAlign: 'center' as const },
  subtitle: { ...textStyles.body, color: colors.textSecondary, textAlign: 'center' as const },
} as const;

export const component = {
  button,
  input,
  card,
  badge,
  avatar,
  divider,
  listItem,
  modal,
  toast,
  skeleton,
  screen,
  emptyState,
} as const;

export type Component = typeof component;

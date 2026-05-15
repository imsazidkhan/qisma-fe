import { StyleSheet } from 'react-native';

import { GROUP_TYPE_ORDER } from '@/features/groups/constants/groupTypes';
import { layoutGrid, radius, size, space, spacing, typography } from '@/theme';
import { fontSize } from '@/theme/typography.tokens';

/** Type rows keep full metrics; hero uses `flexShrink: 0` so title/subtitle never collapse into the next section. */
const TYPE_PAD_H = spacing['4'];
const TYPE_PAD_V = spacing['4'];

/**
 * Create-group vertical metrics; body scrolls so type list + keyboard always fit on short viewports.
 */
export const CREATE_GROUP_LAYOUT = {
  backTop: spacing['2'],
  heroTop: spacing['5'],
  /** Air above the CTA while the main column clears the floating dock. */
  scrollBreathingAboveCta: spacing['6'],
  iconCard: spacing['10'],
  iconRowGap: spacing['2'],
  nameFieldH: spacing['12'],
  nameFieldRadius: radius.modal,
  namePadH: TYPE_PAD_H,
  typeCardMinH: spacing['16'],
  typeIconShell: spacing['11'],
  typeIconRadius: radius.full,
  typeStackGap: spacing['3'],
  ctaHeight: spacing['12'],
  ctaSideRail: spacing['8'],
  dockInsetHorizontal: layoutGrid.inset,
  dockPaddingBottom: spacing['4'],
} as const;

const TYPE_ROW_COUNT = GROUP_TYPE_ORDER.length;

/** Matches the stacked type rows only (no outer tray padding). */
export const CREATE_GROUP_TYPE_LIST_MIN_HEIGHT =
  TYPE_ROW_COUNT * CREATE_GROUP_LAYOUT.typeCardMinH +
  (TYPE_ROW_COUNT - 1) * CREATE_GROUP_LAYOUT.typeStackGap;

const HERO_SZ = fontSize['3xl'];

export const createGroupScreenStyles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  /** Scroll body — `paddingBottom` for CTA dock is set in JSX; `flexGrow` fills when content is short. */
  mainColumn: {
    flexGrow: 1,
    flexDirection: 'column',
    alignItems: 'stretch',
    width: '100%',
    paddingHorizontal: layoutGrid.inset,
  },
  backRow: {
    marginTop: CREATE_GROUP_LAYOUT.backTop,
  },
  backBlurClip: {
    width: size.touchMin,
    height: size.touchMin,
    borderRadius: size.touchMin / 2,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
  },
  backInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hero: {
    marginTop: CREATE_GROUP_LAYOUT.heroTop,
    paddingBottom: space.sectionGapSm,
    maxWidth: 400,
    alignSelf: 'stretch',
    flexShrink: 0,
  },
  heroTitle: {
    fontFamily: typography.fontFamily.sans.medium,
    fontSize: HERO_SZ,
    fontWeight: typography.fontWeight.medium,
    lineHeight: Math.round(HERO_SZ * 1.12),
    letterSpacing: HERO_SZ * -0.028,
  },
  heroSubtitle: {
    marginTop: spacing['3'],
    fontFamily: typography.fontFamily.sans.regular,
    fontSize: fontSize.sm,
    fontWeight: typography.fontWeight.regular,
    lineHeight: Math.round(fontSize.sm * 1.45),
    letterSpacing: 0,
  },
  section: {
    marginTop: space.sectionGapSm,
  },
  typeSection: {
    flexShrink: 0,
  },
  sectionLabel: {
    marginBottom: spacing['3'],
    fontFamily: typography.fontFamily.mono.medium,
    fontSize: fontSize.screenSection,
    fontWeight: typography.fontWeight.medium,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  sectionTypeHint: {
    marginBottom: spacing['3'],
    fontFamily: typography.fontFamily.sans.regular,
    fontSize: fontSize.sm,
    fontWeight: typography.fontWeight.regular,
    lineHeight: Math.round(fontSize.sm * 1.45),
  },
  panelIconStrip: {
    borderRadius: radius.modal,
    paddingVertical: spacing['3'],
    paddingHorizontal: spacing['3'],
    borderWidth: StyleSheet.hairlineWidth,
  },
  iconRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    /** `stretch`/`center` + `Pressable` as row child can explode height on Android inside `ScrollView`. */
    alignItems: 'flex-start',
    columnGap: CREATE_GROUP_LAYOUT.iconRowGap,
    rowGap: CREATE_GROUP_LAYOUT.iconRowGap,
  },
  /**
   * Hard clipping box — chip is **not** a direct flex child of `iconRow` (`Pressable` must not be).
   */
  iconSlotOuter: {
    width: CREATE_GROUP_LAYOUT.iconCard,
    height: CREATE_GROUP_LAYOUT.iconCard,
    position: 'relative',
    flexGrow: 0,
    flexShrink: 0,
    overflow: 'hidden',
    alignSelf: 'flex-start',
  },
  /** Fills `iconSlotOuter`; `Pressable` must wrap ink (not overlay it) so Android hit-testing matches `elevation`. */
  iconSlotPressable: {
    width: '100%',
    height: '100%',
  },
  iconCard: {
    width: '100%',
    height: '100%',
    borderRadius: radius.full,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  nameFieldShell: {
    height: CREATE_GROUP_LAYOUT.nameFieldH,
    borderRadius: CREATE_GROUP_LAYOUT.nameFieldRadius,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: CREATE_GROUP_LAYOUT.namePadH,
    justifyContent: 'center',
  },
  nameInput: {
    fontFamily: typography.fontFamily.sans.regular,
    fontSize: fontSize.md,
    fontWeight: typography.fontWeight.regular,
    letterSpacing: fontSize.md * -0.01,
    padding: 0,
    margin: 0,
    minHeight: CREATE_GROUP_LAYOUT.nameFieldH - 2,
    textAlignVertical: 'center',
  },
  nameCounter: {
    marginTop: spacing['2'],
    alignSelf: 'flex-end',
    fontFamily: typography.fontFamily.mono.medium,
    fontSize: fontSize['2xs'],
  },
  /** Invisible wrapper — rows carry their own surfaces (no tray behind the list). */
  typeListShell: {
    alignSelf: 'stretch',
    flexShrink: 0,
    backgroundColor: 'transparent',
    minHeight: CREATE_GROUP_TYPE_LIST_MIN_HEIGHT,
  },
  typeStack: {
    flexDirection: 'column',
    flexShrink: 0,
    minHeight:
      TYPE_ROW_COUNT * CREATE_GROUP_LAYOUT.typeCardMinH +
      (TYPE_ROW_COUNT - 1) * CREATE_GROUP_LAYOUT.typeStackGap,
  },
  /** Outer slot fixes row height — `Pressable` alone can collapse on some Android builds. */
  typeRowWrap: {
    width: '100%',
    alignSelf: 'stretch',
    minHeight: CREATE_GROUP_LAYOUT.typeCardMinH,
    flexShrink: 0,
  },
  /** Plain Views hold layout; hit target is overlaid — avoids Pressable flex bugs (web / some Android). */
  typeRowHitArea: {
    position: 'relative',
    width: '100%',
    minHeight: CREATE_GROUP_LAYOUT.typeCardMinH,
    alignSelf: 'stretch',
  },
  typeCard: {
    minHeight: CREATE_GROUP_LAYOUT.typeCardMinH,
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: TYPE_PAD_H,
    paddingVertical: TYPE_PAD_V,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    alignSelf: 'stretch',
    width: '100%',
  },
  typeCardSpacing: {
    marginBottom: CREATE_GROUP_LAYOUT.typeStackGap,
  },
  typeIconBoxWrap: {
    marginEnd: spacing['2'],
    flexShrink: 0,
  },
  typeIconBox: {
    width: CREATE_GROUP_LAYOUT.typeIconShell,
    height: CREATE_GROUP_LAYOUT.typeIconShell,
    borderRadius: CREATE_GROUP_LAYOUT.typeIconRadius,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    overflow: 'hidden',
  },
  typeTextCol: {
    flex: 1,
    minWidth: 0,
    alignSelf: 'stretch',
  },
  typeTitleSpaced: {
    marginBottom: spacing['0.5'],
  },
  typeTitle: {
    fontFamily: typography.fontFamily.sans.medium,
    fontSize: fontSize.base,
    fontWeight: typography.fontWeight.medium,
    letterSpacing: fontSize.base * -0.02,
  },
  typeDesc: {
    fontFamily: typography.fontFamily.sans.regular,
    fontSize: fontSize.sm,
    fontWeight: typography.fontWeight.regular,
    lineHeight: Math.round(fontSize.sm * 1.4),
  },
  ctaFloatWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: CREATE_GROUP_LAYOUT.dockInsetHorizontal,
    backgroundColor: 'transparent',
  },
  cta: {
    height: CREATE_GROUP_LAYOUT.ctaHeight,
    minHeight: CREATE_GROUP_LAYOUT.ctaHeight,
    borderRadius: radius.full,
    width: '100%',
    alignSelf: 'stretch',
    overflow: 'hidden',
  },
  ctaInner: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing['3'],
  },
  ctaRailSpacer: {
    width: CREATE_GROUP_LAYOUT.ctaSideRail,
  },
  ctaArrowRail: {
    width: CREATE_GROUP_LAYOUT.ctaSideRail,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaLabel: {
    flex: 1,
    fontFamily: typography.fontFamily.sans.medium,
    fontSize: fontSize.lg,
    fontWeight: typography.fontWeight.medium,
    letterSpacing: fontSize.lg * -0.02,
    textAlign: 'center',
  },
});

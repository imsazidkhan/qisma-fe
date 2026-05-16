import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import { type ReactElement, type ReactNode, type RefObject, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FloatingCTA } from '@/features/expenses/components/addExpense/FloatingCTA';
import type { GroupMemberRosterEntry } from '@/features/groups/types/groupMember.types';
import {
  platformShadow,
  radius,
  size,
  space,
  textStyles,
  typography,
  useThemeColors,
} from '@/theme';

export type MemberPickSheetProps = {
  sheetRef: RefObject<BottomSheetModal | null>;
  members: GroupMemberRosterEntry[];
  includedIds: string[];
  onIncludedChange: (next: string[]) => void;
  paidByUserId: string;
  onPaidByChange: (id: string) => void;
  currentUserId: string | undefined;
  onDone: () => void;
};

function initials(m: GroupMemberRosterEntry): string {
  const raw = m.name?.trim() || m.username?.trim() || '';
  if (raw.length >= 2) return raw.slice(0, 2).toUpperCase();
  return m.id.slice(0, 2).toUpperCase();
}

function memberLabel(
  m: GroupMemberRosterEntry,
  currentUserId: string | undefined,
  t: (key: string) => string,
): string {
  return m.id === currentUserId
    ? t('expenses.add.premium.splitParticipantYou')
    : (m.name ?? m.username ?? m.id.slice(0, 8));
}

const SHEET_HORIZONTAL_PAD = space.sectionGapSm;
const ROW_MIN_HEIGHT = size.avatar + space.gap * 2;

type Palette = ReturnType<typeof useThemeColors>;

type MemberPickRowProps = {
  selected: boolean;
  onPress: () => void;
  accessibilityRole: 'radio' | 'checkbox';
  accessibilityState: { selected?: boolean; checked?: boolean };
  accessibilityLabel: string;
  palette: Palette;
  children: ReactNode;
};

function MemberPickRow({
  selected,
  onPress,
  accessibilityRole,
  accessibilityState,
  accessibilityLabel,
  palette,
  children,
}: MemberPickRowProps): ReactElement {
  return (
    <Pressable
      accessibilityRole={accessibilityRole}
      accessibilityState={accessibilityState}
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ pressed }) => [
        {
          alignSelf: 'stretch',
          borderRadius: radius.lg,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: selected ? palette.accent : palette.borderSubtle,
          backgroundColor: selected ? palette.accentSoft : palette.surfaceFloating,
          opacity: pressed ? 0.92 : 1,
          paddingHorizontal: space.gapMd,
          paddingVertical: space.gapSm,
        },
        selected ? platformShadow('xs') : platformShadow('none'),
      ]}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          width: '100%',
          minHeight: ROW_MIN_HEIGHT,
          gap: space.gapMd,
        }}
      >
        {children}
      </View>
    </Pressable>
  );
}

export function MemberPickSheet({
  sheetRef,
  members,
  includedIds,
  onIncludedChange,
  paidByUserId,
  onPaidByChange,
  currentUserId,
  onDone,
}: MemberPickSheetProps): ReactElement {
  const { t } = useTranslation();
  const palette = useThemeColors();
  const insets = useSafeAreaInsets();
  const snapPoints = useMemo(() => ['72%', '92%'], []);

  const scrollBottomPad = useMemo(
    () => space.sectionGapXl + space.sectionGapLg + space.gapXl + insets.bottom,
    [insets.bottom],
  );

  const renderBackdrop = useCallback((props: BottomSheetBackdropProps) => {
    return (
      <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.42} />
    );
  }, []);

  const toggle = useCallback(
    (id: string) => {
      void Haptics.selectionAsync().catch(() => {});
      if (includedIds.includes(id)) {
        const next = includedIds.filter((x) => x !== id);
        onIncludedChange(next.length === 0 ? [id] : next);
        if (!next.includes(paidByUserId)) {
          const first = (next.length === 0 ? [id] : next)[0];
          if (first) onPaidByChange(first);
        }
        return;
      }
      onIncludedChange([...includedIds, id]);
    },
    [includedIds, onIncludedChange, onPaidByChange, paidByUserId],
  );

  const sheetBackgroundStyle = useMemo((): ViewStyle => {
    return {
      borderTopLeftRadius: radius.inviteCard,
      borderTopRightRadius: radius.inviteCard,
      backgroundColor: palette.sheetBackground,
      ...platformShadow('premiumCard'),
    };
  }, [palette.sheetBackground]);

  const avatar = useCallback(
    (m: GroupMemberRosterEntry): ReactNode => (
      <View
        style={{
          width: size.avatar,
          height: size.avatar,
          flexShrink: 0,
          borderRadius: radius.full,
          overflow: 'hidden',
          backgroundColor: palette.surfaceRaised,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: palette.borderSubtle,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {m.avatar ? (
          <Image
            source={{ uri: m.avatar }}
            style={{ width: '100%', height: '100%' }}
            contentFit="cover"
            accessibilityIgnoresInvertColors
          />
        ) : (
          <Text
            style={{
              fontFamily: typography.fontFamily.mono.medium,
              fontSize: typography.fontSize.sm,
              color: palette.textSecondary,
            }}
          >
            {initials(m)}
          </Text>
        )}
      </View>
    ),
    [palette.borderSubtle, palette.surfaceRaised, palette.textSecondary],
  );

  const radioTrailing = useCallback(
    (selected: boolean): ReactNode => (
      <View
        style={{
          width: size.iconMd,
          height: size.iconMd,
          flexShrink: 0,
          borderRadius: radius.full,
          borderWidth: selected ? 2 : StyleSheet.hairlineWidth,
          borderColor: selected ? palette.accent : palette.borderSubtle,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: selected ? palette.accentSoft : palette.surfaceFloating,
        }}
      >
        {selected ? (
          <View
            style={{
              width: space.gapSm,
              height: space.gapSm,
              borderRadius: radius.full,
              backgroundColor: palette.accent,
            }}
          />
        ) : null}
      </View>
    ),
    [palette.accent, palette.accentSoft, palette.borderSubtle, palette.surfaceFloating],
  );

  const checkboxTrailing = useCallback(
    (on: boolean): ReactNode => (
      <View
        style={{
          width: size.iconMd,
          height: size.iconMd,
          flexShrink: 0,
          borderRadius: radius.md,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: on ? palette.accent : palette.borderSubtle,
          backgroundColor: on ? palette.accentSoft : palette.surfaceFloating,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {on ? <Ionicons name="checkmark" size={18} color={palette.accent} /> : null}
      </View>
    ),
    [palette.accent, palette.accentSoft, palette.borderSubtle, palette.surfaceFloating],
  );

  const splitHeading = t('expenses.add.modern.membersSheetSplitWithCount', {
    count: includedIds.length,
  });

  return (
    <BottomSheetModal
      ref={sheetRef}
      stackBehavior="push"
      snapPoints={snapPoints}
      enableDynamicSizing={false}
      enablePanDownToClose
      enableBlurKeyboardOnGesture
      topInset={insets.top}
      bottomInset={insets.bottom}
      backdropComponent={renderBackdrop}
      handleIndicatorStyle={{
        backgroundColor: palette.borderSubtle,
        width: 40,
        height: 5,
        borderRadius: radius.sm,
      }}
      backgroundStyle={sheetBackgroundStyle}
    >
      <View style={{ flex: 1 }}>
        <BottomSheetScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingHorizontal: SHEET_HORIZONTAL_PAD,
            paddingTop: space.gapLg,
            paddingBottom: scrollBottomPad,
            gap: space.sectionGap,
          }}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={[textStyles.h3, { color: palette.textPrimary }]}>
            {t('expenses.add.modern.membersSheetTitle')}
          </Text>

          <View style={{ gap: space.gapMd }}>
            <View style={{ gap: space.gapXs }}>
              <Text
                style={{
                  fontFamily: typography.fontFamily.sans.semiBold,
                  fontSize: typography.fontSize.md,
                  lineHeight: typography.fontSize.md * typography.lineHeight.snug,
                  color: palette.textPrimary,
                }}
              >
                {t('expenses.add.payerLabel')}
              </Text>
              <Text style={[textStyles.captionSmall, { color: palette.textMuted }]}>
                {t('expenses.add.modern.membersSheetPaidByDescription')}
              </Text>
            </View>

            <View style={{ gap: space.gapSm }}>
              {members.map((m) => {
                const payer = paidByUserId === m.id;
                return (
                  <MemberPickRow
                    key={m.id}
                    selected={payer}
                    palette={palette}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: payer }}
                    accessibilityLabel={memberLabel(m, currentUserId, t)}
                    onPress={() => {
                      void Haptics.selectionAsync().catch(() => {});
                      onPaidByChange(m.id);
                    }}
                  >
                    {avatar(m)}
                    <Text
                      style={{
                        flex: 1,
                        minWidth: 0,
                        fontFamily: typography.fontFamily.sans.medium,
                        fontSize: typography.fontSize.md,
                        lineHeight: typography.fontSize.md * typography.lineHeight.snug,
                        color: payer ? palette.textPrimary : palette.textSecondary,
                      }}
                      numberOfLines={1}
                    >
                      {memberLabel(m, currentUserId, t)}
                    </Text>
                    {radioTrailing(payer)}
                  </MemberPickRow>
                );
              })}
            </View>
          </View>

          <View style={{ gap: space.gapMd }}>
            <View style={{ gap: space.gapXs }}>
              <Text
                style={{
                  fontFamily: typography.fontFamily.sans.semiBold,
                  fontSize: typography.fontSize.md,
                  lineHeight: typography.fontSize.md * typography.lineHeight.snug,
                  color: palette.textPrimary,
                }}
              >
                {splitHeading}
              </Text>
              <Text style={[textStyles.captionSmall, { color: palette.textMuted }]}>
                {t('expenses.add.modern.membersSheetSplitWithDescription')}
              </Text>
            </View>

            <View style={{ gap: space.gapSm }}>
              {members.map((m) => {
                const on = includedIds.includes(m.id);
                return (
                  <MemberPickRow
                    key={`inc-${m.id}`}
                    selected={on}
                    palette={palette}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: on }}
                    accessibilityLabel={memberLabel(m, currentUserId, t)}
                    onPress={() => toggle(m.id)}
                  >
                    {avatar(m)}
                    <Text
                      style={{
                        flex: 1,
                        minWidth: 0,
                        fontFamily: typography.fontFamily.sans.medium,
                        fontSize: typography.fontSize.md,
                        lineHeight: typography.fontSize.md * typography.lineHeight.snug,
                        color: on ? palette.textPrimary : palette.textSecondary,
                      }}
                      numberOfLines={1}
                    >
                      {memberLabel(m, currentUserId, t)}
                    </Text>
                    {checkboxTrailing(on)}
                  </MemberPickRow>
                );
              })}
            </View>
          </View>
        </BottomSheetScrollView>

        <View
          style={{
            borderTopWidth: StyleSheet.hairlineWidth,
            borderTopColor: palette.borderSubtle,
            backgroundColor: palette.sheetBackground,
            paddingHorizontal: SHEET_HORIZONTAL_PAD,
            paddingTop: space.gapMd,
            paddingBottom: space.gapMd + insets.bottom,
          }}
        >
          <FloatingCTA
            label={t('expenses.add.modern.membersSheetContinue')}
            accessibilityLabel={t('expenses.add.modern.membersSheetContinue')}
            onPress={() => {
              void Haptics.selectionAsync().catch(() => {});
              onDone();
            }}
          />
        </View>
      </View>
    </BottomSheetModal>
  );
}

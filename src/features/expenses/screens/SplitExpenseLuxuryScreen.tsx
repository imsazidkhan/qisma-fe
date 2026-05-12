import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Pressable,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuthMe } from '@/features/auth/hooks/useAuthMe';
import { MemberPickSheet } from '@/features/expenses/components/addExpense/MemberPickSheet';
import { SplitExpenseSheet } from '@/features/expenses/components/addExpense/SplitExpenseSheet';
import { LuxurySplitPressable } from '@/features/expenses/components/splitLuxury/LuxurySplitPressable';
import { useExpenseSplitState } from '@/features/expenses/hooks/useExpenseSplitState';
import type { ExpenseSplitType } from '@/features/expenses/types/expense.types';
import {
  firstSplitSheetDismissBlocker,
  formatPercentTotalForDisplay,
  payerIsOnSplit,
  sumPercentsForParticipants,
} from '@/features/expenses/utils/addExpenseSubmitReadiness';
import { minorToMajorString, parseAmountToMinor } from '@/features/expenses/utils/amountParsing';
import { computeEqualMajorPerPerson } from '@/features/expenses/utils/equalSplitPreview';
import { formatExpenseMajorAmount } from '@/features/expenses/utils/formatExpenseMajorAmount';
import {
  computeLocalSplitValidation,
  type LocalSplitFormState,
} from '@/features/expenses/utils/localExpenseSplit';
import {
  luxuryAmbientCardShadow,
  luxuryInnerRowShadow,
  useSplitLuxuryPalette,
} from '@/features/expenses/theme/splitLuxuryPalette';
import { useGroupMembers } from '@/features/groups/hooks/useGroupMembers';
import type { GroupMemberRosterEntry } from '@/features/groups/types/groupMember.types';
import { isUuid } from '@/features/groups/utils/isUuid';
import { radius, space, typography, useThemeMode } from '@/theme';

export type SplitExpenseLuxuryScreenProps = {
  groupId: string;
  /** Preview total shown in hints (optional). */
  initialAmountMajor?: string;
  onClose: () => void;
};

function splitMainRowTitleEnglish(t: (k: string) => string, splitType: ExpenseSplitType): string {
  switch (splitType) {
    case 'equal':
      return t('expenses.add.modern.splitEqually');
    case 'exact':
      return t('expenses.add.modern.splitByExact');
    case 'percentage':
      return t('expenses.add.modern.splitByPercent');
    case 'shares':
      return t('expenses.add.modern.splitByShare');
    default:
      return t('expenses.add.modern.splitEqually');
  }
}

function rosterPrimaryLabel(m: GroupMemberRosterEntry, isSelf: boolean): string {
  if (isSelf) {
    return m.name?.trim() || m.username?.trim() || m.id.slice(0, 8);
  }
  return m.username?.trim() || m.name?.trim() || m.id.slice(0, 8);
}

export function SplitExpenseLuxuryScreen({
  groupId,
  initialAmountMajor = '',
  onClose,
}: SplitExpenseLuxuryScreenProps): ReactElement {
  const { t } = useTranslation();
  const palette = useSplitLuxuryPalette();
  const mode = useThemeMode();
  const insets = useSafeAreaInsets();

  const { data: me } = useAuthMe();
  const rosterQuery = useGroupMembers(groupId, { enabled: isUuid(groupId) });
  const roster = useMemo(() => rosterQuery.data ?? [], [rosterQuery.data]);

  const [amount, setAmount] = useState(initialAmountMajor);
  const [paidByUserId, setPaidByUserId] = useState('');
  const [includedIds, setIncludedIds] = useState<string[]>([]);
  const [didSeed, setDidSeed] = useState(false);

  useEffect(() => {
    setAmount(initialAmountMajor);
  }, [initialAmountMajor]);

  const {
    splitType,
    setSplitType,
    exactByUserId,
    setExactByUserId,
    percentByUserId,
    setPercentByUserId,
    sharesByUserId,
    setSharesByUserId,
    adjustFixedByUserId,
    adjustRemainderUserId,
  } = useExpenseSplitState(includedIds);

  const amountMajorNormalized = amount.trim().replace(/,/g, '');
  const currencyResolved = useMemo(() => 'INR', []);

  const splitSheetRef = useRef<BottomSheetModal | null>(null);
  const memberSheetRef = useRef<BottomSheetModal | null>(null);

  const activeRoster = useMemo(() => roster.filter((r) => r.status === 'active'), [roster]);
  const activeRosterIds = useMemo(() => activeRoster.map((r) => r.id), [activeRoster]);

  useEffect(() => {
    if (didSeed || rosterQuery.isPending) {
      return;
    }
    setIncludedIds([...activeRosterIds]);
    if (activeRosterIds.length > 0) {
      if (me?.id && activeRosterIds.includes(me.id)) {
        setPaidByUserId(me.id);
      } else {
        setPaidByUserId(activeRosterIds[0] ?? '');
      }
    }
    setDidSeed(true);
  }, [activeRosterIds, didSeed, me?.id, rosterQuery.isPending]);

  useEffect(() => {
    if (includedIds.length === 0) {
      return;
    }
    if (!includedIds.includes(paidByUserId)) {
      const first = includedIds[0];
      if (first) setPaidByUserId(first);
    }
  }, [includedIds, paidByUserId]);

  const includedMembers = useMemo((): GroupMemberRosterEntry[] => {
    const set = new Set(includedIds);
    return activeRoster.filter((m) => set.has(m.id));
  }, [activeRoster, includedIds]);

  const splitFormState = useMemo(
    (): LocalSplitFormState => ({
      splitType,
      participantUserIds: includedIds,
      totalAmountMajor: amountMajorNormalized,
      currency: currencyResolved,
      exactByUserId,
      percentByUserId,
      sharesByUserId,
      adjustFixedByUserId,
      adjustRemainderUserId,
    }),
    [
      adjustFixedByUserId,
      adjustRemainderUserId,
      amountMajorNormalized,
      currencyResolved,
      exactByUserId,
      includedIds,
      percentByUserId,
      sharesByUserId,
      splitType,
    ],
  );

  const splitValidation = useMemo(
    () => computeLocalSplitValidation(splitFormState),
    [splitFormState],
  );
  const payerOnSplit = useMemo(
    () => payerIsOnSplit(paidByUserId, includedIds),
    [includedIds, paidByUserId],
  );
  const splitFormValid = splitValidation.kind === 'perfect' && payerOnSplit;

  const splitSubtitle = useMemo(() => {
    const cur = currencyResolved;
    const normalizedAmount = amountMajorNormalized;

    if (splitType === 'equal') {
      const n = includedIds.length;
      if (n === 0) {
        return t('expenses.add.modern.splitSubtitleEqualNoPeople');
      }
      const totalMinor = parseAmountToMinor(normalizedAmount);
      if (totalMinor === null) {
        return t('expenses.add.modern.splitReadinessEqualNeedAmount');
      }
      const parts = computeEqualMajorPerPerson(normalizedAmount, n);
      if (!parts) {
        return t('expenses.add.modern.splitReadinessEqualNeedAmount');
      }
      const minors = parts
        .map((p) => parseAmountToMinor(p.replace(/,/g, '')))
        .filter((m): m is number => m !== null);
      if (minors.length === 0) {
        return t('expenses.add.modern.splitSubtitleEveryonePays', {
          amount: formatExpenseMajorAmount('0', cur),
        });
      }
      const minM = Math.min(...minors);
      const maxM = Math.max(...minors);
      if (minM === maxM) {
        return t('expenses.add.modern.splitSubtitleEveryonePays', {
          amount: formatExpenseMajorAmount(minorToMajorString(minM), cur),
        });
      }
      const low = formatExpenseMajorAmount(minorToMajorString(minM), cur);
      const high = formatExpenseMajorAmount(minorToMajorString(maxM), cur);
      return t('expenses.add.modern.splitSubtitleEveryonePaysRange', { low, high });
    }

    if (splitType === 'percentage') {
      const sum = sumPercentsForParticipants(includedIds, percentByUserId);
      const pctLabel = formatPercentTotalForDisplay(sum);
      return t('expenses.add.modern.splitReadinessLine', {
        mode: t('expenses.add.modern.tabPercent'),
        detail: `${pctLabel}%`,
      });
    }

    if (splitType === 'exact') {
      const detail = splitFormValid
        ? t('expenses.add.modern.splitStatusReady')
        : t('expenses.add.modern.splitStatusNeedsReview');
      return t('expenses.add.modern.splitReadinessLine', {
        mode: t('expenses.add.modern.tabExact'),
        detail,
      });
    }

    const detail = splitFormValid
      ? t('expenses.add.modern.splitStatusReady')
      : t('expenses.add.modern.splitStatusNeedsReview');
    return t('expenses.add.modern.splitReadinessLine', {
      mode: t('expenses.add.modern.tabShare'),
      detail,
    });
  }, [
    amountMajorNormalized,
    currencyResolved,
    includedIds,
    percentByUserId,
    splitFormValid,
    splitType,
    t,
  ]);

  const openSplit = useCallback(() => {
    void Haptics.selectionAsync().catch(() => {});
    splitSheetRef.current?.present();
  }, []);

  const openMembers = useCallback(() => {
    void Haptics.selectionAsync().catch(() => {});
    memberSheetRef.current?.present();
  }, []);

  const onSplitSheetSave = useCallback(() => {
    const key = firstSplitSheetDismissBlocker(splitFormState, paidByUserId, includedIds);
    if (key) {
      Alert.alert(t('expenses.add.errorTitle'), t(key));
      return;
    }
    splitSheetRef.current?.dismiss();
  }, [includedIds, paidByUserId, splitFormState, t]);

  if (!isUuid(groupId)) {
    return (
      <SafeAreaView style={[styles.flex, { backgroundColor: palette.canvas }]} edges={['top']}>
        <Text style={{ color: palette.textSecondary, padding: space.paddingLg }}>
          {t('expenses.add.validationGroupId')}
        </Text>
      </SafeAreaView>
    );
  }

  if (rosterQuery.isPending && !didSeed) {
    return (
      <SafeAreaView
        style={[styles.flex, styles.centered, { backgroundColor: palette.canvas }]}
        edges={['top', 'bottom']}
      >
        <ActivityIndicator color={palette.accent} />
      </SafeAreaView>
    );
  }

  if (activeRoster.length === 0) {
    return (
      <SafeAreaView style={[styles.flex, { backgroundColor: palette.canvas }]} edges={['top']}>
        <Text style={{ color: palette.textSecondary, padding: space.paddingLg }}>
          {t('expenses.add.validationRoster')}
        </Text>
      </SafeAreaView>
    );
  }

  const blurTint = mode === 'dark' ? 'dark' : 'light';

  const cardElev = luxuryAmbientCardShadow(palette);

  return (
    <SafeAreaView
      style={[styles.flex, { backgroundColor: palette.canvas }]}
      edges={['top', 'bottom']}
    >
      <LinearGradient
        colors={[palette.canvas, palette.canvasEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      <ScrollView
        style={styles.flex}
        contentContainerStyle={{
          paddingTop: space.gapMd,
          paddingBottom: space.sectionGap + insets.bottom,
          paddingHorizontal: space.paddingLg,
          gap: space.sectionGap,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('expenses.add.modern.closeA11y')}
            onPress={() => {
              void Haptics.selectionAsync().catch(() => {});
              onClose();
            }}
            hitSlop={12}
          >
            <Ionicons name="close" size={26} color={palette.textPrimary} />
          </Pressable>
          <Text
            style={{
              fontFamily: typography.fontFamily.mono.medium,
              fontSize: typography.fontSize.screenSection,
              letterSpacing: typography.letterSpacing.widest,
              textTransform: 'uppercase',
              color: palette.textMuted,
            }}
          >
            lastbench
          </Text>
          <View style={{ width: 26 }} />
        </View>

        {/* Split configuration */}
        <View
          style={[
            {
              backgroundColor: palette.card,
              borderRadius: radius.inviteCard,
              padding: space.paddingLg,
              borderWidth: StyleSheet.hairlineWidth,
              borderColor: palette.borderHairline,
            },
            cardElev,
          ]}
        >
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
            }}
          >
            <View style={{ flex: 1, paddingRight: space.gap }}>
              <Text
                style={{
                  fontFamily: typography.fontFamily.sans.bold,
                  fontSize: typography.fontSize.hubTitle,
                  lineHeight: typography.fontSize.hubTitle * typography.lineHeight.tight,
                  letterSpacing: typography.letterSpacing.tight,
                  color: palette.textPrimary,
                  marginBottom: space.gapSm,
                }}
              >
                {t('expenses.add.modern.splitMethodKicker')}
              </Text>
              <Text
                style={{
                  fontFamily: typography.fontFamily.sans.medium,
                  fontSize: typography.fontSize.lg,
                  lineHeight: typography.fontSize.lg * typography.lineHeight.normal,
                  color: palette.textMuted,
                }}
              >
                {t('expenses.add.modern.splitDivideSubtitle')}
              </Text>
            </View>

            <LuxurySplitPressable
              accessibilityLabel={t('expenses.add.modern.splitEditHint')}
              enableHaptics
              onPress={openSplit}
            >
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: radius.md,
                  overflow: 'hidden',
                  borderWidth: StyleSheet.hairlineWidth,
                  borderColor: palette.glassBorder,
                  backgroundColor: Platform.OS === 'ios' ? 'transparent' : palette.glassFallback,
                }}
              >
                {Platform.OS === 'ios' ? (
                  <BlurView intensity={42} tint={blurTint} style={StyleSheet.absoluteFillObject} />
                ) : null}
                <View style={styles.glassInner}>
                  <Ionicons name="scale-outline" size={21} color={palette.textSecondary} />
                </View>
              </View>
            </LuxurySplitPressable>
          </View>

          <View style={{ height: space.gapLg }} />

          <LuxurySplitPressable
            accessibilityLabel={splitMainRowTitleEnglish(t, splitType)}
            onPress={openSplit}
            enableHaptics
            style={{
              minHeight: 70,
              borderRadius: radius.full,
              backgroundColor: palette.selectorSurface,
              borderWidth: StyleSheet.hairlineWidth,
              borderColor: palette.borderHairline,
              paddingVertical: space.gapSm,
              paddingHorizontal: space.gapMd + 4,
              ...luxuryInnerRowShadow(palette),
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.gapMd }}>
              <View style={{ width: 24, flexShrink: 0, alignItems: 'center' }}>
                <Ionicons name="pie-chart-outline" size={23} color={palette.textMuted} />
              </View>
              <Text
                style={{
                  flex: 1,
                  minWidth: 0,
                  fontFamily: typography.fontFamily.sans.semiBold,
                  fontSize: typography.fontSize['2xl'],
                  lineHeight: typography.fontSize['2xl'] * typography.lineHeight.snug,
                  letterSpacing: typography.letterSpacing.tight,
                  color: palette.textPrimary,
                  ...(Platform.OS === 'android' ? { includeFontPadding: false as const } : {}),
                }}
                numberOfLines={2}
              >
                {splitMainRowTitleEnglish(t, splitType)}
              </Text>
              <View style={{ flexShrink: 0 }}>
                <Ionicons name="chevron-down" size={20} color={palette.iconMuted} />
              </View>
            </View>
          </LuxurySplitPressable>

          <Text
            style={{
              marginTop: space.gapMd,
              marginLeft: 2,
              fontFamily: typography.fontFamily.sans.regular,
              fontSize: typography.fontSize.sm,
              lineHeight: typography.fontSize.sm * typography.lineHeight.normal,
              color:
                splitType !== 'equal' && !splitFormValid ? palette.accentMuted : palette.textMuted,
            }}
          >
            {splitSubtitle}
          </Text>
        </View>

        {/* People */}
        <View
          style={[
            {
              backgroundColor: palette.card,
              borderRadius: radius['3xl'],
              padding: space.paddingLg,
              borderWidth: StyleSheet.hairlineWidth,
              borderColor: palette.borderHairline,
            },
            luxuryAmbientCardShadow(palette),
          ]}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: space.gap,
            }}
          >
            <Text
              style={{
                fontFamily: typography.fontFamily.sans.bold,
                fontSize: typography.fontSize['3xl'],
                lineHeight: typography.fontSize['3xl'] * typography.lineHeight.tight,
                letterSpacing: typography.letterSpacing.tight,
                color: palette.textPrimary,
              }}
            >
              {t('expenses.add.modern.peopleCardKicker')}
            </Text>

            <LuxurySplitPressable
              accessibilityLabel={t('expenses.add.modern.participantsAddChipA11y')}
              onPress={openMembers}
              enableHaptics
              style={{ flexDirection: 'row', alignItems: 'center', gap: space.gapSm }}
            >
              <View
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: radius.full,
                  backgroundColor: palette.accentTintFill,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="add" size={22} color={palette.accent} />
              </View>
              <Text
                style={{
                  fontFamily: typography.fontFamily.sans.medium,
                  fontSize: typography.fontSize.md,
                  color: palette.accent,
                }}
              >
                {t('expenses.add.modern.addPersonLink')}
              </Text>
            </LuxurySplitPressable>
          </View>

          <View style={{ gap: space.gapMd }}>
            {includedMembers.map((m) => {
              const isSelf = m.id === me?.id;
              const isPayer = m.id === paidByUserId;
              const label = rosterPrimaryLabel(m, isSelf);
              const initialsTxt = label.slice(0, 2).toUpperCase();
              return (
                <View
                  key={m.id}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: space.gap,
                    paddingVertical: space.gapMd + 2,
                    paddingHorizontal: space.gapMd + 4,
                    borderRadius: radius['2xl'],
                    backgroundColor: palette.rowSurface,
                    borderWidth: StyleSheet.hairlineWidth,
                    borderColor: palette.borderHairline,
                    ...luxuryInnerRowShadow(palette),
                  }}
                >
                  <LuxurySplitPressable
                    accessibilityRole="button"
                    accessibilityLabel={`${label}${isPayer ? ` · ${t('expenses.add.premium.paidBadge')}` : ''}`}
                    onPress={() => {
                      void Haptics.selectionAsync().catch(() => {});
                      setPaidByUserId(m.id);
                    }}
                    enableHaptics
                    style={{
                      flex: 1,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: space.gap,
                      minWidth: 0,
                    }}
                  >
                    <View
                      style={{
                        shadowColor: palette.shadowIos,
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: Platform.OS === 'ios' ? 0.22 : 0.18,
                        shadowRadius: Platform.OS === 'ios' ? 8 : 4,
                        elevation: 6,
                        borderRadius: radius.full,
                      }}
                    >
                      <LinearGradient
                        colors={[palette.textPrimary, palette.avatarGradientEnd]}
                        start={{ x: 0.1, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={[styles.avatar, { overflow: 'hidden' }]}
                      >
                        <Text
                          style={{
                            fontFamily: typography.fontFamily.sans.medium,
                            fontSize: typography.fontSize.lg,
                            color: palette.avatarInitials,
                            letterSpacing: 0.4,
                          }}
                        >
                          {initialsTxt}
                        </Text>
                      </LinearGradient>
                    </View>

                    <View style={{ flex: 1, minWidth: 0, justifyContent: 'center', gap: 4 }}>
                      <Text
                        numberOfLines={1}
                        style={{
                          fontFamily: typography.fontFamily.sans.semiBold,
                          fontSize: typography.fontSize['2xl'],
                          color: palette.textPrimary,
                        }}
                      >
                        {label}
                      </Text>
                      <View
                        style={{ flexDirection: 'row', alignItems: 'center', gap: space.gapSm }}
                      >
                        <Text
                          style={{
                            fontFamily: typography.fontFamily.sans.medium,
                            fontSize: typography.fontSize.sm,
                            color: palette.textMuted,
                          }}
                        >
                          {t('expenses.add.modern.participantStatusLabel')}
                        </Text>
                        {isPayer ? (
                          <View
                            style={{
                              flexDirection: 'row',
                              alignItems: 'center',
                              gap: 4,
                              paddingVertical: 4,
                              paddingHorizontal: space.gapSm,
                              borderRadius: radius.full,
                              backgroundColor: palette.paidBg,
                            }}
                          >
                            <Ionicons name="checkmark" size={11} color={palette.paidText} />
                            <Text
                              style={{
                                fontFamily: typography.fontFamily.sans.semiBold,
                                fontSize: typography.fontSize['2xs'],
                                letterSpacing: typography.letterSpacing.wider,
                                textTransform: 'uppercase',
                                color: palette.paidText,
                              }}
                            >
                              {t('expenses.add.premium.paidBadge')}
                            </Text>
                          </View>
                        ) : null}
                      </View>
                    </View>
                  </LuxurySplitPressable>

                  <LuxurySplitPressable
                    accessibilityRole="button"
                    accessibilityLabel={t('expenses.add.modern.splitLuxuryPersonMenuA11y')}
                    onPress={() => {
                      openMembers();
                    }}
                    enableHaptics
                  >
                    <View
                      style={{
                        paddingVertical: 8,
                        paddingHorizontal: space.gapSm,
                        borderRadius: radius.md,
                      }}
                    >
                      <Ionicons name="ellipsis-vertical" size={20} color={palette.iconMuted} />
                    </View>
                  </LuxurySplitPressable>
                </View>
              );
            })}

            <LuxurySplitPressable
              onPress={openMembers}
              enableHaptics
              accessibilityLabel={t('expenses.add.modern.participantsAddChipA11y')}
              style={{
                minHeight: 76,
                borderRadius: radius['2xl'],
                borderWidth: 1,
                borderStyle: 'dashed',
                borderColor: palette.dashedBorder,
                backgroundColor: palette.accentTintFill,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: space.gapSm,
              }}
            >
              <Ionicons name="add" size={22} color={palette.accent} />
              <Text
                style={{
                  fontFamily: typography.fontFamily.sans.medium,
                  fontSize: typography.fontSize.base,
                  color: palette.accent,
                }}
              >
                {t('expenses.add.modern.addAnotherPerson')}
              </Text>
            </LuxurySplitPressable>
          </View>
        </View>
      </ScrollView>

      <SplitExpenseSheet
        sheetRef={splitSheetRef}
        splitType={splitType}
        onChangeSplitType={setSplitType}
        includedMembers={includedMembers}
        totalAmountMajor={amountMajorNormalized}
        currency={currencyResolved}
        currentUserId={me?.id}
        paidByUserId={paidByUserId}
        exactByUserId={exactByUserId}
        setExactByUserId={setExactByUserId}
        percentByUserId={percentByUserId}
        setPercentByUserId={setPercentByUserId}
        sharesByUserId={sharesByUserId}
        setSharesByUserId={setSharesByUserId}
        onSave={onSplitSheetSave}
      />

      <MemberPickSheet
        sheetRef={memberSheetRef}
        members={activeRoster}
        includedIds={includedIds}
        onIncludedChange={setIncludedIds}
        paidByUserId={paidByUserId}
        onPaidByChange={setPaidByUserId}
        currentUserId={me?.id}
        onDone={() => memberSheetRef.current?.dismiss()}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  glassInner: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

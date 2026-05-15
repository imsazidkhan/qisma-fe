import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import type { TFunction } from 'i18next';
import { useCallback, useEffect, useMemo, useState, type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import {
  AccessibilityInfo,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSharedValue, withTiming } from 'react-native-reanimated';
import { FlashList, type ListRenderItemInfo } from '@shopify/flash-list';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { ApiError } from '@/api';
import { BackHeaderButton } from '@/components/ui';
import { PhoneInput, phoneInputLoginPreset } from '@/features/auth/components/PhoneInput';
import type { AddGroupMemberBody } from '@/features/groups/api/groupMembersApi';
import { addGroupMemberModalStyles as styles } from '@/features/groups/components/addGroupMemberModal.styles';
import { InviteStickyCta } from '@/features/groups/components/addMembers/InviteStickyCta';
import { SelectedContactRow } from '@/features/groups/components/addMembers/SelectedContactRow';
import { ContactsPermissionIntroCard } from '@/features/groups/components/ContactsPermissionIntroCard';
import { useContactsPermission } from '@/features/groups/hooks/useContactsPermission';
import { useDeviceContactInviteRows } from '@/features/groups/hooks/useDeviceContactInviteRows';
import { useGroupMembers } from '@/features/groups/hooks/useGroupMembers';
import { buildGroupInviteDeepLink } from '@/features/groups/utils/buildGroupInviteDeepLink';
import { buildPhoneInviteBatch } from '@/features/groups/utils/buildPhoneInviteBatch';
import { isUuid } from '@/features/groups/utils/isUuid';
import { resolvePhoneInviteRowState } from '@/features/groups/utils/resolveAddMemberInviteRowState';
import { DEFAULT_PHONE_REGION } from '@/constants';
import { shareTextNative } from '@/services';
import type { DeviceContactInviteRow } from '@/services/deviceContacts';
import { isValidPhone, normalizeToE164, stripPhoneInput, tryNormalizeToE164 } from '@/utils';
import {
  duration,
  easing,
  space,
  textStyles,
  typography,
  useThemeColors,
  useThemeMode,
} from '@/theme';

export type AddGroupMembersVariant = 'modal' | 'screen';

export type AddGroupMembersPanelProps = {
  groupId: string;
  active: boolean;
  variant: AddGroupMembersVariant;
  onDismiss: () => void;
  onSubmit: (body: AddGroupMemberBody) => Promise<void>;
  isPending: boolean;
};

function mapAddMemberErrorToMessage(e: ApiError, t: TFunction): string {
  const code = e.code;
  const key = `groups.addMember.errors.${code}`;
  const mapped = t(key);
  if (mapped !== key) return mapped;
  if (e.retryAfter !== undefined && e.retryAfter >= 0) {
    return t('groups.addMember.errors.retryAfter', { seconds: e.retryAfter });
  }
  return e.message || t('groups.addMember.genericError');
}

function rowInviteKey(e164: string): string {
  return tryNormalizeToE164(e164, DEFAULT_PHONE_REGION) ?? e164.trim();
}

type AddMembersListHeaderProps = {
  t: TFunction;
  palette: ReturnType<typeof useThemeColors>;
  phone: string;
  handlePhoneChange: (text: string) => void;
  isPending: boolean;
  isSendingBatch: boolean;
  rosterBlock: boolean;
  batchSuccessCount: number | null;
  showIntroCard: boolean;
  contactsUiState: ReturnType<typeof useContactsPermission>['contactsUiState'];
  introPrimaryIsOpenSettings: boolean;
  requestOrOpenSettings: () => void;
  fieldError: string | null;
  showSuggestionsSection: boolean;
  suggestedShowDeviceLoading: boolean;
  suggestedShowDeviceError: boolean;
  suggestedShowCompactEmpty: boolean;
  showPhoneIncompleteHint: boolean;
};

function AddMembersListHeader({
  t,
  palette,
  phone,
  handlePhoneChange,
  isPending,
  isSendingBatch,
  rosterBlock,
  batchSuccessCount,
  showIntroCard,
  contactsUiState,
  introPrimaryIsOpenSettings,
  requestOrOpenSettings,
  fieldError,
  showSuggestionsSection,
  suggestedShowDeviceLoading,
  suggestedShowDeviceError,
  suggestedShowCompactEmpty,
  showPhoneIncompleteHint,
}: AddMembersListHeaderProps): ReactElement {
  const blocked = isPending || isSendingBatch || rosterBlock;
  return (
    <>
      <PhoneInput
        label={t('groups.addMember.phoneLabel')}
        countryCode="+91"
        countryFlagEmoji="🇮🇳"
        value={phone}
        onChangeText={handlePhoneChange}
        editable={!blocked}
        containerStyle={{ marginBottom: 0 }}
        {...phoneInputLoginPreset}
      />

      {batchSuccessCount !== null ? (
        <View
          style={[
            styles.errorBanner,
            {
              borderColor: palette.successBorder,
              backgroundColor: palette.successSubtle,
            },
          ]}
          accessibilityLiveRegion="polite"
        >
          <Text style={[styles.errorText, { color: palette.successText }]}>
            {t('groups.addMember.batchSuccess', { count: batchSuccessCount })}
          </Text>
        </View>
      ) : null}

      {showIntroCard ? (
        <ContactsPermissionIntroCard
          variant="inline"
          contactsUiState={contactsUiState}
          introPrimaryIsOpenSettings={introPrimaryIsOpenSettings}
          isPending={blocked}
          onRequestAccess={requestOrOpenSettings}
        />
      ) : null}

      {fieldError ? (
        <View
          style={[
            styles.errorBanner,
            {
              borderColor: palette.errorBorder,
              backgroundColor: palette.errorSubtle,
            },
          ]}
        >
          <Text style={[styles.errorText, { color: palette.errorText }]}>{fieldError}</Text>
        </View>
      ) : null}

      {showSuggestionsSection ? (
        <View style={styles.suggestionBlock}>
          <Text style={[styles.sectionTitle, { color: palette.textMuted }]}>
            {t('groups.addMember.sectionSuggested')}
          </Text>
          {suggestedShowDeviceLoading ? (
            <ActivityIndicator
              size="small"
              color={palette.textSecondary}
              style={styles.inlineLoading}
              accessibilityLabel={t('groups.addMember.suggestedContactsLoading')}
            />
          ) : null}
          {suggestedShowDeviceError ? (
            <Text
              style={[textStyles.caption, { color: palette.errorText }]}
              accessibilityLiveRegion="polite"
            >
              {t('groups.addMember.suggestedContactsError')}
            </Text>
          ) : null}
          {suggestedShowCompactEmpty ? (
            <View style={{ gap: space.gapXs, paddingTop: space.gapXs }}>
              <Text
                style={[
                  textStyles.caption,
                  {
                    fontFamily: typography.fontFamily.sans.medium,
                    fontSize: typography.fontSize.sm,
                    color: palette.textPrimary,
                    letterSpacing: typography.letterSpacing.tight,
                  },
                ]}
              >
                {t('groups.addMember.suggestedNoPhonesCompactTitle')}
              </Text>
              <Text
                style={[
                  textStyles.caption,
                  {
                    fontSize: typography.fontSize.sm,
                    color: palette.textSecondary,
                    lineHeight: typography.fontSize.sm * typography.lineHeight.relaxed,
                  },
                ]}
              >
                {t('groups.addMember.suggestedNoPhonesCompactBody')}
              </Text>
            </View>
          ) : null}
        </View>
      ) : null}

      {showPhoneIncompleteHint ? (
        <Text
          style={[
            textStyles.caption,
            {
              fontFamily: typography.fontFamily.mono.regular,
              color: palette.textMuted,
              letterSpacing: typography.letterSpacing.wide,
            },
          ]}
          accessibilityLiveRegion="polite"
        >
          {t('groups.addMember.phoneIncompleteHint')}
        </Text>
      ) : null}
    </>
  );
}

export function AddGroupMembersPanel({
  groupId,
  active,
  variant,
  onDismiss,
  onSubmit,
  isPending,
}: AddGroupMembersPanelProps): ReactElement {
  const { t } = useTranslation();
  const palette = useThemeColors();
  const themeMode = useThemeMode();
  const insets = useSafeAreaInsets();
  const { data: roster, isPending: rosterPending } = useGroupMembers(groupId, {
    enabled: active && isUuid(groupId),
  });
  const rosterBlock = active && rosterPending;
  const {
    showIntroCard,
    requestOrOpenSettings,
    introPrimaryIsOpenSettings,
    contactsUiState,
    contactsLibraryReady,
  } = useContactsPermission(active);
  const {
    rows: deviceInviteRows,
    status: deviceContactsStatus,
    registeredByE164,
  } = useDeviceContactInviteRows(active, contactsLibraryReady);

  const [phone, setPhone] = useState('');
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [selectedE164s, setSelectedE164s] = useState<Set<string>>(() => new Set());
  const [isSendingBatch, setIsSendingBatch] = useState(false);
  const [batchSuccessCount, setBatchSuccessCount] = useState<number | null>(null);

  const ctaProgress = useSharedValue(0);

  useEffect(() => {
    if (!active) {
      setPhone('');
      setFieldError(null);
      setSelectedE164s(new Set());
      setIsSendingBatch(false);
      setBatchSuccessCount(null);
    }
  }, [active]);

  useEffect(() => {
    setSelectedE164s((prev) => {
      const sessionEmpty = new Set<string>();
      const next = new Set<string>();
      for (const k of prev) {
        if (resolvePhoneInviteRowState(roster, k, sessionEmpty) === 'add') {
          next.add(k);
        }
      }
      if (next.size === prev.size) {
        for (const k of prev) {
          if (!next.has(k)) {
            return next;
          }
        }
        return prev;
      }
      return next;
    });
  }, [roster]);

  const handlePhoneChange = useCallback((text: string) => {
    setBatchSuccessCount(null);
    setPhone(text);
  }, []);

  const close = useCallback(() => {
    onDismiss();
  }, [onDismiss]);

  const manualE164 = useMemo((): string | null => {
    if (!isValidPhone(phone, DEFAULT_PHONE_REGION)) return null;
    return normalizeToE164(phone, DEFAULT_PHONE_REGION);
  }, [phone]);

  const manualAddsToBatch = useMemo((): boolean => {
    if (!manualE164) return false;
    return resolvePhoneInviteRowState(roster, manualE164, new Set()) === 'add';
  }, [manualE164, roster]);

  const inviteTargets = useMemo(
    () =>
      buildPhoneInviteBatch({
        roster,
        selectedE164s,
        manualPhoneRaw: manualE164,
        manualPhoneIncluded: manualAddsToBatch,
        registeredByE164,
      }),
    [manualAddsToBatch, manualE164, registeredByE164, roster, selectedE164s],
  );

  const inviteCount = inviteTargets.length;

  const showPhoneIncompleteHint = useMemo((): boolean => {
    return stripPhoneInput(phone).length > 0 && !isValidPhone(phone, DEFAULT_PHONE_REGION);
  }, [phone]);

  const busy = isPending || isSendingBatch;
  const footerDisabled = rosterBlock || busy || inviteCount === 0;

  useEffect(() => {
    ctaProgress.value = withTiming(footerDisabled ? 0 : 1, {
      duration: duration.normal.ms,
      easing: easing.standard.rn,
    });
  }, [footerDisabled, ctaProgress]);

  const sendBatchInvites = useCallback(async () => {
    setFieldError(null);
    setBatchSuccessCount(null);
    if (rosterBlock || inviteTargets.length === 0) return;

    setIsSendingBatch(true);
    try {
      let sent = 0;
      for (const body of inviteTargets) {
        await onSubmit(body);
        sent += 1;
      }
      setSelectedE164s(new Set());
      setPhone('');
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      void AccessibilityInfo.announceForAccessibility(
        t('groups.addMember.batchSuccessA11y', { count: sent }),
      );
      setBatchSuccessCount(sent);
      setTimeout(() => {
        setBatchSuccessCount(null);
        close();
      }, 820);
    } catch (e) {
      if (e instanceof ApiError) {
        setFieldError(mapAddMemberErrorToMessage(e, t));
        return;
      }
      setFieldError(t('groups.addMember.genericError'));
    } finally {
      setIsSendingBatch(false);
    }
  }, [close, inviteTargets, onSubmit, rosterBlock, t]);

  const scrollFooterPad = Math.max(insets.bottom, space.gapMd) + 108;

  const showSuggestionsSection = contactsLibraryReady;
  const suggestedShowDeviceLoading = showSuggestionsSection && deviceContactsStatus === 'loading';
  const suggestedShowDeviceError = showSuggestionsSection && deviceContactsStatus === 'error';
  const suggestedShowCompactEmpty =
    showSuggestionsSection && deviceContactsStatus === 'ready' && deviceInviteRows.length === 0;

  const listData = showSuggestionsSection ? deviceInviteRows : [];

  const selectionExtra = useMemo(() => {
    const keys = [...selectedE164s].sort();
    return `${keys.length}:${keys.join('|')}`;
  }, [selectedE164s]);

  const toggleRowSelection = useCallback(
    (e164Raw: string) => {
      if (rosterBlock) return;
      const key = rowInviteKey(e164Raw);
      if (resolvePhoneInviteRowState(roster, key, new Set()) !== 'add') return;
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      setSelectedE164s((prev) => {
        const next = new Set(prev);
        if (next.has(key)) {
          next.delete(key);
        } else {
          next.add(key);
        }
        return next;
      });
    },
    [roster, rosterBlock],
  );

  const shareDeviceContactInvite = useCallback(
    async (row: DeviceContactInviteRow) => {
      if (rosterBlock) return;
      void Haptics.selectionAsync().catch(() => {});
      const url = buildGroupInviteDeepLink(groupId);
      const displayLabel =
        row.displayName.trim() || t('groups.addMember.suggestedContactFallbackName');
      const message = t('groups.addMember.shareInviteMessage', { url, name: displayLabel });
      await shareTextNative(message, t('groups.addMember.shareInviteDialogTitle'));
    },
    [groupId, rosterBlock, t],
  );

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<DeviceContactInviteRow>) => {
      const key = rowInviteKey(item.e164);
      return (
        <SelectedContactRow
          row={item}
          roster={roster}
          selected={selectedE164s.has(key)}
          matchedUserId={registeredByE164.get(key)}
          onToggleSelect={() => {
            toggleRowSelection(item.e164);
          }}
          onShare={() => {
            void shareDeviceContactInvite(item);
          }}
          rosterBlock={rosterBlock}
          isSendingBatch={isSendingBatch}
        />
      );
    },
    [
      isSendingBatch,
      registeredByE164,
      roster,
      rosterBlock,
      selectedE164s,
      shareDeviceContactInvite,
      toggleRowSelection,
    ],
  );

  const itemSeparator = useCallback(
    () => <View style={[styles.suggestionHairline, { backgroundColor: palette.inviteBorder }]} />,
    [palette.inviteBorder],
  );

  const listHeader = useMemo(
    () => (
      <AddMembersListHeader
        t={t}
        palette={palette}
        phone={phone}
        handlePhoneChange={handlePhoneChange}
        isPending={isPending}
        isSendingBatch={isSendingBatch}
        rosterBlock={rosterBlock}
        batchSuccessCount={batchSuccessCount}
        showIntroCard={showIntroCard}
        contactsUiState={contactsUiState}
        introPrimaryIsOpenSettings={introPrimaryIsOpenSettings}
        requestOrOpenSettings={requestOrOpenSettings}
        fieldError={fieldError}
        showSuggestionsSection={showSuggestionsSection}
        suggestedShowDeviceLoading={suggestedShowDeviceLoading}
        suggestedShowDeviceError={suggestedShowDeviceError}
        suggestedShowCompactEmpty={suggestedShowCompactEmpty}
        showPhoneIncompleteHint={showPhoneIncompleteHint}
      />
    ),
    [
      batchSuccessCount,
      contactsUiState,
      fieldError,
      handlePhoneChange,
      introPrimaryIsOpenSettings,
      isPending,
      isSendingBatch,
      rosterBlock,
      phone,
      palette,
      requestOrOpenSettings,
      showIntroCard,
      showPhoneIncompleteHint,
      showSuggestionsSection,
      suggestedShowCompactEmpty,
      suggestedShowDeviceError,
      suggestedShowDeviceLoading,
      t,
    ],
  );

  return (
    <KeyboardAvoidingView
      style={[styles.keyboard, { backgroundColor: palette.inviteCanvas }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      <SafeAreaView
        style={[styles.flex, { backgroundColor: palette.inviteCanvas }]}
        edges={['top']}
      >
        {variant === 'modal' ? (
          <View style={[styles.header, { paddingTop: space.sectionGap }]}>
            <View style={styles.headerTop}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('groups.addMember.cancelA11y')}
                onPress={close}
                style={({ pressed }) => [styles.cancelBtn, { opacity: pressed ? 0.65 : 1 }]}
              >
                <Text
                  style={[
                    textStyles.label,
                    {
                      fontFamily: typography.fontFamily.mono.medium,
                      color: palette.textSecondary,
                      fontSize: typography.fontSize.sm,
                      letterSpacing: typography.letterSpacing.widest,
                      textTransform: 'uppercase',
                    },
                  ]}
                >
                  {t('groups.addMember.cancel')}
                </Text>
              </Pressable>
              <View style={styles.headerSpacer} />
            </View>
            <Text style={[styles.title, { color: palette.textPrimary }]} accessibilityRole="header">
              {t('groups.addMember.title')}
            </Text>
            <Text style={[styles.subtitle, { color: palette.textSecondary, maxWidth: 320 }]}>
              {t('groups.addMember.subtitle')}
            </Text>
          </View>
        ) : (
          <View style={styles.screenHeader}>
            <View style={styles.screenHeaderTop}>
              <BackHeaderButton
                onPress={close}
                accessibilityLabel={t('groups.addMember.backA11y')}
              />
              <Text
                style={[styles.screenHeaderBrandKicker, { color: palette.textMuted }]}
                accessibilityRole="text"
                accessibilityLabel={t('groups.addMember.onQismaA11y')}
                numberOfLines={1}
              >
                {t('groups.addMember.onQisma')}
              </Text>
            </View>
            <Text
              style={[styles.screenTitle, { color: palette.textPrimary }]}
              accessibilityRole="header"
            >
              {t('groups.addMember.title')}
            </Text>
            <Text style={[styles.screenSubtitle, { color: palette.textSecondary }]}>
              {t('groups.addMember.subtitle')}
            </Text>
          </View>
        )}

        <FlashList<DeviceContactInviteRow>
          data={listData}
          keyExtractor={(item) => item.key}
          renderItem={renderItem}
          extraData={selectionExtra}
          ItemSeparatorComponent={itemSeparator}
          ListHeaderComponent={listHeader}
          keyboardShouldPersistTaps="handled"
          style={styles.scroll}
          contentContainerStyle={{
            paddingHorizontal: space.screenPadding,
            paddingTop: space.gapLg,
            paddingBottom: scrollFooterPad,
            backgroundColor: palette.inviteCanvas,
          }}
          showsVerticalScrollIndicator={false}
        />

        <View
          style={[
            styles.footer,
            {
              borderTopColor: palette.inviteBorder,
              paddingBottom: Math.max(insets.bottom, space.gapMd),
              overflow: 'hidden',
            },
          ]}
        >
          {Platform.OS !== 'web' ? (
            <BlurView
              pointerEvents="none"
              intensity={themeMode === 'dark' ? 34 : 26}
              tint={themeMode === 'dark' ? 'dark' : 'light'}
              experimentalBlurMethod={Platform.OS === 'android' ? 'dimezisBlurView' : undefined}
              style={[
                StyleSheet.absoluteFillObject,
                { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: palette.inviteBorder },
              ]}
            />
          ) : (
            <View
              pointerEvents="none"
              style={[
                StyleSheet.absoluteFillObject,
                {
                  backgroundColor: palette.glassStrong,
                  borderTopWidth: StyleSheet.hairlineWidth,
                  borderTopColor: palette.inviteBorder,
                },
              ]}
            />
          )}
          <View style={{ zIndex: 1 }}>
            <InviteStickyCta
              inviteCount={inviteCount}
              disabled={footerDisabled}
              busy={isSendingBatch}
              ctaProgress={ctaProgress}
              onPress={() => {
                void sendBatchInvites();
              }}
            />
          </View>
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

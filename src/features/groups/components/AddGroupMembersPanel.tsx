import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import type { TFunction } from 'i18next';
import { useCallback, useEffect, useMemo, useState, type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  LayoutChangeEvent,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { ApiError } from '@/api';
import { BackHeaderButton } from '@/components/ui';
import { PhoneInput } from '@/features/auth/components/PhoneInput';
import type { AddGroupMemberBody } from '@/features/groups/api/groupMembersApi';
import { USER_SEARCH_QUERY_MIN, type UserSearchHit } from '@/features/groups/api/usersSearchApi';
import { addGroupMemberModalStyles as styles } from '@/features/groups/components/addGroupMemberModal.styles';
import { ContactsPermissionIntroCard } from '@/features/groups/components/ContactsPermissionIntroCard';
import { useContactsPermission } from '@/features/groups/hooks/useContactsPermission';
import { useDeviceContactInviteRows } from '@/features/groups/hooks/useDeviceContactInviteRows';
import { useGroupMembers } from '@/features/groups/hooks/useGroupMembers';
import { useUserDirectorySearch } from '@/features/groups/hooks/useUserDirectorySearch';
import { isUuid } from '@/features/groups/utils/isUuid';
import {
  resolvePhoneInviteRowState,
  resolveUserIdInviteRowState,
  resolveUsernameInviteRowState,
} from '@/features/groups/utils/resolveAddMemberInviteRowState';
import { buildGroupInviteDeepLink } from '@/features/groups/utils/buildGroupInviteDeepLink';
import { DEFAULT_PHONE_REGION } from '@/constants';
import { useDebouncedValue } from '@/hooks';
import { shareTextNative } from '@/services';
import type { DeviceContactInviteRow } from '@/services/deviceContacts';
import { isValidPhone, maskPhoneE164, normalizeToE164, stripPhoneInput } from '@/utils';
import { platformShadow, space, textStyles, typography, useThemeColors } from '@/theme';

export type AddGroupMembersVariant = 'modal' | 'screen';

export type AddGroupMembersPanelProps = {
  /** Target group; drives roster lookup for member / pending row states. */
  groupId: string;
  /** When false, hooks and directory search idle (same contract as the old modal `visible`). */
  active: boolean;
  variant: AddGroupMembersVariant;
  onDismiss: () => void;
  onSubmit: (body: AddGroupMemberBody) => Promise<void>;
  isPending: boolean;
  initialUserId?: string;
};

type AddMode = 'phone' | 'username' | 'userId';

const USERNAME_RE = /^[a-z0-9_]{3,32}$/;

function normalizeUsernameForInvite(raw: string): string {
  return raw.trim().replace(/^@+/u, '').toLowerCase();
}

const SOCIAL_RING_KEYS = [
  'socialRing0',
  'socialRing1',
  'socialRing2',
  'socialRing3',
  'socialRing4',
] as const;

function tintIndexFromId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i += 1) {
    h = (h + id.charCodeAt(i) * (i + 1)) % 1009;
  }
  return Math.abs(h) % SOCIAL_RING_KEYS.length;
}

function pickSocialRing(palette: ReturnType<typeof useThemeColors>, i: number): string {
  const idx = ((i % SOCIAL_RING_KEYS.length) + SOCIAL_RING_KEYS.length) % SOCIAL_RING_KEYS.length;
  const k = SOCIAL_RING_KEYS[idx];
  if (!k) return palette.socialRing0;
  return palette[k];
}

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

function directoryHitDisplayName(hit: UserSearchHit, tr: TFunction): string {
  const n = hit.name?.trim();
  if (n) return n;
  const u = hit.username?.trim();
  if (u) return `@${u}`;
  return tr('groups.addMember.directoryFallbackName');
}

export function AddGroupMembersPanel({
  groupId,
  active,
  variant,
  onDismiss,
  onSubmit,
  isPending,
  initialUserId,
}: AddGroupMembersPanelProps): ReactElement {
  const { t } = useTranslation();
  const palette = useThemeColors();
  const insets = useSafeAreaInsets();
  const reduceMotion = useReducedMotion();
  const { data: roster, isLoading: rosterLoading } = useGroupMembers(groupId, {
    enabled: active && isUuid(groupId),
  });
  const rosterBlock = active && rosterLoading;
  const {
    showIntroCard,
    requestOrOpenSettings,
    introPrimaryIsOpenSettings,
    contactsUiState,
    contactsLibraryReady,
  } = useContactsPermission(active);
  const { rows: deviceInviteRows, status: deviceContactsStatus } = useDeviceContactInviteRows(
    active,
    contactsLibraryReady,
  );
  const showUserIdTab = Boolean(initialUserId && isUuid(initialUserId));
  const [mode, setMode] = useState<AddMode>('username');
  const [phone, setPhone] = useState('');
  const [username, setUsername] = useState('');
  const [userId, setUserId] = useState('');
  const [directoryQuery, setDirectoryQuery] = useState('');
  const debouncedDirectoryQuery = useDebouncedValue(directoryQuery, 320);
  const directorySearchActive =
    active && debouncedDirectoryQuery.trim().length >= USER_SEARCH_QUERY_MIN;
  const {
    data: directoryHits,
    isFetching: directoryFetching,
    isError: directoryIsError,
  } = useUserDirectorySearch(debouncedDirectoryQuery, directorySearchActive);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [invitingUserId, setInvitingUserId] = useState<string | null>(null);
  const [invitedUserIds, setInvitedUserIds] = useState<Set<string>>(() => new Set());
  const [invitingPhoneE164, setInvitingPhoneE164] = useState<string | null>(null);
  const [invitedPhoneE164s, setInvitedPhoneE164s] = useState<Set<string>>(() => new Set());
  const [segmentWidth, setSegmentWidth] = useState(0);
  const thumbW = useSharedValue(0);
  const thumbX = useSharedValue(0);

  const tabCount = showUserIdTab ? 3 : 2;
  const modeIndex = mode === 'username' ? 0 : mode === 'phone' ? 1 : 2;

  useEffect(() => {
    if (!active) {
      setPhone('');
      setUsername('');
      setUserId('');
      setDirectoryQuery('');
      setFieldError(null);
      setMode('username');
      setInvitingUserId(null);
      setInvitedUserIds(new Set());
      setInvitingPhoneE164(null);
      setInvitedPhoneE164s(new Set());
    }
  }, [active]);

  useEffect(() => {
    if (active && showUserIdTab && initialUserId) {
      setMode('userId');
      setUserId(initialUserId);
    }
  }, [active, showUserIdTab, initialUserId]);

  useEffect(() => {
    if (active) setFieldError(null);
  }, [mode, active]);

  useEffect(() => {
    const pad = 4;
    if (segmentWidth < pad * 2 + 8) return;
    const tw = (segmentWidth - pad * 2) / tabCount;
    thumbW.value = tw;
    const idx = Math.min(modeIndex, tabCount - 1);
    const target = pad + idx * tw;
    thumbX.value = reduceMotion
      ? withTiming(target, { duration: 0 })
      : withSpring(target, { damping: 18, stiffness: 360 });
  }, [segmentWidth, modeIndex, tabCount, reduceMotion, thumbW, thumbX]);

  const thumbStyle = useAnimatedStyle(() => ({
    width: thumbW.value,
    transform: [{ translateX: thumbX.value }],
  }));

  const onSegmentLayout = useCallback((e: LayoutChangeEvent) => {
    setSegmentWidth(e.nativeEvent.layout.width);
  }, []);

  const close = useCallback(() => {
    onDismiss();
  }, [onDismiss]);

  const submit = useCallback(async () => {
    setFieldError(null);
    try {
      if (mode === 'phone') {
        if (!isValidPhone(phone, DEFAULT_PHONE_REGION)) {
          setFieldError(t('groups.addMember.phoneInvalid'));
          return;
        }
        const identifier = normalizeToE164(phone, DEFAULT_PHONE_REGION);
        const phoneState = resolvePhoneInviteRowState(roster, identifier, invitedPhoneE164s);
        if (phoneState === 'member') {
          setFieldError(t('groups.addMember.alreadyMember'));
          return;
        }
        if (phoneState === 'pending' || phoneState === 'invited') {
          setFieldError(t('groups.addMember.alreadyPending'));
          return;
        }
        await onSubmit({ identifier });
      } else if (mode === 'username') {
        const u = normalizeUsernameForInvite(username);
        if (!USERNAME_RE.test(u)) {
          setFieldError(t('groups.addMember.usernameInvalid'));
          return;
        }
        const usernameState = resolveUsernameInviteRowState(roster, u);
        if (usernameState === 'member') {
          setFieldError(t('groups.addMember.alreadyMember'));
          return;
        }
        if (usernameState === 'pending') {
          setFieldError(t('groups.addMember.alreadyPending'));
          return;
        }
        await onSubmit({ username: u });
      } else {
        const id = userId.trim();
        if (!isUuid(id)) {
          setFieldError(t('groups.addMember.userIdInvalid'));
          return;
        }
        const userState = resolveUserIdInviteRowState(roster, id, invitedUserIds);
        if (userState === 'member') {
          setFieldError(t('groups.addMember.alreadyMember'));
          return;
        }
        if (userState === 'pending' || userState === 'invited') {
          setFieldError(t('groups.addMember.alreadyPending'));
          return;
        }
        await onSubmit({ userId: id });
      }
      close();
    } catch (e) {
      if (e instanceof ApiError) {
        setFieldError(mapAddMemberErrorToMessage(e, t));
        return;
      }
      setFieldError(t('groups.addMember.genericError'));
    }
  }, [
    close,
    invitedPhoneE164s,
    invitedUserIds,
    mode,
    onSubmit,
    phone,
    roster,
    t,
    userId,
    username,
  ]);

  const canSubmit = useMemo((): boolean => {
    if (rosterBlock) return false;
    if (mode === 'phone') {
      if (!isValidPhone(phone, DEFAULT_PHONE_REGION)) return false;
      const identifier = normalizeToE164(phone, DEFAULT_PHONE_REGION);
      return resolvePhoneInviteRowState(roster, identifier, invitedPhoneE164s) === 'add';
    }
    if (mode === 'username') {
      const u = normalizeUsernameForInvite(username);
      if (!USERNAME_RE.test(u)) return false;
      return resolveUsernameInviteRowState(roster, u) === 'add';
    }
    const id = userId.trim();
    if (!isUuid(id)) return false;
    return resolveUserIdInviteRowState(roster, id, invitedUserIds) === 'add';
  }, [mode, phone, roster, rosterBlock, userId, username, invitedPhoneE164s, invitedUserIds]);

  const showPhoneIncompleteHint = useMemo((): boolean => {
    if (mode !== 'phone') return false;
    return stripPhoneInput(phone).length > 0 && !isValidPhone(phone, DEFAULT_PHONE_REGION);
  }, [mode, phone]);

  const pickFromDeviceContact = useCallback(
    async (row: DeviceContactInviteRow) => {
      if (resolvePhoneInviteRowState(roster, row.e164, invitedPhoneE164s) !== 'add') return;
      if (invitedPhoneE164s.has(row.e164) || invitingPhoneE164 !== null || invitingUserId !== null)
        return;
      setFieldError(null);
      setInvitingPhoneE164(row.e164);
      try {
        await onSubmit({ identifier: row.e164 });
        setInvitedPhoneE164s((prev) => new Set(prev).add(row.e164));
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        await new Promise<void>((r) => {
          setTimeout(r, 480);
        });
        close();
      } catch (e) {
        if (e instanceof ApiError) {
          setFieldError(mapAddMemberErrorToMessage(e, t));
          return;
        }
        setFieldError(t('groups.addMember.genericError'));
      } finally {
        setInvitingPhoneE164(null);
      }
    },
    [close, invitingPhoneE164, invitedPhoneE164s, invitingUserId, onSubmit, roster, t],
  );

  const pickFromDirectory = useCallback(
    async (hit: UserSearchHit) => {
      if (resolveUserIdInviteRowState(roster, hit.id, invitedUserIds) !== 'add') return;
      if (invitedUserIds.has(hit.id) || invitingUserId !== null || invitingPhoneE164 !== null)
        return;
      setFieldError(null);
      setInvitingUserId(hit.id);
      try {
        await onSubmit({ userId: hit.id });
        setInvitedUserIds((prev) => new Set(prev).add(hit.id));
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        await new Promise<void>((r) => {
          setTimeout(r, 480);
        });
        close();
      } catch (e) {
        if (e instanceof ApiError) {
          setFieldError(mapAddMemberErrorToMessage(e, t));
          return;
        }
        setFieldError(t('groups.addMember.genericError'));
      } finally {
        setInvitingUserId(null);
      }
    },
    [close, invitingPhoneE164, invitingUserId, invitedUserIds, onSubmit, roster, t],
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

  const directoryShowEmpty =
    directorySearchActive &&
    !directoryFetching &&
    !directoryIsError &&
    directoryHits !== undefined &&
    directoryHits.length === 0;

  const renderUserRow = (hit: UserSearchHit): ReactElement => {
    const label = directoryHitDisplayName(hit, t);
    const showHandle = Boolean(hit.username?.trim());
    const handle = hit.username?.trim();
    const tint = pickSocialRing(palette, tintIndexFromId(hit.id));
    const initial = label.replace(/^@/, '').slice(0, 1).toUpperCase();
    const rowState = resolveUserIdInviteRowState(roster, hit.id, invitedUserIds);
    const inviting = invitingUserId === hit.id;
    const rowActionDisabled =
      rosterBlock || isPending || inviting || rowState !== 'add' || invitingPhoneE164 !== null;
    const actionA11y =
      rowState === 'add'
        ? t('groups.addMember.directoryPickA11y', { name: label })
        : rowState === 'member'
          ? t('groups.addMember.rowMemberA11y', { name: label })
          : rowState === 'pending'
            ? t('groups.addMember.rowPendingA11y', { name: label })
            : t('groups.addMember.rowInvitedA11y', { name: label });

    return (
      <View
        key={hit.id}
        style={[
          styles.userRow,
          platformShadow('xs'),
          { borderColor: palette.inviteBorder, backgroundColor: palette.inviteSurface },
        ]}
      >
        {hit.avatar ? (
          <Image
            source={{ uri: hit.avatar }}
            style={[
              styles.userAvatarImg,
              { borderWidth: StyleSheet.hairlineWidth, borderColor: palette.inviteBorder },
            ]}
            contentFit="cover"
            accessibilityIgnoresInvertColors
          />
        ) : (
          <View
            style={[
              styles.userAvatar,
              { borderColor: palette.inviteBorder, backgroundColor: tint },
            ]}
          >
            <Text style={[styles.userAvatarGlyph, { color: palette.white }]}>{initial}</Text>
          </View>
        )}
        <View style={styles.userTextCol}>
          <Text style={[styles.userName, { color: palette.textPrimary }]} numberOfLines={1}>
            {label}
          </Text>
          {showHandle ? (
            <Text style={[styles.userHandle, { color: palette.inviteMuted }]} numberOfLines={1}>
              @{handle}
            </Text>
          ) : null}
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={actionA11y}
          accessibilityState={{ disabled: rowActionDisabled }}
          disabled={rowActionDisabled}
          onPress={() => void pickFromDirectory(hit)}
          style={({ pressed }) => {
            if (rowState === 'member') {
              return [
                styles.rowAction,
                { backgroundColor: palette.inviteSegmentTrack, borderColor: 'transparent' },
              ];
            }
            if (rowState === 'pending') {
              return [
                styles.rowAction,
                { backgroundColor: palette.warningSubtle, borderColor: 'transparent' },
              ];
            }
            if (rowState === 'invited') {
              return [
                styles.rowAction,
                { backgroundColor: palette.inviteSuccessSoft, borderColor: 'transparent' },
              ];
            }
            return [
              styles.rowAction,
              {
                backgroundColor: pressed ? palette.inviteAccentSoft : 'transparent',
                borderColor: palette.inviteAccent,
              },
            ];
          }}
        >
          {inviting ? (
            <ActivityIndicator size="small" color={palette.inviteAccent} />
          ) : rowState === 'member' ? (
            <Text style={[styles.rowActionLabel, { color: palette.inviteMuted }]}>
              {t('groups.addMember.rowMember')}
            </Text>
          ) : rowState === 'pending' ? (
            <Text style={[styles.rowActionLabel, { color: palette.warningText }]}>
              {t('groups.addMember.rowPending')}
            </Text>
          ) : rowState === 'invited' ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Ionicons name="checkmark-circle" size={20} color={palette.inviteSuccess} />
              <Text style={[styles.rowActionLabel, { color: palette.inviteSuccess }]}>
                {t('groups.addMember.rowInvited')}
              </Text>
            </View>
          ) : (
            <Text style={[styles.rowActionLabel, { color: palette.inviteAccent }]}>
              {t('groups.addMember.rowAdd')}
            </Text>
          )}
        </Pressable>
      </View>
    );
  };

  const renderDeviceContactRow = (row: DeviceContactInviteRow): ReactElement => {
    const label = row.displayName.trim() || t('groups.addMember.suggestedContactFallbackName');
    const masked = maskPhoneE164(row.e164);
    const tint = pickSocialRing(palette, tintIndexFromId(row.contactId));
    const initial = label.replace(/^@/, '').slice(0, 1).toUpperCase();
    const rowState = resolvePhoneInviteRowState(roster, row.e164, invitedPhoneE164s);
    const inviting = invitingPhoneE164 === row.e164;
    const rowActionDisabled =
      rosterBlock || isPending || inviting || rowState !== 'add' || invitingUserId !== null;
    const actionA11y =
      rowState === 'add'
        ? t('groups.addMember.suggestedContactPickA11y', { name: label })
        : rowState === 'member'
          ? t('groups.addMember.rowMemberA11y', { name: label })
          : rowState === 'pending'
            ? t('groups.addMember.rowPendingA11y', { name: label })
            : t('groups.addMember.rowInvitedA11y', { name: label });

    return (
      <View
        key={row.key}
        style={[
          styles.userRow,
          platformShadow('xs'),
          { borderColor: palette.inviteBorder, backgroundColor: palette.inviteSurface },
        ]}
      >
        <View
          style={[styles.userAvatar, { borderColor: palette.inviteBorder, backgroundColor: tint }]}
        >
          <Text style={[styles.userAvatarGlyph, { color: palette.white }]}>{initial}</Text>
        </View>
        <View style={styles.userTextCol}>
          <Text style={[styles.userName, { color: palette.textPrimary }]} numberOfLines={1}>
            {label}
          </Text>
          <Text style={[styles.userHandle, { color: palette.inviteMuted }]} numberOfLines={1}>
            {masked}
          </Text>
        </View>
        <View style={styles.rowActions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('groups.addMember.shareInviteA11y', { name: label })}
            accessibilityState={{ disabled: rosterBlock }}
            disabled={rosterBlock}
            onPress={() => void shareDeviceContactInvite(row)}
            style={({ pressed }) => [
              styles.rowShareAction,
              {
                borderColor: palette.inviteBorder,
                backgroundColor: pressed ? palette.inviteAccentSoft : 'transparent',
                opacity: rosterBlock ? 0.45 : 1,
              },
            ]}
          >
            <Text style={[styles.rowActionLabel, { color: palette.inviteMuted }]}>
              {t('groups.addMember.shareInvite')}
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={actionA11y}
            accessibilityState={{ disabled: rowActionDisabled }}
            disabled={rowActionDisabled}
            onPress={() => void pickFromDeviceContact(row)}
            style={({ pressed }) => {
              if (rowState === 'member') {
                return [
                  styles.rowAction,
                  { backgroundColor: palette.inviteSegmentTrack, borderColor: 'transparent' },
                ];
              }
              if (rowState === 'pending') {
                return [
                  styles.rowAction,
                  { backgroundColor: palette.warningSubtle, borderColor: 'transparent' },
                ];
              }
              if (rowState === 'invited') {
                return [
                  styles.rowAction,
                  { backgroundColor: palette.inviteSuccessSoft, borderColor: 'transparent' },
                ];
              }
              return [
                styles.rowAction,
                {
                  backgroundColor: pressed ? palette.inviteAccentSoft : 'transparent',
                  borderColor: palette.inviteAccent,
                },
              ];
            }}
          >
            {inviting ? (
              <ActivityIndicator size="small" color={palette.inviteAccent} />
            ) : rowState === 'member' ? (
              <Text style={[styles.rowActionLabel, { color: palette.inviteMuted }]}>
                {t('groups.addMember.rowMember')}
              </Text>
            ) : rowState === 'pending' ? (
              <Text style={[styles.rowActionLabel, { color: palette.warningText }]}>
                {t('groups.addMember.rowPending')}
              </Text>
            ) : rowState === 'invited' ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Ionicons name="checkmark-circle" size={20} color={palette.inviteSuccess} />
                <Text style={[styles.rowActionLabel, { color: palette.inviteSuccess }]}>
                  {t('groups.addMember.rowInvited')}
                </Text>
              </View>
            ) : (
              <Text style={[styles.rowActionLabel, { color: palette.inviteAccent }]}>
                {t('groups.addMember.rowAdd')}
              </Text>
            )}
          </Pressable>
        </View>
      </View>
    );
  };

  const suggestedShowDeviceList =
    !directorySearchActive && contactsLibraryReady && deviceInviteRows.length > 0;
  const suggestedShowDeviceLoading =
    !directorySearchActive && contactsLibraryReady && deviceContactsStatus === 'loading';
  const suggestedShowDeviceError =
    !directorySearchActive && contactsLibraryReady && deviceContactsStatus === 'error';
  const suggestedShowNoInvitablePhones =
    !directorySearchActive &&
    contactsLibraryReady &&
    deviceContactsStatus === 'ready' &&
    deviceInviteRows.length === 0;
  const suggestedShowGenericEmpty =
    !directorySearchActive &&
    !suggestedShowDeviceLoading &&
    !suggestedShowDeviceError &&
    !suggestedShowDeviceList &&
    !suggestedShowNoInvitablePhones;

  return (
    <KeyboardAvoidingView
      style={[styles.keyboard, { backgroundColor: palette.inviteCanvas }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      <SafeAreaView style={styles.flex} edges={['top']}>
        {variant === 'modal' ? (
          <View style={styles.header}>
            <View style={styles.headerTop}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('groups.addMember.cancelA11y')}
                onPress={close}
                style={({ pressed }) => [styles.cancelBtn, { opacity: pressed ? 0.65 : 1 }]}
              >
                <Text style={[textStyles.label, { color: palette.inviteAccent, fontSize: 16 }]}>
                  {t('groups.addMember.cancel')}
                </Text>
              </Pressable>
              <View style={styles.headerSpacer} />
            </View>
            <Text style={[styles.title, { color: palette.textPrimary }]} accessibilityRole="header">
              {t('groups.addMember.title')}
            </Text>
            <Text style={[styles.subtitle, { color: palette.inviteMuted }]}>
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
            </View>
            <View style={styles.screenHeaderKickers}>
              <Text
                style={[
                  textStyles.captionSmall,
                  {
                    fontFamily: typography.fontFamily.mono.medium,
                    color: palette.inviteMuted,
                    letterSpacing: typography.letterSpacing.widest,
                    textTransform: 'uppercase',
                  },
                ]}
                accessibilityRole="text"
                accessibilityLabel={t('groups.addMember.onQismaA11y')}
              >
                {t('groups.addMember.onQisma')}
              </Text>
              <Text
                style={[
                  textStyles.captionSmall,
                  {
                    fontFamily: typography.fontFamily.mono.medium,
                    color: palette.inviteMuted,
                    letterSpacing: typography.letterSpacing.widest,
                    textTransform: 'uppercase',
                  },
                ]}
                accessibilityRole="text"
                accessibilityLabel={t('groups.addMember.inviteToDividoA11y')}
              >
                {t('groups.addMember.inviteToDivido')}
              </Text>
            </View>
            <Text
              style={[styles.screenTitle, { color: palette.textPrimary }]}
              accessibilityRole="header"
            >
              {t('groups.addMember.title')}
            </Text>
            <Text style={[styles.screenSubtitle, { color: palette.inviteMuted }]}>
              {t('groups.addMember.subtitle')}
            </Text>
          </View>
        )}

        <ScrollView
          style={styles.scroll}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[
            styles.body,
            { paddingHorizontal: space.screenPadding, paddingBottom: space.sectionGap },
          ]}
        >
          <View
            style={[styles.segmentWrap, { backgroundColor: palette.inviteSegmentTrack }]}
            onLayout={onSegmentLayout}
          >
            <Animated.View
              style={[
                styles.segmentThumb,
                platformShadow('sm'),
                thumbStyle,
                { backgroundColor: palette.inviteSurface, shadowColor: palette.shadow },
              ]}
            />
            <View style={styles.segmentRow}>
              <Pressable
                accessibilityRole="tab"
                accessibilityState={{ selected: mode === 'username' }}
                onPress={() => setMode('username')}
                style={styles.segmentTab}
              >
                <Text
                  style={[
                    styles.segmentTabLabel,
                    {
                      color: mode === 'username' ? palette.inviteAccent : palette.inviteMuted,
                    },
                  ]}
                  numberOfLines={1}
                >
                  {t('groups.addMember.modeUsername')}
                </Text>
              </Pressable>
              <Pressable
                accessibilityRole="tab"
                accessibilityState={{ selected: mode === 'phone' }}
                onPress={() => setMode('phone')}
                style={styles.segmentTab}
              >
                <Text
                  style={[
                    styles.segmentTabLabel,
                    {
                      color: mode === 'phone' ? palette.inviteAccent : palette.inviteMuted,
                    },
                  ]}
                  numberOfLines={1}
                >
                  {t('groups.addMember.modePhone')}
                </Text>
              </Pressable>
              {showUserIdTab ? (
                <Pressable
                  accessibilityRole="tab"
                  accessibilityState={{ selected: mode === 'userId' }}
                  onPress={() => setMode('userId')}
                  style={styles.segmentTab}
                >
                  <Text
                    style={[
                      styles.segmentTabLabel,
                      {
                        color: mode === 'userId' ? palette.inviteAccent : palette.inviteMuted,
                      },
                    ]}
                    numberOfLines={1}
                  >
                    {t('groups.addMember.modeUserId')}
                  </Text>
                </Pressable>
              ) : null}
            </View>
          </View>

          {mode === 'phone' ? (
            <View
              style={[
                styles.phoneShellBox,
                { borderColor: palette.inviteBorder, backgroundColor: palette.inviteSurface },
              ]}
            >
              <PhoneInput
                label={t('groups.addMember.phoneLabel')}
                countryCode="+91"
                countryFlagEmoji="🇮🇳"
                fieldVariant="ghost"
                value={phone}
                onChangeText={setPhone}
                editable={!isPending}
                style={{ fontSize: typography.fontSize.lg }}
              />
            </View>
          ) : null}

          {mode === 'username' ? (
            <View
              style={[
                styles.manualFieldShell,
                { borderColor: palette.inviteBorder, backgroundColor: palette.inviteSurface },
              ]}
            >
              <TextInput
                accessibilityLabel={t('groups.addMember.usernamePlaceholder')}
                value={username}
                onChangeText={setUsername}
                placeholder={`@${t('groups.addMember.usernamePlaceholder')}`}
                placeholderTextColor={palette.inviteMuted}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isPending}
                style={[styles.manualFieldInput, { color: palette.textPrimary }]}
                cursorColor={palette.cursor}
                selectionColor={palette.selection}
              />
            </View>
          ) : null}

          {mode === 'userId' ? (
            <View
              style={[
                styles.manualFieldShell,
                { borderColor: palette.inviteBorder, backgroundColor: palette.inviteSurface },
              ]}
            >
              <TextInput
                accessibilityLabel={t('groups.addMember.userIdPlaceholder')}
                value={userId}
                onChangeText={setUserId}
                placeholder={t('groups.addMember.userIdPlaceholder')}
                placeholderTextColor={palette.inviteMuted}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isPending}
                style={[
                  styles.manualFieldInput,
                  {
                    color: palette.textPrimary,
                    fontFamily: typography.fontFamily.mono.regular,
                    fontSize: typography.fontSize.sm,
                  },
                ]}
                cursorColor={palette.cursor}
                selectionColor={palette.selection}
              />
            </View>
          ) : null}

          <View
            style={[
              styles.searchShell,
              { backgroundColor: palette.inviteSurface, borderColor: palette.inviteBorder },
            ]}
          >
            <Ionicons name="search-outline" size={22} color={palette.inviteMuted} />
            <TextInput
              accessibilityLabel={t('groups.addMember.searchPlaceholder')}
              value={directoryQuery}
              onChangeText={setDirectoryQuery}
              placeholder={t('groups.addMember.searchPlaceholder')}
              placeholderTextColor={palette.inviteMuted}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isPending}
              style={[styles.searchInput, { color: palette.textPrimary }]}
              cursorColor={palette.cursor}
              selectionColor={palette.selection}
            />
          </View>

          {showIntroCard ? (
            <ContactsPermissionIntroCard
              contactsUiState={contactsUiState}
              introPrimaryIsOpenSettings={introPrimaryIsOpenSettings}
              isPending={isPending}
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

          {!directorySearchActive ? (
            <View style={{ gap: space.gapMd, alignSelf: 'stretch' }}>
              <Text style={[styles.sectionTitle, { color: palette.textPrimary }]}>
                {t('groups.addMember.sectionSuggested')}
              </Text>
              {suggestedShowDeviceLoading ? (
                <ActivityIndicator
                  size="small"
                  color={palette.inviteAccent}
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
              {suggestedShowDeviceList ? (
                <View style={{ gap: space.gap }}>
                  {deviceInviteRows.map(renderDeviceContactRow)}
                </View>
              ) : null}
              {suggestedShowNoInvitablePhones ? (
                <View
                  style={[
                    styles.emptyWrap,
                    {
                      borderColor: palette.inviteBorder,
                      borderWidth: StyleSheet.hairlineWidth,
                      borderRadius: 20,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.emptyGlyph,
                      {
                        borderColor: palette.inviteBorder,
                        backgroundColor: palette.inviteSegmentTrack,
                      },
                    ]}
                  >
                    <Ionicons name="book-outline" size={40} color={palette.inviteMuted} />
                  </View>
                  <Text style={[styles.emptyTitle, { color: palette.textPrimary }]}>
                    {t('groups.addMember.suggestedNoInvitablePhonesTitle')}
                  </Text>
                  <Text style={[styles.emptyBody, { color: palette.inviteMuted }]}>
                    {t('groups.addMember.suggestedNoInvitablePhonesBody')}
                  </Text>
                </View>
              ) : null}
              {suggestedShowGenericEmpty ? (
                <View
                  style={[
                    styles.emptyWrap,
                    {
                      borderColor: palette.inviteBorder,
                      borderWidth: StyleSheet.hairlineWidth,
                      borderRadius: 20,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.emptyGlyph,
                      {
                        borderColor: palette.inviteBorder,
                        backgroundColor: palette.inviteSegmentTrack,
                      },
                    ]}
                  >
                    <Ionicons name="people-outline" size={40} color={palette.inviteMuted} />
                  </View>
                  <Text style={[styles.emptyTitle, { color: palette.textPrimary }]}>
                    {t('groups.addMember.suggestedEmptyTitle')}
                  </Text>
                  <Text style={[styles.emptyBody, { color: palette.inviteMuted }]}>
                    {t('groups.addMember.suggestedEmptyBody')}
                  </Text>
                </View>
              ) : null}
            </View>
          ) : null}

          {directorySearchActive ? (
            <View style={{ gap: space.gapMd, alignSelf: 'stretch' }}>
              <Text style={[styles.sectionTitle, { color: palette.textPrimary }]}>
                {t('groups.addMember.sectionResults')}
              </Text>
              {directoryFetching ? (
                <ActivityIndicator
                  size="small"
                  color={palette.inviteAccent}
                  style={styles.inlineLoading}
                  accessibilityLabel={t('groups.addMember.directoryLoading')}
                />
              ) : null}
              {directoryIsError ? (
                <Text
                  style={[textStyles.caption, { color: palette.errorText }]}
                  accessibilityLiveRegion="polite"
                >
                  {t('groups.addMember.directoryError')}
                </Text>
              ) : null}
              {directoryHits !== undefined && directoryHits.length > 0 ? (
                <View style={{ gap: space.gap }}>{directoryHits.map(renderUserRow)}</View>
              ) : null}
              {directoryShowEmpty ? (
                <View style={styles.emptyWrap}>
                  <View
                    style={[
                      styles.emptyGlyph,
                      {
                        borderColor: palette.inviteBorder,
                        backgroundColor: palette.inviteSegmentTrack,
                      },
                    ]}
                  >
                    <Ionicons name="search-outline" size={36} color={palette.inviteMuted} />
                  </View>
                  <Text style={[styles.emptyTitle, { color: palette.textPrimary }]}>
                    {t('groups.addMember.resultsEmptyTitle')}
                  </Text>
                  <Text style={[styles.emptyBody, { color: palette.inviteMuted }]}>
                    {t('groups.addMember.resultsEmptyBody')}
                  </Text>
                </View>
              ) : null}
            </View>
          ) : null}

          <Text style={[textStyles.captionSmall, { color: palette.inviteMuted }]}>
            {t('groups.addMember.directoryHint')}
          </Text>

          {showPhoneIncompleteHint ? (
            <Text
              style={[textStyles.caption, { color: palette.inviteMuted }]}
              accessibilityLiveRegion="polite"
            >
              {t('groups.addMember.phoneIncompleteHint')}
            </Text>
          ) : null}
        </ScrollView>

        <View
          style={[
            styles.footer,
            {
              borderTopColor: palette.inviteBorder,
              backgroundColor: palette.inviteCanvas,
              paddingBottom: Math.max(insets.bottom, space.gapMd),
            },
          ]}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('groups.addMember.add')}
            accessibilityState={{
              disabled:
                rosterBlock ||
                isPending ||
                !canSubmit ||
                invitingUserId !== null ||
                invitingPhoneE164 !== null,
            }}
            disabled={
              rosterBlock ||
              isPending ||
              !canSubmit ||
              invitingUserId !== null ||
              invitingPhoneE164 !== null
            }
            onPress={() => void submit()}
            style={({ pressed }) => [
              styles.footerCta,
              platformShadow('md'),
              {
                backgroundColor: palette.inviteAccent,
                opacity:
                  pressed &&
                  !rosterBlock &&
                  !isPending &&
                  canSubmit &&
                  invitingUserId === null &&
                  invitingPhoneE164 === null
                    ? 0.9
                    : rosterBlock ||
                        isPending ||
                        !canSubmit ||
                        invitingUserId !== null ||
                        invitingPhoneE164 !== null
                      ? 0.45
                      : 1,
                shadowColor: palette.inviteAccent,
              },
            ]}
          >
            {isPending ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.gapSm }}>
                <ActivityIndicator color={palette.inviteSuccessFg} />
                <Text style={[styles.footerCtaLabel, { color: palette.inviteSuccessFg }]}>
                  {t('groups.addMember.adding')}
                </Text>
              </View>
            ) : (
              <Text style={[styles.footerCtaLabel, { color: palette.inviteSuccessFg }]}>
                {t('groups.addMember.add')}
              </Text>
            )}
          </Pressable>
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

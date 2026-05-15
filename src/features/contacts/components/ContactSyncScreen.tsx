import { useMutation } from '@tanstack/react-query';
import { FlashList } from '@shopify/flash-list';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import type { ReactElement } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ApiError } from '@/api';
import { BackHeaderButton, Button } from '@/components/ui';
import { DEFAULT_PHONE_REGION } from '@/constants';
import { ROUTES } from '@/constants/routes';
import {
  deviceInviteRowsToSyncPayload,
  getContactsSyncRetryAfterSeconds,
  isContactsSyncPayloadLimitError,
  isContactsSyncRateLimitError,
  postContactsSyncAll,
} from '@/features/contacts/api/contactsSyncApi';
import type { ContactsSyncRegisteredRow } from '@/features/contacts/types/contactsSync.types';
import { DotMatrixField } from '@/features/invites/components/DotMatrixField';
import {
  canReadDeviceContacts,
  getContactsPermission,
  isNativeContactsSupported,
  requestContactsAccess,
  resolveContactsPermissionUiState,
  type ContactsPermissionResponse,
} from '@/services/contactsPermission';
import {
  fetchDeviceContactInviteRows,
  type DeviceContactInviteRow,
} from '@/services/deviceContacts';
import { tryNormalizeToE164 } from '@/utils';
import {
  duration,
  easing,
  platformShadow,
  radius,
  space,
  textStyles,
  useThemeColors,
  useThemeMode,
} from '@/theme';

type ListRow =
  | { kind: 'section'; id: string; title: string }
  | { kind: 'registered'; id: string; row: ContactsSyncRegisteredRow }
  | { kind: 'invite'; id: string; row: DeviceContactInviteRow };

function buildIdentifierSet(registered: ContactsSyncRegisteredRow[]): Set<string> {
  const set = new Set<string>();
  for (const r of registered) {
    if (!r.identifier) continue;
    const norm = tryNormalizeToE164(r.identifier, DEFAULT_PHONE_REGION) ?? r.identifier.trim();
    if (norm) set.add(norm);
  }
  return set;
}

/**
 * Contact sync — `POST /v1/contacts/sync` with device permission gate.
 */
export function ContactSyncScreen(): ReactElement {
  const { t } = useTranslation();
  const palette = useThemeColors();
  const mode = useThemeMode();
  const [permission, setPermission] = useState<ContactsPermissionResponse | null>(null);
  const [deviceRows, setDeviceRows] = useState<DeviceContactInviteRow[]>([]);
  const [registered, setRegistered] = useState<ContactsSyncRegisteredRow[]>([]);
  /** After last successful sync — server `syncedCount` (fallback: identifiers sent). */
  const [processedCount, setProcessedCount] = useState<number | null>(null);
  /** E.164 keys the API confirmed are not registered — used to order invite list. */
  const [unregisteredKeys, setUnregisteredKeys] = useState<ReadonlySet<string>>(() => new Set());
  const [phase, setPhase] = useState<'idle' | 'syncing' | 'done' | 'error'>('idle');
  const pulse = useSharedValue(0);

  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(1, { duration: duration.moderate.ms, easing: easing.standard.rn }),
      -1,
      true,
    );
  }, [pulse]);

  const heroPulseStyle = useAnimatedStyle(() => ({
    opacity: 0.55 + pulse.value * 0.45,
  }));

  const loadPermission = useCallback(async () => {
    const snap = await getContactsPermission();
    setPermission(snap);
  }, []);

  useEffect(() => {
    void loadPermission();
  }, [loadPermission]);

  const permissionUi = resolveContactsPermissionUiState(permission);

  const syncMutation = useMutation({
    mutationFn: async () => {
      const snap = await getContactsPermission();
      const rows = canReadDeviceContacts(snap)
        ? await fetchDeviceContactInviteRows({ maxRows: 200 })
        : [];
      setDeviceRows(rows);
      const payload = deviceInviteRowsToSyncPayload(rows);
      const res = await postContactsSyncAll(payload);
      return { res, identifiersUploaded: payload.contacts.length };
    },
    onMutate: () => {
      setPhase('syncing');
      setProcessedCount(null);
      setUnregisteredKeys(new Set());
    },
    onSuccess: ({ res, identifiersUploaded }) => {
      setRegistered(res.registered);
      setProcessedCount(res.syncedCount ?? identifiersUploaded);
      setUnregisteredKeys(new Set(res.unregistered));
      setPhase('done');
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    },
    onError: (e) => {
      setPhase('error');
      setProcessedCount(null);
      setUnregisteredKeys(new Set());
      if (e instanceof ApiError && isContactsSyncRateLimitError(e)) {
        const sec = getContactsSyncRetryAfterSeconds(e);
        const body =
          sec !== undefined
            ? t('contactsSync.rateLimitBodyRetryAfter', {
                minutes: Math.max(1, Math.ceil(sec / 60)),
              })
            : t('contactsSync.rateLimitBody');
        Alert.alert(t('contactsSync.rateLimitTitle'), body);
        return;
      }
      if (e instanceof ApiError && isContactsSyncPayloadLimitError(e)) {
        Alert.alert(t('contactsSync.limitExceededTitle'), t('contactsSync.limitExceededBody'));
        return;
      }
      Alert.alert(t('contactsSync.errorTitle'), t('contactsSync.errorBody'));
    },
  });

  const onRequestAccess = useCallback(async () => {
    const res = await requestContactsAccess(permission);
    setPermission(res.permission);
    void loadPermission();
    if (canReadDeviceContacts(res.permission)) {
      syncMutation.mutate();
    }
  }, [loadPermission, permission, syncMutation]);

  const flatData: ListRow[] = useMemo(() => {
    const idSet = buildIdentifierSet(registered);

    const onQuisma = registered.filter((r) => {
      if (!r.identifier) return true;
      const n = tryNormalizeToE164(r.identifier, DEFAULT_PHONE_REGION) ?? r.identifier.trim();
      return deviceRows.some((x) => x.e164 === n);
    });

    const inviteRowsRaw = deviceRows.filter((d) => !idSet.has(d.e164));
    const inviteRows =
      unregisteredKeys.size > 0
        ? [
            ...inviteRowsRaw.filter((d) => unregisteredKeys.has(d.e164)),
            ...inviteRowsRaw.filter((d) => !unregisteredKeys.has(d.e164)),
          ]
        : inviteRowsRaw;

    const out: ListRow[] = [];
    out.push({ kind: 'section', id: 'sec-on', title: t('contactsSync.sectionOnQuisma') });
    if (onQuisma.length === 0) {
      out.push({
        kind: 'section',
        id: 'sec-on-empty',
        title: t('contactsSync.sectionOnQuismaEmpty'),
      });
    } else {
      for (const r of onQuisma) {
        out.push({ kind: 'registered', id: `r:${r.userId}`, row: r });
      }
    }
    out.push({ kind: 'section', id: 'sec-inv', title: t('contactsSync.sectionInvite') });
    if (inviteRows.length === 0) {
      out.push({
        kind: 'section',
        id: 'sec-inv-empty',
        title: t('contactsSync.sectionInviteEmpty'),
      });
    } else {
      for (const r of inviteRows) {
        out.push({ kind: 'invite', id: `i:${r.key}`, row: r });
      }
    }
    return out;
  }, [deviceRows, registered, t, unregisteredKeys]);

  const renderItem = useCallback(
    ({ item }: { item: ListRow }) => {
      if (item.kind === 'section') {
        const isRealSection = !item.id.includes('empty');
        return (
          <Text
            style={[
              textStyles.overline,
              {
                color: isRealSection ? palette.textMuted : palette.textSecondary,
                marginTop: space.sectionGap,
                marginBottom: space.gapSm,
              },
            ]}
          >
            {item.title}
          </Text>
        );
      }
      if (item.kind === 'registered') {
        const r = item.row;
        const title = r.name?.trim() || r.username?.trim() || t('contactsSync.unknownUser');
        const subtitle = r.username?.trim() ? `@${r.username.trim()}` : (r.identifier ?? '');
        return (
          <View
            style={[
              styles.card,
              {
                borderColor: palette.borderFrost,
                marginBottom: space.gapMd,
              },
              platformShadow('sm'),
            ]}
          >
            {Platform.OS !== 'web' ? (
              <BlurView
                intensity={mode === 'dark' ? 22 : 18}
                tint={mode}
                style={[StyleSheet.absoluteFill, { borderRadius: radius['2xl'] }]}
                experimentalBlurMethod={Platform.OS === 'android' ? 'dimezisBlurView' : undefined}
              />
            ) : null}
            <View
              style={[
                StyleSheet.absoluteFill,
                {
                  borderRadius: radius['2xl'],
                  backgroundColor: palette.surfaceFloating,
                  opacity: Platform.OS === 'web' ? 0.96 : 0.88,
                },
              ]}
            />
            <View style={styles.rowInner}>
              <View
                style={[
                  styles.avatar,
                  {
                    borderColor: palette.borderFrost,
                    backgroundColor: palette.surfaceOverlay,
                  },
                ]}
              >
                {r.avatar ? (
                  <Image
                    source={{ uri: r.avatar }}
                    style={styles.avatarImg}
                    contentFit="cover"
                    accessibilityIgnoresInvertColors
                  />
                ) : (
                  <Text style={[textStyles.h3, { color: palette.textMuted }]}>
                    {(title[0] ?? '?').toUpperCase()}
                  </Text>
                )}
              </View>
              <View style={{ flex: 1, gap: space.gapXs }}>
                <Text style={[textStyles.body, { color: palette.textPrimary }]} numberOfLines={1}>
                  {title}
                </Text>
                {subtitle ? (
                  <Text
                    style={[textStyles.caption, { color: palette.textSecondary }]}
                    numberOfLines={1}
                  >
                    {subtitle}
                  </Text>
                ) : null}
              </View>
              <Button
                label={t('contactsSync.addToGroupCta')}
                variant="secondary"
                onPress={() => router.push(ROUTES.HOME_GROUPS)}
                trailing="none"
                labelCase="none"
                accessibilityLabel={t('contactsSync.addToGroupCtaA11y')}
              />
            </View>
          </View>
        );
      }
      const r = item.row;
      return (
        <View
          style={[
            styles.card,
            { borderColor: palette.borderFrost, marginBottom: space.gapMd },
            platformShadow('sm'),
          ]}
        >
          <View
            style={[
              StyleSheet.absoluteFill,
              {
                borderRadius: radius['2xl'],
                backgroundColor: palette.surfaceElevated,
                opacity: 1,
              },
            ]}
          />
          <View style={styles.rowInner}>
            <View style={{ flex: 1, gap: space.gapXs }}>
              <Text style={[textStyles.body, { color: palette.textPrimary }]} numberOfLines={1}>
                {r.displayName.trim() || t('contactsSync.unnamedContact')}
              </Text>
              <Text
                style={[textStyles.caption, { color: palette.textSecondary }]}
                numberOfLines={1}
              >
                {r.e164}
              </Text>
            </View>
            <Button
              label={t('contactsSync.inviteCta')}
              variant="accent"
              onPress={() =>
                Alert.alert(t('contactsSync.inviteHintTitle'), t('contactsSync.inviteHintBody'))
              }
              trailing="none"
              labelCase="none"
              accessibilityLabel={t('contactsSync.inviteCtaA11y')}
            />
          </View>
        </View>
      );
    },
    [mode, palette, t],
  );

  const getItemType = useCallback((item: ListRow) => item.kind, []);

  const listUnsupported = !isNativeContactsSupported();

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: palette.background }}>
      <View style={{ paddingHorizontal: space.screenPadding, paddingTop: space.gapSm }}>
        <BackHeaderButton
          onPress={() => {
            if (router.canGoBack()) router.back();
            else router.replace(ROUTES.HOME);
          }}
          accessibilityLabel={t('common.backA11y')}
        />
      </View>
      <FlashList
        data={flatData}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        getItemType={getItemType}
        contentContainerStyle={{
          paddingHorizontal: space.screenPadding,
          paddingBottom: space.sectionGapLg,
        }}
        ListHeaderComponent={
          <View style={{ paddingTop: space.gapMd, gap: space.sectionGapSm }}>
            <DotMatrixField height={64} rows={5} columns={18} />
            <Text
              style={[textStyles.h1, { color: palette.textPrimary }]}
              accessibilityRole="header"
            >
              {t('contactsSync.heroTitle')}
            </Text>
            <Text style={[textStyles.body, { color: palette.textSecondary }]}>
              {t('contactsSync.heroBody')}
            </Text>

            {listUnsupported ? (
              <Text style={[textStyles.caption, { color: palette.warningText }]}>
                {t('contactsSync.unsupported')}
              </Text>
            ) : (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('contactsSync.permissionCardA11y')}
                onPress={() => void onRequestAccess()}
                style={({ pressed }) => [
                  styles.permissionCard,
                  {
                    borderColor: palette.borderFrost,
                    opacity: pressed ? 0.9 : 1,
                  },
                  platformShadow('sm'),
                ]}
              >
                {Platform.OS !== 'web' ? (
                  <BlurView
                    intensity={mode === 'dark' ? 26 : 20}
                    tint={mode}
                    style={[StyleSheet.absoluteFill, { borderRadius: radius['2xl'] }]}
                    experimentalBlurMethod={
                      Platform.OS === 'android' ? 'dimezisBlurView' : undefined
                    }
                  />
                ) : null}
                <View
                  style={[
                    StyleSheet.absoluteFill,
                    {
                      borderRadius: radius['2xl'],
                      backgroundColor: palette.surfaceFloating,
                      opacity: Platform.OS === 'web' ? 0.96 : 0.85,
                    },
                  ]}
                />
                <View style={{ padding: space.sectionGap, gap: space.gapSm }}>
                  <Text style={[textStyles.overline, { color: palette.textMuted }]}>
                    {t('contactsSync.permissionEyebrow')}
                  </Text>
                  <Text style={[textStyles.h3, { color: palette.textPrimary }]}>
                    {permissionUi === 'granted'
                      ? t('contactsSync.permissionGranted')
                      : t('contactsSync.permissionCta')}
                  </Text>
                  <Text style={[textStyles.caption, { color: palette.textSecondary }]}>
                    {permissionUi === 'blocked'
                      ? t('contactsSync.permissionBlocked')
                      : t('contactsSync.permissionDetail')}
                  </Text>
                  {phase === 'syncing' ? (
                    <Animated.View style={[styles.syncingRow, heroPulseStyle]}>
                      <ActivityIndicator color={palette.accent} />
                      <Text style={[textStyles.caption, { color: palette.textMuted }]}>
                        {t('contactsSync.syncing')}
                      </Text>
                    </Animated.View>
                  ) : phase === 'done' ? (
                    <Text style={[textStyles.caption, { color: palette.successText }]}>
                      {t('contactsSync.synced', {
                        registered: registered.length,
                        processed:
                          processedCount ??
                          deviceInviteRowsToSyncPayload(deviceRows).contacts.length,
                      })}
                    </Text>
                  ) : permissionUi === 'granted' ? (
                    <Button
                      label={t('contactsSync.syncNow')}
                      variant="accent"
                      onPress={() => syncMutation.mutate()}
                      trailing="none"
                      loading={syncMutation.isPending}
                      labelCase="none"
                    />
                  ) : null}
                </View>
              </Pressable>
            )}
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  permissionCard: {
    borderRadius: radius['2xl'],
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    minHeight: 44,
  },
  card: {
    borderRadius: radius['2xl'],
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    minHeight: 44,
  },
  rowInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.gapMd,
    padding: space.gapLg,
    zIndex: 1,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImg: {
    width: 44,
    height: 44,
  },
  syncingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.gapMd,
    marginTop: space.gapSm,
  },
});

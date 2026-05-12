import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import type { ReactElement } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  AccessibilityInfo,
  Alert,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { ApiError } from '@/api';
import { Button } from '@/components/ui';
import { GROUP_TYPE_EMOJI, type GroupTypeId } from '@/features/groups/constants/groupTypes';
import {
  useAcceptGroupInvite,
  useDeclineGroupInvite,
} from '@/features/groups/hooks/useGroupMembers';
import { formatGroupTimestamp } from '@/features/groups/utils/formatGroupTimestamp';
import { InviteReactionLottie } from '@/features/invites/components/InviteReactionLottie';
import type { InviteReactionKind } from '@/features/invites/constants/inviteReactionEmoji';
import type { GroupInviteInboxItem } from '@/features/invites/types/groupInviteInbox.types';
import { mapInviteFlowError } from '@/features/invites/utils/mapInviteFlowError';
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

const AVATAR_SIZE = 44;

export type InvitesInboxCardProps = {
  item: GroupInviteInboxItem;
  offline: boolean;
};

const DISMISS_MAX_HEIGHT = 480;

const REACTION_HOLD_ACCEPT_MS = 450;
const REACTION_HOLD_DECLINE_MS = 550;
const REACTION_HOLD_REDUCE_MS = 140;

export function InvitesInboxCard({ item, offline }: InvitesInboxCardProps): ReactElement {
  const { t } = useTranslation();
  const palette = useThemeColors();
  const mode = useThemeMode();
  const accept = useAcceptGroupInvite(item.groupId);
  const decline = useDeclineGroupInvite(item.groupId);
  const [rowBusy, setRowBusy] = useState(false);
  const [reaction, setReaction] = useState<InviteReactionKind | null>(null);
  const [reduceMotionEnabled, setReduceMotionEnabled] = useState(false);
  const overlayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navigateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reduceMotionRef = useRef(false);

  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      reduceMotionRef.current = enabled;
      setReduceMotionEnabled(enabled);
    });
    const sub = AccessibilityInfo.addEventListener?.('reduceMotionChanged', (enabled: boolean) => {
      reduceMotionRef.current = enabled;
      setReduceMotionEnabled(enabled);
    });
    return () => {
      if (overlayTimerRef.current) clearTimeout(overlayTimerRef.current);
      sub?.remove?.();
    };
  }, []);

  const reactionHoldMs = useCallback((normalMs: number): number => {
    return reduceMotionRef.current ? REACTION_HOLD_REDUCE_MS : normalMs;
  }, []);

  const showReaction = useCallback((kind: InviteReactionKind) => {
    setReaction(kind);
    void Haptics.impactAsync(
      kind === 'accept' ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light,
    ).catch(() => {});
  }, []);

  const clearReactionSoon = useCallback(() => {
    if (overlayTimerRef.current) clearTimeout(overlayTimerRef.current);
    overlayTimerRef.current = setTimeout(() => {
      setReaction(null);
      overlayTimerRef.current = null;
    }, reactionHoldMs(REACTION_HOLD_DECLINE_MS));
  }, [reactionHoldMs]);

  const dismiss = useSharedValue(0);
  const cardScale = useSharedValue(1);

  const rowAnimStyle = useAnimatedStyle(() => {
    const p = dismiss.value;
    return {
      opacity: interpolate(p, [0, 0.55, 1], [1, 0.2, 0]),
      maxHeight: interpolate(p, [0, 1], [DISMISS_MAX_HEIGHT, 0]),
      marginBottom: interpolate(p, [0, 1], [space.gapLg, 0]),
      overflow: 'hidden' as const,
      transform: [{ translateY: interpolate(p, [0, 1], [0, -8]) }],
    };
  }, []);

  const cardPressStyle = useAnimatedStyle(
    () => ({
      transform: [{ scale: cardScale.value }],
    }),
    [],
  );

  const title = item.name?.trim() || t('invites.unknownGroup');
  const busy = rowBusy || accept.isPending || decline.isPending;
  const effectiveType: GroupTypeId = item.groupType ?? 'other';
  const emoji = GROUP_TYPE_EMOJI[effectiveType];

  const invitedByLabel = useMemo(() => {
    const by = item.invitedBy;
    const name = by?.name?.trim();
    const user = by?.username?.trim();
    const legacy = item.invitedByName?.trim();
    const display =
      name && name.length > 0
        ? name
        : user && user.length > 0
          ? `@${user}`
          : legacy && legacy.length > 0
            ? legacy
            : t('invites.someoneInvited');
    return t('invites.invitedByLine', { name: display });
  }, [item.invitedBy, item.invitedByName, t]);

  const detailLine = useMemo(() => {
    const parts: string[] = [];
    if (item.memberCount != null) {
      parts.push(
        item.memberCount === 1
          ? t('groups.members_one', { count: item.memberCount })
          : t('groups.members_other', { count: item.memberCount }),
      );
    }
    if (item.groupType) {
      parts.push(t(`createGroup.types.${item.groupType}`));
    }
    if (item.invitedAt) {
      const relative = formatGroupTimestamp(item.invitedAt, t);
      parts.push(t('invites.invitedRelative', { relative }));
    }
    return parts.length > 0 ? parts.join(t('invites.metaSeparator')) : null;
  }, [item.groupType, item.invitedAt, item.memberCount, t]);

  const runDismissMotion = useCallback(() => {
    dismiss.value = withTiming(1, {
      duration: duration.moderate.ms,
      easing: easing.exit.rn,
    });
  }, [dismiss]);

  const openPreview = useCallback(() => {
    router.push(`/home/group/${item.groupId}?roster=0`);
  }, [item.groupId]);

  const onAccept = useCallback(() => {
    if (offline || busy) return;
    setRowBusy(true);
    showReaction('accept');
    accept.mutate(undefined, {
      onSuccess: () => {
        if (navigateTimerRef.current) clearTimeout(navigateTimerRef.current);
        const delay = reactionHoldMs(REACTION_HOLD_ACCEPT_MS);
        navigateTimerRef.current = setTimeout(() => {
          setReaction(null);
          router.replace(`/home/group/${item.groupId}`);
          navigateTimerRef.current = null;
        }, delay);
      },
      onError: (e) => {
        setReaction(null);
        const msg =
          e instanceof ApiError
            ? mapInviteFlowError(e, t)
            : t('groups.membersScreen.inviteAcceptErrorGeneric');
        Alert.alert(t('groups.membersScreen.inviteAcceptErrorTitle'), msg);
      },
      onSettled: () => setRowBusy(false),
    });
  }, [accept, busy, item.groupId, offline, reactionHoldMs, showReaction, t]);

  const onDecline = useCallback(() => {
    if (offline || busy) return;
    Alert.alert(
      t('groups.membersScreen.declineInviteConfirmTitle'),
      t('groups.membersScreen.declineInviteConfirmBody'),
      [
        { text: t('groups.membersScreen.declineInviteConfirmCancel'), style: 'cancel' },
        {
          text: t('groups.membersScreen.declineInviteConfirmCta'),
          style: 'destructive',
          onPress: () => {
            setRowBusy(true);
            showReaction('decline');
            decline.mutate(undefined, {
              onSuccess: () => {
                runDismissMotion();
                clearReactionSoon();
              },
              onError: (e) => {
                setReaction(null);
                const msg =
                  e instanceof ApiError
                    ? mapInviteFlowError(e, t)
                    : t('groups.membersScreen.inviteDeclineErrorGeneric');
                Alert.alert(t('groups.membersScreen.inviteDeclineErrorTitle'), msg);
              },
              onSettled: () => setRowBusy(false),
            });
          },
        },
      ],
    );
  }, [busy, clearReactionSoon, decline, offline, runDismissMotion, showReaction, t]);

  const onPreviewPressIn = useCallback(() => {
    cardScale.value = withTiming(0.99, {
      duration: duration.micro.ms,
      easing: easing.standard.rn,
    });
  }, [cardScale]);

  const onPreviewPressOut = useCallback(() => {
    cardScale.value = withTiming(1, {
      duration: duration.fast.ms,
      easing: easing.enter.rn,
    });
  }, [cardScale]);

  let reactionA11y: string | undefined;
  if (reaction === 'accept') reactionA11y = t('invites.reactionOverlayAcceptA11y');
  else if (reaction === 'decline') reactionA11y = t('invites.reactionOverlayDeclineA11y');

  return (
    <>
      <Modal
        visible={reaction !== null}
        transparent
        animationType="fade"
        statusBarTranslucent
        presentationStyle="overFullScreen"
        accessibilityViewIsModal
        accessibilityLabel={reactionA11y}
      >
        <View
          style={[styles.reactionBackdrop, { backgroundColor: palette.scrimHeavy }]}
          pointerEvents="none"
        >
          {reaction ? (
            <InviteReactionLottie kind={reaction} reduceMotion={reduceMotionEnabled} />
          ) : null}
        </View>
      </Modal>
      <Animated.View style={rowAnimStyle}>
        <View style={[{ borderRadius: radius.inviteCard }, platformShadow('sm')]}>
          <View
            style={{
              borderRadius: radius.inviteCard,
              overflow: 'hidden',
              borderWidth: StyleSheet.hairlineWidth,
              borderColor: palette.borderSubtle,
            }}
          >
            {Platform.OS !== 'web' ? (
              <BlurView
                intensity={mode === 'dark' ? 28 : 22}
                tint={mode}
                style={StyleSheet.absoluteFill}
                experimentalBlurMethod={Platform.OS === 'android' ? 'dimezisBlurView' : undefined}
              />
            ) : null}
            <View
              style={[
                StyleSheet.absoluteFill,
                {
                  backgroundColor: palette.surfaceFloating,
                  opacity: Platform.OS === 'web' ? 0.96 : 0.82,
                },
              ]}
            />
            <View
              style={{
                paddingHorizontal: space.gapLg,
                paddingVertical: space.sectionGapSm,
                gap: space.sectionGapSm,
              }}
            >
              <Animated.View style={cardPressStyle}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t('invites.rowOpenA11y', { name: title })}
                  accessibilityHint={t('invites.rowOpenHint')}
                  onPress={openPreview}
                  onPressIn={onPreviewPressIn}
                  onPressOut={onPreviewPressOut}
                  disabled={busy}
                  style={({ pressed }) => ({
                    opacity: busy ? 0.55 : pressed ? 0.94 : 1,
                  })}
                >
                  <View
                    style={{ flexDirection: 'row', alignItems: 'flex-start', gap: space.gapMd }}
                  >
                    <View
                      style={{
                        width: AVATAR_SIZE,
                        height: AVATAR_SIZE,
                        borderRadius: radius.full,
                        borderWidth: StyleSheet.hairlineWidth,
                        borderColor: palette.borderSubtle,
                        backgroundColor: palette.surfaceOverlay,
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                      }}
                    >
                      {item.avatarUrl ? (
                        <Image
                          source={{ uri: item.avatarUrl }}
                          style={{ width: AVATAR_SIZE, height: AVATAR_SIZE }}
                          contentFit="cover"
                          accessibilityIgnoresInvertColors
                        />
                      ) : (
                        <Text
                          style={{ fontSize: 22 }}
                          accessibilityElementsHidden
                          importantForAccessibility="no"
                        >
                          {emoji}
                        </Text>
                      )}
                    </View>
                    <View style={{ flex: 1, gap: space.gapSm }}>
                      <Text
                        style={[textStyles.h3, { color: palette.textPrimary }]}
                        numberOfLines={2}
                      >
                        {title}
                      </Text>
                      <Text style={[textStyles.body, { color: palette.textSecondary }]}>
                        {invitedByLabel}
                      </Text>
                      {detailLine ? (
                        <Text
                          style={[textStyles.caption, { color: palette.textMuted }]}
                          accessibilityRole="text"
                        >
                          {detailLine}
                        </Text>
                      ) : null}
                    </View>
                  </View>
                </Pressable>
              </Animated.View>

              <View style={{ flexDirection: 'row', gap: space.gapMd, paddingTop: space.gapXs }}>
                <View style={{ flex: 1 }}>
                  <Button
                    label={t('groups.membersScreen.declineInvite')}
                    variant="secondary"
                    onPress={onDecline}
                    disabled={offline || busy}
                    loading={decline.isPending}
                    trailing="none"
                    labelCase="none"
                    accessibilityLabel={t('groups.membersScreen.declineInviteA11y')}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Button
                    label={t('groups.membersScreen.acceptInvite')}
                    variant="accent"
                    onPress={onAccept}
                    disabled={offline || busy}
                    loading={accept.isPending}
                    trailing="none"
                    labelCase="none"
                    accessibilityLabel={t('groups.membersScreen.acceptInviteA11y')}
                  />
                </View>
              </View>
            </View>
          </View>
        </View>
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  reactionBackdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

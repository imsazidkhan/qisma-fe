import { Ionicons } from '@expo/vector-icons';
import { memo, useMemo, type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { addMemberContactRowStyles as rowStyles } from '@/features/groups/components/addMembers/addMemberContactRow.styles';
import { AddButtonMorph } from '@/features/groups/components/addMembers/AddButtonMorph';
import {
  ContactAvatar,
  useAvatarColors,
} from '@/features/groups/components/addMembers/ContactAvatar';
import { InviteStatusBadge } from '@/features/groups/components/addMembers/InviteStatusBadge';
import { addGroupMemberModalStyles as modalStyles } from '@/features/groups/components/addGroupMemberModal.styles';
import type { GroupMemberRosterEntry } from '@/features/groups/types/groupMember.types';
import { resolvePhoneInviteRowState } from '@/features/groups/utils/resolveAddMemberInviteRowState';
import { DEFAULT_PHONE_REGION } from '@/constants';
import type { DeviceContactInviteRow } from '@/services/deviceContacts';
import { maskPhoneE164, tryNormalizeToE164 } from '@/utils';
import { space, useThemeColors } from '@/theme';

export type SelectedContactRowProps = {
  row: DeviceContactInviteRow;
  roster: GroupMemberRosterEntry[] | undefined;
  selected: boolean;
  matchedUserId: string | undefined;
  onToggleSelect: () => void;
  onShare: () => void;
  rosterBlock: boolean;
  isSendingBatch: boolean;
};

function SelectedContactRowInner({
  row,
  roster,
  selected,
  matchedUserId,
  onToggleSelect,
  onShare,
  rosterBlock,
  isSendingBatch,
}: SelectedContactRowProps): ReactElement {
  const { t } = useTranslation();
  const palette = useThemeColors();
  const phoneKey = useMemo(
    () => tryNormalizeToE164(row.e164, DEFAULT_PHONE_REGION) ?? row.e164.trim(),
    [row.e164],
  );

  const label = row.displayName.trim() || t('groups.addMember.suggestedContactFallbackName');
  const masked = maskPhoneE164(row.e164);
  const { backgroundColor: avatarBg } = useAvatarColors(palette, row.contactId);

  const emptySession = useMemo(() => new Set<string>(), []);
  const rowState = resolvePhoneInviteRowState(roster, phoneKey, emptySession);
  const rowQueued = rowState === 'pending' || rowState === 'invited';
  const canSelect = rowState === 'add';
  const morphDisabled = rosterBlock || isSendingBatch || !canSelect;
  const shareDisabled = rosterBlock;

  const actionA11y =
    rowState === 'add'
      ? selected
        ? t('groups.addMember.rowToggleRemoveA11y', { name: label })
        : t('groups.addMember.rowToggleSelectA11y', { name: label })
      : rowState === 'member'
        ? t('groups.addMember.rowMemberA11y', { name: label })
        : t('groups.addMember.rowPendingA11y', { name: label });

  return (
    <View
      style={[
        rowStyles.rowShell,
        {
          borderColor: selected ? palette.borderFocus : palette.inviteCanvas,
          backgroundColor: selected ? palette.accentSoft : palette.inviteCanvas,
        },
      ]}
    >
      <View style={rowStyles.rowInner}>
        <View>
          <ContactAvatar
            label={label}
            backgroundColor={avatarBg}
            borderColor={palette.borderSubtle}
            textColor={palette.textPrimary}
          />
          {selected ? (
            <View
              style={{
                position: 'absolute',
                right: -2,
                bottom: -2,
                width: 16,
                height: 16,
                borderRadius: 8,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: StyleSheet.hairlineWidth,
                borderColor: palette.borderFocus,
                backgroundColor: palette.surfaceFloating,
              }}
            >
              <Ionicons name="checkmark" size={10} color={palette.textPrimary} />
            </View>
          ) : null}
        </View>
        <View style={modalStyles.userTextCol}>
          <Text style={[modalStyles.userName, { color: palette.textPrimary }]} numberOfLines={1}>
            {label}
          </Text>
          <Text style={[modalStyles.userHandle, { color: palette.textMuted }]} numberOfLines={1}>
            {masked}
          </Text>
          {selected ? (
            matchedUserId ? (
              <InviteStatusBadge
                label={t('groups.addMember.onQisma')}
                borderColor={palette.border}
                backgroundColor={palette.surfaceFloating}
                textColor={palette.textSecondary}
              />
            ) : (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.gapXs }}>
                <Ionicons name="cloud-outline" size={12} color={palette.textMuted} />
                <InviteStatusBadge
                  label={t('groups.addMember.inviteWhenTheyJoin')}
                  borderColor={palette.borderSubtle}
                  backgroundColor={palette.overlay}
                  textColor={palette.textMuted}
                />
              </View>
            )
          ) : null}
        </View>
        <View style={modalStyles.rowActions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('groups.addMember.shareInviteA11y', { name: label })}
            accessibilityState={{ disabled: shareDisabled }}
            disabled={shareDisabled}
            onPress={onShare}
            style={({ pressed }) => [
              modalStyles.rowShareAction,
              {
                borderColor: palette.borderSubtle,
                backgroundColor: pressed ? palette.surfaceElevated : 'transparent',
                opacity: shareDisabled ? 0.45 : 1,
              },
            ]}
          >
            <Text style={[modalStyles.rowActionLabel, { color: palette.textSecondary }]}>
              {t('groups.addMember.shareInvite')}
            </Text>
          </Pressable>
          {rowState === 'member' ? (
            <View
              style={[
                modalStyles.rowAction,
                {
                  backgroundColor: palette.surfaceRaised,
                  borderColor: palette.borderSubtle,
                },
              ]}
            >
              <Text style={[modalStyles.rowActionLabel, { color: palette.textMuted }]}>
                {t('groups.addMember.rowMember')}
              </Text>
            </View>
          ) : rowQueued ? (
            <View
              style={[
                modalStyles.rowAction,
                {
                  backgroundColor: palette.surfaceElevated,
                  borderColor: palette.border,
                },
              ]}
            >
              <Text style={[modalStyles.rowActionLabel, { color: palette.textSecondary }]}>
                {t('groups.addMember.rowPending')}
              </Text>
            </View>
          ) : (
            <AddButtonMorph
              selected={selected}
              disabled={morphDisabled}
              onToggle={onToggleSelect}
              labelAdd={t('groups.addMember.rowAdd')}
              labelAdded={t('groups.addMember.rowAdded')}
              accessibilityLabel={actionA11y}
            />
          )}
        </View>
      </View>
    </View>
  );
}

export const SelectedContactRow = memo(SelectedContactRowInner);

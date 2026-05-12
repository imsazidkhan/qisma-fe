import { Image } from 'expo-image';
import { memo, useMemo, type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';

import { groupMemberRowStyles as styles } from '@/features/groups/components/groupMemberRow.styles';
import type { GroupMemberRosterEntry } from '@/features/groups/types/groupMember.types';
import { useThemeColors } from '@/theme';

export type GroupMemberRowProps = {
  member: GroupMemberRosterEntry;
  displayName: string;
  showRemove: boolean;
  onRemovePress?: () => void;
  isRemoving?: boolean;
  showSelfInviteActions?: boolean;
  onAcceptInvitePress?: () => void;
  onDeclineInvitePress?: () => void;
  inviteActionBusy?: boolean;
  showOwnerRoleControl?: boolean;
  onRoleControlPress?: () => void;
  roleActionBusy?: boolean;
};

function initialsFromEntry(entry: GroupMemberRosterEntry): string {
  const base = entry.name?.trim() || entry.username?.trim() || '';
  if (!base) return '?';
  const parts = base.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]![0] ?? ''}${parts[1]![0] ?? ''}`.toUpperCase().slice(0, 2);
  }
  return base.slice(0, 2).toUpperCase();
}

function GroupMemberRowInner({
  member,
  displayName,
  showRemove,
  onRemovePress,
  isRemoving,
  showSelfInviteActions,
  onAcceptInvitePress,
  onDeclineInvitePress,
  inviteActionBusy,
  showOwnerRoleControl,
  onRoleControlPress,
  roleActionBusy,
}: GroupMemberRowProps): ReactElement {
  const { t } = useTranslation();
  const palette = useThemeColors();

  const badgeKey = useMemo(() => {
    switch (member.role) {
      case 'owner':
        return 'groups.membersScreen.roleOwner';
      case 'admin':
        return 'groups.membersScreen.roleAdmin';
      default:
        return 'groups.membersScreen.roleMember';
    }
  }, [member.role]);

  const initials = useMemo(() => initialsFromEntry(member), [member]);

  const badgeLabel = t(badgeKey);
  const showInvitedBadge = member.status === 'pending';

  return (
    <View
      style={styles.row}
      accessibilityElementsHidden={false}
      accessibilityLabel={
        showInvitedBadge
          ? `${displayName}, ${t('groups.membersScreen.statusPending')}`
          : displayName
      }
    >
      <View
        style={[
          styles.avatarWrap,
          { borderColor: palette.borderSubtle, backgroundColor: palette.surfaceRaised },
        ]}
      >
        {member.avatar ? (
          <Image
            source={{ uri: member.avatar }}
            style={styles.avatarImg}
            contentFit="cover"
            accessibilityIgnoresInvertColors
          />
        ) : (
          <Text
            style={[styles.initials, { color: palette.textSecondary }]}
            accessibilityElementsHidden
          >
            {initials}
          </Text>
        )}
      </View>
      <View style={styles.textCol}>
        <Text
          style={[styles.name, { color: palette.textPrimary }]}
          numberOfLines={1}
          accessibilityRole="text"
        >
          {displayName}
        </Text>
        <View style={styles.badgeRow}>
          <View
            style={[
              styles.badge,
              { borderColor: palette.borderSubtle, backgroundColor: palette.surfaceBase },
            ]}
            accessibilityRole="text"
          >
            <Text style={[styles.badgeLabel, { color: palette.textMuted }]}>{badgeLabel}</Text>
          </View>
          {showInvitedBadge ? (
            <View
              style={[
                styles.badge,
                {
                  borderColor: palette.accent,
                  backgroundColor: palette.surfaceElevated,
                },
              ]}
              accessibilityRole="text"
            >
              <Text style={[styles.badgeLabel, { color: palette.textSecondary }]}>
                {t('groups.membersScreen.statusPending')}
              </Text>
            </View>
          ) : null}
        </View>
        {showSelfInviteActions ? (
          <View style={styles.inviteRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('groups.membersScreen.acceptInviteA11y')}
              accessibilityState={{ disabled: inviteActionBusy ?? false }}
              disabled={inviteActionBusy}
              onPress={onAcceptInvitePress}
              style={({ pressed }) => [
                styles.inviteAction,
                { opacity: pressed ? 0.65 : inviteActionBusy ? 0.5 : 1 },
              ]}
            >
              <Text style={[styles.inviteActionLabel, { color: palette.accent }]}>
                {t('groups.membersScreen.acceptInvite')}
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('groups.membersScreen.declineInviteA11y')}
              accessibilityState={{ disabled: inviteActionBusy ?? false }}
              disabled={inviteActionBusy}
              onPress={onDeclineInvitePress}
              style={({ pressed }) => [
                styles.inviteAction,
                { opacity: pressed ? 0.65 : inviteActionBusy ? 0.5 : 1 },
              ]}
            >
              <Text style={[styles.inviteActionLabel, { color: palette.textSecondary }]}>
                {t('groups.membersScreen.declineInvite')}
              </Text>
            </Pressable>
          </View>
        ) : null}
      </View>
      <View style={styles.trailingCol}>
        {showOwnerRoleControl ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('groups.membersScreen.changeRoleA11y', { name: displayName })}
            accessibilityState={{ disabled: roleActionBusy ?? false }}
            disabled={roleActionBusy}
            onPress={onRoleControlPress}
            style={({ pressed }) => [styles.rolePressable, { opacity: pressed ? 0.65 : 1 }]}
          >
            <Text style={[styles.roleLabel, { color: palette.borderFocus }]}>
              {t('groups.membersScreen.changeRole')}
            </Text>
          </Pressable>
        ) : null}
        {showRemove ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('groups.membersScreen.removeA11y', { name: displayName })}
            accessibilityHint={t('groups.membersScreen.removeHint')}
            accessibilityState={{ disabled: isRemoving ?? false }}
            disabled={isRemoving}
            onPress={onRemovePress}
            style={({ pressed }) => [styles.removePressable, { opacity: pressed ? 0.65 : 1 }]}
          >
            <Text style={[styles.removeLabel, { color: palette.errorText }]}>
              {t('groups.membersScreen.remove')}
            </Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

export const GroupMemberRow = memo(GroupMemberRowInner);

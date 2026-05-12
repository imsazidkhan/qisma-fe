import * as Haptics from 'expo-haptics';
import { type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';

import { addGroupMemberModalStyles as styles } from '@/features/groups/components/addGroupMemberModal.styles';
import type { ContactsPermissionUiState } from '@/services/contactsPermission';
import { platformShadow, useThemeColors } from '@/theme';

export type ContactsPermissionIntroCardProps = {
  contactsUiState: ContactsPermissionUiState;
  introPrimaryIsOpenSettings: boolean;
  isPending: boolean;
  onRequestAccess: () => void | Promise<void>;
};

/**
 * Native contacts permission education + primary CTA (system prompt or Settings),
 * shown on the add-members surface until access is **granted**.
 */
export function ContactsPermissionIntroCard({
  contactsUiState,
  introPrimaryIsOpenSettings,
  isPending,
  onRequestAccess,
}: ContactsPermissionIntroCardProps): ReactElement {
  const { t } = useTranslation();
  const palette = useThemeColors();

  const bodyKey =
    contactsUiState === 'blocked'
      ? 'groups.addMember.contactsIntroBodyBlocked'
      : contactsUiState === 'denied'
        ? 'groups.addMember.contactsIntroBodyDenied'
        : 'groups.addMember.contactsIntroBody';

  return (
    <View
      style={[
        styles.contactsCard,
        platformShadow('sm'),
        {
          borderColor: palette.inviteBorder,
          backgroundColor: palette.inviteSurface,
        },
      ]}
    >
      <Text
        style={[styles.contactsCardTitle, { color: palette.textPrimary }]}
        accessibilityRole="header"
        accessibilityLabel={t('groups.addMember.contactsIntroTitleA11y')}
      >
        {t('groups.addMember.contactsIntroTitle')}
      </Text>
      <Text style={[styles.contactsCardBody, { color: palette.inviteMuted }]}>{t(bodyKey)}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={
          introPrimaryIsOpenSettings
            ? t('groups.addMember.contactsOpenSettingsA11y')
            : t('groups.addMember.contactsAllowA11y')
        }
        accessibilityState={{ disabled: isPending }}
        disabled={isPending}
        onPress={() => {
          void Haptics.selectionAsync().catch(() => {});
          void onRequestAccess();
        }}
        style={({ pressed }) => [
          styles.contactsAllowBtn,
          {
            backgroundColor: palette.inviteAccent,
            opacity: pressed && !isPending ? 0.9 : isPending ? 0.45 : 1,
          },
        ]}
      >
        <Text style={[styles.contactsAllowLabel, { color: palette.inviteSuccessFg }]}>
          {introPrimaryIsOpenSettings
            ? t('groups.addMember.contactsOpenSettings')
            : t('groups.addMember.contactsAllowAccess')}
        </Text>
      </Pressable>
    </View>
  );
}

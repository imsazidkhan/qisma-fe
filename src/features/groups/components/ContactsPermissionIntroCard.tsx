import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';

import { addGroupMemberModalStyles as styles } from '@/features/groups/components/addGroupMemberModal.styles';
import type { ContactsPermissionUiState } from '@/services/contactsPermission';
import { typography, useThemeColors } from '@/theme';

export type ContactsPermissionIntroCardProps = {
  contactsUiState: ContactsPermissionUiState;
  introPrimaryIsOpenSettings: boolean;
  isPending: boolean;
  onRequestAccess: () => void | Promise<void>;
  /** `inline` — compact add-members helper without a heavy bordered card. */
  variant?: 'card' | 'inline';
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
  variant = 'card',
}: ContactsPermissionIntroCardProps): ReactElement {
  const { t } = useTranslation();
  const palette = useThemeColors();

  const bodyKey =
    contactsUiState === 'blocked'
      ? 'groups.addMember.contactsIntroBodyBlocked'
      : contactsUiState === 'denied'
        ? 'groups.addMember.contactsIntroBodyDenied'
        : 'groups.addMember.contactsIntroBody';

  const inlineBodyKey =
    contactsUiState === 'blocked'
      ? 'groups.addMember.permissionInlineBodyBlocked'
      : contactsUiState === 'denied'
        ? 'groups.addMember.permissionInlineBodyDenied'
        : 'groups.addMember.permissionInlineBody';

  if (variant === 'inline') {
    return (
      <View style={styles.contactsInline}>
        <View style={styles.contactsInlineTitleRow}>
          <Ionicons name="person-outline" size={18} color={palette.textMuted} />
          <Text
            style={[styles.contactsInlineTitle, { color: palette.textPrimary }]}
            accessibilityRole="header"
          >
            {t('groups.addMember.permissionInlineTitle')}
          </Text>
        </View>
        <Text style={[styles.contactsInlineBody, { color: palette.textSecondary }]}>
          {t(inlineBodyKey)}
        </Text>
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
            styles.contactsInlineCta,
            {
              borderColor: palette.borderStrong,
              backgroundColor: pressed && !isPending ? palette.surfaceRaised : 'transparent',
              opacity: isPending ? 0.55 : 1,
            },
          ]}
        >
          <Text
            style={[
              styles.contactsInlineCtaLabel,
              {
                color: palette.textSecondary,
                fontFamily: typography.fontFamily.mono.medium,
              },
            ]}
          >
            {introPrimaryIsOpenSettings
              ? t('groups.addMember.contactsOpenSettings')
              : t('groups.addMember.contactsAllowAccess')}
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.contactsCard,
        {
          borderColor: palette.border,
          backgroundColor: palette.surfaceBase,
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
      <Text style={[styles.contactsCardBody, { color: palette.textSecondary }]}>{t(bodyKey)}</Text>
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
            backgroundColor: isPending ? palette.surfaceElevated : palette.textPrimary,
            borderColor: palette.textPrimary,
            opacity: pressed && !isPending ? 0.88 : isPending ? 0.5 : 1,
          },
        ]}
      >
        <Text
          style={[
            styles.contactsAllowLabel,
            { color: isPending ? palette.textDisabled : palette.background },
          ]}
        >
          {introPrimaryIsOpenSettings
            ? t('groups.addMember.contactsOpenSettings')
            : t('groups.addMember.contactsAllowAccess')}
        </Text>
      </Pressable>
    </View>
  );
}

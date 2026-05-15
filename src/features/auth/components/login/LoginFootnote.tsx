import { useTranslation } from 'react-i18next';
import { Linking, Text, View } from 'react-native';

import { LEGAL_PRIVACY_URL, LEGAL_TERMS_URL } from '@/constants';
import { useThemeColors } from '@/theme';

import { loginScreenStyles as styles } from './loginScreen.styles';

export function LoginFootnote() {
  const palette = useThemeColors();
  const { t } = useTranslation();

  const open = (url: string): void => {
    const u = url.trim();
    if (!u) return;
    void Linking.openURL(u).catch(() => {
      /* no-op */
    });
  };

  const termsHref = LEGAL_TERMS_URL.trim();
  const privacyHref = LEGAL_PRIVACY_URL.trim();

  return (
    <View style={styles.footnoteBlock}>
      <Text style={[styles.footnote, { color: palette.textMuted }]}>
        {t('auth.phone.footnoteTerms')}{' '}
        <Text
          {...(termsHref
            ? {
                onPress: () => open(termsHref),
                accessibilityRole: 'link' as const,
              }
            : {})}
          accessibilityLabel={t('auth.phone.footnoteTermsLink')}
          style={[
            termsHref ? styles.footnoteLink : styles.footnote,
            { color: palette.textSecondary },
          ]}
        >
          {t('auth.phone.footnoteTermsLink')}
        </Text>{' '}
        {t('auth.phone.footnoteAnd')}{' '}
        <Text
          {...(privacyHref
            ? {
                onPress: () => open(privacyHref),
                accessibilityRole: 'link' as const,
              }
            : {})}
          accessibilityLabel={t('auth.phone.footnotePrivacyLink')}
          style={[
            privacyHref ? styles.footnoteLink : styles.footnote,
            { color: palette.textSecondary },
          ]}
        >
          {t('auth.phone.footnotePrivacyLink')}
        </Text>
        .
      </Text>
    </View>
  );
}

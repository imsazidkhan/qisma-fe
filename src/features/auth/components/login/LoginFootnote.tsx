import { useTranslation } from 'react-i18next';
import { Text } from 'react-native';

import { useThemeColors } from '@/theme';

import { loginScreenStyles as styles } from './loginScreen.styles';

export function LoginFootnote() {
  const palette = useThemeColors();
  const { t } = useTranslation();

  return (
    <Text style={[styles.footnote, { color: palette.textMuted }]}>
      {t('auth.phone.footnoteTerms')}{' '}
      <Text style={{ color: palette.textSecondary }}>{t('auth.phone.footnoteTermsLink')}</Text>{' '}
      {t('auth.phone.footnoteAnd')}{' '}
      <Text style={{ color: palette.textSecondary }}>{t('auth.phone.footnotePrivacyLink')}</Text>.
    </Text>
  );
}

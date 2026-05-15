import { Text, View } from 'react-native';

import { StatusDot, type StatusDotState, ThemeToggle } from '@/components/ui';
import { useThemeColors } from '@/theme';

import { loginScreenStyles as styles } from './loginScreen.styles';

export function LoginTopBar({ dotState }: { dotState: StatusDotState }) {
  const palette = useThemeColors();

  return (
    <View style={styles.topBar}>
      <View style={[styles.brandRow, { opacity: 0.72 }]}>
        <StatusDot state={dotState} size={4} />
        <Text style={[styles.brandMark, { color: palette.textMuted }]}>QISMA · v0.1</Text>
      </View>
      <ThemeToggle variant="auth" />
    </View>
  );
}

import { Ionicons } from '@expo/vector-icons';
import type { ReactElement } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import {
  layoutGrid,
  platformShadow,
  radius,
  space,
  textStyles,
  typography,
  useThemeColors,
} from '@/theme';

export type InsightsSmartStackProps = {
  title: string;
  lines: { id: string; body: string }[];
};

const GLYPHS: (keyof typeof Ionicons.glyphMap)[] = [
  'calendar-outline',
  'restaurant-outline',
  'people-outline',
  'trending-down-outline',
];

export function InsightsSmartStack({ title, lines }: InsightsSmartStackProps): ReactElement {
  const palette = useThemeColors();

  return (
    <View style={{ gap: space.gapSm }}>
      <Text
        style={[
          textStyles.overline,
          {
            color: palette.textMuted,
            letterSpacing: typography.letterSpacing.widest,
          },
        ]}
      >
        {title}
      </Text>
      <View style={{ gap: space.gapSm }}>
        {lines.map((line, idx) => {
          const name = GLYPHS[idx % GLYPHS.length] ?? 'sparkles-outline';
          return (
            <View
              key={line.id}
              style={[
                platformShadow('xs'),
                {
                  borderRadius: radius['2xl'],
                },
              ]}
            >
              <View
                style={[
                  styles.card,
                  {
                    borderColor: palette.borderSubtle,
                    backgroundColor: palette.surfaceElevated,
                    borderRadius: radius['2xl'],
                  },
                ]}
              >
                <View
                  style={[
                    styles.iconRail,
                    { borderColor: palette.borderSubtle, backgroundColor: palette.surfaceFloating },
                  ]}
                >
                  <Ionicons name={name} size={17} color={palette.textMuted} />
                </View>
                <Text style={[textStyles.body, { color: palette.textSecondary, flex: 1 }]}>
                  {line.body}
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: layoutGrid.sm,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: space.gapMd,
    paddingVertical: space.gapMd,
  },
  iconRail: {
    width: 34,
    height: 34,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
});

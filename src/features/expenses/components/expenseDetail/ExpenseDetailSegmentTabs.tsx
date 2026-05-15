import type { ReactElement } from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import { layoutGrid, radius, size, textStyles, typography, useThemeColors } from '@/theme';

export type ExpenseDetailSegmentTabsProps<T extends string> = {
  tabs: readonly { id: T; label: string; a11yLabel: string }[];
  active: T;
  onChange: (id: T) => void;
};

const PILL_PAD_V = layoutGrid.micro;
const PILL_PAD_H = layoutGrid.sm;

export function ExpenseDetailSegmentTabs<T extends string>({
  tabs,
  active,
  onChange,
}: ExpenseDetailSegmentTabsProps<T>): ReactElement {
  const palette = useThemeColors();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{
        gap: layoutGrid.micro,
        paddingVertical: layoutGrid.micro,
        alignItems: 'center',
      }}
    >
      {tabs.map((tab) => {
        const selected = tab.id === active;
        return (
          <Pressable
            key={tab.id}
            accessibilityRole="tab"
            accessibilityLabel={tab.a11yLabel}
            accessibilityState={{ selected }}
            android_ripple={{
              color: palette.overlay,
              foreground: true,
            }}
            hitSlop={8}
            onPress={() => onChange(tab.id)}
            style={({ pressed }) => {
              const shell = {
                paddingVertical: PILL_PAD_V,
                paddingHorizontal: PILL_PAD_H,
                minHeight: size.buttonSm,
                borderRadius: radius.full,
                borderWidth: StyleSheet.hairlineWidth,
                justifyContent: 'center' as const,
                alignItems: 'center' as const,
              };
              if (selected) {
                return [
                  shell,
                  {
                    borderColor: pressed ? palette.borderFocus : palette.accent,
                    backgroundColor: pressed ? palette.surfaceFloating : palette.surfaceElevated,
                    opacity: pressed ? 0.92 : 1,
                  },
                ];
              }
              return [
                shell,
                {
                  borderColor: pressed ? palette.border : palette.borderSubtle,
                  backgroundColor: pressed ? palette.interactive : palette.surfaceBase,
                  opacity: pressed ? 0.88 : 1,
                },
              ];
            }}
          >
            <Text
              style={[
                textStyles.captionSmall,
                {
                  color: selected ? palette.textPrimary : palette.textSecondary,
                  fontFamily: typography.fontFamily.mono.medium,
                  letterSpacing: typography.letterSpacing.wide,
                  textTransform: 'uppercase',
                },
              ]}
              numberOfLines={1}
            >
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

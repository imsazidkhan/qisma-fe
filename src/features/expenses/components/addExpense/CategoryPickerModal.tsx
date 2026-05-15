import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import type { ReactElement } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { ExpenseCategoryListItem } from '@/features/expenses/types/expenseTaxonomy.types';
import { renderExpenseTierIcon } from '@/features/expenses/utils/renderExpenseTierIcon';
import { radius, size, space, typography, useThemeColors } from '@/theme';

export type CategoryPickerModalProps = {
  visible: boolean;
  categories: ExpenseCategoryListItem[];
  onClose: () => void;
  onPick: (category: ExpenseCategoryListItem) => void;
};

/** Full category picker used for fallback or manual override. */
export function CategoryPickerModal({
  visible,
  categories,
  onClose,
  onPick,
}: CategoryPickerModalProps): ReactElement {
  const palette = useThemeColors();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: palette.background }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: space.screenPadding,
          }}
        >
          <Text
            style={{
              fontFamily: typography.fontFamily.mono.medium,
              fontSize: typography.fontSize.sm,
              letterSpacing: typography.letterSpacing.widest,
              textTransform: 'uppercase',
              color: palette.textPrimary,
            }}
          >
            Pick category
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close category picker"
            onPress={onClose}
            hitSlop={12}
            style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
          >
            <Ionicons name="close" size={22} color={palette.textPrimary} />
          </Pressable>
        </View>
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: space.screenPadding,
            paddingBottom: space.gapXl,
            gap: space.gapSm,
          }}
          showsVerticalScrollIndicator={false}
        >
          {categories.map((c) => (
            <Pressable
              key={c.id}
              accessibilityRole="button"
              accessibilityLabel={`Select ${c.name}`}
              onPress={() => {
                void Haptics.selectionAsync().catch(() => {});
                onPick(c);
              }}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                gap: space.gapMd,
                borderRadius: radius.md,
                borderWidth: StyleSheet.hairlineWidth,
                borderColor: palette.borderStrong,
                backgroundColor: palette.surfaceElevated,
                paddingVertical: space.gapSm,
                paddingHorizontal: space.gapMd,
                opacity: pressed ? 0.78 : 1,
              })}
            >
              <View
                style={{
                  width: size.avatarSm,
                  height: size.avatarSm,
                  borderRadius: radius.full,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: palette.surfaceRaised,
                  borderWidth: StyleSheet.hairlineWidth,
                  borderColor: palette.borderSubtle,
                }}
              >
                {renderExpenseTierIcon(c, {
                  size: size.avatarSm,
                  glyphColor: palette.textSecondary,
                  fallbackTextColor: palette.textMuted,
                  fallbackIon: 'pricetag-outline',
                })}
              </View>
              <Text
                style={{
                  flex: 1,
                  fontFamily: typography.fontFamily.sans.semiBold,
                  fontSize: typography.fontSize.sm,
                  color: palette.textPrimary,
                }}
              >
                {c.name}
              </Text>
              <Ionicons name="chevron-forward" size={16} color={palette.iconMuted} />
            </Pressable>
          ))}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

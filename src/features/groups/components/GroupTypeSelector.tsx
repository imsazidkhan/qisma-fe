import * as Haptics from 'expo-haptics';
import { memo, useCallback, type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { createGroupScreenStyles as styles } from '@/features/groups/components/createGroupScreen.styles';
import {
  GROUP_TYPE_EMOJI,
  GROUP_TYPE_ORDER,
  type GroupTypeId,
} from '@/features/groups/constants/groupTypes';
import { textStyles, typography, useThemeColors } from '@/theme';

export type GroupTypeSelectorProps = {
  value: GroupTypeId;
  onChange: (id: GroupTypeId) => void;
};

function GroupTypeSelectorInner({ value, onChange }: GroupTypeSelectorProps): ReactElement {
  const { t } = useTranslation();
  const palette = useThemeColors();

  const handleSelect = useCallback(
    (id: GroupTypeId) => {
      void Haptics.selectionAsync().catch(() => {});
      onChange(id);
    },
    [onChange],
  );

  return (
    <View style={styles.typeList}>
      {GROUP_TYPE_ORDER.map((id, index) => {
        const selected = value === id;
        const isLast = index === GROUP_TYPE_ORDER.length - 1;
        return (
          <Pressable
            key={id}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            accessibilityLabel={t(`createGroup.types.${id}`)}
            onPress={() => handleSelect(id)}
            style={({ pressed }) => [
              styles.typeRow,
              {
                borderBottomWidth: isLast ? 0 : StyleSheet.hairlineWidth,
                borderBottomColor: palette.borderSubtle,
                opacity: pressed ? 0.88 : 1,
              },
            ]}
          >
            <View
              style={[
                styles.typeRowBar,
                { backgroundColor: selected ? palette.accent : 'transparent' },
              ]}
            />
            <View style={styles.typeRowMain}>
              <Text
                style={[styles.typeRowEmoji, { color: palette.textMuted }]}
                accessibilityElementsHidden
              >
                {GROUP_TYPE_EMOJI[id]}
              </Text>
              <Text
                style={[
                  textStyles.body,
                  {
                    flex: 1,
                    color: selected ? palette.textPrimary : palette.textSecondary,
                    fontFamily: selected
                      ? typography.fontFamily.sans.medium
                      : typography.fontFamily.sans.regular,
                  },
                ]}
                numberOfLines={1}
              >
                {t(`createGroup.types.${id}`)}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

export const GroupTypeSelector = memo(GroupTypeSelectorInner);

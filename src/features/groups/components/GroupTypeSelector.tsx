import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { memo, useCallback, useRef, type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { createGroupScreenStyles as styles } from '@/features/groups/components/createGroupScreen.styles';
import {
  GROUP_TYPE_GLYPH,
  GROUP_TYPE_ORDER,
  type GroupTypeId,
} from '@/features/groups/constants/groupTypes';
import { duration, platformShadow, useThemeColors } from '@/theme';

const GROUP_TYPE_DOUBLE_TAP_MS = duration.moderate.ms;

export type GroupTypeSelectorProps = {
  value: GroupTypeId | null;
  onChange: (id: GroupTypeId | null) => void;
};

function GroupTypeSelectorInner({ value, onChange }: GroupTypeSelectorProps): ReactElement {
  const { t } = useTranslation();
  const p = useThemeColors();
  const lastPressRef = useRef<{ id: GroupTypeId; at: number } | null>(null);

  const handleRowPress = useCallback(
    (id: GroupTypeId) => {
      const now = Date.now();
      const prev = lastPressRef.current;
      if (
        value === id &&
        prev?.id === id &&
        now - prev.at <= GROUP_TYPE_DOUBLE_TAP_MS
      ) {
        lastPressRef.current = null;
        void Haptics.selectionAsync().catch(() => {});
        onChange(null);
        return;
      }
      lastPressRef.current = { id, at: now };
      if (value !== id) {
        void Haptics.selectionAsync().catch(() => {});
        onChange(id);
      }
    },
    [onChange, value],
  );

  return (
    <View collapsable={false} style={styles.typeListShell}>
      <View collapsable={false} style={styles.typeStack}>
        {GROUP_TYPE_ORDER.map((id, index) => {
          const selected = value === id;
          const isLast = index === GROUP_TYPE_ORDER.length - 1;
          return (
            <View
              key={id}
              collapsable={false}
              style={[styles.typeRowWrap, !isLast ? styles.typeCardSpacing : null]}
            >
              <View collapsable={false} style={styles.typeRowHitArea}>
                <View
                  collapsable={false}
                  style={[
                    styles.typeCard,
                    {
                      backgroundColor: selected ? p.createGroupCtaFill : p.surfaceBase,
                      borderColor: selected ? p.createGroupCtaFill : p.borderSubtle,
                    },
                    selected ? null : platformShadow('sm'),
                  ]}
                >
                  <View style={styles.typeIconBoxWrap}>
                    <View
                      style={[
                        styles.typeIconBox,
                        {
                          borderColor: selected ? p.createGroupCtaContent : p.borderSubtle,
                          backgroundColor: 'transparent',
                        },
                      ]}
                    >
                      <Ionicons
                        color={
                          selected ? p.createGroupCtaContent : p.iconSecondary
                        }
                        name={GROUP_TYPE_GLYPH[id]}
                        size={22}
                      />
                    </View>
                  </View>
                  <View style={styles.typeTextCol}>
                    <Text
                      style={[
                        styles.typeTitle,
                        styles.typeTitleSpaced,
                        { color: selected ? p.createGroupCtaContent : p.textPrimary },
                      ]}
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      {t(`createGroup.types.${id}`)}
                    </Text>
                    <Text
                      style={[
                        styles.typeDesc,
                        {
                          color: selected ? `${p.createGroupCtaContent}B3` : p.textSecondary,
                        },
                      ]}
                      numberOfLines={2}
                      ellipsizeMode="tail"
                    >
                      {t(`createGroup.typesDesc.${id}`)}
                    </Text>
                  </View>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  accessibilityLabel={`${t(`createGroup.types.${id}`)}. ${t(`createGroup.typesDesc.${id}`)}`}
                  accessibilityHint={
                    selected ? t('createGroup.typeDoubleTapClearHint') : undefined
                  }
                  onPress={() => handleRowPress(id)}
                  style={[StyleSheet.absoluteFill, { zIndex: 1 }]}
                />
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

export const GroupTypeSelector = memo(GroupTypeSelectorInner);

import { Ionicons } from '@expo/vector-icons';
import { memo, useCallback, useMemo, useState, type ReactElement } from 'react';
import {
  Keyboard,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  type TextInputProps,
  View,
} from 'react-native';

import { radius, shadows, spacing, typography } from '@/theme';
import { useThemeColors } from '@/theme/ThemeProvider';

const FIELD_H = spacing['12'] + spacing['0.5'];
const FILTER_HIT = spacing['8'];
const PAD_H = spacing['4'];
const GAP_ICON_FIELD = spacing['3'];
const GAP_FIELD_FILTER = spacing['2.5'];
const ICON_SEARCH = typography.fontSize.lg;
const ICON_FILTER = typography.fontSize.base;

export type AmbientSearchFieldProps = Omit<
  TextInputProps,
  'placeholderTextColor' | 'style' | 'multiline'
> & {
  placeholder: string;
  onFilterPress?: () => void;
  filterAccessibilityLabel?: string;
  filterAccessibilityHint?: string;
  searchAccessibilityLabel?: string;
  /** Horizontal inset so the field sits slightly inside the screen rail (default: `spacing['2']`). */
  railInset?: number;
};

function AmbientSearchFieldInner({
  value,
  onChangeText,
  placeholder,
  onFilterPress,
  filterAccessibilityLabel,
  filterAccessibilityHint,
  searchAccessibilityLabel,
  railInset = spacing['2'],
  editable = true,
  onFocus: onFocusProp,
  onBlur: onBlurProp,
  ...textInputRest
}: AmbientSearchFieldProps): ReactElement {
  const palette = useThemeColors();
  const [focused, setFocused] = useState(false);

  const elevation = useMemo(() => (focused ? shadows.ambientSearchFocused : shadows.ambientSearch), [focused]);

  const shellShadow = useMemo(
    () =>
      focused
        ? Platform.select({
            ios: {
              shadowColor: palette.shadow,
              shadowOffset: elevation.shadowOffset,
              shadowOpacity: elevation.shadowOpacity,
              shadowRadius: elevation.shadowRadius,
            },
            android: { elevation: elevation.elevation },
            default: {
              shadowColor: palette.shadow,
              shadowOffset: elevation.shadowOffset,
              shadowOpacity: elevation.shadowOpacity,
              shadowRadius: elevation.shadowRadius,
            },
          })
        : Platform.select({
            ios: {
              shadowColor: palette.shadow,
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0,
              shadowRadius: 0,
            },
            android: { elevation: 0 },
            default: {
              shadowColor: palette.shadow,
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0,
              shadowRadius: 0,
            },
          }),
    [focused, elevation, palette.shadow],
  );

  const shellTone = useMemo(
    () => ({
      backgroundColor: focused ? palette.ambientSearchFillFocused : palette.ambientSearchFill,
      borderColor: focused ? palette.ambientSearchBorderFocused : palette.ambientSearchBorder,
    }),
    [focused, palette],
  );

  const handleFilter = useCallback(() => {
    void Keyboard.dismiss();
    onFilterPress?.();
  }, [onFilterPress]);

  return (
    <View style={[styles.rail, { marginHorizontal: railInset }]}>
      <View
        style={[
          styles.shell,
          shellShadow,
          {
            height: FIELD_H,
            borderRadius: radius.ambientSearch,
            paddingHorizontal: PAD_H,
            borderWidth: focused ? 1 : 0,
            ...shellTone,
          },
        ]}
      >
        <View style={[styles.leadIcon, { marginRight: GAP_ICON_FIELD }]} pointerEvents="none">
          <Ionicons name="search-outline" size={ICON_SEARCH} color={palette.textPrimary} style={styles.searchGlyph} />
        </View>

        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={palette.ambientSearchPlaceholder}
          selectionColor={palette.selection}
          cursorColor={palette.cursor}
          underlineColorAndroid="transparent"
          editable={editable}
          onFocus={(e) => {
            setFocused(true);
            onFocusProp?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlurProp?.(e);
          }}
          style={[
            styles.field,
            {
              color: palette.textPrimary,
              marginRight: onFilterPress ? GAP_FIELD_FILTER : 0,
            },
            Platform.OS === 'android'
              ? { textAlignVertical: 'center', includeFontPadding: false }
              : {},
          ]}
          returnKeyType="search"
          onSubmitEditing={() => Keyboard.dismiss()}
          accessibilityLabel={searchAccessibilityLabel}
          {...textInputRest}
        />

        {onFilterPress ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={filterAccessibilityLabel}
            accessibilityHint={filterAccessibilityHint}
            hitSlop={spacing['1.5']}
            onPress={handleFilter}
            style={({ pressed }) => [
              styles.filterDisk,
              {
                backgroundColor: palette.ambientSearchFilterScrim,
                opacity: pressed ? 0.88 : 1,
              },
            ]}
          >
            <Ionicons
              name="options-outline"
              size={ICON_FILTER}
              color={palette.textPrimary}
              style={styles.filterGlyph}
            />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  rail: {
    alignSelf: 'stretch',
  },
  shell: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  leadIcon: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchGlyph: {
    opacity: 0.34,
  },
  field: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 0,
    margin: 0,
    backgroundColor: 'transparent',
    fontFamily: typography.fontFamily.sans.regular,
    fontSize: typography.fontSize.ambientSearch,
    fontWeight: typography.fontWeight.regular,
    letterSpacing: typography.letterSpacing.ambientSearch,
  },
  filterDisk: {
    width: FILTER_HIT,
    height: FILTER_HIT,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterGlyph: {
    opacity: 0.4,
  },
});

export const AmbientSearchField = memo(AmbientSearchFieldInner);

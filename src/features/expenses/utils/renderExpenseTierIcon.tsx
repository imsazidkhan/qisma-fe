import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import type { ReactElement } from 'react';
import { Text, View, StyleSheet } from 'react-native';

import type { ExpenseCategoryTier } from '@/features/expenses/types/expenseTaxonomy.types';
import {
  resolveExpenseIonFromGlyphKey,
  type ExpenseIonIcon,
} from '@/features/expenses/utils/expenseCategoryIonResolve';

function parseHttpsUrl(raw: string | null | undefined): string | null {
  if (typeof raw !== 'string') return null;
  const t = raw.trim();
  if (!/^https?:\/\//i.test(t)) return null;
  return t;
}

function tierFallbackInitials(tier: ExpenseCategoryTier): string {
  const n = tier.name?.trim() ?? '';
  if (n.length >= 2) return n.slice(0, 2).toUpperCase();
  const s = tier.slug?.trim() ?? '';
  if (s.length >= 2) return s.slice(0, 2).toUpperCase();
  return '?';
}

export type RenderExpenseTierIconOptions = {
  /** Bubble / canvas size in px */
  size: number;
  glyphColor: string;
  fallbackTextColor: string;
  fallbackIon?: ExpenseIonIcon;
};

/**
 * Renders a category tier with strict precedence:
 * 1. **`iconUrl`** (HTTPS) → raster image
 * 2. **`icon.kind === 'emoji'`** → text
 * 3. **`icon.kind === 'glyph'`** → mapped vector (Ionicons)
 * 4. **`name` / `slug`** → initials fallback
 */
export function renderExpenseTierIcon(
  tier: ExpenseCategoryTier | null | undefined,
  opts: RenderExpenseTierIconOptions,
): ReactElement {
  const { size, glyphColor, fallbackTextColor, fallbackIon = 'ellipse-outline' } = opts;
  const inner = Math.round(size * 0.72);

  if (tier === null || tier === undefined) {
    return (
      <Text
        allowFontScaling={false}
        style={{
          fontSize: Math.round(inner * 0.45),
          color: fallbackTextColor,
          textAlign: 'center',
        }}
      >
        ?
      </Text>
    );
  }

  const url = parseHttpsUrl(tier.iconUrl ?? undefined);
  if (url) {
    return (
      <Image
        accessibilityIgnoresInvertColors
        contentFit="contain"
        source={{ uri: url }}
        style={{ width: inner, height: inner }}
      />
    );
  }

  const ic = tier.icon;
  if (ic?.kind === 'emoji') {
    return (
      <Text
        allowFontScaling={false}
        style={{
          fontSize: Math.round(inner * 0.72),
          lineHeight: Math.round(inner * 0.92),
          color: glyphColor,
          textAlign: 'center',
        }}
      >
        {ic.value}
      </Text>
    );
  }

  if (ic?.kind === 'glyph') {
    const ion = resolveExpenseIonFromGlyphKey(ic.value, fallbackIon);
    return <Ionicons color={glyphColor} name={ion} size={inner} />;
  }

  return (
    <Text
      allowFontScaling={false}
      style={{
        fontSize: Math.round(inner * 0.38),
        color: fallbackTextColor,
        textAlign: 'center',
      }}
    >
      {tierFallbackInitials(tier)}
    </Text>
  );
}

/** Wraps {@link renderExpenseTierIcon} in a fixed square for list rows / chips. */
export function ExpenseTierIconBubble(props: {
  tier: ExpenseCategoryTier | null | undefined;
  palette: { surfaceRaised: string; borderSubtle: string };
  size: number;
  glyphColor: string;
  fallbackTextColor: string;
  fallbackIon?: ExpenseIonIcon;
}): ReactElement {
  const { tier, palette, size, glyphColor, fallbackTextColor, fallbackIon } = props;
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: palette.surfaceRaised,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: palette.borderSubtle,
      }}
    >
      {renderExpenseTierIcon(tier, { size, glyphColor, fallbackTextColor, fallbackIon })}
    </View>
  );
}

---
description: "Use when writing, editing, or reviewing React Native components (.tsx files). Enforces component size, composition, accessibility, list performance, and Nothing OS visual rules."
applyTo: "**/*.tsx"
---

# Component Authoring Rules

## Size & Responsibility

- Components stay under ~150 lines. Split when they cross.
- One responsibility per component. If you say "and" describing it, split it.
- Never place business logic directly in JSX. Compute first, render flat.
- Use early returns to reduce nesting.

```tsx
// ❌ BAD — logic in JSX, deep nesting
return (
  <View>
    {phone.length === 10 && !isOnline ? <OfflineBanner /> : (
      isPending ? <Spinner /> : <Button onPress={() => sendOtp({ ... })} />
    )}
  </View>
);

// ✅ GOOD — derive once, render flat
const showOffline = isPhoneValid && !isOnline;
const handleSubmit = () => sendOtp({ phoneE164: normalizeToE164(phone) });

if (isPending) return <Spinner />;
return (
  <View>
    {showOffline ? <OfflineBanner /> : <Button onPress={handleSubmit} />}
  </View>
);
```

## Composition

- Prefer composition over prop explosion. If a component has > ~6 props, split it or accept `children`.
- Screens compose primitives. Primitives never compose screens.
- Always reuse existing primitives from `@/components/ui` (Button, Input, Card, etc.) — never reinvent them.

## Hooks Inside Components

- Hooks at the top of the function only. No conditional hooks.
- Stable keys in lists — never `index` for dynamic data.
- Hoist `renderItem` and callbacks with `useCallback` — no inline arrow functions in `FlatList`/`FlashList`.
- Avoid side effects during rendering.

## Theme (mandatory in every component)

```tsx
// ❌ WRONG every time — hardcoded or static import
<View style={{ backgroundColor: '#111' }} />
import { colors } from '@/theme'; // dark-only, breaks light mode

// ✅ CORRECT
import { useThemeColors, textStyles, space } from '@/theme';
const palette = useThemeColors();
<View style={{ backgroundColor: palette.surfaceElevated }} />
```

- All colors via `useThemeColors()`. Spacing via `space.*` or NativeWind `p-*`/`gap-*`. Typography via `textStyles.*`.
- Verify in **both light AND dark** before finishing.

## Accessibility (non-optional)

- Every interactive element needs `accessibilityRole`, `accessibilityLabel`, `accessibilityState`.
- Announce live status changes: `AccessibilityInfo.announceForAccessibility(...)`.
- Respect `AccessibilityInfo.isReduceMotionEnabled()` for non-essential animations.

## Lists

- Use `FlashList` for >50 items or async-loaded feeds.
- `FlatList`: always set `keyExtractor`, `getItemLayout` (fixed height), `removeClippedSubviews`.

```tsx
// ❌ BAD
<FlatList data={items} renderItem={(x) => <Row item={x.item} />} />

// ✅ GOOD
const renderItem = useCallback(({ item }: { item: MyType }) => <Row item={item} />, []);
const keyExtractor = useCallback((item: MyType) => item.id, []);
<FlatList data={items} renderItem={renderItem} keyExtractor={keyExtractor} />
```

## Motion

- Reanimated worklets only — never JS-driven animations.
- `withTiming(value, { duration: duration.standard.ms, easing: easing.standard.rn })`.
- Import `Easing` from `react-native-reanimated`, never from `react-native`.
- Pass palette colors as second-arg deps in `useAnimatedStyle` for theme-reactivity.

## Forbidden in Components

- Hardcoded hex/px/rem/colors.
- `console.log` — use `@/services/logger`.
- `PanResponder` — use `react-native-gesture-handler`.
- Inline styles for layout that NativeWind handles (`p-4`, `flex-1`, `gap-2`).
- Gradients, shadows, colorful fills, oversized CTAs, bouncy springs.

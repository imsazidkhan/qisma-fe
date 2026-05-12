---
description: "Use when building forms, input screens, or any screen with user input fields. Covers React Hook Form, Zod validation, keyboard handling, and submit patterns."
applyTo: ["**/*Form*.tsx", "**/screens/**/*.tsx", "src/app/**/*.tsx"]
---

# Forms & Input Rules

## React Hook Form

- Use React Hook Form (`react-hook-form`) for any form with more than 1 field.
- Build on top of existing `@/components/ui` primitives (Input, Button) — never re-implement label/error layout per screen.

## Zod Validation

- Centralize validation schemas in `src/features/<name>/schemas/`.
- The **same Zod schema** validates both the form input AND the API response — never duplicate logic.

```ts
// ❌ BAD — validation logic stated twice
if (phone.length !== 10) showError('...');
const parsed = z.string().length(10).parse(phone);

// ✅ GOOD — one schema, both sides
const phoneSchema = z.string().length(10);
const { success, error } = phoneSchema.safeParse(phone);
```

## Keyboard Handling (mandatory for every input screen)

- Every screen with a text input **must** handle the soft keyboard.
- `KeyboardAvoidingView` with:
  - `behavior="padding"` on iOS
  - `behavior="height"` on Android (when `edgeToEdgeEnabled: true`)
- Wrap content in `ScrollView` with `keyboardShouldPersistTaps="handled"`.
- Pin the primary CTA above the keyboard — never let it scroll out of view.

```tsx
<KeyboardAvoidingView
  style={{ flex: 1 }}
  behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
>
  <ScrollView keyboardShouldPersistTaps="handled">
    {/* inputs here */}
    <Button label="Submit" onPress={handleSubmit} />
  </ScrollView>
</KeyboardAvoidingView>
```

## Submit / Async Actions

- Disable the submit button while offline (`useNetworkStatus`).
- Show loading state on the button during submission — never block the whole screen with a spinner.
- Never auto-retry form submissions — treat 5xx as ambiguous, surface to user.
- Show error messages tied to `error.code` via the i18n error map, never raw server strings.

## Single Primary CTA Rule

- One primary (accent) CTA per screen. Everything else is `variant="secondary"` or `variant="ghost"`.
- Outlined Button variants by default. Filled only for the single primary action.

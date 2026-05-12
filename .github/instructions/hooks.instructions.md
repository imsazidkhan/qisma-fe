---
description: "Use when writing, editing, or reviewing custom React hooks (use*.ts, use*.tsx). Enforces single-responsibility, effect cleanup, dependency arrays, and pure utility separation."
applyTo: ["**/use*.ts", "**/use*.tsx", "**/hooks/**/*.ts", "**/hooks/**/*.tsx"]
---

# Hooks & Effects Rules

## Authoring Hooks

- One responsibility per hook. Never mix unrelated concerns.
- Name hooks `useThing`. Document return type explicitly.
- Wrap third-party imperative APIs in custom hooks — keep components free of raw subscriptions.

## Effects

- Never perform side effects during rendering. All mutations, fetches, subscriptions go in `useEffect` / `useLayoutEffect`.
- Always clean up subscriptions and listeners in the effect's return function.

```tsx
// ❌ BAD — leaks the listener
useEffect(() => {
  AppState.addEventListener('change', onChange);
}, []);

// ✅ GOOD — explicit cleanup
useEffect(() => {
  const sub = AppState.addEventListener('change', onChange);
  return () => sub.remove();
}, [onChange]);
```

- Effect dependency arrays must be exhaustive. `// eslint-disable-next-line` is a code smell — fix the dependency, don't silence the rule.
- Effects should be deterministic — same inputs → same outputs / same subscriptions.

## Zustand Selectors

```ts
// ❌ BAD — returns new object every render, causes unnecessary re-renders
const { phone, isPending } = useOtpFlowStore();

// ✅ GOOD — narrow selector, only re-renders when that field changes
const phone = useOtpFlowStore(s => s.phone);
const isPending = useOtpFlowStore(s => s.isPending);
```

## Pure Utilities

- Keep utility functions pure. No I/O, no React, no globals.
- Pure utils live in `src/utils/`. They are the easiest things to unit-test.
- Side-effecting helpers go in `src/services/` instead.

## Derived State

```ts
// ❌ BAD — derived state stored separately, can drift
const [phone, setPhone] = useState('');
const [isValid, setIsValid] = useState(false);
useEffect(() => setIsValid(phone.length === 10), [phone]);

// ✅ GOOD — derive on render
const [phone, setPhone] = useState('');
const isValid = phone.length === 10;
```

- Never duplicate derived state — compute from source on render.
- Never mutate state directly. Prefer immutable patterns (`set(s => ({ ...s, field: value }))`).

## AbortSignal

- All data-fetching hooks must pass an `AbortSignal` to the API call and cancel on unmount.

```ts
useEffect(() => {
  const controller = new AbortController();
  void fetchData(controller.signal);
  return () => controller.abort();
}, []);
```

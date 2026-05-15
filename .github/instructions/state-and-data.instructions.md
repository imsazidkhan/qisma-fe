---
description: 'Use when writing API functions, TanStack Query hooks, Zustand stores, or Zod schemas. Covers server state, client state, API layer, error handling, and data validation patterns.'
applyTo:
  ['src/features/**/api/**', 'src/features/**/hooks/**', 'src/features/**/store/**', 'src/api/**']
---

# State & Data Rules

## State Management Split

- **Server state → TanStack Query.** Anything fetched from a backend lives here.
- **Client state → Zustand.** UI state, flow machines, ephemeral flags.
- Keep state close to where it is used. Lift only when truly shared.
- Prefer feature-local stores (`features/<name>/store/`). Avoid giant global stores.

## API Layer

- Never call `fetch` directly inside a component or hook. Wrap every endpoint in a typed function under `features/<name>/api/`.
- Type both request and response shapes explicitly.
- Validate every API response with **Zod at the edge** before data enters the rest of the app.

```ts
// ❌ BAD — unvalidated, untyped
const res = await fetch('/v1/groups');
const data = await res.json();

// ✅ GOOD — typed, Zod-validated, via apiFetch
export async function getMyGroupsList(signal?: AbortSignal): Promise<GroupListItem[]> {
  const raw = await apiFetch<unknown>(ENDPOINTS.groups.list, { method: 'GET', signal });
  return groupsListSchema.parse(raw);
}
```

## Error Handling

- Errors always flow through `ApiError` (`src/api/ApiError.ts`) — never raw thrown strings.
- Map every backend error code → UI message via a central parser. Never display raw server messages.
- Branch UI on `error.code`; surface `retryAfter` when present (OTP/rate limits).

```ts
// ❌ BAD
throw new Error(response.error.message);

// ✅ GOOD
throw new ApiError({
  code: response.error.code,
  message: response.error.message,
  status: httpStatus,
});
```

## Async Patterns

- `async/await` only — no raw `.then` chains.
- Always handle loading, success, AND error states explicitly.
- Never ignore rejected promises. Use `void promise.catch(logger.error)` if you must fire-and-forget.
- **Never auto-retry side-effecting writes** (`/otp/send`, create, delete, patch).
- Retry only idempotent reads on network-only failures.

## TanStack Query

- Always provide `queryKey` arrays that uniquely identify the query (use `queryKeys` files per feature).
- Set `staleTime` explicitly — don't rely on the default 0.
- Use `setQueryData` to update cache after mutations that return the new resource — avoid redundant refetches.
- `retry` callback: return `false` for 4xx errors (client errors are not retryable).

```ts
retry: (failureCount, error) => {
  if (error instanceof ApiError && error.status >= 400 && error.status < 500) return false;
  return failureCount < 2;
},
```

## Zustand

```ts
// ❌ BAD — new object reference every render, re-renders everything
const { phone, isPending } = useMyStore();

// ✅ GOOD — narrow selectors
const phone = useMyStore((s) => s.phone);
const isPending = useMyStore((s) => s.isPending);
```

- Never mutate state directly. Use `set(s => ({ ...s }))` pattern.
- Feature stores go in `features/<name>/store/`. Only truly global state goes in `src/store/`.

## Zod Schema Location

- Inline schemas for one-off API parsing in `features/<name>/api/`.
- Reusable schemas shared between form validation + API parsing go in `features/<name>/schemas/` — one schema, both sides.

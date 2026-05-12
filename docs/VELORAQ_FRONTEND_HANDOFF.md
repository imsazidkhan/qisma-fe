# Veloraq — Frontend handoff (groups · invites · directory)

Use this when onboarding humans or Cursor on **Qisma** against the **Veloraq auth-service**. Align runtime behaviour with **OpenAPI** at `{API}/docs` when in doubt.

## Base URL & config (Qisma)

| Item                                                                             | Location                                                                                               |
| -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Resolved API root (**must end with `/v1`**)                                      | `src/api/resolveApiBaseUrl.ts` — `EXPO_PUBLIC_API_BASE_URL` in prod; dev fallbacks for simulator / LAN |
| Path list (relative to that base)                                                | `src/api/endpoints.ts`                                                                                 |
| HTTP client + envelope unwrap + `Authorization` + **401 → refresh → retry once** | `src/api/apiFetch.ts`, `src/api/authRetry.ts`                                                          |

**Base URL shape:** `{origin}/v1` (e.g. `http://localhost:3000/v1`, `https://api.veloraq.co/v1`).

## Authentication

- **Header:** `Authorization: Bearer <accessToken>`
- **Sources:** `POST /v1/otp/verify`, `POST /v1/auth/refresh`
- **Storage:** Access/refresh handling lives in auth session store (`expo-secure-store` for refresh per project rules); protected calls read the access token for `apiFetch`.

## Response envelopes

**Success**

```json
{ "success": true, "data": "<T>" }
```

**Failure**

```json
{ "success": false, "error": { "code": "<MACHINE_READABLE>", "message": "<human text>", "retryAfter?": <seconds> } }
```

**Client:** Branch UI on `error.code`; surface `retryAfter` when present (OTP/rate limits, etc.). Qisma maps many codes in `src/i18n/locales/en.ts` under `groups.*` and uses `ApiError` from `src/api/ApiError.ts`.

**Non-envelope 404:** Wrong base (missing `/v1`) can return Nest default JSON — `apiFetch` hints at this in dev.

---

## Groups (authenticated)

| Action       | Method & path                | Notes                                                                 |
| ------------ | ---------------------------- | --------------------------------------------------------------------- |
| List groups  | `GET /v1/groups`             | Newest first; success `data`: array                                   |
| Group detail | `GET /v1/groups/:groupId`    | Narrow access; `404` + `GROUP_NOT_FOUND` when not allowed             |
| Create       | `POST /v1/groups`            | Body: `name`, `type` (slug), optional `avatar` (https URL); **`201`** |
| Delete       | `DELETE /v1/groups/:groupId` | Owner; **`200`** `data: { deletedGroupId }`                           |

**Qisma:** `src/features/groups/api/groupsApi.ts`, hooks, group detail + create flows. On delete, also clear related TanStack cache (e.g. members query for that `groupId`).

---

## Members & invites (authenticated)

### Roster row (`GroupMemberRosterEntryDto`)

| Field      | Type                           | Notes                                                                                                              |
| ---------- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `id`       | UUID                           | User id; use as `memberId` for `DELETE` / `PATCH .../role`                                                         |
| `avatar`   | string \| null                 |                                                                                                                    |
| `name`     | string \| null                 |                                                                                                                    |
| `username` | string \| null                 |                                                                                                                    |
| `role`     | `owner` \| `admin` \| `member` |                                                                                                                    |
| `status`   | `active` \| `pending`          | **Pending** = invited, not fully in until accept (except auto-join path for unknown phone after OTP — see backend) |
| `joinedAt` | string \| null                 |                                                                                                                    |

**Qisma today:** `src/features/groups/types/groupMember.types.ts` has **no `status` yet** — add when backend exposes it; branch roster UI (badge copy, permissions) on `pending` vs `active`.

| Action           | Method & path                                      | Who                                       | Success body                                                                  |
| ---------------- | -------------------------------------------------- | ----------------------------------------- | ----------------------------------------------------------------------------- |
| Roster           | `GET /v1/groups/:groupId/members`                  | **Active** member (any role)              | `data`: roster array                                                          |
| Invite / add     | `POST /v1/groups/:groupId/members`                 | Owner or admin                            | **`201`** `data`: full roster[]                                               |
| Accept invite    | `POST /v1/groups/:groupId/invites/accept`          | Invitee (pending)                         | **`200`**; idempotent if already active                                       |
| Decline invite   | `POST /v1/groups/:groupId/invites/decline`         | Invitee                                   | **`200`** `data: { groupId }`                                                 |
| Promote / demote | `PATCH /v1/groups/:groupId/members/:memberId/role` | **Owner**                                 | Body `{ "role": "admin" \| "member" }`; **`200`** roster; cannot change owner |
| Remove           | `DELETE /v1/groups/:groupId/members/:memberId`     | Admin or owner (rules for admin vs admin) | **`200`** roster                                                              |

**Body for invite (exactly one of):** `identifier` (E.164 phone), `username`, `userId` (UUID).

**Qisma today:**

- Implemented: `GET` roster, `POST` invite, `DELETE` remove, TanStack key `groupsQueryKeys.members`, `setQueryData` after mutations where the API returns roster.
- **Not implemented yet:** `PATCH .../role`, `POST .../invites/accept`, `POST .../invites/decline` (add to `ENDPOINTS`, Zod, hooks, UI).
- Deep link: `GET` route supports **`?userId=`** for add-member (`userId` body path).

### Invite behaviour (FYI for UX)

- **Registered target:** often `pending` until accept/decline or admin removes row.
- **Unknown phone (`identifier`):** backend may hold `group_invites` until OTP; then user can become **`active`** with `joinedAt` (auto-join — no accept step).
- After any membership/invite mutation, **replace roster** from response `data` or refetch `GET .../members`.

---

## User directory search (authenticated)

| Action | Method & path                     | Notes                                 |
| ------ | --------------------------------- | ------------------------------------- |
| Search | `GET /v1/users/search?q=<string>` | `q` required, trimmed, **2–96** chars |

**Matching (per product):** full phone E.164 exact; username prefix (`[a-z0-9_]`, optional leading `@`); display name **substring** (case-insensitive).

**Response:** `200` `data: [{ id, name, username, avatar }]` (≤20 hits; excludes self; omit inactive users).

**Qisma:** **Not wired yet.** Add `ENDPOINTS.users.search`, typed client, then drive **add-member** picker (list + fallback manual phone for “not found” / offline invite path).

---

## Error codes (non-exhaustive — verify in OpenAPI)

Handle in UI where user-visible:

`NOT_GROUP_MEMBER`, `GROUP_OWNER_REQUIRED`, `GROUP_ADMIN_REQUIRED`, `ALREADY_GROUP_MEMBER`, `INVITE_ALREADY_PENDING`, `GROUP_INVITE_NOT_PENDING`, `USER_NOT_FOUND`, `GROUP_NOT_FOUND`, `VALIDATION_ERROR`, `GROUP_OWNER_PROTECTED`, `GROUP_MEMBER_NOT_FOUND`, `ADMIN_REMOVE_REQUIRES_OWNER`, `INVITE_SELF`, `ACCOUNT_INACTIVE`, …

Map to copy under `groups.membersScreen.*`, `groups.addMember.errors.*`, etc.; add keys as backend adds codes.

---

## UX checklist (against this API)

- [x] **Roster screen:** header (group visual + member count), list rows, remove when allowed, FAB add-member.
- [x] **Add-member MVP:** phone \| username (single field); optional `userId` via query + tab when `?userId=` present.
- [ ] **Add-member v2:** `GET /v1/users/search` picker + manual phone fallback.
- [ ] **Roster `status`:** pending vs active badges + copy (“Invited” vs member).
- [ ] **Accept / decline** invite flows + screens or deep links.
- [ ] **PATCH role** (owner-only promote/demote).
- [ ] **Permissions:** hide invite, kick, role actions using roster role + handle `GROUP_ADMIN_REQUIRED` / `GROUP_OWNER_REQUIRED` from API.
- [x] **Token refresh:** `401` → `POST /v1/auth/refresh` → single retry (`apiFetch`).

---

## Optional project notes

- **Group `type` slugs** in app: `src/features/groups/constants/groupTypes.ts` (`GROUP_TYPE_ORDER` / Zod).
- **Prod base URL:** set `EXPO_PUBLIC_API_BASE_URL` (e.g. `https://api.veloraq.co`) — `/v1` appended if you pass origin-only.
- **OpenAPI:** `{API}/docs` is the source of truth for schemas and exact error codes.

# Group invites — frontend / API contract (`/v1`)

Auth: `Authorization: Bearer <access_token>` (JWT from `POST /v1/otp/verify` or `POST /v1/auth/refresh`). JSON bodies use `Content-Type: application/json`.

## Envelope

- Success: `{ "success": true, "data": … }`
- Error: `{ "success": false, "error": { "code": "SOME_CODE", "message": "…", "retryAfter?": number } }`

## Endpoints

### Inbox (pending only)

`GET /v1/users/me/group-invites`

- Returns `data`: `PendingGroupInviteEntry[]`, newest first.
- Only `group_members` with `status: pending` for the current user (registered invites; offline-phone rows attach after first successful `POST /v1/otp/verify`).
- Requires JWT.

**`PendingGroupInviteEntry`**

| Field         | Type                                         |
| ------------- | -------------------------------------------- |
| `groupId`     | UUID                                         |
| `groupName`   | string                                       |
| `groupAvatar` | string \| null                               |
| `groupType`   | string (product slug; see Swagger enum)      |
| `role`        | `'owner' \| 'admin' \| 'member'`             |
| `invitedAt`   | ISO string (`group_members.createdAt`)       |
| `invitedBy`   | `{ userId, name, username, avatar } \| null` |

### Preview (pending invitee)

`GET /v1/groups/:groupId/invite-preview`

- Returns `data`: `{ id, name, type, avatar, memberCount }` (`memberCount` = active members only).
- If the user already joined: **403** `GROUP_INVITE_PREVIEW_NOT_PENDING`.
- Do not call `GET /v1/groups/:groupId/members` before accept — pending users get **403** `NOT_GROUP_MEMBER`.

### Accept / decline

- `POST /v1/groups/:groupId/invites/accept` — **200**, `data`: full roster `GroupMemberRosterEntry[]`. Idempotent if already active.
- `POST /v1/groups/:groupId/invites/decline` — **200**, `data`: `{ groupId: string }`.

No request body.

**`GroupMemberRosterEntry`**: `id`, `avatar`, `name`, `username`, `role`, `status` (`active` \| `pending`), `joinedAt`.

### Send invite (owner/admin)

`POST /v1/groups/:groupId/members` — **201**

Body: exactly one of:

- `{ "identifier": "+8801712345678" }` (E.164)
- `{ "username": "jane_doe" }`
- `{ "userId": "<uuid>" }`

Returns `data`: roster array (same shape as accept).

## UX (MVP)

- On cold start and after OTP verify: refresh `GET /v1/users/me/groups` (active groups) and `GET /v1/users/me/group-invites` (badge = `data.length`).
- After accept: navigate to the group; may load `GET /v1/groups/:groupId/members` as an active member.
- Split/expense UIs: use roster rows with `status === 'active'` only.

Field-level detail: Swagger `/docs`.

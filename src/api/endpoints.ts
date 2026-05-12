/**
 * Endpoint paths, relative to the API base URL (which already includes `/v1`).
 *
 * Keep these centralised — every consumer reads from this file so a backend
 * route rename is a one-line change.
 */
export const ENDPOINTS = {
  otp: {
    send: '/otp/send',
    verify: '/otp/verify',
  },
  auth: {
    refresh: '/auth/refresh',
    logout: '/auth/logout',
    /** `GET` current user + onboarding; `PATCH` update profile. */
    me: '/auth/me',
  },
  groups: {
    /** `GET` — groups **created** by the current user (not the primary home membership feed). */
    list: '/groups',
    /** `POST` — create a group (same path; method distinguishes). */
    create: '/groups',
    /** `GET` — creator-only full row (`GET /v1/groups/:groupId`). Prefer {@link memberProfile} for members. */
    detail: (groupId: string) => `/groups/${encodeURIComponent(groupId)}`,
    /** `GET` — **active member** group row (same `Group` shape as creator detail). */
    memberProfile: (groupId: string) => `/groups/${encodeURIComponent(groupId)}/member-profile`,
    /** `GET` — minimal preview for **pending** invitees (403 if already active). */
    invitePreview: (groupId: string) => `/groups/${encodeURIComponent(groupId)}/invite-preview`,
    /** `GET` roster / `POST` add member — same path; method distinguishes. */
    members: (groupId: string) => `/groups/${encodeURIComponent(groupId)}/members`,
    /** `DELETE` remove member (`memberId` = target user UUID). */
    member: (groupId: string, memberId: string) =>
      `/groups/${encodeURIComponent(groupId)}/members/${encodeURIComponent(memberId)}`,
    /** `POST` pending invitee → active (`200`, `data` may be roster). */
    inviteAccept: (groupId: string) => `/groups/${encodeURIComponent(groupId)}/invites/accept`,
    /** `POST` pending invitee declines (`200`, `data` may be `{ groupId }`). */
    inviteDecline: (groupId: string) => `/groups/${encodeURIComponent(groupId)}/invites/decline`,
    /** `PATCH` owner-only role change; body `{ role: 'admin' | 'member' }`. */
    memberRole: (groupId: string, memberId: string) =>
      `/groups/${encodeURIComponent(groupId)}/members/${encodeURIComponent(memberId)}/role`,
    /** `GET` — membership / invite timeline for **active members** only (`data[]`, max ~100, newest first). */
    activity: (groupId: string) => `/groups/${encodeURIComponent(groupId)}/activity`,
    /** `GET` — settlement snapshot (`netByUserId`, settlement `edges`) for **active members** only. */
    balances: (groupId: string) => `/groups/${encodeURIComponent(groupId)}/balances`,
    analyticsCategoryBreakdown: (groupId: string) =>
      `/groups/${encodeURIComponent(groupId)}/analytics/category-breakdown`,
    analyticsMonthlyTrends: (groupId: string) =>
      `/groups/${encodeURIComponent(groupId)}/analytics/monthly-trends`,
    analyticsTopSpenders: (groupId: string) =>
      `/groups/${encodeURIComponent(groupId)}/analytics/top-spenders`,
    analyticsMerchants: (groupId: string) =>
      `/groups/${encodeURIComponent(groupId)}/analytics/merchants`,
    analyticsHeatmap: (groupId: string) =>
      `/groups/${encodeURIComponent(groupId)}/analytics/heatmap`,
    analyticsRecurring: (groupId: string) =>
      `/groups/${encodeURIComponent(groupId)}/analytics/recurring`,
  },
  users: {
    /** `GET` groups the signed-in user belongs to (membership home list). */
    meGroups: '/users/me/groups',
    /**
     * `GET` **`group_members.pending`** for the current user (registered invite path).
     * Not `group_invites` rows for phones without an account yet.
     */
    meGroupInvites: '/users/me/group-invites',
    /** `GET` directory search; `q` trimmed, 2–96 chars. */
    search: (q: string) => `/users/search?q=${encodeURIComponent(q)}`,
  },
  expenses: {
    /** `POST` — title-only classification preview (`{ title }` → taxonomy suggestion). */
    classify: '/expenses/classify',
    /** `POST` — user correction for a saved expense category/subcategory. */
    reclassify: (expenseId: string) =>
      `/expenses/${encodeURIComponent(expenseId)}/reclassify`,
    /** `GET` — full expense (participants, comments, reactions, attachments, history). Soft-deleted → 404. */
    detail: (expenseId: string) => `/expenses/${encodeURIComponent(expenseId)}`,
    /** `PATCH` — partial update (legacy global path; prefer {@link groupPatch}). */
    patch: (expenseId: string) => `/expenses/${encodeURIComponent(expenseId)}`,
    /** `PATCH` — `PATCH /v1/groups/:groupId/expenses/:expenseId` (structured + financial fields). */
    groupPatch: (groupId: string, expenseId: string) =>
      `/groups/${encodeURIComponent(groupId)}/expenses/${encodeURIComponent(expenseId)}`,
    /** `DELETE` — soft-delete; idempotent second call → 404 (`EXPENSE_NOT_FOUND`). */
    remove: (expenseId: string) => `/expenses/${encodeURIComponent(expenseId)}`,
    /** `POST` — add comment; body `{ message }`. */
    comments: (expenseId: string) => `/expenses/${encodeURIComponent(expenseId)}/comments`,
    /** `POST` — add reaction; body `{ emoji }`. **201** new, **200** idempotent duplicate. */
    reactions: (expenseId: string) => `/expenses/${encodeURIComponent(expenseId)}/reactions`,
    /** `POST` — upload receipt; multipart field `file` (JPEG, PNG, WebP, GIF, PDF; max 20 MB). */
    receipts: (expenseId: string) => `/expenses/${encodeURIComponent(expenseId)}/receipts`,
    /** `POST` — create expense; body `CreateExpenseBodyDto`. */
    groupCreate: (groupId: string) => `/groups/${encodeURIComponent(groupId)}/expenses`,
    groupFeed: (groupId: string) => `/groups/${encodeURIComponent(groupId)}/expenses`,
  },
  upload: {
    /** `POST` multipart field `file` — returns `{ url }` for PATCH `/auth/me`. */
    avatar: '/upload/avatar',
  },
  /** Address-book snapshot for suggestions / matching (auth required). */
  contacts: {
    sync: '/contacts/sync',
  },
  categories: {
    /** `GET` — global expense categories for full picker UI. */
    list: '/categories',
  },
} as const;

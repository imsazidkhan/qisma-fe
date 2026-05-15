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
    /** `GET` tabbed groups dashboard with balances + card metadata (`?tab=` optional). */
    meGroupsHome: '/users/me/groups/home',
    /**
     * `GET` **`group_members.pending`** for the current user (registered invite path).
     * Not `group_invites` rows for phones without an account yet.
     */
    meGroupInvites: '/users/me/group-invites',
  },
  expenses: {
    /** `POST` — title-only classification preview (`{ title }` → category suggestion). Throttle ~45/min (server). */
    classify: '/expenses/classify',
    /**
     * Group-scoped expense row — **`GET`** detail, **`PATCH`**, **`DELETE`** (`/v1/groups/:groupId/expenses/:expenseId`).
     */
    groupExpense: (groupId: string, expenseId: string) =>
      `/groups/${encodeURIComponent(groupId)}/expenses/${encodeURIComponent(expenseId)}`,
    /** `POST` — user-driven category correction (`…/reclassify`). */
    groupExpenseReclassify: (groupId: string, expenseId: string) =>
      `/groups/${encodeURIComponent(groupId)}/expenses/${encodeURIComponent(expenseId)}/reclassify`,
    /** `GET` list / `POST` thread — `/v1/groups/:groupId/expenses/:expenseId/comments`. */
    groupExpenseComments: (groupId: string, expenseId: string) =>
      `/groups/${encodeURIComponent(groupId)}/expenses/${encodeURIComponent(expenseId)}/comments`,
    /** `PATCH` / `DELETE` single comment. */
    groupExpenseComment: (groupId: string, expenseId: string, commentId: string) =>
      `/groups/${encodeURIComponent(groupId)}/expenses/${encodeURIComponent(expenseId)}/comments/${encodeURIComponent(commentId)}`,
    /** `POST` — add reaction; body `{ emoji }`. **201** new, **200** idempotent duplicate. */
    groupExpenseReactions: (groupId: string, expenseId: string) =>
      `/groups/${encodeURIComponent(groupId)}/expenses/${encodeURIComponent(expenseId)}/reactions`,
    /** `POST` — upload receipt; multipart field `file`. Throttle ~30/min (server). */
    groupExpenseReceipts: (groupId: string, expenseId: string) =>
      `/groups/${encodeURIComponent(groupId)}/expenses/${encodeURIComponent(expenseId)}/receipts`,
    /** `POST` — create expense in group. **201** */
    groupCreate: (groupId: string) => `/groups/${encodeURIComponent(groupId)}/expenses`,
    /** `GET` — cursor-paginated feed for one group. */
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

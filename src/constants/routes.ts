/** Stable Expo Router hrefs — use instead of string literals in `router.push` / `replace`. */

export const ROUTES = {
  HOME: '/home',
  HOME_GROUPS: '/home/groups',
  HOME_INVITES: '/home/invites',
  /** Device contacts → `POST /v1/contacts/sync` — find people on Quisma. */
  HOME_CONTACTS_SYNC: '/home/contacts-sync',
  HOME_ACTIVITY: '/home/activity',
  HOME_CREATE_GROUP: '/home/create-group',
  HOME_PROFILE: '/home/profile',
  /** Stack screen — edit display name / avatar (`PATCH /v1/auth/me`). */
  HOME_EDIT_PROFILE: '/home/edit-profile',
  LOGIN: '/login',
} as const;

/** Dynamic route — use with `router.push(hrefGroupDetail(id))`. */
export type GroupDetailHref = {
  pathname: '/home/group/[groupId]';
  params: { groupId: string };
};

export function hrefGroupDetail(groupId: string): GroupDetailHref {
  return { pathname: '/home/group/[groupId]', params: { groupId } };
}

export type GroupActivityHref = {
  pathname: '/home/group/[groupId]/activity';
  params: { groupId: string };
};

export function hrefGroupActivity(groupId: string): GroupActivityHref {
  return { pathname: '/home/group/[groupId]/activity', params: { groupId } };
}

export type GroupBalancesHref = {
  pathname: '/home/group/[groupId]/balances';
  params: { groupId: string };
};

export function hrefGroupBalances(groupId: string): GroupBalancesHref {
  return { pathname: '/home/group/[groupId]/balances', params: { groupId } };
}

export type GroupAnalyticsHref = {
  pathname: '/home/group/[groupId]/analytics';
  params: { groupId: string };
};

export function hrefGroupAnalytics(groupId: string): GroupAnalyticsHref {
  return { pathname: '/home/group/[groupId]/analytics', params: { groupId } };
}

export type GroupAddExpenseHref = {
  pathname: '/home/group/[groupId]/add-expense';
  params: { groupId: string };
};

export function hrefGroupAddExpense(groupId: string): GroupAddExpenseHref {
  return { pathname: '/home/group/[groupId]/add-expense', params: { groupId } };
}

export type GroupExpenseCommentsHref = {
  pathname: '/home/group/[groupId]/expense/[expenseId]/comments';
  params: { groupId: string; expenseId: string };
};

export function hrefGroupExpenseComments(
  groupId: string,
  expenseId: string,
): GroupExpenseCommentsHref {
  return {
    pathname: '/home/group/[groupId]/expense/[expenseId]/comments',
    params: { groupId, expenseId },
  };
}

export type GroupAddMembersHref = {
  pathname: '/home/group/[groupId]/add-members';
  params: { groupId: string };
};

export function hrefGroupAddMembers(groupId: string): GroupAddMembersHref {
  return { pathname: '/home/group/[groupId]/add-members', params: { groupId } };
}

export type GroupMembersHref = {
  pathname: '/home/group/[groupId]/members';
  params: { groupId: string };
};

export function hrefGroupMembers(groupId: string): GroupMembersHref {
  return { pathname: '/home/group/[groupId]/members', params: { groupId } };
}

export type AppRoute = (typeof ROUTES)[keyof typeof ROUTES];

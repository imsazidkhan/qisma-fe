/** `GET /v1/groups/:groupId/balances` — viewer-centric settlement summary (active members only). */
export type GroupBalancesViewerSummaryStatus = 'settled' | 'you_owe' | 'owed_to_you';

export type GroupBalancesViewerSummary = {
  status: GroupBalancesViewerSummaryStatus;
  /** Absolute magnitude in minor units (e.g. paise). */
  netAmount: number;
  currency: string;
  /** Server-rendered; safe for MVP display. */
  formattedAmount: string;
  /** Server-rendered headline for the viewer's net position. */
  displayText: string;
  isSettled: boolean;
};

export type GroupBalancesViewerCounterpartyUser = {
  id: string;
  name: string;
  username?: string | null;
  avatarUrl: string | null;
};

/** Settlement edge involving the current viewer only. */
export type GroupBalancesViewerEdge = {
  user: GroupBalancesViewerCounterpartyUser;
  type: 'owe' | 'owed';
  amount: number;
  formattedAmount: string;
  displayText: string;
  settleActionEnabled: boolean;
};

export type GroupViewerBalancesPayload = {
  summary: GroupBalancesViewerSummary;
  balances: GroupBalancesViewerEdge[];
  /** ISO-8601 — when the snapshot was computed. */
  updatedAt: string;
};

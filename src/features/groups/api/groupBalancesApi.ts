import { z } from 'zod';

import { ApiError, apiFetch, CLIENT_ERROR_CODES, ENDPOINTS } from '@/api';
import type { GroupViewerBalancesPayload } from '@/features/groups/types/groupBalancesViewer.types';

const summarySchema = z.object({
  status: z.enum(['settled', 'you_owe', 'owed_to_you']),
  netAmount: z.number(),
  currency: z.string(),
  formattedAmount: z.string(),
  displayText: z.string(),
  isSettled: z.boolean(),
});

const balanceUserSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  username: z.union([z.string(), z.null()]).optional(),
  avatarUrl: z.union([z.string(), z.null()]).optional(),
});

const balanceEdgeSchema = z.object({
  user: balanceUserSchema,
  type: z.enum(['owe', 'owed']),
  amount: z.number(),
  formattedAmount: z.string(),
  displayText: z.string(),
  settleActionEnabled: z.boolean(),
});

const viewerBalancesWireSchema = z
  .object({
    summary: summarySchema,
    balances: z.array(balanceEdgeSchema),
    updatedAt: z.string(),
  })
  .passthrough();

export function parseGroupViewerBalancesWire(data: unknown): GroupViewerBalancesPayload {
  const parsed = viewerBalancesWireSchema.safeParse(data);
  if (!parsed.success) {
    throw new ApiError({
      code: CLIENT_ERROR_CODES.PARSE_ERROR,
      message: 'Invalid group balances response shape.',
      status: 0,
      details: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`),
    });
  }
  const row = parsed.data;
  return {
    summary: {
      status: row.summary.status,
      netAmount: Number.isFinite(row.summary.netAmount)
        ? Math.max(0, Math.round(row.summary.netAmount))
        : 0,
      currency: row.summary.currency.trim() || 'INR',
      formattedAmount: row.summary.formattedAmount,
      displayText: row.summary.displayText,
      isSettled: row.summary.isSettled,
    },
    balances: row.balances.map((b) => ({
      user: {
        id: b.user.id,
        name: b.user.name,
        username: b.user.username,
        avatarUrl: b.user.avatarUrl ?? null,
      },
      type: b.type,
      amount: Number.isFinite(b.amount) ? Math.max(0, Math.round(b.amount)) : 0,
      formattedAmount: b.formattedAmount,
      displayText: b.displayText,
      settleActionEnabled: b.settleActionEnabled,
    })),
    updatedAt: row.updatedAt.trim(),
  };
}

/**
 * `GET /v1/groups/:groupId/balances` — viewer-centric settlement summary (active members only).
 *
 * Differs from **`groupBalances` on expense mutations**: those remain raw `netByUserId` / `edges`
 * decimal-string snapshots; this endpoint is enriched for hub UI.
 */
export async function fetchGroupBalancesSnapshot(
  groupId: string,
  signal?: AbortSignal,
): Promise<GroupViewerBalancesPayload> {
  const raw = await apiFetch<unknown>(ENDPOINTS.groups.balances(groupId), {
    method: 'GET',
    signal,
  });
  return parseGroupViewerBalancesWire(raw);
}

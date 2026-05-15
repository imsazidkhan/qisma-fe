import { z } from 'zod';

import { ApiError, apiFetch, CLIENT_ERROR_CODES, ENDPOINTS } from '@/api';
import type { GroupViewerBalancesPayload } from '@/features/groups/types/groupBalancesViewer.types';
import { formatMinorAsCurrencyCompact } from '@/features/groups/utils/formatMinorAsCurrency';

function wireFieldPresent(raw: unknown): boolean {
  if (raw === undefined || raw === null) {
    return false;
  }
  if (typeof raw === 'number') {
    return Number.isFinite(raw);
  }
  if (typeof raw === 'string') {
    return raw.trim() !== '';
  }
  return false;
}

/** Non-negative minor integer (edge magnitudes, unsigned summary magnitude). */
function parseMinorWire(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.round(Math.abs(value));
  }
  if (typeof value === 'string') {
    const t = value.trim().replace(/,/g, '');
    if (t === '') return 0;
    const n = Number.parseInt(t, 10);
    return Number.isFinite(n) ? Math.abs(n) : 0;
  }
  return 0;
}

function parseSignedMinorWire(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.round(value);
  }
  if (typeof value === 'string') {
    const t = value.trim().replace(/,/g, '');
    if (t === '') return 0;
    const n = Number.parseInt(t, 10);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

/**
 * Major-unit wire values (`netAmount`, `amount`) — same convention as expense `amount`:
 * decimal strings / floats; converts to minor integer for UI formatters.
 */
function parseMajorWireToMinor(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.round(Math.abs(value) * 100);
  }
  if (typeof value === 'string') {
    const t = value.trim().replace(/,/g, '');
    if (t === '') return 0;
    const n = Number(t);
    if (!Number.isFinite(n)) return 0;
    return Math.round(Math.abs(n) * 100);
  }
  return 0;
}

function ledgerEdgeAmountMinor(edge: z.infer<typeof ledgerEdgeSchema>): number {
  if (wireFieldPresent(edge.amountMinor)) {
    return parseMinorWire(edge.amountMinor);
  }
  if (wireFieldPresent(edge.amount)) {
    return parseMajorWireToMinor(edge.amount);
  }
  return 0;
}

type NormalizedBalancesEnvelope = {
  summary: unknown;
  balances: unknown;
  peers: unknown;
  updatedAt: string;
  dominantCurrency?: string;
};

function summaryWireHasNetMinorOrAmount(summary: unknown): boolean {
  if (typeof summary !== 'object' || summary === null) {
    return false;
  }
  const o = summary as Record<string, unknown>;
  return (
    wireFieldPresent(o.netMinor ?? o.net_minor) || wireFieldPresent(o.netAmount ?? o.net_amount)
  );
}

function pickSummary(
  root: Record<string, unknown>,
  inner: Record<string, unknown> | null,
): unknown {
  const r = root.summary;
  const i = inner?.summary;
  const rOk = summaryWireHasNetMinorOrAmount(r);
  const iOk = summaryWireHasNetMinorOrAmount(i);
  if (iOk && !rOk) {
    return i;
  }
  if (rOk) {
    return r;
  }
  return r ?? i;
}

function pickNonEmptyArray(rootVal: unknown, innerVal: unknown): unknown[] {
  const r = Array.isArray(rootVal) ? rootVal : null;
  const i = Array.isArray(innerVal) ? innerVal : null;
  if (r && r.length > 0) {
    return r;
  }
  if (i && i.length > 0) {
    return i;
  }
  return r ?? i ?? [];
}

function normalizeGroupBalancesWire(data: unknown): NormalizedBalancesEnvelope | null {
  if (!data || typeof data !== 'object') {
    return null;
  }
  const root = data as Record<string, unknown>;
  const innerRaw = root.groupBalances;
  const inner =
    innerRaw && typeof innerRaw === 'object' ? (innerRaw as Record<string, unknown>) : null;

  const summary = pickSummary(root, inner);
  const balances = pickNonEmptyArray(root.balances, inner?.balances);
  const peers = pickNonEmptyArray(root.peers, inner?.peers);

  const updatedAtRaw = root.updatedAt ?? inner?.updatedAt ?? root.updated_at ?? inner?.updated_at;
  const updatedAt = typeof updatedAtRaw === 'string' ? updatedAtRaw.trim() : '';

  const dominantRaw =
    root.dominantCurrency ??
    inner?.dominantCurrency ??
    root.dominant_currency ??
    inner?.dominant_currency;
  const dominantCurrency =
    typeof dominantRaw === 'string' && dominantRaw.trim() !== '' ? dominantRaw.trim() : undefined;

  return {
    summary,
    balances,
    peers,
    updatedAt,
    dominantCurrency,
  };
}

function isEnrichedSummary(summary: unknown): boolean {
  if (typeof summary !== 'object' || summary === null) {
    return false;
  }
  return 'status' in summary && typeof (summary as { status: unknown }).status === 'string';
}

function isLedgerEdge(edge: unknown): boolean {
  if (typeof edge !== 'object' || edge === null) {
    return false;
  }
  const o = edge as Record<string, unknown>;
  const from = o.fromUserId ?? o.from_user_id;
  const to = o.toUserId ?? o.to_user_id;
  return typeof from === 'string' && typeof to === 'string';
}

/** Backend may emit camelCase or snake_case; Zod expects camelCase. */
function coerceLedgerSummaryWire(raw: unknown): Record<string, unknown> {
  if (typeof raw !== 'object' || raw === null) {
    return {};
  }
  const o = raw as Record<string, unknown>;
  return {
    ...o,
    currency: o.currency ?? o.currency_code,
    netMinor: o.netMinor ?? o.net_minor,
    netAmount: o.netAmount ?? o.net_amount,
  };
}

function coerceLedgerEdgeWire(raw: unknown): Record<string, unknown> {
  if (typeof raw !== 'object' || raw === null) {
    return {};
  }
  const o = raw as Record<string, unknown>;
  return {
    ...o,
    fromUserId: o.fromUserId ?? o.from_user_id,
    toUserId: o.toUserId ?? o.to_user_id,
    amountMinor: o.amountMinor ?? o.amount_minor,
    amount: o.amount,
  };
}

function coerceLedgerPeerWire(raw: unknown): Record<string, unknown> {
  if (typeof raw !== 'object' || raw === null) {
    return {};
  }
  const o = raw as Record<string, unknown>;
  return {
    ...o,
    avatar: o.avatar ?? o.avatar_url ?? o.avatarUrl,
  };
}

function uuidStringsEqual(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

function isEnrichedEdge(edge: unknown): boolean {
  if (typeof edge !== 'object' || edge === null) {
    return false;
  }
  const o = edge as Record<string, unknown>;
  return typeof o.user === 'object' && o.user !== null;
}

const ledgerPeerSchema = z
  .object({
    id: z.string().uuid(),
    name: z.string().optional().default(''),
    username: z.union([z.string(), z.null()]).optional(),
    avatar: z.union([z.string(), z.null()]).optional(),
  })
  .passthrough();

const ledgerEdgeSchema = z
  .object({
    fromUserId: z.string().uuid(),
    toUserId: z.string().uuid(),
    amountMinor: z.union([z.string(), z.number()]).optional(),
    amount: z.union([z.string(), z.number()]).optional(),
  })
  .passthrough();

const ledgerSummarySchema = z
  .object({
    currency: z.string().optional(),
    netMinor: z.union([z.string(), z.number()]).optional(),
    netAmount: z.union([z.string(), z.number()]).optional(),
  })
  .passthrough();

const summarySchema = z
  .object({
    status: z.enum(['settled', 'you_owe', 'owed_to_you']),
    netAmount: z.union([z.number(), z.string()]).optional(),
    netMinor: z.union([z.number(), z.string()]).optional(),
    currency: z.string(),
    formattedAmount: z.string(),
    displayText: z.string(),
    isSettled: z.boolean(),
  })
  .passthrough();

const balanceUserSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  username: z.union([z.string(), z.null()]).optional(),
  avatarUrl: z.union([z.string(), z.null()]).optional(),
});

const balanceEdgeSchema = z
  .object({
    user: balanceUserSchema,
    type: z.enum(['owe', 'owed']),
    amount: z.union([z.number(), z.string()]).optional(),
    amountMinor: z.union([z.number(), z.string()]).optional(),
    formattedAmount: z.string(),
    displayText: z.string(),
    settleActionEnabled: z.boolean(),
  })
  .passthrough();

function summaryNetAbsoluteMinor(summary: z.infer<typeof summarySchema>): number {
  if (wireFieldPresent(summary.netMinor)) {
    return parseMinorWire(summary.netMinor);
  }
  if (wireFieldPresent(summary.netAmount)) {
    return parseMajorWireToMinor(summary.netAmount);
  }
  return 0;
}

function balanceEdgeAbsoluteMinor(edge: z.infer<typeof balanceEdgeSchema>): number {
  if (wireFieldPresent(edge.amountMinor)) {
    return parseMinorWire(edge.amountMinor);
  }
  if (wireFieldPresent(edge.amount)) {
    return parseMajorWireToMinor(edge.amount);
  }
  return 0;
}

const viewerBalancesWireSchema = z
  .object({
    summary: summarySchema,
    balances: z.array(balanceEdgeSchema),
    updatedAt: z.string(),
  })
  .passthrough();

function parseEnrichedViewerPayload(input: {
  summary: unknown;
  balances: unknown;
  updatedAt: string;
}): GroupViewerBalancesPayload {
  const wrapped = {
    summary: input.summary,
    balances: Array.isArray(input.balances) ? input.balances : [],
    updatedAt: input.updatedAt.trim() !== '' ? input.updatedAt.trim() : new Date().toISOString(),
  };
  const parsed = viewerBalancesWireSchema.safeParse(wrapped);
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
      netAmount: Math.max(0, summaryNetAbsoluteMinor(row.summary)),
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
      amount: Math.max(0, balanceEdgeAbsoluteMinor(b)),
      formattedAmount: b.formattedAmount,
      displayText: b.displayText,
      settleActionEnabled: b.settleActionEnabled,
    })),
    updatedAt: row.updatedAt.trim(),
  };
}

function ledgerPeerToViewerUser(peer: z.infer<typeof ledgerPeerSchema>): {
  id: string;
  name: string;
  username?: string | null;
  avatarUrl: string | null;
} {
  return {
    id: peer.id,
    name: peer.name,
    username: peer.username ?? null,
    avatarUrl: peer.avatar ?? null,
  };
}

function ledgerPeerOrSynthetic(
  userId: string,
  peersById: Map<string, z.infer<typeof ledgerPeerSchema>>,
): z.infer<typeof ledgerPeerSchema> {
  const hit = peersById.get(userId.trim().toLowerCase());
  return hit ?? { id: userId.trim(), name: '', username: null, avatar: null };
}

function parseLedgerViewerPayload(
  normalized: NormalizedBalancesEnvelope,
  viewerUserId: string | undefined,
): GroupViewerBalancesPayload {
  const sumParsed = ledgerSummarySchema.safeParse(
    coerceLedgerSummaryWire(normalized.summary ?? {}),
  );
  if (!sumParsed.success) {
    throw new ApiError({
      code: CLIENT_ERROR_CODES.PARSE_ERROR,
      message: 'Invalid group balances summary.',
      status: 0,
      details: sumParsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`),
    });
  }
  const s = sumParsed.data;
  const currency = (s.currency ?? normalized.dominantCurrency ?? 'INR').trim() || 'INR';

  let netSigned = 0;
  if (wireFieldPresent(s.netMinor)) {
    netSigned = parseSignedMinorWire(s.netMinor);
  } else if (wireFieldPresent(s.netAmount)) {
    netSigned = parseSignedMinorWire(s.netAmount);
  }

  const netAbs = Math.abs(netSigned);
  const status =
    netAbs === 0
      ? ('settled' as const)
      : netSigned > 0
        ? ('owed_to_you' as const)
        : ('you_owe' as const);

  const formattedAmount = formatMinorAsCurrencyCompact(netAbs, currency);

  const peersParsed = z
    .array(ledgerPeerSchema)
    .safeParse(
      (Array.isArray(normalized.peers) ? normalized.peers : []).map((p) => coerceLedgerPeerWire(p)),
    );
  const peersList = peersParsed.success ? peersParsed.data : [];
  const peersById = new Map(peersList.map((p) => [p.id.trim().toLowerCase(), p]));

  const balancesArr = Array.isArray(normalized.balances) ? normalized.balances : [];

  const viewerEdges: GroupViewerBalancesPayload['balances'] = [];

  if (viewerUserId) {
    const vid = viewerUserId.trim();
    for (const raw of balancesArr) {
      const parsedEdge = ledgerEdgeSchema.safeParse(coerceLedgerEdgeWire(raw));
      if (!parsedEdge.success) {
        continue;
      }
      const e = parsedEdge.data;
      const amt = ledgerEdgeAmountMinor(e);
      if (amt <= 0) {
        continue;
      }

      const compact = formatMinorAsCurrencyCompact(amt, currency);

      if (uuidStringsEqual(e.fromUserId, vid)) {
        const peer = ledgerPeerOrSynthetic(e.toUserId, peersById);
        viewerEdges.push({
          user: ledgerPeerToViewerUser(peer),
          type: 'owe',
          amount: amt,
          formattedAmount: compact,
          displayText: compact,
          settleActionEnabled: false,
        });
      } else if (uuidStringsEqual(e.toUserId, vid)) {
        const peer = ledgerPeerOrSynthetic(e.fromUserId, peersById);
        viewerEdges.push({
          user: ledgerPeerToViewerUser(peer),
          type: 'owed',
          amount: amt,
          formattedAmount: compact,
          displayText: compact,
          settleActionEnabled: false,
        });
      }
    }
  }

  const updatedAt =
    normalized.updatedAt.trim() !== '' ? normalized.updatedAt.trim() : new Date().toISOString();

  return {
    summary: {
      status,
      netAmount: netAbs,
      currency,
      formattedAmount,
      displayText: '',
      isSettled: status === 'settled',
    },
    balances: viewerEdges,
    updatedAt,
  };
}

export type ParseGroupViewerBalancesOptions = {
  /** Required to map ledger `fromUserId`/`toUserId` edges into viewer-centric rows. */
  viewerUserId?: string;
};

export function parseGroupViewerBalancesWire(
  data: unknown,
  options?: ParseGroupViewerBalancesOptions,
): GroupViewerBalancesPayload {
  const normalized = normalizeGroupBalancesWire(data);
  if (!normalized) {
    throw new ApiError({
      code: CLIENT_ERROR_CODES.PARSE_ERROR,
      message: 'Invalid group balances response shape.',
      status: 0,
      details: ['expected object envelope'],
    });
  }

  const viewerUserId = options?.viewerUserId?.trim();
  const balancesArr = Array.isArray(normalized.balances) ? normalized.balances : [];
  const summaryRaw = normalized.summary;
  const firstEdge = balancesArr[0];

  if (balancesArr.length === 0) {
    if (isEnrichedSummary(summaryRaw)) {
      return parseEnrichedViewerPayload({
        summary: summaryRaw,
        balances: [],
        updatedAt: normalized.updatedAt,
      });
    }
    return parseLedgerViewerPayload(normalized, viewerUserId);
  }

  if (isLedgerEdge(firstEdge)) {
    return parseLedgerViewerPayload(normalized, viewerUserId);
  }

  if (isEnrichedEdge(firstEdge)) {
    return parseEnrichedViewerPayload({
      summary: summaryRaw,
      balances: balancesArr,
      updatedAt: normalized.updatedAt,
    });
  }

  throw new ApiError({
    code: CLIENT_ERROR_CODES.PARSE_ERROR,
    message: 'Invalid group balances response shape.',
    status: 0,
    details: ['unrecognized balances[] item shape'],
  });
}

export type FetchGroupBalancesSnapshotOptions = {
  signal?: AbortSignal;
  viewerUserId?: string;
};

/**
 * `GET /v1/groups/:groupId/balances` — viewer-centric settlement summary (active members only).
 *
 * Differs from **`groupBalances` on expense mutations**: those remain raw `netByUserId` / `edges`
 * decimal-string snapshots; this endpoint is enriched for hub UI.
 */
export async function fetchGroupBalancesSnapshot(
  groupId: string,
  options?: FetchGroupBalancesSnapshotOptions,
): Promise<GroupViewerBalancesPayload> {
  const raw = await apiFetch<unknown>(ENDPOINTS.groups.balances(groupId), {
    method: 'GET',
    signal: options?.signal,
  });
  return parseGroupViewerBalancesWire(raw, { viewerUserId: options?.viewerUserId });
}

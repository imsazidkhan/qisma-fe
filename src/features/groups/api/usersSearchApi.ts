import { z } from 'zod';

import { ApiError, apiFetch, CLIENT_ERROR_CODES, ENDPOINTS } from '@/api';

export const USER_SEARCH_QUERY_MIN = 2;
export const USER_SEARCH_QUERY_MAX = 96;

const userSearchHitSchema = z
  .object({
    id: z.string().uuid(),
    name: z
      .union([z.string(), z.null()])
      .optional()
      .transform((v) => v ?? null),
    username: z
      .union([z.string(), z.null()])
      .optional()
      .transform((v) => v ?? null),
    avatar: z
      .union([z.string(), z.null()])
      .optional()
      .transform((v) => v ?? null),
  })
  .passthrough();

export type UserSearchHit = z.infer<typeof userSearchHitSchema>;

/**
 * `GET /v1/users/search?q=` — `q` required, trimmed length **2–96**.
 */
export function searchUsersDirectory(q: string, signal?: AbortSignal): Promise<UserSearchHit[]> {
  const trimmed = q.trim();
  if (trimmed.length < USER_SEARCH_QUERY_MIN || trimmed.length > USER_SEARCH_QUERY_MAX) {
    throw new ApiError({
      code: 'VALIDATION_ERROR',
      message: `Search query must be ${USER_SEARCH_QUERY_MIN}–${USER_SEARCH_QUERY_MAX} characters.`,
      status: 400,
    });
  }
  return apiFetch<unknown>(ENDPOINTS.users.search(trimmed), {
    method: 'GET',
    signal,
  }).then((raw) => {
    if (!Array.isArray(raw)) {
      throw new ApiError({
        code: CLIENT_ERROR_CODES.PARSE_ERROR,
        message: 'Invalid user search response: expected an array.',
        status: 0,
      });
    }
    const out: UserSearchHit[] = [];
    for (const el of raw) {
      const row = userSearchHitSchema.safeParse(el);
      if (!row.success) {
        throw new ApiError({
          code: CLIENT_ERROR_CODES.PARSE_ERROR,
          message: 'Invalid user search hit.',
          status: 0,
          details: row.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`),
        });
      }
      out.push(row.data);
    }
    return out;
  });
}

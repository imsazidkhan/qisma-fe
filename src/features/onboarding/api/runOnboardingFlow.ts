import { ApiError, CLIENT_ERROR_CODES } from '@/api';

import { getAuthMe, updateProfile, uploadAvatar } from '@/features/auth/api/authApi';

/**
 * Allowed `useCase` values for `PATCH /v1/auth/me` (auth-service contract).
 *
 * Note: these differ from generic labels like "trip" / "friends" — map your UI
 * choices to these slugs before calling {@link runOnboardingFlow}.
 */
export const ONBOARDING_USE_CASE_SLUGS = [
  'personal',
  'work_or_business',
  'with_groups',
  'just_exploring',
] as const;

export type OnboardingUseCaseSlug = (typeof ONBOARDING_USE_CASE_SLUGS)[number];

const RETRY_DELAYS_MS = [1000, 2000, 4000] as const;
const MAX_ATTEMPTS = 4;

export type RunOnboardingFlowInput = {
  displayName: string;
  avatar: { uri: string; fileName: string; mimeType: string };
  useCase: OnboardingUseCaseSlug;
  signal?: AbortSignal;
};

export type OnboardingFlowResult =
  | { status: 'already_complete'; completedSteps: [1] }
  | { status: 'complete'; completedSteps: [1, 2, 3, 4, 5, 6] }
  | {
      status: 'error';
      completedSteps: number[];
      error: { step: number; reason: string };
    };

function formatFailureReason(err: unknown): string {
  if (err instanceof ApiError) {
    return `${String(err.status)} - ${err.message}`;
  }
  if (err instanceof Error) {
    return `0 - ${err.message}`;
  }
  return '0 - unknown error';
}

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(
        new ApiError({
          code: CLIENT_ERROR_CODES.CANCELLED,
          message: 'Request aborted',
          status: 0,
        }),
      );
      return;
    }
    const id = setTimeout(resolve, ms);
    const onAbort = (): void => {
      clearTimeout(id);
      signal?.removeEventListener('abort', onAbort);
      reject(
        new ApiError({
          code: CLIENT_ERROR_CODES.CANCELLED,
          message: 'Request aborted',
          status: 0,
        }),
      );
    };
    signal?.addEventListener('abort', onAbort, { once: true });
  });
}

/**
 * Retries the same operation up to 3 times after failures (4 attempts total),
 * with 1s / 2s / 4s backoff between attempts.
 */
async function withRetries<T>(op: () => Promise<T>, signal?: AbortSignal): Promise<T> {
  let last: unknown;
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    try {
      return await op();
    } catch (e) {
      last = e;
      if (attempt === MAX_ATTEMPTS - 1) {
        break;
      }
      const delayMs = RETRY_DELAYS_MS[attempt];
      if (delayMs !== undefined) {
        await sleep(delayMs, signal);
      }
    }
  }
  throw last;
}

function isAlreadyOnboarded(me: {
  onboarding?: {
    isOnboardingComplete?: boolean;
  };
  onboardingCompletedAt?: string | null;
}): boolean {
  if (me.onboarding?.isOnboardingComplete === true) {
    return true;
  }
  const at = me.onboardingCompletedAt;
  return at != null && at.length > 0;
}

/**
 * Runs the canonical onboarding sequence against auth-service (paths relative to
 * API base URL, which already includes `/v1`):
 *
 * 1. `GET /auth/me` — stop if already complete
 * 2. `PATCH /auth/me` `{ name }`
 * 3. `POST /upload/avatar` multipart `file`
 * 4. `PATCH /auth/me` `{ avatarUrl }` from step 3
 * 5. `PATCH /auth/me` `{ useCase }`
 * 6. `PATCH /auth/me` `{ onboardingCompleted: true }`
 *
 * Each HTTP call is retried on failure with exponential backoff.
 * The next step runs only after the current step succeeds.
 */
export async function runOnboardingFlow(
  input: RunOnboardingFlowInput,
): Promise<OnboardingFlowResult> {
  const { displayName, avatar, useCase, signal } = input;
  const completed: number[] = [];

  try {
    const me = await withRetries(() => getAuthMe(signal), signal);
    completed.push(1);

    if (isAlreadyOnboarded(me)) {
      return { status: 'already_complete', completedSteps: [1] };
    }

    await withRetries(() => updateProfile({ name: displayName, signal }), signal);
    completed.push(2);

    const upload = await withRetries(
      () =>
        uploadAvatar({
          uri: avatar.uri,
          fileName: avatar.fileName,
          mimeType: avatar.mimeType,
          signal,
        }),
      signal,
    );

    const avatarUrl = typeof upload?.url === 'string' ? upload.url.trim() : '';
    if (!avatarUrl) {
      return {
        status: 'error',
        completedSteps: completed,
        error: { step: 3, reason: '0 - missing avatar url in upload response' },
      };
    }
    completed.push(3);

    await withRetries(() => updateProfile({ avatarUrl, signal }), signal);
    completed.push(4);

    await withRetries(() => updateProfile({ useCase, signal }), signal);
    completed.push(5);

    await withRetries(() => updateProfile({ onboardingCompleted: true, signal }), signal);
    completed.push(6);

    return { status: 'complete', completedSteps: [1, 2, 3, 4, 5, 6] };
  } catch (e) {
    const step = completed.length >= 6 ? 6 : completed.length === 0 ? 1 : completed.length + 1;
    return {
      status: 'error',
      completedSteps: completed,
      error: { step, reason: formatFailureReason(e) },
    };
  }
}

import { STORAGE_KEYS } from '@/constants';
import { storage } from '@/services';
import { decodeJwtPayloadUnsafe } from '@/utils/decodeJwtPayload';

const DONE = '1';

type SubClaim = { sub?: string };

function readSub(accessToken: string): string | null {
  const sub = decodeJwtPayloadUnsafe<SubClaim>(accessToken)?.sub;
  return typeof sub === 'string' && sub.length > 0 ? sub : null;
}

function readPair(userIdKey: string, flagKey: string, accessToken: string | null): boolean {
  if (!accessToken) return false;
  const sub = readSub(accessToken);
  if (!sub) return false;
  if (storage.getString(userIdKey) !== sub) return false;
  return storage.getString(flagKey) === DONE;
}

/**
 * JWT `sub` has finished **full onboarding** on this install (use-case saved + server completion).
 *
 * Migrates installs that only had legacy `qisma.onboarding.displayName.*` (old “after avatar”).
 * Legacy alone is treated as **avatar-era** only via {@link isAvatarStepOnboardingComplete}; full
 * completion requires {@link STORAGE_KEYS.onboardingFullyComplete}.
 */
export function isDisplayNameOnboardingComplete(accessToken: string | null): boolean {
  return readPair(
    STORAGE_KEYS.onboardingFullyCompleteUserId,
    STORAGE_KEYS.onboardingFullyComplete,
    accessToken,
  );
}

/**
 * Marks full onboarding done locally — call after **`PATCH /v1/auth/me`** with `useCase` +
 * `onboardingCompleted: true` succeeds.
 */
export function setDisplayNameOnboardingComplete(accessToken: string): void {
  const sub = readSub(accessToken);
  if (!sub) return;
  storage.set(STORAGE_KEYS.onboardingFullyCompleteUserId, sub);
  storage.set(STORAGE_KEYS.onboardingFullyComplete, DONE);
  storage.delete(STORAGE_KEYS.onboardingAvatarStepUserId);
  storage.delete(STORAGE_KEYS.onboardingAvatarStepComplete);
  storage.delete(STORAGE_KEYS.onboardingDisplayNameUserId);
  storage.delete(STORAGE_KEYS.onboardingDisplayNameComplete);
}

/**
 * Whether the user saved `name` (`PATCH /v1/auth/me`) on this device but has not necessarily
 * finished later steps.
 */
export function isNameStepOnboardingComplete(accessToken: string | null): boolean {
  return readPair(
    STORAGE_KEYS.onboardingNameStepUserId,
    STORAGE_KEYS.onboardingNameStepComplete,
    accessToken,
  );
}

export function setNameStepOnboardingComplete(accessToken: string): void {
  const sub = readSub(accessToken);
  if (!sub) return;
  storage.set(STORAGE_KEYS.onboardingNameStepUserId, sub);
  storage.set(STORAGE_KEYS.onboardingNameStepComplete, DONE);
}

/**
 * Avatar step finished (upload + `avatarUrl` PATCH, or skip). Drives offline routing to use-case.
 */
export function isAvatarStepOnboardingComplete(accessToken: string | null): boolean {
  if (
    readPair(
      STORAGE_KEYS.onboardingAvatarStepUserId,
      STORAGE_KEYS.onboardingAvatarStepComplete,
      accessToken,
    )
  ) {
    return true;
  }
  // Legacy: older builds set `displayName.*` keys after avatar.
  const legacyAvatarEra =
    readPair(
      STORAGE_KEYS.onboardingDisplayNameUserId,
      STORAGE_KEYS.onboardingDisplayNameComplete,
      accessToken,
    ) && !isDisplayNameOnboardingComplete(accessToken);
  return Boolean(legacyAvatarEra);
}

export function setAvatarStepOnboardingComplete(accessToken: string): void {
  const sub = readSub(accessToken);
  if (!sub) return;
  storage.set(STORAGE_KEYS.onboardingAvatarStepUserId, sub);
  storage.set(STORAGE_KEYS.onboardingAvatarStepComplete, DONE);
}

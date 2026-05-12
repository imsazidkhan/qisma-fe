export type InviteReactionKind = 'accept' | 'decline';

/** Fallback when reduce motion is on or Lottie is unavailable. */
export const INVITE_REACTION_FALLBACK = {
  accept: '✨',
  decline: '👋',
} as const;

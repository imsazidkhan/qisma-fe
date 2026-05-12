import type { PickedAvatar } from '@/features/onboarding/hooks/useCompleteAvatarOnboarding';

export type PickAvatarResult =
  | { kind: 'picked'; asset: PickedAvatar }
  | { kind: 'cancelled' }
  | { kind: 'permission_denied' };

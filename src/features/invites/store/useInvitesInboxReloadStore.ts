import { create } from 'zustand';

type InvitesInboxReloadState = {
  reloadToken: number;
  bumpInvitesInboxReload: () => void;
};

/** Bumped after `POST /v1/otp/verify` so inbox refetches without duplicating side effects. */
export const useInvitesInboxReloadStore = create<InvitesInboxReloadState>((set) => ({
  reloadToken: 0,
  bumpInvitesInboxReload: () => set((s) => ({ reloadToken: s.reloadToken + 1 })),
}));

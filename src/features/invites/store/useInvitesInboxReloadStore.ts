import { create } from 'zustand';

type InvitesInboxReloadState = {
  reloadToken: number;
  bumpInvitesInboxReload: () => void;
};

/** Bumped when the access JWT is (re)issued — OTP verify, cold-start refresh, `/auth/refresh` — so inbox refetches. */
export const useInvitesInboxReloadStore = create<InvitesInboxReloadState>((set) => ({
  reloadToken: 0,
  bumpInvitesInboxReload: () => set((s) => ({ reloadToken: s.reloadToken + 1 })),
}));

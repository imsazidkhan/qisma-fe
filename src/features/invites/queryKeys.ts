export const invitesQueryKeys = {
  root: ['invites'] as const,
  /** `GET /v1/users/me/group-invites` — third segment is `reloadToken` from OTP post-verify. */
  inbox: (reloadToken: number) => ['invites', 'inbox', reloadToken] as const,
} as const;

export type ContactsSyncRegisteredRow = {
  userId: string;
  name: string | null;
  username: string | null;
  avatar: string | null;
  /** E.164 when the server includes it — used to match device contacts. */
  identifier: string | null;
};

export type ContactsSyncResult = {
  registered: ContactsSyncRegisteredRow[];
  /**
   * Identifiers the server processed in this response (`syncedCount` wire).
   * `null` when the backend omits the field (older contracts).
   */
  syncedCount: number | null;
  /**
   * Normalized E.164 (or best-effort) identifiers confirmed **not** registered.
   */
  unregistered: string[];
};

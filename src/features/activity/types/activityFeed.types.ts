export type ActivityFeedKind = 'invite' | 'join' | 'accept';

export type ActivityFeedInviteItem = {
  kind: 'invite';
  feedItemId: string;
  groupId: string;
  groupName: string;
  invitedByName: string | null;
  invitedAt: string | null;
  avatarUrl: string | null;
  iconEmoji: string;
};

export type ActivityFeedMembershipItem = {
  kind: 'join' | 'accept';
  feedItemId: string;
  groupId: string;
  groupName: string;
  at: string;
  avatarUrl?: string | null;
  iconEmoji: string;
};

export type ActivityFeedItem = ActivityFeedInviteItem | ActivityFeedMembershipItem;

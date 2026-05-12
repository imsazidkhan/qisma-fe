import { router } from 'expo-router';

import type { ActivityFeedItem } from '@/features/activity/types/activityFeed.types';

export function navigateForActivityFeedItem(item: ActivityFeedItem): void {
  if (item.kind === 'invite') {
    router.push(`/home/group/${item.groupId}?roster=0`);
    return;
  }
  router.push(`/home/group/${item.groupId}`);
}

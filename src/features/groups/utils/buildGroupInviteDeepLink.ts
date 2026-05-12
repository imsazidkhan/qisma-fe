import * as Linking from 'expo-linking';

/** Resolves to the app’s group-invite path (scheme / universal link from Expo config). */
export function buildGroupInviteDeepLink(groupId: string): string {
  return Linking.createURL(`groups/${groupId}/invite`);
}

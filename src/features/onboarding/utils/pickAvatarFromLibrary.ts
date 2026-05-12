/**
 * Metro resolves `pickAvatarFromLibrary` to `.web` (web) or `.native` (iOS/Android).
 * This barrel exists for TypeScript and fallbacks; platform files override at bundle time.
 */
export type { PickAvatarResult } from './pickAvatarFromLibrary.types';
export { pickAvatarFromLibrary } from './pickAvatarFromLibrary.native';

import * as ImagePicker from 'expo-image-picker';

import type { PickAvatarResult } from '@/features/onboarding/utils/pickAvatarFromLibrary.types';

function guessMime(uri: string): string {
  const lower = uri.toLowerCase();
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.endsWith('.gif')) return 'image/gif';
  return 'image/jpeg';
}

/** iOS / Android: system photo library via `expo-image-picker`. */
export async function pickAvatarFromLibrary(): Promise<PickAvatarResult> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    return { kind: 'permission_denied' };
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.85,
  });

  if (result.canceled || !result.assets[0]) {
    return { kind: 'cancelled' };
  }

  const asset = result.assets[0];
  const uri = asset.uri;
  const fileName = asset.fileName ?? 'avatar.jpg';
  const mimeType = asset.mimeType ?? guessMime(uri);

  return {
    kind: 'picked',
    asset: { uri, fileName, mimeType },
  };
}

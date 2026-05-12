import type { PickAvatarResult } from '@/features/onboarding/utils/pickAvatarFromLibrary.types';

function guessMime(name: string): string {
  const lower = name.toLowerCase();
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.endsWith('.gif')) return 'image/gif';
  return 'image/jpeg';
}

/**
 * Web: hidden `<input type="file">` — no `expo-image-picker` (avoids native module on web).
 */
export async function pickAvatarFromLibrary(): Promise<PickAvatarResult> {
  if (typeof document === 'undefined') {
    return { kind: 'cancelled' };
  }

  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/jpeg,image/png,image/webp,image/gif';
    input.style.display = 'none';

    const cleanup = () => {
      input.remove();
    };

    input.onchange = () => {
      const file = input.files?.[0];
      cleanup();
      if (!file) {
        resolve({ kind: 'cancelled' });
        return;
      }
      const uri = URL.createObjectURL(file);
      const fileName = file.name || 'avatar.jpg';
      const mimeType = file.type || guessMime(fileName);
      resolve({
        kind: 'picked',
        asset: { uri, fileName, mimeType },
      });
    };

    input.oncancel = () => {
      cleanup();
      resolve({ kind: 'cancelled' });
    };

    document.body.appendChild(input);
    input.click();
  });
}

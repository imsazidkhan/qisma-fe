/**
 * Arabic (`ar`) — **RTL QA stub**: strings match English until a proper translation
 * lands. Use with device/emulator RTL + Arabic locale to exercise mirrored layout.
 */
import { en } from './en';

function cloneEnTranslation(): (typeof en)['translation'] {
  return JSON.parse(JSON.stringify(en.translation)) as (typeof en)['translation'];
}

export const ar = {
  translation: cloneEnTranslation(),
} as const;

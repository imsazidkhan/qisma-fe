/**
 * i18next bootstrap. Imported once, eagerly initialised on first import.
 *
 * i18next v26 defaults `ignoreJSONStructure: true`, which changes how nested
 * JSON is resolved. Qisma keeps classic nested resources (`auth.phone.*`, etc.),
 * so we set **`ignoreJSONStructure: false`** on the resource store.
 *
 * Export **`export const i18n = i18next`** — the same instance `.init()` runs on.
 */
import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';

import { en } from './locales/en';

function bundleEnglish(): (typeof en)['translation'] {
  return JSON.parse(JSON.stringify(en)).translation as (typeof en)['translation'];
}

const bundledEn = bundleEnglish();

if (!i18next.isInitialized) {
  // eslint-disable-next-line import/no-named-as-default-member
  i18next.use(initReactI18next).init({
    resources: { en: { translation: bundledEn } },
    lng: 'en',
    fallbackLng: ['en'],
    supportedLngs: ['en'],
    defaultNS: 'translation',
    ns: ['translation'],
    /** Nested resources (`home.headline`, `auth.phone.title`, …). */
    keySeparator: '.',
    ignoreJSONStructure: false,
    interpolation: { escapeValue: false },
    returnNull: false,
    returnEmptyString: false,
    react: {
      useSuspense: false,
      /** Re-render once i18n finishes init (default only listened to `languageChanged`). */
      bindI18n: 'initialized languageChanged loaded',
      bindI18nStore: 'added removed',
    },
    ...(typeof __DEV__ !== 'undefined' && __DEV__
      ? {
          missingKeyHandler: (lngs: readonly string[], ns: string, key: string) => {
            console.warn(`[i18n] missing key "${key}" (ns=${ns}, lng=${String(lngs)})`);
          },
        }
      : {}),
  });
}

export const i18n = i18next;

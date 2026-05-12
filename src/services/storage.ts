/**
 * Synchronous key-value store. Backed by `react-native-mmkv` when the native
 * module is available; transparently falls back to an in-memory `Map` shim
 * when running in Expo Go (where MMKV's native module is absent).
 *
 * Use this for small, NON-SENSITIVE values that need to survive app restarts:
 * device id, theme preference, last-seen-onboarding-version. For tokens /
 * secrets use `expo-secure-store` instead — never put a JWT here.
 *
 * The shim only mirrors the surface we use; expand `StorageLike` if you
 * reach for a method we haven't proxied.
 */

type StorageLike = {
  getString: (key: string) => string | undefined;
  set: (key: string, value: string) => void;
  delete: (key: string) => void;
};

function createStorage(): StorageLike {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { MMKV } = require('react-native-mmkv');
    const instance = new MMKV();
    return {
      getString: (key) => instance.getString(key),
      set: (key, value) => instance.set(key, value),
      delete: (key) => instance.delete(key),
    };
  } catch {
    // Expo Go path — native MMKV module not linked. In-memory shim is enough
    // for development; a real dev client / production build picks up MMKV.
    const memory = new Map<string, string>();
    return {
      getString: (key) => memory.get(key),
      set: (key, value) => {
        memory.set(key, value);
      },
      delete: (key) => {
        memory.delete(key);
      },
    };
  }
}

export const storage: StorageLike = createStorage();

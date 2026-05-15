/** Minimal stub so Vitest never parses Flow sources under `react-native`. */

export const Platform = {
  OS: 'ios',
  select<T>(spec: { ios?: T; android?: T; default?: T }): T | undefined {
    return spec.ios ?? spec.android ?? spec.default;
  },
};

vi.mock('expo/devtools', () => ({}));
vi.mock('@dev-plugins/react-query', () => ({}));
vi.mock('expo-constants', () => ({
  default: {
    expoConfig: undefined,
    expoGoConfig: undefined,
  },
}));

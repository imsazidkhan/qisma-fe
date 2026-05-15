globalThis.__DEV__ = true;

process.env.EXPO_OS = 'ios';
process.env.EXPO_PUBLIC_API_BASE_URL = 'http://localhost:3000/v1';

class ExpoEmitterStub {}
(globalThis as unknown as { expo: { EventEmitter: typeof ExpoEmitterStub } }).expo = {
  EventEmitter: ExpoEmitterStub,
};

import path from 'node:path';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    setupFiles: ['./vitest.polyfills.ts', './vitest.setup.ts'],
    environment: 'jsdom',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
  },
  resolve: {
    alias: [
      {
        find: 'react-native',
        replacement: path.resolve(__dirname, './src/test/shims/react-native.ts'),
      },
      { find: '@', replacement: path.resolve(__dirname, './src') },
    ],
  },
});

import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    fileParallelism: false,
    include: ['src/**/*.test.ts'],
    env: {
      NODE_ENV: 'test',
      JWT_SECRET: 'test-only-secret-that-is-at-least-32-characters-long',
      JWT_EXPIRES_IN: '7d',
      CORS_ORIGIN: 'http://localhost:5173',
      MONGODB_URI: 'mongodb://localhost:27017/studdypuddy-test',
    },

    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/core/**/*.ts'],
      exclude: ['src/**/*.test.ts', 'src/core/types.ts'],
      thresholds: { lines: 90, statements: 90, functions: 90, branches: 80 },
    },
  },
});

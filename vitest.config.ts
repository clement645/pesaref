import { defineConfig } from 'vitest/config';
import path from 'path';
import { config as loadEnv } from 'dotenv';

// Integration tests truncate tables between runs, so they must never point
// at the same database used for local development/seed data. Prefer
// .env.test (see .env.test.example) and only fall back to .env if it does
// not exist, so a missing .env.test does not silently wipe dev data - it
// just borrows dev's DATABASE_URL, which the README warns against.
loadEnv({ path: path.resolve(__dirname, '.env.test') });
loadEnv({ path: path.resolve(__dirname, '.env') });

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    testTimeout: 20000,
    hookTimeout: 20000,
    // Integration tests share one live Postgres database and truncate
    // tables between tests - running test files in parallel would let them
    // stomp on each other's data.
    fileParallelism: false,
  },
  resolve: {
    alias: {
      'server-only': path.resolve(__dirname, './tests/stubs/server-only.ts'),
      '@': path.resolve(__dirname, './src'),
    },
  },
});

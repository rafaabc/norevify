import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e/tests',
  globalTeardown: './e2e/global-teardown',
  fullyParallel: !process.env.CI,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  // CI: 2 workers, parallel by spec file (fullyParallel stays off in CI — each file
  // creates its own user in beforeAll and its tests share it). Local stays at 1.
  workers: process.env.CI ? 2 : 1,
  // Abort a catastrophically broken run (e.g. server down) instead of retrying all tests.
  maxFailures: process.env.CI ? 10 : undefined,
  reporter: [['html', { open: 'never' }], ['list']],
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});

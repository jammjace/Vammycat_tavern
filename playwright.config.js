import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  testMatch: '**/*.spec.cjs',
  timeout: 300_000,
  expect: { timeout: 60_000 },
  workers: 1,
  use: {
    channel: 'chrome',
    baseURL: 'http://127.0.0.1:5175',
    viewport: { width: 1320, height: 780 },
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'npm run dev -- --port 5175 --strictPort',
    url: 'http://127.0.0.1:5175',
    reuseExistingServer: !process.env.CI,
  },
});

import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config();

export default defineConfig({
  testDir: './tests',
  timeout: process.env.CI ? 60_000 : 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : 4,
  reporter: [['html', { open: 'never' }], ['list']],
  use: {
    baseURL: process.env.BASE_URL ?? 'https://qa-practice.netlify.app',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      testIgnore: '**/bonus-api.spec.ts',
       // { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    },
    {
      name: 'api',
      testMatch: '**/bonus-api.spec.ts',
      use: {
        baseURL: process.env.API_BASE_URL ?? 'http://localhost:8887',
      },
    },
  ],
});

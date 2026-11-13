import { defineConfig, devices } from '@playwright/test';
import { defineBddConfig, cucumberReporter } from 'playwright-bdd';

const testDir = defineBddConfig({
  features: ['features/**/*.feature'],
  steps: ['features/common/*.ts', 'features/**/*.ts'],
});

const isCI = process.env.CI === 'true' || process.env.CI === '1';
const baseURL = (process.env.BASE_URL || 'http://localhost:3003').replace(/\/$/, '');

export default defineConfig({
  testDir,
  globalSetup: require.resolve('./global-setup.ts'),
  timeout: isCI ? 240000 : 120000,
  grep: /^(?!.*@skip)/,
  retries: isCI ? 1 : 0,
  workers: 1,
  reporter: [
    ['list'],
    cucumberReporter('html', { outputFile: 'cucumber-report/index.html' }),
    ['html', { open: 'never' }],
  ],
  use: {
    baseURL,
    ignoreHTTPSErrors: true,
    testIdAttribute: 'data-tid',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    viewport: { width: 1280, height: 720 },
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  // Reuses a UI already listening on BASE_URL. This app has no sign-in.
  webServer: process.env.E2E_NO_WEB_SERVER
    ? undefined
    : {
        command: `npm run dev:test -- --port ${new URL(baseURL).port || '3003'}`,
        cwd: '..',
        url: baseURL,
        reuseExistingServer: true,
        timeout: 300_000,
      },
});

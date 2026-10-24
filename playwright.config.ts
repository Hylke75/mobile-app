import { defineConfig, devices } from '@playwright/test';

// Schermtests op de webversie (npm run e2e). Alarmen en camera bestaan op web niet;
// die blijven voor de Maestro-tests op een echt toestel (e2e/maestro).
export default defineConfig({
  testDir: './e2e/web',
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  timeout: 60_000,
  expect: { timeout: 8_000 },
  reporter: process.env.CI ? [['github'], ['list']] : 'list',
  use: {
    baseURL: 'http://localhost:8090',
    locale: 'nl-NL',
    timezoneId: 'Europe/Amsterdam',
    viewport: { width: 390, height: 844 },
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], viewport: { width: 390, height: 844 } },
    },
  ],
  webServer: {
    command: 'node e2e/web/server.mjs dist-web 8090',
    url: 'http://localhost:8090',
    reuseExistingServer: !process.env.CI,
  },
});

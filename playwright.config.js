// @ts-check
const { defineConfig, devices } = require('@playwright/test');

/**
 * Playwright config for Website Modul3D.
 * Uses the Chromium build pre-installed in this environment
 * (PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers) — no browser download needed.
 */
module.exports = defineConfig({
  testDir: './tests',
  fullyParallel: true,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: {
          executablePath: '/opt/pw-browsers/chromium',
        },
      },
    },
  ],
});

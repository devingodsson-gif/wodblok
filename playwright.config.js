// Playwright config for the WODBLOK safety net.
// - Chromium is the reference engine (pinned via @playwright/test 1.56.0).
// - WebKit runs only the @smoke tests and only where WebKit is installed (CI); see tests/smoke.spec.js.
// - Pixel goldens live in tests/__golden__/<WB_ENV>/ because pixels differ between machines. Run them
//   in the same environment that created them. State and SVG-markup snapshots do not depend on the machine.
const { defineConfig } = require('@playwright/test');
const fs = require('fs');

const ENV = process.env.WB_ENV || 'sandbox';
// Allow an explicit browser path (this sandbox ships Chromium outside the default cache).
const CHROMIUM = process.env.WB_CHROMIUM || (fs.existsSync('/opt/pw-browsers/chromium-1194/chrome-linux/chrome')
  ? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' : undefined);

module.exports = defineConfig({
  testDir: './tests',
  testMatch: /.*\.spec\.js/,
  fullyParallel: false,
  workers: 1,                       // one at a time: perf numbers and the seeded runs must not compete for CPU
  retries: 0,                       // a flaky test is a finding, not something to hide
  timeout: 120000,
  expect: { timeout: 15000, toHaveScreenshot: { maxDiffPixelRatio: 0.002, animations: 'disabled', pathTemplate: '{testDir}/__golden__/' + ENV + '/{testFilePath}/{arg}{ext}' } },
  reporter: [['list'], ['json', { outputFile: 'test-results/report.json' }]],
  snapshotPathTemplate: '{testDir}/__snapshots__/{testFilePath}/{arg}{ext}',
  use: {
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
    locale: 'en-US',
    timezoneId: 'UTC',
    colorScheme: 'dark',
    reducedMotion: 'reduce',
    acceptDownloads: true,
    actionTimeout: 30000,          // never wait forever on a missing element
    navigationTimeout: 60000,
  },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium', launchOptions: { ...(CHROMIUM ? { executablePath: CHROMIUM } : {}), args: ['--disable-background-networking', '--disable-component-update', '--disable-sync', '--no-first-run'] } },
      metadata: { env: ENV } },
    { name: 'webkit', use: { browserName: 'webkit' }, metadata: { env: ENV } },
  ],
});

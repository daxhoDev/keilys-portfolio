import { defineConfig, devices } from '@playwright/test';

/**
 * Browser tests run against the built site via `astro preview`, not the dev server:
 * the dev server serves unbundled modules and unminified CSS, so it can pass while
 * the thing that actually deploys is broken.
 */
export default defineConfig({
  testDir: './tests/browser',
  fullyParallel: true,

  /**
   * Every image on this site is AVIF, and /mi-trabajo carries 27 of them. AVIF decode
   * is CPU-bound, page.goto waits for load, and load waits for every decode — so the
   * default 30s is not enough here, and running one worker per core makes the workers
   * compete for the very CPU the decoding needs.
   */
  timeout: 60_000,
  workers: process.env.CI ? 2 : 4,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : [['list']],
  use: {
    baseURL: 'http://localhost:4321',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    command: 'npm run preview -- --port 4321',
    url: 'http://localhost:4321',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});

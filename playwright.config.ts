import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:4173',
    browserName: 'chromium',
    // Varsayılan: makinede kurulu Google Chrome (indirme gerekmez). Playwright'ın kendi Chromium'u için PW_KANAL=chromium.
    channel: process.env.PW_KANAL || 'chrome',
    viewport: { width: 375, height: 812 },
    isMobile: true,
    hasTouch: true,
    locale: 'tr-TR'
  },
  webServer: {
    command: 'npm run build && npm run preview -- --port 4173 --strictPort',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000
  }
});

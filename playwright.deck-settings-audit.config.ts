import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './manual-tests/deck-settings-audit', workers: 1, retries: 0, timeout: 60000,
  expect: { timeout: 12000 }, reporter: 'list', outputDir: '.cache/deck-settings-improvements/browser-results',
  use: { baseURL: 'http://127.0.0.1:4403/kana-study/', channel: 'msedge', trace: 'retain-on-failure' },
  projects: [
    { name: 'desktop-dark', use: { viewport: { width: 1440, height: 1000 }, colorScheme: 'dark' } },
    { name: 'desktop-light', use: { viewport: { width: 1440, height: 1000 }, colorScheme: 'light' } },
    { name: 'laptop-dark', use: { viewport: { width: 1280, height: 800 }, colorScheme: 'dark' } },
    { name: 'tablet-light', use: { viewport: { width: 768, height: 1024 }, colorScheme: 'light' } },
    { name: 'mobile-light', use: { viewport: { width: 390, height: 844 }, colorScheme: 'light' } },
    { name: 'narrow-dark', use: { viewport: { width: 320, height: 800 }, colorScheme: 'dark' } },
  ],
  webServer: { command: 'node scripts/serve-kaishi-auto-preview.mjs', url: 'http://127.0.0.1:4403/kana-study/', reuseExistingServer: false, timeout: 30000 },
});

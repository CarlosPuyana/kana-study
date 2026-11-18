import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './manual-tests/puyi-private',
  outputDir: '.cache/phrase-islands-puyi-p71/playwright',
  timeout: 45000,
  workers: 2,
  projects: [
    { name: 'edge', use: { browserName: 'chromium', channel: 'msedge' } },
    { name: 'webkit', use: { browserName: 'webkit' } },
  ],
});

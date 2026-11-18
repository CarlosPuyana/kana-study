import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './manual-tests/puyi-demo',
  outputDir: '.cache/phrase-islands-puyi-p6/playwright',
  timeout: 50_000,
  workers: 2,
  use: { baseURL: 'http://127.0.0.1:4446', trace: 'retain-on-failure' },
  webServer: {
    command: 'npm run start:puyi-demo',
    url: 'http://127.0.0.1:4446',
    reuseExistingServer: true,
    timeout: 90_000,
  },
  projects: [
    { name: 'edge', use: { browserName: 'chromium', channel: 'msedge' } },
    { name: 'webkit', use: { browserName: 'webkit' } },
  ],
});

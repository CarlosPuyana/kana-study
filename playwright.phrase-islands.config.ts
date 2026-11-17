import { defineConfig } from '@playwright/test';
import base from './playwright.deck-learning.config';

export default defineConfig({ ...base, testDir: './manual-tests/phrase-islands',
  outputDir: '.cache/phrase-islands/browser-results',
  projects: [
    { name: 'desktop-dark', use: { viewport: { width: 1280, height: 1000 }, colorScheme: 'dark' } },
    { name: 'desktop-light', use: { viewport: { width: 1280, height: 1000 }, colorScheme: 'light' } },
    { name: 'mobile-dark', use: { viewport: { width: 390, height: 844 }, colorScheme: 'dark' } },
    { name: 'mobile-light', use: { viewport: { width: 390, height: 844 }, colorScheme: 'light' } },
    { name: 'narrow-dark', use: { viewport: { width: 320, height: 800 }, colorScheme: 'dark' } },
    { name: 'narrow-light', use: { viewport: { width: 320, height: 800 }, colorScheme: 'light' } },
  ],
});

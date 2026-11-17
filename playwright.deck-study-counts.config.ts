import { defineConfig } from '@playwright/test';
import base from './playwright.deck-learning.config';

export default defineConfig({ ...base, testDir: './manual-tests/deck-study-counts',
  outputDir: '.cache/deck-study-counts/browser-results' });

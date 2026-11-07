import base from './playwright.vocabulary-short-lessons.config';
import {defineConfig} from '@playwright/test';
export default defineConfig({...base,testDir:'./manual-tests/vocabulary-stats',outputDir:'.cache/vocabulary-stats/browser-results'});

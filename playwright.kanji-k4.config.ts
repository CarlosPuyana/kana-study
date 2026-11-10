import {defineConfig} from '@playwright/test';
import base from './playwright.kanji-k3.config';
export default defineConfig({...base,testDir:'./manual-tests/kanji-k4',outputDir:'.cache/kanji-k4/browser-results'});

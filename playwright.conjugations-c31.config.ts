import {defineConfig} from '@playwright/test';
import base from './playwright.conjugations-c1.config';
export default defineConfig({...base,testDir:'./manual-tests/conjugations-c31',outputDir:'.cache/conjugations-c31/browser-results'});

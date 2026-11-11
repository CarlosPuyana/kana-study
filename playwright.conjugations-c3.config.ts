import {defineConfig} from '@playwright/test';
import base from './playwright.conjugations-c1.config';
export default defineConfig({...base,testDir:'./manual-tests/conjugations-c3',outputDir:'.cache/conjugations-c3/browser-results'});

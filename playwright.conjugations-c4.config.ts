import {defineConfig} from '@playwright/test';
import base from './playwright.conjugations-c1.config';
export default defineConfig({...base,testDir:'./manual-tests/conjugations-c4',outputDir:'.cache/conjugations-c4/browser-results'});

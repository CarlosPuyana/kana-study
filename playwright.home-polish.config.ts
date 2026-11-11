import {defineConfig} from '@playwright/test';
import base from './playwright.kanji-k3.config';
export default defineConfig({...base,testDir:'./manual-tests/home-polish',outputDir:'.cache/home-polish/browser-results'});

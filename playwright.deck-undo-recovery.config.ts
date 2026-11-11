import {defineConfig} from '@playwright/test';
import base from './playwright.decks-anki-parity.config';
export default defineConfig({...base,testDir:'./manual-tests/deck-undo-recovery',outputDir:'.cache/deck-undo-close/browser-results'});

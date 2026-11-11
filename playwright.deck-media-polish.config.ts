import {defineConfig} from '@playwright/test';
import base from './playwright.decks-anki-parity.config';
export default defineConfig({...base,testDir:'./manual-tests/deck-media-polish',outputDir:'.cache/deck-media-polish',use:{...base.use,baseURL:'http://127.0.0.1:4431/'},webServer:{command:'npm run start -- --build-target kana-study:build:manga-candidate,development --host 127.0.0.1 --port 4431 --live-reload false --hmr false',url:'http://127.0.0.1:4431/',reuseExistingServer:false,timeout:120000}});

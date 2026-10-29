import base from './playwright.config';
import {defineConfig} from '@playwright/test';
export default defineConfig({...base,testDir:'./manual-tests/kaishi-auto',use:{...base.use,baseURL:'http://127.0.0.1:4403/kana-study/'},
 webServer:{command:'node scripts/prepare-kaishi-static-media.mjs --fixtures && node scripts/serve-kaishi-auto-preview.mjs --fixtures',url:'http://127.0.0.1:4403/kana-study/',reuseExistingServer:false,timeout:30000},
});

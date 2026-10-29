import base from './playwright.config';
import {defineConfig} from '@playwright/test';
export default defineConfig({...base,testDir:'./manual-tests/kaishi-original',
 use:{...base.use,baseURL:'http://127.0.0.1:4403/kana-study/'},
 webServer:{command:'node scripts/serve-kaishi-auto-preview.mjs',url:'http://127.0.0.1:4403/kana-study/',reuseExistingServer:false,timeout:30000},
});

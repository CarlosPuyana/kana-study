import base from './playwright.config';
import {defineConfig} from '@playwright/test';
const optimized=process.env['KAISHI_MEDIA_CANDIDATE']==='1';
export default defineConfig({...base,testDir:'./manual-tests/kaishi-media',workers:1,timeout:180000,
 use:{...base.use,...(optimized?{baseURL:'http://127.0.0.1:4402/kana-study/'}:{})},
 webServer:optimized?{command:'node scripts/serve-manga-candidate.mjs',url:'http://127.0.0.1:4402/kana-study/',reuseExistingServer:false,timeout:30000}:base.webServer,
});

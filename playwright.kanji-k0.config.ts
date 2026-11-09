import {defineConfig} from '@playwright/test';
export default defineConfig({testDir:'./manual-tests/kanji-k0',workers:1,retries:0,timeout:45000,expect:{timeout:12000},reporter:'list',outputDir:'.cache/kanji-k0/browser-results',
use:{baseURL:'http://127.0.0.1:4420/',channel:'msedge',trace:'retain-on-failure'},
projects:[{name:'desktop-es-dark',use:{viewport:{width:1280,height:720},colorScheme:'dark'}},{name:'narrow-en-light',use:{viewport:{width:320,height:800},colorScheme:'light'}},{name:'mobile-ca-dark',use:{viewport:{width:390,height:844},colorScheme:'dark'}}],
webServer:{command:'npm run start -- --host 127.0.0.1 --port 4420',url:'http://127.0.0.1:4420/',reuseExistingServer:true,timeout:120000}});

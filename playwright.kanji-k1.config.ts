import {defineConfig} from '@playwright/test';
export default defineConfig({testDir:'./manual-tests/kanji-k1',workers:1,retries:0,timeout:45000,expect:{timeout:10000},reporter:'list',outputDir:'.cache/kanji-k1/browser-results',
use:{baseURL:'http://127.0.0.1:4424/',channel:'msedge',trace:'retain-on-failure'},
projects:[{name:'desktop-es-dark',use:{viewport:{width:1280,height:720},colorScheme:'dark'}},{name:'mobile-en-light',use:{viewport:{width:390,height:844},colorScheme:'light'}},{name:'narrow-ca-dark',use:{viewport:{width:320,height:800},colorScheme:'dark'}}],
webServer:{command:'npm run start -- --host 127.0.0.1 --port 4424 --live-reload false --hmr false',url:'http://127.0.0.1:4424/',reuseExistingServer:false,timeout:120000}});

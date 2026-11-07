import {defineConfig} from '@playwright/test';
export default defineConfig({
  testDir:'./manual-tests/vocabulary-fsrs-rush',workers:1,retries:0,timeout:60000,
  expect:{timeout:12000},reporter:'list',outputDir:'.cache/vocabulary-fsrs-rush/browser-results',
  use:{baseURL:'http://127.0.0.1:4403/kana-study/',channel:'msedge',trace:'retain-on-failure'},
  projects:[
    {name:'desktop-es-dark',use:{viewport:{width:1280,height:900},colorScheme:'dark'}},
    {name:'mobile-en-light',use:{viewport:{width:390,height:844},colorScheme:'light'}},
    {name:'narrow-ca-dark',use:{viewport:{width:320,height:800},colorScheme:'dark'}},
  ],
  webServer:{command:'node scripts/serve-kaishi-auto-preview.mjs',url:'http://127.0.0.1:4403/kana-study/',reuseExistingServer:false,timeout:30000},
});

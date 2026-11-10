import {defineConfig} from '@playwright/test';
import base from './playwright.kanji-k1.config';

export default defineConfig({
  ...base,
  testDir:'./manual-tests/kanji-k2',
  outputDir:'.cache/kanji-k2/browser-results',
  projects:[
    {name:'desktop-es-dark',use:{viewport:{width:1280,height:720},colorScheme:'dark'}},
    {name:'narrow-en-light',use:{viewport:{width:320,height:800},colorScheme:'light'}},
    {name:'mobile-ca-dark',use:{viewport:{width:390,height:844},colorScheme:'dark'}},
  ],
  use:{...base.use,baseURL:'http://127.0.0.1:4425/'},
  webServer:{command:'npm run start -- --host 127.0.0.1 --port 4425 --live-reload false --hmr false',url:'http://127.0.0.1:4425/',reuseExistingServer:false,timeout:120000},
});

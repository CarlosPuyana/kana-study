import {defineConfig} from '@playwright/test';

const chromium={browserName:'chromium' as const,...(process.env['PLAYWRIGHT_CHANNEL']?{channel:process.env['PLAYWRIGHT_CHANNEL']}:{})};
export default defineConfig({
  testDir:'./e2e',testMatch:['grammar-stability.spec.ts','grammar-access.spec.ts'],fullyParallel:true,workers:2,retries:0,
  timeout:60000,expect:{timeout:10000},reporter:'list',
  use:{baseURL:'http://127.0.0.1:4417',trace:'retain-on-failure'},
  projects:[
    {name:'desktop-dark',use:{...chromium,viewport:{width:1280,height:900},colorScheme:'dark'}},
    {name:'mobile-light',use:{...chromium,viewport:{width:390,height:844},colorScheme:'light'}},
    {name:'webkit-mobile-light',use:{browserName:'webkit',viewport:{width:390,height:844},colorScheme:'light',hasTouch:true}},
  ],
  webServer:{command:'npm run start -- --host 127.0.0.1 --port 4417',url:'http://127.0.0.1:4417',reuseExistingServer:false,timeout:120000},
});

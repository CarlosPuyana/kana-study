import {defineConfig} from '@playwright/test';
export default defineConfig({
  testDir:'./e2e', fullyParallel:true, workers:2, retries:0,
  timeout:45000, expect:{timeout:10000}, reporter:'list',
  use:{baseURL:'http://127.0.0.1:4400',trace:'retain-on-failure'},
  projects:[
    {name:'desktop-dark',use:{browserName:'chromium',viewport:{width:1280,height:900},colorScheme:'dark'}},
    {name:'mobile-light',use:{browserName:'chromium',viewport:{width:390,height:844},colorScheme:'light'}},
    {name:'narrow-dark',use:{browserName:'chromium',viewport:{width:320,height:800},colorScheme:'dark'}},
  ],
  webServer:{command:'npm run start -- --host 127.0.0.1 --port 4400',url:'http://127.0.0.1:4400',reuseExistingServer:false,timeout:120000},
});

import {defineConfig} from '@playwright/test';
export default defineConfig({
 testDir:'./manual-tests/rush-shortcuts',fullyParallel:true,workers:2,retries:0,timeout:60000,expect:{timeout:12000},reporter:'list',
 use:{baseURL:'http://127.0.0.1:4403/kana-study/',trace:'retain-on-failure'},
 projects:[
  {name:'desktop-es-dark',use:{browserName:'chromium',viewport:{width:1280,height:900}}},
  {name:'mobile-en-light',use:{browserName:'chromium',viewport:{width:390,height:844},hasTouch:true}},
  {name:'narrow-ca-nora',use:{browserName:'chromium',viewport:{width:320,height:568},hasTouch:true}},
 ],webServer:{command:'node scripts/serve-kaishi-auto-preview.mjs',url:'http://127.0.0.1:4403/kana-study/',reuseExistingServer:false,timeout:30000},
});

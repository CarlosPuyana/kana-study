import {defineConfig} from '@playwright/test';
export default defineConfig({
 testDir:'./manual-tests/mazos-roadmap',fullyParallel:true,workers:2,retries:0,timeout:60000,expect:{timeout:12000},reporter:'list',
 use:{baseURL:'http://127.0.0.1:4403/kana-study/',trace:'retain-on-failure'},
 projects:[
  {name:'desktop-ca-nora-dark',use:{browserName:'chromium',viewport:{width:1280,height:900}}},
  {name:'desktop-es-dark',use:{browserName:'chromium',viewport:{width:1280,height:900}}},
  {name:'laptop-en-light',use:{browserName:'chromium',viewport:{width:1280,height:720}}},
  {name:'mobile-es-light',use:{browserName:'chromium',viewport:{width:390,height:844}}},
  {name:'small-ca-nora',use:{browserName:'chromium',viewport:{width:360,height:640}}},
  {name:'narrow-es-anime',use:{browserName:'chromium',viewport:{width:320,height:568}}},
 ],webServer:{command:'node scripts/serve-kaishi-auto-preview.mjs',url:'http://127.0.0.1:4403/kana-study/',reuseExistingServer:false,timeout:30000},
});

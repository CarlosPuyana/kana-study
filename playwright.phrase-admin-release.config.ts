import {defineConfig} from '@playwright/test';
// Uses an explicitly prepared private release, never the source/public catalog.
const release=process.env['PHRASE_ADMIN_RELEASE']??'i62-demo37-final';
if(!/^[a-z0-9][a-z0-9_-]{0,79}$/.test(release))throw Error('Invalid private release name');
export default defineConfig({testDir:'./manual-tests/phrase-admin-release',outputDir:'.cache/phrase-islands-i62/release-browser-results',workers:1,retries:0,timeout:60000,expect:{timeout:12000},use:{baseURL:'http://127.0.0.1:4413/kana-study/',channel:'msedge',trace:'retain-on-failure'},projects:[{name:'desktop-dark',use:{viewport:{width:1280,height:1000},colorScheme:'dark'}},{name:'mobile-light',use:{viewport:{width:390,height:844},colorScheme:'light'}}],webServer:{command:`node scripts/phrase-islands-admin.mjs preview --release ${release} --demo --port 4413`,url:'http://127.0.0.1:4413/kana-study/',reuseExistingServer:true,timeout:180000}});

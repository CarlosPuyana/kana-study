import {defineConfig} from '@playwright/test';
export default defineConfig({testDir:'./manual-tests/vocabulary-compact',testMatch:'compact.spec.ts',workers:1,retries:0,timeout:60000,expect:{timeout:12000},reporter:'list',outputDir:'.cache/vocabulary-compact/results',use:{baseURL:'http://127.0.0.1:4404/',channel:'msedge',trace:'retain-on-failure'},projects:[
 {name:'desktop-1920',use:{viewport:{width:1920,height:1080},colorScheme:'dark'}},
 {name:'desktop-1536',use:{viewport:{width:1536,height:864},colorScheme:'light'}},
 {name:'desktop-1366',use:{viewport:{width:1366,height:768},colorScheme:'dark'}},
 {name:'desktop-1280',use:{viewport:{width:1280,height:720},colorScheme:'light'}},
 {name:'mobile-390',use:{viewport:{width:390,height:844},colorScheme:'light'}},
 {name:'mobile-375',use:{viewport:{width:375,height:812},colorScheme:'dark'}},
 {name:'mobile-320',use:{viewport:{width:320,height:800},colorScheme:'dark'}},
 {name:'zoom-125',testMatch:'zoom.spec.ts'},
 ],webServer:{command:'npm run start -- --host 127.0.0.1 --port 4404',url:'http://127.0.0.1:4404',reuseExistingServer:true,timeout:120000}});

import {defineConfig} from '@playwright/test';
import base from './playwright.conjugations-adjectives.config';
export default defineConfig({...base,testMatch:['conjugations.spec.ts','adjectives.spec.ts','verbs.spec.ts'],outputDir:'.cache/conjugations-phase3/browser-results',use:{...base.use,baseURL:'http://127.0.0.1:4414/'},webServer:{command:'npm run start -- --host 127.0.0.1 --port 4414',url:'http://127.0.0.1:4414/',reuseExistingServer:false,timeout:120000}});

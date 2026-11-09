import {defineConfig} from '@playwright/test';
import base from './playwright.conjugations.config';
export default defineConfig({...base,testMatch:['conjugations.spec.ts','adjectives.spec.ts'],outputDir:'.cache/conjugations-phase2/browser-results',projects:[...base.projects!,{name:'round-completion',testMatch:'round.spec.ts',use:{viewport:{width:1280,height:720},colorScheme:'dark'}}]});

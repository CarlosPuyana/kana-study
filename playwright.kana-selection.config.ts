import base from './playwright.vocabulary-compact.config';import {defineConfig} from '@playwright/test';
export default defineConfig({...base,testMatch:'kana-selection.spec.ts',outputDir:'.cache/vocabulary-compact/kana-selection',projects:base.projects!.filter(p=>['desktop-1366','mobile-390','mobile-320'].includes(p.name!))});

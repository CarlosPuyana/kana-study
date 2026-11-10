import {defineConfig} from '@playwright/test';
import base from './playwright.kanji-k2.config';

export default defineConfig({
  ...base,
  testDir:'./manual-tests/kanji-k3',
  outputDir:'.cache/kanji-k3/browser-results',
  projects:[320,390,1280].flatMap(width=>(['light','dark'] as const).map(colorScheme=>({
    name:`${width}-${width===320?'en':width===390?'ca':'es'}-${colorScheme}`,
    use:{viewport:{width,height:width===1280?720:width===390?844:800},colorScheme},
  }))),
});

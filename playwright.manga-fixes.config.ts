import {defineConfig} from '@playwright/test';
import base from './playwright.manga-library.config';
export default defineConfig({...base,projects:base.projects?.map(p=>({...p,use:{...p.use,hasTouch:(p.use?.viewport?.width??1280)<600}})),testDir:'./manual-tests/manga-fixes',outputDir:'.cache/manga-fixes-browser'});

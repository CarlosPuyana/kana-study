import {Page} from '@playwright/test';
export const language=(name:string)=>name.includes('-en-')?'en':name.includes('-ca-')?'ca':'es';
export async function configure(page:Page,name:string){
 await page.route('**/supabase-config.js',r=>r.fulfill({contentType:'text/javascript',body:'window.__KANA_STUDY_CONFIG__={};'}));await page.route('**/*.supabase.co/**',r=>r.abort());
 await page.addInitScript(({language,theme})=>{if(localStorage.getItem('qa-conjugations'))return;localStorage.setItem('qa-conjugations','1');localStorage.setItem('kana-study.settings.v1',JSON.stringify({language,theme}));localStorage.setItem('kana-study.rush.kana-settings.v1',JSON.stringify({questionTypes:['kana-to-romaji'],selectedContentIds:['hiragana:basic']}));},{language:language(name),theme:name.endsWith('light')?'light':'dark'});
}
export async function protectedState(page:Page){return page.evaluate(()=>Object.fromEntries(Object.entries(localStorage).filter(([key])=>key!=='kana-study.workspace.active.v1'&&!key.endsWith('kana-study.conjugation-selection.v1'))));}
export async function geometry(page:Page){return page.evaluate(()=>{
 const cards=[...document.querySelectorAll('.category-card')].map(e=>{const r=e.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height}});
 return {width:innerWidth,height:innerHeight,scrollWidth:document.documentElement.scrollWidth,scrollHeight:document.documentElement.scrollHeight,cards};
});}

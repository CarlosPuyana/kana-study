import {Page,expect} from '@playwright/test';
import {VOCABULARY_N5} from '../../src/app/data/vocabulary-n5.generated';
import {VocabularyQuestionType,VOCABULARY_CATEGORIES} from '../../src/app/core/models/vocabulary.model';
export const target=VOCABULARY_N5.find(e=>e.primaryWrittenForm==='毎月')!;
export const directions=['japanese-to-meaning','meaning-to-japanese','japanese-to-reading','reading-to-japanese'] as const;
export async function setup(page:Page,direction:VocabularyQuestionType,theme='dark',quick=false){
 await page.route('**/supabase-config.js',r=>r.fulfill({contentType:'text/javascript',body:'window.__KANA_STUDY_CONFIG__={};'}));await page.route('**/*.supabase.co/**',r=>r.abort());await page.clock.setFixedTime(new Date('2026-11-08T11:00:00Z'));
 await page.addInitScript(({ids,id,direction,theme,categories})=>{
  if(localStorage.getItem('qa-compact'))return;localStorage.setItem('qa-compact','1');localStorage.setItem('kana-study.settings.v1',JSON.stringify({language:'es',theme}));
  localStorage.setItem('kana-study.vocabulary-selection.v1',JSON.stringify({lessonSize:10,levels:{N5:true},categories:Object.fromEntries(categories.map(c=>[c,true])),questionTypes:[direction]}));
  const rows:Record<string,unknown>={};for(const entryId of ids){const key=`vocab:${entryId}:${direction}`;rows[key]={key,entryId,questionType:direction,fsrs:{due:entryId===id?'2026-11-08T10:00:00Z':'2026-12-01T11:00:00Z',lastReview:'2026-11-01T11:00:00Z',stability:30,difficulty:5,elapsedDays:7,scheduledDays:7,learningSteps:0,reps:10,lapses:0,state:'review'},firstSeenAt:'2026-11-01T11:00:00Z',lastSeenAt:'2026-11-01T11:00:00Z',totalAttempts:10,totalFirstTrySuccesses:10,totalFailures:0,lastRating:'good'};}localStorage.setItem('kana-study.vocabulary-progress.v1',JSON.stringify(rows));
 },{ids:VOCABULARY_N5.map(e=>e.id),id:target.id,direction,theme,categories:VOCABULARY_CATEGORIES});
 await page.goto('./#/vocabulary');await page.locator('.play-button').click();await page.locator(quick?'.mode.start':'.secondary-start').click();await expect(page.locator('.exercise')).toBeVisible();
}
export async function measure(page:Page){return page.evaluate(()=>{const box=(s:string)=>{const b=document.querySelector(s)!.getBoundingClientRect();return {top:b.top,bottom:b.bottom,height:b.height,width:b.width}};return {width:innerWidth,height:innerHeight,scrollHeight:document.documentElement.scrollHeight,scrollWidth:document.documentElement.scrollWidth,scrollY,prompt:box('.meaning-prompt'),answer:box('.answer'),ratings:box('.ratings'),scrollNeeded:Math.max(0,document.querySelector('.ratings')!.getBoundingClientRect().bottom-innerHeight)}});}

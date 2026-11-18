import {topicCount} from './catalog-fixture';
import { expect, Page, test } from '@playwright/test';

test.beforeEach(async({page})=>{
 await page.route('**/supabase-config.js',r=>r.fulfill({contentType:'text/javascript',body:'window.__KANA_STUDY_CONFIG__={};'}));
 await page.route('**/*.supabase.co/**',r=>r.abort());
 await page.addInitScript(()=>{if(!localStorage.getItem('kana-study.settings.v1'))localStorage.setItem('kana-study.settings.v1',JSON.stringify({language:'es',theme:matchMedia('(prefers-color-scheme: light)').matches?'light':'dark'}));});
});
async function reveal(page:Page){await page.locator('.reveal').click();await expect(page.locator('.grade-known')).toBeVisible();}
async function metric(page:Page,name:string,value:string){await expect(page.locator(`[data-metric=${name}]`)).toHaveText(value);}
async function noOverflow(page:Page){expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);}

test('RUSH buttons, undo, navigation and explicit rounds use only real unique answers',async({page},info)=>{
 await page.goto('./#/anki/islands/recall?topics=everyday,conversation');
 await expect(page.locator('.grade-actions')).toHaveCount(0);await expect(page.locator('ruby')).toHaveCount(0);
 await page.screenshot({path:`.cache/phrase-islands-i5/hidden-${info.project.name}.png`,fullPage:true});
 await reveal(page);await expect(page.locator('.grade-actions')).toBeInViewport();
 await page.screenshot({path:`.cache/phrase-islands-i5/revealed-${info.project.name}.png`,fullPage:true});
 const first=page.locator('.grade-unknown');await first.evaluate((b:HTMLButtonElement)=>{b.click();b.click();});
 await expect(page.locator('.recall-round')).toContainText('1 / '+topicCount('everyday','conversation')+' evaluadas');
 await page.getByRole('button',{name:'Anterior',exact:true}).click();await reveal(page);await expect(page.locator('.grade-known')).toBeDisabled();
 await page.locator('.session-navigation .undo').click();await expect(page.locator('.grade-known')).toBeEnabled();await expect(page.locator('.recall-round')).toContainText('0 / '+topicCount('everyday','conversation')+' evaluadas');
 await page.locator('.grade-unknown').click();
 for(let n=0;n<topicCount('everyday','conversation')-1;n++){await reveal(page);await page.locator('.grade-known').click();}
 await expect(page.locator('.round-summary')).toBeVisible();await metric(page,'total',String(topicCount('everyday','conversation')));await metric(page,'correct',String(topicCount('everyday','conversation')-1));await metric(page,'failed','1');await metric(page,'percent',Math.round(100*(topicCount('everyday','conversation')-1)/topicCount('everyday','conversation'))+'%');
 await page.screenshot({path:`.cache/phrase-islands-i5/summary-${info.project.name}.png`,fullPage:true});await noOverflow(page);
 await page.locator('.repeat-failed').click();await expect(page.locator('.recall-round')).toContainText('Ronda 2');await expect(page.locator('.progress')).toContainText('1 / 1');await expect(page.locator('ruby')).toHaveCount(0);
 await reveal(page);await page.locator('.grade-unknown').click();await metric(page,'failed','1');await metric(page,'percent','0%');
 await page.locator('.repeat-failed').click();await expect(page.locator('.recall-round')).toContainText('Ronda 3');await reveal(page);await page.locator('.grade-known').click();await metric(page,'correct','1');await metric(page,'percent','100%');await expect(page.locator('.repeat-failed')).toHaveCount(0);
 await page.locator('.round-summary .undo').click();await expect(page.locator('.grade-known')).toBeEnabled();await expect(page.locator('.recall-round')).toContainText('0 / 1 evaluadas');
 await page.locator('.grade-known').click();await page.getByRole('button',{name:'Finalizar',exact:true}).click();await expect(page.locator('.round-summary')).toHaveCount(0);
 await page.locator('.session-back').click();await expect(page.locator('.topic-card[aria-pressed=true]')).toHaveCount(2);
});

test('RUSH keyboard protects hidden answers and native controls, ignores held arrows',async({page})=>{
 await page.goto('./#/anki/islands/recall?topics=shopping');await page.keyboard.press('ArrowLeft');await expect(page.locator('.recall-round')).toContainText('0 / '+topicCount('shopping')+' evaluadas');
 await reveal(page);await page.locator('.session-settings summary').click();await page.getByLabel('Velocidad').focus();await page.keyboard.press('ArrowRight');await expect(page.locator('.recall-round')).toContainText('0 / '+topicCount('shopping')+' evaluadas');
 await page.locator('.task-label').click();await page.keyboard.down('ArrowRight');await expect(page.locator('.recall-round')).toContainText('1 / '+topicCount('shopping')+' evaluadas');
 await reveal(page);await page.keyboard.down('ArrowRight');await expect(page.locator('.recall-round')).toContainText('1 / '+topicCount('shopping')+' evaluadas');await page.keyboard.up('ArrowRight');
 await page.keyboard.press('ArrowLeft');await expect(page.locator('.recall-round')).toContainText('2 / '+topicCount('shopping')+' evaluadas');
 await page.locator('.undo').click();await expect(page.locator('.recall-round')).toContainText('1 / '+topicCount('shopping')+' evaluadas');await expect(page.locator('.grade-known')).toBeEnabled();
});

test('RUSH browser-native touch gestures distinguish horizontal intent from scrolling',async({page})=>{
 const cdp=await page.context().newCDPSession(page);await cdp.send('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:2});
 async function swipe(dx:number,dy:number,hidden=false){
  const target=page.locator(hidden?'.prompt':'.japanese h2');await target.scrollIntoViewIfNeeded();const box=(await target.boundingBox())!;const x=box.x+box.width/2,y=box.y+box.height/2;
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y,id:1}]});
  for(let step=1;step<=6;step++){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+dx*step/6,y:y+dy*step/6,id:1}]});await page.waitForTimeout(20);}
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 }
 await page.goto('./#/anki/islands/recall?topics=everyday');await swipe(100,0,true);await expect(page.locator('.recall-round')).toContainText('0 / '+topicCount('everyday')+' evaluadas');
 await reveal(page);await swipe(-100,2);await expect(page.locator('.recall-round')).toContainText('1 / '+topicCount('everyday')+' evaluadas');await expect(page.locator('ruby')).toHaveCount(0);
 await reveal(page);await swipe(5,130);await expect(page.locator('.recall-round')).toContainText('1 / '+topicCount('everyday')+' evaluadas');await swipe(30,1);await expect(page.locator('.recall-round')).toContainText('1 / '+topicCount('everyday')+' evaluadas');await swipe(85,75);await expect(page.locator('.recall-round')).toContainText('1 / '+topicCount('everyday')+' evaluadas');
 await swipe(100,3);await expect(page.locator('.recall-round')).toContainText('2 / '+topicCount('everyday')+' evaluadas');await page.locator('.undo').click();await expect(page.locator('.answer-status')).toHaveText('Sin evaluar');await noOverflow(page);
});

test('RUSH permits textual grading through audio failure and writes no study state',async({page})=>{
 await page.addInitScript(()=>{const Native=window.Audio;(window as any).rushAudios=[];window.Audio=function(){const a=new Native();(window as any).rushAudios.push(a);return a;} as typeof Audio;});
 await page.goto('./#/anki/islands/recall?topics=everyday');await page.evaluate(()=>{(window as any).rushWrites=[];const set=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){(window as any).rushWrites.push(k);set.call(this,k,v);};(window as any).rushOpens=0;const open=indexedDB.open.bind(indexedDB);indexedDB.open=(...args)=>{(window as any).rushOpens++;return open(...args);};});
 await reveal(page);await page.route('**/audio/phrase-islands/v1/*.mp3',r=>r.fulfill({status:404,body:''}));await page.locator('.play').click();await expect(page.locator('.audio-status')).toContainText('Audio no disponible');await expect(page.locator('.recall-round')).toContainText('0 / '+topicCount('everyday')+' evaluadas');
 await page.locator('.grade-known').click();await reveal(page);await page.unroute('**/audio/phrase-islands/v1/*.mp3');await page.locator('.play').click();await expect(page.locator('.audio-status')).toHaveText('Reproduciendo');
 await page.locator('.grade-unknown').click();expect(await page.evaluate(()=>(window as any).rushAudios.every((a:HTMLAudioElement)=>a.paused))).toBe(true);await page.locator('.undo').click();await expect(page.locator('.recall-round')).toContainText('1 / '+topicCount('everyday')+' evaluadas');
 expect(await page.evaluate(()=>({writes:(window as any).rushWrites,opens:(window as any).rushOpens}))).toEqual({writes:[],opens:0});
 await page.locator('.session-back').click();await page.locator('.mode-card').nth(2).click();await expect(page.locator('.recall-round')).toContainText('0 / '+topicCount('everyday')+' evaluadas');await expect(page.locator('ruby')).toHaveCount(0);
});

test('RUSH labels and results are localized in ES EN CA',async({page})=>{
 for(const [lang,known,unknown,title] of [['es','La sabía','No la sabía','Resumen de ronda'],['en','I knew it','I didn’t know it','Round summary'],['ca','La sabia','No la sabia','Resum de ronda']]){
  await page.goto('./#/anki/islands');await page.evaluate(language=>{const key='kana-study.settings.v1';localStorage.setItem(key,JSON.stringify({...JSON.parse(localStorage.getItem(key)!),language}));},lang);
  await page.goto('./#/anki/islands/recall?topics=hobbies');await page.reload();
  for(let i=0;i<topicCount('hobbies');i++){await page.locator('.reveal').click();await expect(page.getByRole('button',{name:unknown,exact:true})).toBeVisible();await page.getByRole('button',{name:known,exact:true}).click();}
  await expect(page.locator('.round-summary h2')).toHaveText(title);await metric(page,'correct',String(topicCount('hobbies')));await expect(page.locator('.repeat-failed')).toHaveCount(0);await expect(page.locator('main')).not.toContainText('phraseIslands.');
 }
});

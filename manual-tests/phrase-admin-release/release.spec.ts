import {expect,test} from '@playwright/test';
import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';
const name=process.env['PHRASE_ADMIN_RELEASE']??'i62-demo37-final';
const folder=path.resolve('.phrase-islands-authoring/releases',name);
const load=(relative:string)=>JSON.parse(fs.readFileSync(path.join(folder,'candidate',relative),'utf8'));
const content=load('src/app/data/phrase-islands/phrases.v1.json');
const baseline=JSON.parse(fs.readFileSync('src/app/data/phrase-islands/phrases.v1.json','utf8'));
const added=content.phrases.filter((p:any)=>!baseline.phrases.some((b:any)=>b.id===p.id));
if(added.length!==1)throw Error('This demonstration requires one newly prepared phrase');
const phrase=added[0],topic=phrase.topicId,topicPhrases=content.phrases.filter((p:any)=>p.topicId===topic);
const audio=load('src/app/data/phrase-islands/audio.v1.json')[phrase.id];
test.beforeEach(async({page})=>{
 await page.route('**/*.supabase.co/**',r=>r.abort());
 await page.addInitScript(()=>{localStorage.setItem('kana-study.settings.v1',JSON.stringify({language:'es',theme:matchMedia('(prefers-color-scheme: light)').matches?'light':'dark'}));const Native=window.Audio;(window as any).releaseAudios=[];window.Audio=function(){const a=new Native();(window as any).releaseAudios.push(a);return a;} as typeof Audio;});
});
test('prepared catalog updates counts and Explore; actual new MP3 plays; unpublished draft stays absent',async({page},info)=>{
 expect(baseline.phrases).toHaveLength(36);expect(content.phrases).toHaveLength(37);
 for(const original of baseline.phrases)expect(content.phrases.find((p:any)=>p.id===original.id)).toEqual(original);
 await page.goto('./#/anki/islands');const topics=page.locator('.topic-card');await expect(topics).toHaveCount(6);
 await expect(topics.locator('.phrase-count')).toHaveText(['everyday','conversation','work','shopping','travel','hobbies'].map(id=>content.phrases.filter((p:any)=>p.topicId===id).length+' frases'));
 await expect(page.locator('a[href*="admin"]')).toHaveCount(0);await topics.first().click();await page.locator('.explore-link').click();
 await expect(page.locator('.phrase-entry')).toHaveCount(topicPhrases.length);const row=page.locator(`[data-phrase-id="${phrase.id}"]`);await expect(row).toBeVisible();await expect(row.locator('.phrase-reading')).toHaveText(phrase.reading);
 const responsePromise=page.waitForResponse(r=>r.url().endsWith('/'+audio.path)&&r.status()===200);await row.locator('button').first().click();const response=await responsePromise;
 expect(crypto.createHash('sha256').update(await response.body()).digest('hex')).toBe(audio.sha256);
 await expect.poll(()=>page.evaluate(()=>(window as any).releaseAudios.some((a:HTMLAudioElement)=>!a.paused&&a.currentTime>0))).toBe(true);
 await row.getByRole('button',{name:'Detener',exact:true}).click();await row.screenshot({path:`.cache/phrase-islands-i62/release37-explore-${info.project.name}.png`});
 const demonstration=JSON.parse(fs.readFileSync('.phrase-islands-authoring/demonstration/results.json','utf8'));await expect(page.locator(`[data-phrase-id="${demonstration.unpublishedId}"]`)).toHaveCount(0);
});
test('new phrase belongs to all three real sessions and RUSH evaluates the expanded topic',async({page},info)=>{
 for(const mode of ['listen','shadowing','recall']){
  await page.goto(`./#/anki/islands/${mode}?topics=${topic}`);await expect(page.locator('.progress')).toContainText('/ '+topicPhrases.length);
  if(mode==='recall'){
   for(let n=0;n<topicPhrases.length;n++){await page.locator('.reveal').click();if(n===topicPhrases.length-1){await expect(page.locator('.reading')).toHaveText(phrase.reading);await page.locator('.play').click();await expect.poll(()=>page.evaluate(()=>(window as any).releaseAudios.some((a:HTMLAudioElement)=>!a.paused))).toBe(true);await page.screenshot({path:`.cache/phrase-islands-i62/release37-recall-${info.project.name}.png`,fullPage:true});}await page.locator(n===0?'.grade-unknown':'.grade-known').click();}
   await expect(page.locator('.round-summary')).toBeVisible();await expect(page.locator('[data-metric=total]')).toHaveText(String(topicPhrases.length));await expect(page.locator('[data-metric=failed]')).toHaveText('1');await page.locator('.repeat-failed').click();await expect(page.locator('.progress')).toContainText('/ 1');await page.locator('.reveal').click();await page.locator('.grade-known').click();await expect(page.locator('[data-metric=percent]')).toHaveText('100%');
  }else{
   for(let n=1;n<topicPhrases.length;n++)await page.locator('.session-navigation .next').click();await expect(page.locator('.reading')).toHaveText(phrase.reading);await page.locator('.play').click();await expect.poll(()=>page.evaluate(()=>(window as any).releaseAudios.some((a:HTMLAudioElement)=>!a.paused))).toBe(true);await page.locator('.stop').click();
  }
 }
});

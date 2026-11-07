import {test,expect,Page} from '@playwright/test';
import {VOCABULARY_N5} from '../../src/app/data/vocabulary-n5.generated';
import fs from 'node:fs';
const NOW=new Date('2026-11-06T11:00:00Z'),words=VOCABULARY_N5.filter(e=>e.enabled).slice(0,3);
const language=(name:string)=>name.includes('-en-')?'en':name.includes('-ca-')?'ca':'es';
const copy=(name:string)=>JSON.parse(fs.readFileSync(`src/assets/i18n/${language(name)}.json`,'utf8'));
test.beforeEach(async({page},info)=>{
  await page.route('**/supabase-config.js',r=>r.fulfill({contentType:'text/javascript',body:'window.__KANA_STUDY_CONFIG__={};'}));
  await page.route('**/*.supabase.co/**',r=>r.abort());await page.clock.setFixedTime(NOW);
  await page.addInitScript(({entries,selected,lang,theme,now})=>{
    if(localStorage.getItem('qa-vocabulary-seeded'))return;localStorage.setItem('qa-vocabulary-seeded','1');
    localStorage.setItem('kana-study.settings.v1',JSON.stringify({language:lang,theme}));
    const progress:Record<string,unknown>={};
    for(const entry of entries){const key=`vocab:${entry.id}:japanese-to-meaning`,index=selected.indexOf(entry.id);
      const due=index<0?'2026-11-07T11:00:00.000Z':`2026-11-06T${['11','12','18'][index]}:00:00.000Z`;
      progress[key]={key,entryId:entry.id,questionType:'japanese-to-meaning',fsrs:{due,stability:30,difficulty:5,elapsedDays:30,scheduledDays:30,learningSteps:0,reps:10,lapses:1,state:'review',lastReview:'2026-10-07T11:00:00.000Z'},firstSeenAt:now,lastSeenAt:now,totalAttempts:10,totalFirstTrySuccesses:9,totalFailures:1,lastRating:'good'};
    }
    localStorage.setItem('kana-study.vocabulary-progress.v1',JSON.stringify(progress));
  },{entries:VOCABULARY_N5.filter(e=>e.enabled).map(e=>({id:e.id})),selected:words.map(e=>e.id),lang:language(info.project.name),theme:info.project.use.colorScheme==='light'?'light':'dark',now:NOW.toISOString()});
  await page.goto('./#/vocabulary');await expect(page.locator('app-vocabulary-page .play-button')).toBeEnabled();
});
async function start(page:Page){await page.locator('.play-button').click();await page.locator('.secondary-start').click();await expect(page.locator('.exercise')).toBeVisible();}
async function rate(page:Page,rating:'again'|'hard'|'good'){
  await page.locator('.reveal').click();await page.locator('.ratings .'+({again:'no',hard:'hard',good:'yes'}[rating])).click();
}
const events=(page:Page)=>page.evaluate(()=>JSON.parse(localStorage.getItem('kana-study.vocabulary-review-events.v1')??'[]'));
async function closeMedals(page:Page){for(let n=0;n<30&&await page.locator('.medal-dialog').count();n++)await page.locator('.medal-dialog .primary').click();}
async function finishGood(page:Page){for(let n=0;n<12&&await page.locator('.exercise').count();n++)await rate(page,'good');await closeMedals(page);await expect(page.locator('.session-rush')).toBeVisible();}
async function oneRushCard(page:Page){await expect(page.locator('.rush-shell')).toBeVisible();for(let n=0;n<30&&await page.locator('.medal-toast button').count();n++)await page.locator('.medal-toast button').click();await page.locator('.rush-shell .action').click();await expect(page.locator('.answer')).toBeVisible();await page.locator('.rush-shell .action').click();await expect(page.locator('.counter')).toContainText('1');}

test('one real rating per word, all-session/difficult RUSH and return preserve memory',async({page},info)=>{
  const c=copy(info.project.name);await start(page);await rate(page,'again');await rate(page,'hard');await rate(page,'good');await finishGood(page);await expect(page.locator('.session-rush')).toBeVisible();
  const saved=await events(page);expect(saved.slice(0,3).map((e:any)=>e.entryId)).toEqual(words.map(w=>w.id));
  const first=saved.filter((e:any)=>e.entryId===words[0].id);expect(saved.map((e:any)=>e.rating)).toEqual(['again','hard','good']);expect(first).toHaveLength(1);expect(saved).toHaveLength(3);
  for(let n=1;n<first.length;n++)expect(first[n].fsrsBefore).toEqual(first[n-1].fsrsAfter);
  expect(new Set(saved.map((e:any)=>e.id)).size).toBe(saved.length);
  await page.screenshot({path:`.cache/vocabulary-fsrs-rush/results-${info.project.name}.png`,fullPage:true});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
  const before=await page.evaluate(()=>[localStorage.getItem('kana-study.vocabulary-progress.v1'),localStorage.getItem('kana-study.vocabulary-review-events.v1')]);
  await page.getByRole('button',{name:c['vocabulary.daily.rushAll'],exact:true}).focus();await expect(page.getByRole('button',{name:c['vocabulary.daily.rushAll'],exact:true})).toBeFocused();
  await page.keyboard.press('Enter');await oneRushCard(page);await page.locator('.rush-header .back').click();await expect(page.locator('.summary')).toBeVisible();
  await page.locator('.summary .action').click();await expect(page.locator('.session-rush')).toBeVisible();
  await page.getByRole('button',{name:c['vocabulary.daily.rushDifficult'],exact:true}).click();await expect(page.locator('.rush-shell .question')).toContainText(new RegExp(words.slice(0,2).map(w=>w.primaryWrittenForm).join('|')));
  await oneRushCard(page);await page.locator('.rush-header .back').click();await page.locator('.summary .action').click();await expect(page.locator('.session-rush')).toBeVisible();
  expect(await page.evaluate(()=>[localStorage.getItem('kana-study.vocabulary-progress.v1'),localStorage.getItem('kana-study.vocabulary-review-events.v1')])).toEqual(before);
});
test('reload reconstructs pending later-today work without adding a review',async({page})=>{
  await start(page);await rate(page,'again');const before=await events(page);await page.reload();await expect(page.locator('.exercise')).toBeVisible();expect(await events(page)).toEqual(before);await expect(page.locator('.lesson-progress')).toHaveText('0/3');await expect(page.locator('.queue-help')).toHaveCount(0);
});
test('a failed canonical write is visible and Retry keeps one answer and event',async({page},info)=>{
  await start(page);await page.evaluate(()=>{const original=Storage.prototype.setItem;let fail=true;Storage.prototype.setItem=function(key,value){if(fail&&key==='kana-study.vocabulary-review-events.v1')throw new DOMException('quota','QuotaExceededError');return original.call(this,key,value);};(window as any).restoreVocabularyStorage=()=>{fail=false;};});
  await rate(page,'again');await expect(page.locator('.save-error')).toBeVisible();expect(await events(page)).toHaveLength(0);await page.evaluate(()=>(window as any).restoreVocabularyStorage());await page.getByRole('button',{name:copy(info.project.name)['vocabulary.daily.retry'],exact:true}).click();await expect(page.locator('.save-error')).toHaveCount(0);expect(await events(page)).toHaveLength(1);
});
test('Good-only sessions show an explicit empty difficult state',async({page},info)=>{
  const c=copy(info.project.name);await start(page);await finishGood(page);await expect(page.getByRole('button',{name:c['vocabulary.daily.rushAll'],exact:true})).toBeVisible();await expect(page.getByRole('button',{name:c['vocabulary.daily.rushDifficult'],exact:true})).toHaveCount(0);await expect(page.locator('.session-rush')).toContainText(c['vocabulary.daily.noDifficult']);
});
test('forged or reloaded handoffs never substitute general vocabulary',async({page})=>{
  await page.goto('./#/vocabulary/rush?sessionRush=forged');await expect(page.locator('app-vocabulary-page')).toBeVisible();await expect(page.locator('.rush-shell')).toHaveCount(0);
});

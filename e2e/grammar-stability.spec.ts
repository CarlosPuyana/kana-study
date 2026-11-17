import {test,expect} from '@playwright/test';
import {grammarAccount,grammarStoragePrefix} from './grammar-access.fixture';

test('the 60-second access revalidation preserves the visible lesson and reading position',async({page})=>{
  await grammarAccount(page);
  await page.clock.install();
  await page.goto('/#/grammar/n5/01/sentence-structure-context');
  const lesson=page.locator('.lesson-heading-card');
  await expect(lesson).toBeVisible();
  await page.evaluate(()=>{window.scrollTo(0,900);(window as any).__lesson=document.querySelector('app-grammar-page');});
  const scroll=await page.evaluate(()=>scrollY);
  let release!:()=>void;
  const delayed=new Promise<void>(resolve=>release=resolve);
  let requests=0;
  await page.route('**/rest/v1/grammar_beta_access*',async route=>{
    requests++;await delayed;await route.fulfill({json:{enabled:true}});
  });
  await page.clock.fastForward(60_000);
  await expect.poll(()=>requests).toBe(1);
  try {
    await expect(lesson).toBeVisible();
    expect(await page.evaluate(()=>scrollY)).toBe(scroll);
    expect(await page.evaluate(()=>(window as any).__lesson===document.querySelector('app-grammar-page'))).toBe(true);
  } finally {release();}
});

for(const language of ['es','en','ca'])test(`${language}: long study, foreground, offline recovery and SDK token refresh keep answers and position`,async({page,context},info)=>{
  const permission=await grammarAccount(page);
  const theme=info.project.use.colorScheme==='light'?'light':'dark';
  await page.addInitScript(({prefix,language,theme})=>{
    localStorage.setItem(prefix+'kana-study.settings.v1',JSON.stringify({language,theme}));
  },{prefix:grammarStoragePrefix,language,theme});
  let refreshes=0;
  await page.route('**/auth/v1/token*',async route=>{
    refreshes++;
    const session=await page.evaluate(()=>JSON.parse(localStorage.getItem('sb-grammar-beta-fixture-auth-token')!));
    const now=await page.evaluate(()=>Math.floor(Date.now()/1000));
    await route.fulfill({json:{...session,expires_at:now+3600,expires_in:3600}});
  });
  let navigations=0;page.on('framenavigated',frame=>{if(frame===page.mainFrame())navigations++;});
  const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
  await page.clock.install();
  await page.goto('/#/grammar/n5/01/sentence-structure-context');
  const exercise=page.locator('app-grammar-exercise');
  await expect(exercise).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('lang',language);
  await expect(page.locator('html')).toHaveAttribute('data-theme',theme);
  await exercise.locator('.exercise-option').first().click();
  await exercise.locator('.check-answer').click();
  await expect(exercise.locator('.exercise-feedback')).toBeVisible();
  const progress=await page.evaluate(prefix=>JSON.parse(localStorage.getItem(prefix+'kana-study.grammar-progress.v2')!),grammarStoragePrefix);
  await page.evaluate(()=>{(window as any).__exercise=document.querySelector('app-grammar-exercise');});
  const next=exercise.locator('.continue-answer');
  await next.scrollIntoViewIfNeeded();
  const scroll=await page.evaluate(()=>scrollY),url=page.url(),navigationCount=navigations;
  // Sixty-five separate minute ticks exercise repeated permission renewals and SDK expiry.
  for(let minute=0;minute<65;minute++){
    await page.clock.fastForward(60_000);
    await expect(exercise).toBeVisible();
  }
  await expect.poll(()=>refreshes).toBeGreaterThan(0);
  permission.error=true;
  await context.setOffline(true);
  await page.clock.fastForward(60_000);
  await expect(page.locator('.access-warning')).toBeVisible();
  await expect(next).toBeEnabled();
  expect(page.url()).toBe(url);
  expect(await page.evaluate(()=>scrollY)).toBe(scroll);
  await context.setOffline(false);permission.error=false;
  // A real second browser tab plus the exact lifecycle events used by the app.
  const other=await context.newPage();await other.goto('about:blank');await other.bringToFront();
  await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));});
  await page.bringToFront();
  await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:false});document.dispatchEvent(new Event('visibilitychange'));window.dispatchEvent(new Event('focus'));});
  await expect(page.locator('.access-warning')).toHaveCount(0);
  await expect(next).toBeEnabled();
  expect(await page.evaluate(()=>(window as any).__exercise===document.querySelector('app-grammar-exercise'))).toBe(true);
  expect(await page.evaluate(prefix=>JSON.parse(localStorage.getItem(prefix+'kana-study.grammar-progress.v2')!).concepts,grammarStoragePrefix)).toEqual(progress.concepts);
  expect(await page.evaluate(()=>scrollY)).toBe(scroll);
  expect(navigations).toBe(navigationCount);expect(errors).toEqual([]);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
  await page.screenshot({path:info.outputPath(`stable-${language}.png`),fullPage:false});
  await other.close();
  await next.click();await expect(exercise.locator('.check-answer')).toBeVisible();
});

test('a late workspace sync merges new progress without restarting a selected exercise',async({page})=>{
  await grammarAccount(page);await page.clock.install();
  await page.goto('/#/grammar/n5/01/sentence-structure-context');
  const exercise=page.locator('app-grammar-exercise');await expect(exercise).toBeVisible();
  await page.clock.runFor(2000);
  const old=await page.evaluate(prefix=>JSON.parse(localStorage.getItem(prefix+'kana-study.grammar-progress.v2')!),grammarStoragePrefix);
  const conceptId=Object.keys(old.concepts)[0];
  old.review[conceptId]={conceptId,topicId:'01',active:true,updatedAt:'2027-01-01T00:00:00Z'};
  let release!:()=>void;const delayed=new Promise<void>(resolve=>release=resolve);let pending=false;
  await page.route('**/rest/v1/user_preferences*',async route=>{
    if(route.request().method()!=='GET')return route.fulfill({json:[]});
    pending=true;await delayed;
    await route.fulfill({json:[{preference_key:'kana-study.grammar-progress.v2',payload:old,updated_at:'2027-01-01T00:00:00Z'}]});
  });
  await page.evaluate(()=>window.dispatchEvent(new Event('focus')));await page.clock.runFor(200);
  await expect.poll(()=>pending).toBe(true);
  await exercise.locator('.exercise-option').first().click();await exercise.locator('.check-answer').click();
  await exercise.locator('.continue-answer').click();
  await exercise.locator('.exercise-option').last().click();
  const selected=await exercise.locator('.selected').textContent();
  await page.evaluate(()=>(window as any).__exercise=document.querySelector('app-grammar-exercise'));
  release();
  await expect.poll(()=>page.evaluate(({prefix,id})=>JSON.parse(localStorage.getItem(prefix+'kana-study.grammar-progress.v2')!).review[id]?.active,{prefix:grammarStoragePrefix,id:conceptId})).toBe(true);
  expect(await exercise.locator('.selected').textContent()).toBe(selected);
  expect(await page.evaluate(()=>(window as any).__exercise===document.querySelector('app-grammar-exercise'))).toBe(true);
  const saved=await page.evaluate(prefix=>JSON.parse(localStorage.getItem(prefix+'kana-study.grammar-progress.v2')!),grammarStoragePrefix);
  expect(Object.keys(saved.concepts[conceptId].answers)).toHaveLength(1);expect(saved.concepts[conceptId].attempts).toBe(1);
  // Explanation and exercise stay mounted while the learner moves between them.
  await page.locator('app-grammar-v2-lesson').scrollIntoViewIfNeeded();await exercise.scrollIntoViewIfNeeded();
  expect(await exercise.locator('.selected').textContent()).toBe(selected);
  // Voluntary route changes still work; confirmed progress determines re-entry.
  await page.evaluate(()=>{location.hash='#/grammar';});await expect(page.locator('.roadmap-section')).toBeVisible();
  await page.locator('.primary-action').click();await expect(page).toHaveURL(/sentence-structure-context/);
  await expect(page.locator('.lesson-exercise-count')).toContainText('2');
});

for(const path of ['/grammar/n5/01/practice','/grammar/review','/grammar/n5/11/01'])test(`active round stays mounted across renewals: ${path}`,async({page})=>{
  await grammarAccount(page);await page.clock.install();await page.goto('/#'+path);
  await page.locator('.practice-start,.integration-content button.primary-link').first().click();
  const exercise=page.locator('app-grammar-exercise');await expect(exercise).toBeVisible();
  const input=exercise.locator('input');
  if(await input.count()){
    await input.fill('かな');await expect(input).toHaveValue('かな');
  } else {
    const before=await exercise.innerHTML();
    await exercise.locator('button:not(:disabled)').first().click();
    // Angular renders after the input event; capture the draft after that render.
    await expect.poll(()=>exercise.innerHTML()).not.toBe(before);
  }
  await page.evaluate(()=>(window as any).__exercise=document.querySelector('app-grammar-exercise'));
  const draft=await exercise.innerHTML(),url=page.url();
  for(let minute=0;minute<5;minute++){
    await page.clock.fastForward(60_000);await expect(exercise).toBeVisible();
    await page.evaluate(()=>window.dispatchEvent(new Event('focus')));
  }
  expect(await exercise.innerHTML()).toBe(draft);
  if(await input.count())await expect(input).toHaveValue('かな');
  expect(await page.evaluate(()=>(window as any).__exercise===document.querySelector('app-grammar-exercise'))).toBe(true);
  expect(page.url()).toBe(url);
});

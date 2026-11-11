import {test,expect} from '@playwright/test';
test('home states and vocabulary statistics stay coherent',async({page},info)=>{
 const language=info.project.name.includes('-en-')?'en':info.project.name.includes('-ca-')?'ca':'es';
 await page.route('**/supabase-config.js',r=>r.fulfill({contentType:'text/javascript',body:'window.__KANA_STUDY_CONFIG__={};'}));
 await page.route('**/*.supabase.co/**',r=>r.abort());
 await page.addInitScript(({language,theme})=>localStorage.setItem('kana-study.settings.v1',JSON.stringify({language,theme})),{language,theme:info.project.name.endsWith('light')?'light':'dark'});
 await page.goto('./#/kanji');await expect(page.locator('.play-button')).toBeEnabled();
 await expect(page.locator('app-kanji-availability-notice')).toHaveCount(0);
 await expect(page.locator('.learn-summary')).toContainText('80');await expect(page.locator('.learn-summary')).toContainText('10');
 await page.locator('.play-button').click();await expect(page.locator('app-kanji-start-panel .panel')).toBeVisible();await page.locator('app-kanji-start-panel .heading button').click();
 await page.locator('app-kanji-page').evaluate(node=>{
  const c=(window as any).ng.getComponent(node),at=new Date().toISOString();
  const data=Object.fromEntries(c.progress.activeUnits().map((u:any)=>[u.key,{...u,fsrs:{due:new Date(Date.now()+86400000).toISOString(),stability:1,difficulty:5,elapsedDays:0,scheduledDays:0,learningSteps:0,reps:1,lapses:0,state:'review',lastReview:at},firstSeenAt:at,lastSeenAt:at,totalAttempts:1,totalFirstTrySuccesses:1,totalFailures:0,lastRating:'good'}]));
  c.progress.storage.set('kana-study.kanji-progress.v1',data);c.progress.storage.cloudRevision.update((n:number)=>n+1);
 });
 await expect(page.locator('.play-button')).toBeDisabled();
 expect(await page.locator('.learn-summary').innerText()).not.toMatch(/\d\d:\d\d:\d\d|kanji\.availability/);
 await page.locator('app-kanji-page').evaluate(node=>{const c=(window as any).ng.getComponent(node),data={...c.progress.allProgress()},key=Object.keys(data)[0];data[key]={...data[key],fsrs:{...data[key].fsrs,due:new Date(Date.now()-1000).toISOString()}};c.progress.storage.set('kana-study.kanji-progress.v1',data);c.progress.storage.cloudRevision.update((n:number)=>n+1);});
 await expect(page.locator('.play-button')).toBeEnabled();
 await page.locator('app-kanji-page').evaluate(node=>(window as any).ng.getComponent(node).daily.history.record({module:'kanji',sessionId:'polish-completed',completedAt:new Date().toISOString(),mode:'self-assessment',exercisesCompleted:1,firstTrySuccesses:1,attempts:1,needsPracticeCount:0,durationSeconds:10}));
 await expect(page.locator('.play-button')).toBeDisabled();await expect(page.locator('.learn-summary strong')).toBeVisible();
 await page.screenshot({path:info.outputPath('kanji-completed.png'),fullPage:true});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
 await page.goto('./#/vocabulary');const toggle=page.locator('.progress-section .section-heading .stats-toggle');
 await expect(toggle).toHaveAttribute('aria-expanded','false');await toggle.click();await expect(page.locator('app-vocabulary-statistics')).toBeVisible();await expect(toggle).toHaveAttribute('aria-expanded','true');
 await toggle.click();await expect(page.locator('app-vocabulary-statistics')).toHaveCount(0);
 expect(await page.locator('main').innerText()).not.toMatch(/vocabulary\.daily\.stats\.view/);
 await page.screenshot({path:info.outputPath('vocabulary.png'),fullPage:true});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
});

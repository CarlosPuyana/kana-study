import {test,expect,Page} from '@playwright/test';
const NOW=new Date('2026-10-28T10:00:00Z');
test.beforeEach(async({page})=>{
 await page.route('**/supabase-config.js',r=>r.fulfill({contentType:'text/javascript',body:'window.__KANA_STUDY_CONFIG__ = {};'}));
 await page.addInitScript(()=>localStorage.setItem('kana-study.settings.v1',JSON.stringify({language:'es',theme:matchMedia('(prefers-color-scheme: light)').matches?'light':'dark'})));
 await page.clock.setFixedTime(NOW);
});
async function limit(page:Page,n:number){
 await page.goto('/#/anki/japanese-1500/settings');await expect(page.locator('input[type=number]')).toBeVisible();
 await page.locator('input[type=number]').fill(String(n));await page.locator('.save-button').click();await expect(page.locator('.save-row [role=status]')).toBeVisible();
}
async function records(page:Page){return page.evaluate(async()=>{
 const p=(window as any).ng.getComponent(document.querySelector('app-anki-study-page')),db=p.study.database.bind('japanese-1500');
 return {events:await db.getDeckReviewEvents('japanese-1500'),progress:await db.getDeckProgress('japanese-1500'),daily:await db.getDailyState('japanese-1500','2026-10-28')};
});}
async function noOverflow(page:Page){expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);}
test('one new card repeats early, reloads, graduates tomorrow and undoes with one introduction',async({page},info)=>{
 await limit(page,1);await expect(page.locator('.scheduler-policy')).toContainText('20');await noOverflow(page);await page.screenshot({path:`.cache/scheduler1/settings-${info.project.name}.png`,fullPage:true});
 await page.goto('/#/anki/japanese-1500/study');await expect(page.locator('.front h1')).toBeVisible();
 const word=await page.locator('.front h1').textContent();
 await page.locator('.reveal').click();await expect(page.locator('.ratings button')).toHaveCount(2);
 await expect(page.locator('.again')).toContainText('1 min');await expect(page.locator('.good')).toContainText('10 min');
 await page.locator('.good').click();await expect(page.locator('.advance-note')).toBeVisible();
 let r=await records(page);expect(r.progress[0].state).toBe(1);expect(r.progress[0].due).toBe(NOW.getTime()+600000);expect(r.daily.introducedEntryIds).toHaveLength(1);
 await page.reload();await expect(page.locator('.front h1')).toHaveText(word!);await expect(page.locator('.advance-note')).toBeVisible();
 await page.locator('.reveal').click();await expect(page.locator('.good')).toContainText('Mañana');
 await noOverflow(page);await page.screenshot({path:`.cache/scheduler1/early-${info.project.name}.png`,fullPage:true});
 await page.locator('.good').click();await expect(page.locator('.end-state')).toBeVisible();
 r=await records(page);expect(r.events).toHaveLength(2);expect(r.events.every((e:any)=>e.reviewedAt===NOW.getTime()&&e.fsrsLog.review===NOW.getTime())).toBe(true);
 expect(r.progress[0].state).toBe(2);expect(r.progress[0].due).toBe(Date.parse('2026-10-28T23:00:00Z'));expect(r.daily.completedAt).toBe(NOW.getTime());
 await page.locator('.undo').click();await expect(page.locator('.front h1')).toHaveText(word!);r=await records(page);expect(r.events).toHaveLength(1);expect(r.progress[0].state).toBe(1);expect(r.daily.introducedEntryIds).toHaveLength(1);
});
test('daily Review ignores old hour; a real wait refreshes at twenty minutes without replacing its preview',async({page},info)=>{
 await limit(page,0);await page.clock.install({time:NOW});await page.goto('/#/anki/japanese-1500/study');await expect(page.locator('.end-state')).toBeVisible();
 await page.evaluate(async()=>{
  const p=(window as any).ng.getComponent(document.querySelector('app-anki-study-page')),index=p.resource.content.index,now=Date.now();
  const row=(i:number,state:number,due:number)=>({deckId:'japanese-1500',entryId:index[i].id,state,due,card:{state,due,stability:30,difficulty:5,reps:20,lapses:1,scheduledDays:30,elapsedDays:30,learningSteps:state===1?1:0,lastReview:now-30*86400000}});
  await p.study.database.builtin.mergeFromCloud({progress:[row(0,1,now+40*60000),row(1,2,now+6*3600000),row(2,2,now+86400000)],events:[],daily:[]});
 });
 await page.reload();await expect(page.locator('.front h1')).toBeVisible();await page.locator('.reveal').click();await page.locator('.good').click();
 await expect(page.locator('.end-state')).toBeVisible();await expect(page.locator('.learning-pending')).toContainText('1');
 expect((await records(page)).daily?.completedAt??null).toBeNull();await noOverflow(page);
 await page.screenshot({path:`.cache/scheduler1/wait-${info.project.name}.png`,fullPage:true});
 await page.clock.fastForward(20*60000);await expect(page.locator('.advance-note')).toBeVisible();
 await page.locator('.reveal').click();const buttons=await page.locator('.ratings').textContent();
 await page.clock.fastForward(21*60000);await expect(page.locator('.ratings')).toHaveText(buttons!);
 await page.locator('.good').click();await expect(page.locator('.end-state')).toBeVisible();
 const r=await records(page);expect(r.events).toHaveLength(2);expect(r.events[1].reviewedAt).toBeGreaterThanOrEqual(NOW.getTime()+41*60000);expect(r.events[1].reviewedAt).toBe(r.events[1].fsrsLog.review);expect(r.events[1].dueAfter).toBe(Date.parse('2026-10-28T23:00:00Z'));expect(r.events[1].elapsedAnswerMs).toBeLessThanOrEqual(10000);
 expect(r.progress.filter((c:any)=>c.state===1)).toHaveLength(0);await noOverflow(page);
});

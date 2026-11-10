import {test,expect,Page} from '@playwright/test';

const saved=(page:Page)=>page.evaluate(()=>Object.fromEntries(Object.entries(localStorage).filter(([key])=>/kanji|completed-sessions|weaknesses/.test(key))));

for(const direction of ['kanji-to-meaning','meaning-to-kanji']){
  for(const mode of ['self-assessment','quick-practice']){
    test(`${direction}, ${mode}: contextual reveal stays read-only`,async({page},info)=>{
      const language=info.project.name.includes('-en-')?'en':info.project.name.includes('-ca-')?'ca':'es';
      await page.route('**/supabase-config.js',r=>r.fulfill({contentType:'text/javascript',body:'window.__KANA_STUDY_CONFIG__={};'}));
      await page.route('**/*.supabase.co/**',r=>r.abort());
      await page.addInitScript(({language,direction})=>{
        localStorage.setItem('kana-study.settings.v1',JSON.stringify({language,theme:language==='en'?'light':'dark'}));
        localStorage.setItem('kana-study.kanji-selection.v1',JSON.stringify({levels:{N5:true},questionTypes:[direction]}));
      },{language,direction});
      await page.goto('./#/kanji');
      await expect(page.locator('.play-button')).toBeEnabled();
      await page.locator('app-kanji-page').evaluate(node=>{
        const p=(window as any).ng.getComponent(node).progress,now=Date.now(),at=new Date(now-1000).toISOString();
        const progress=Object.fromEntries(p.activeUnits().map((u:any)=>[u.key,{...u,fsrs:{due:new Date(now+(u.kanjiId==='食'?-1:3*86400000)).toISOString(),stability:1,difficulty:5,elapsedDays:0,scheduledDays:0,learningSteps:0,reps:1,lapses:0,state:'learning',lastReview:at},firstSeenAt:at,lastSeenAt:at,totalAttempts:1,totalFirstTrySuccesses:1,totalFailures:0,lastRating:'good'}]));
        p.storage.set('kana-study.kanji-progress.v1',progress);p.storage.cloudRevision.update((n:number)=>n+1);
      });
      await page.locator('.play-button').click();
      await page.locator('app-kanji-start-panel .mode').nth(mode==='self-assessment'?1:0).click();
      await expect(page.locator('.exercise')).toBeVisible();
      await expect(page.locator('app-kanji-answer')).toHaveCount(0);
      const before=await saved(page);
      if(mode==='self-assessment')await page.locator('.reveal').click();
      else{
        if(direction==='meaning-to-kanji')await page.locator('app-learning-writing-prompt .actions button').last().click();
        const index=await page.locator('app-kanji-play-page').evaluate(node=>(window as any).ng.getComponent(node).options().findIndex((o:any)=>o.correct));
        await page.locator('.options button').nth(index).click();
      }
      const answer=page.locator('app-kanji-answer');
      await expect(answer.locator('.word')).toHaveText('食べる');
      await expect(answer.locator('.reading')).toHaveText('たべる');
      await expect(answer.locator('.example p')).toHaveText({es:'comer',en:'to eat',ca:'menjar'}[language]);
      await expect(answer.locator('details')).not.toHaveAttribute('open');
      if(mode==='self-assessment')expect(await saved(page)).toEqual(before);
      const after=await saved(page);
      await answer.locator('summary').click();
      await expect(answer.locator('dd').first()).toContainText('ショク');
      expect(await saved(page)).toEqual(after);
      expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
      await page.screenshot({path:info.outputPath(`${direction}-${mode}.png`),fullPage:true});
      if(mode==='self-assessment')await page.locator('.ratings .yes').click();
      else await page.locator('.exercise > .primary').click();
      await expect(page.locator('.results')).toBeVisible();
      const stored=await page.evaluate(()=>({
        reviews:JSON.parse(localStorage.getItem('kana-study.kanji-review-events.v1')??'[]'),
        history:JSON.parse(localStorage.getItem('kana-study.completed-sessions.v1')??'[]'),
      }));
      expect(stored.reviews).toHaveLength(1);
      expect(stored.reviews[0]).toMatchObject({kanjiId:'食',questionType:direction,rating:'good'});
      expect(stored.history).toHaveLength(1);
      expect(stored.history[0]).toMatchObject({module:'kanji',exercisesCompleted:1});
    });
  }
}

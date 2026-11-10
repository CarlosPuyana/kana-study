import {test,expect,Page,TestInfo} from '@playwright/test';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
const phase=process.env['KANJI_K3_PHASE']??'after';
// Capture the old revision with KANJI_K3_PHASE=before, then compare the new one
// with KANJI_K3_COMPARE=1. Normal runs need no ignored baseline artifacts.
async function capture(page:Page,info:TestInfo,name:string){
  await page.evaluate(()=>scrollTo(0,0));
  const metrics=await page.evaluate(()=>{
    const action=document.querySelector('.ratings,.reveal,.exercise > .primary,.results > button') as HTMLElement|null;
    return {height:document.documentElement.scrollHeight,actionBottom:action?Math.round(action.getBoundingClientRect().bottom):0,width:innerWidth};
  });
  const folder='.cache/kanji-k3/'+phase+'/'+info.project.name+'/'+name;
  await mkdir(folder,{recursive:true});
  await page.screenshot({path:folder+'/screen.png',fullPage:true});
  await writeFile(folder+'/metrics.json',JSON.stringify(metrics));
  if(phase==='after' && process.env['KANJI_K3_COMPARE']==='1'){
    const before=JSON.parse(await readFile(folder.replace('/after/','/before/')+'/metrics.json','utf8'));
    expect(metrics.height).toBeLessThanOrEqual(before.height);
    if(metrics.actionBottom)expect(metrics.actionBottom).toBeLessThan(before.actionBottom);
  }
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
  if(phase==='after'){
    const sizes=await page.locator('.exercise button,.exercise summary,.results > button').evaluateAll(nodes=>nodes.filter(n=>n.getClientRects().length).map(n=>n.getBoundingClientRect().height));
    for(const height of sizes)expect(height).toBeGreaterThanOrEqual(44);
  }
}


const saved=(page:Page)=>page.evaluate(()=>Object.fromEntries(Object.entries(localStorage).filter(([key])=>/kanji|completed-sessions|weaknesses/.test(key))));

for(const direction of ['kanji-to-meaning','meaning-to-kanji']){
  for(const mode of ['self-assessment','quick-practice']){
    test(`${direction}, ${mode}: compact question, answer and results`,async({page},info)=>{
      const language=info.project.name.includes('-en-')?'en':info.project.name.includes('-ca-')?'ca':'es';
      await page.route('**/supabase-config.js',r=>r.fulfill({contentType:'text/javascript',body:'window.__KANA_STUDY_CONFIG__={};'}));
      await page.route('**/*.supabase.co/**',r=>r.abort());
      await page.addInitScript(({language,direction,theme})=>{
        localStorage.setItem('kana-study.settings.v1',JSON.stringify({language,theme:theme}));
        localStorage.setItem('kana-study.kanji-selection.v1',JSON.stringify({levels:{N5:true},questionTypes:[direction]}));
      },{language,direction,theme:info.project.name.endsWith('light')?'light':'dark'});
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
      await capture(page,info,direction+'-'+mode+'-question');
      const before=await saved(page);
      if(mode==='self-assessment'){
        await page.locator('.reveal').focus();
        const scroll=await page.evaluate(()=>scrollY);
        await page.keyboard.press('Space');
        expect(await page.evaluate(()=>scrollY)).toBe(scroll);
      }
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
      await capture(page,info,direction+'-'+mode+'-answer');
      const after=await saved(page);
      await answer.locator('summary').click();
      await expect(answer.locator('dd').first()).toContainText('ショク');
      expect(await saved(page)).toEqual(after);
      expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
      await page.screenshot({path:info.outputPath(`${direction}-${mode}.png`),fullPage:true});
      if(mode==='self-assessment')await page.locator('.ratings .yes').click();
      else await page.locator('.exercise > .primary').click();
      await expect(page.locator('.results')).toBeVisible();
      while(await page.locator('.medal-dialog button').count())await page.locator('.medal-dialog button').click();
      await capture(page,info,direction+'-'+mode+'-results');
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

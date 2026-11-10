import {test,expect,Page} from '@playwright/test';

const persisted=(page:Page)=>page.evaluate(()=>Object.fromEntries(Object.entries(localStorage).filter(([key])=>/kanji|completed-sessions/.test(key))));
async function ready(page:Page){await expect(page.locator('section[aria-labelledby="history-title"]')).toHaveAttribute('aria-busy','false');}
async function seed(page:Page,extensive=false){
  await page.locator('app-kanji-stats-page').evaluate(async(node,extensive)=>{
    const component=(window as any).ng.getComponent(node),now=Date.now(),at=new Date(now).toISOString();
    const fsrs={due:at,stability:1,difficulty:5,elapsedDays:0,scheduledDays:0,learningSteps:0,reps:1,lapses:0,state:'review',lastReview:at};
    const unit=(id:string,type:string)=>({key:`kanji:${id}:${type}`,kanjiId:id,questionType:type});
    const progress=Object.fromEntries(['kanji-to-meaning','meaning-to-kanji'].map(type=>{
      const u=unit('食',type);return [u.key,{...u,fsrs,firstSeenAt:at,lastSeenAt:at,totalAttempts:1,totalFirstTrySuccesses:1,totalFailures:0,lastRating:'good'}];
    }));
    const units=component.reader.progress.activeUnits();
    const reviews=Array.from({length:extensive?1500:4},(_,n)=>{
      const u=extensive?units[n%10]:unit('食',n===2?'meaning-to-kanji':'kanji-to-meaning');
      return {...u,id:`k4-${n}:fsrs`,sessionId:`k4-${n}`,rating:n===2&&!extensive?'hard':n%2?'again':'good',reviewedAt:new Date(now-Math.floor(n/(extensive?10:1))*86400000-(n%10)*1000).toISOString(),fsrsBefore:null,fsrsAfter:fsrs};
    });
    localStorage.setItem('kana-study.kanji-progress.v1',JSON.stringify(progress));
    localStorage.setItem('kana-study.kanji-review-events.v1',JSON.stringify(reviews));
    localStorage.setItem('kana-study.completed-sessions.v1',JSON.stringify([
      {module:'kanji',sessionId:'k4-complete',completedAt:at,mode:'self-assessment',exercisesCompleted:1,firstTrySuccesses:1,attempts:1,needsPracticeCount:0,durationSeconds:120},
      {module:'kanji',sessionId:'k4-legacy',completedAt:new Date(now-86400000).toISOString(),mode:'quick-practice',exercisesCompleted:1},
    ]));
    await new Promise<void>((resolve,reject)=>{
      const request=indexedDB.open('kana-study-attempts-v1',1);
      request.onerror=()=>reject(request.error);
      request.onsuccess=()=>{
        const db=request.result,tx=db.transaction('events','readwrite');
        tx.oncomplete=()=>{db.close();resolve();};tx.onerror=()=>{db.close();reject(tx.error);};
        for(const [n,e] of reviews.entries()){
          if(!extensive&&n===3)continue;
          tx.objectStore('events').put({version:1,id:e.id.replace(':fsrs',''),occurredAt:e.reviewedAt,module:'kanji',activity:'learn',itemId:e.kanjiId,questionType:e.questionType,sessionId:e.sessionId,firstAttempt:true,
            result:e.rating==='hard'?{source:'self',rating:'hard'}:{source:'objective',correct:e.rating==='good'},workspace:'guest'});
        }
        // A voluntary practice attempt lacks a normal review and must not affect accuracy.
        tx.objectStore('events').put({version:1,id:'k4-practice',occurredAt:at,module:'kanji',activity:'learn',itemId:'食',questionType:'kanji-to-meaning',sessionId:'practice',firstAttempt:true,result:{source:'objective',correct:false},workspace:'guest'});
      };
    });
  },extensive);
  await page.reload();await ready(page);
}
test.beforeEach(async({page},info)=>{
  const language=info.project.name.includes('-en-')?'en':info.project.name.includes('-ca-')?'ca':'es';
  await page.route('**/supabase-config.js',r=>r.fulfill({contentType:'text/javascript',body:'window.__KANA_STUDY_CONFIG__={};'}));
  await page.route('**/*.supabase.co/**',r=>r.abort());
  await page.addInitScript(({language,theme})=>localStorage.setItem('kana-study.settings.v1',JSON.stringify({language,theme})),{language,theme:info.project.name.endsWith('light')?'light':'dark'});
  await page.goto('./#/kanji/stats');await ready(page);
});
test('empty and partial statistics, accessible detail and isolated workspaces',async({page},info)=>{
  await expect(page.locator('[data-testid="empty-history"]')).toBeVisible();
  await expect(page.locator('app-attempt-history-chart')).toHaveCount(0);
  await seed(page);
  await expect(page.locator('[data-testid="normal-reviews"]')).toHaveText('4');
  await expect(page.locator('[data-testid="accuracy"]')).toHaveText('50%');
  expect(await page.locator('app-kanji-stats-page').evaluate(n=>(window as any).ng.getComponent(n).overview())).toMatchObject({new:79,learning:0,review:1});
  await expect(page.locator('.difficult a')).toHaveCount(1);
  expect(await page.locator('main').innerText()).not.toMatch(/kanji\.stats\.|statsV2\.|\{\{/);
  const before=await persisted(page);
  await page.screenshot({path:info.outputPath('partial.png'),fullPage:true});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
  await page.locator('.filters select').selectOption('7');await ready(page);expect(await persisted(page)).toEqual(before);
  await page.locator('app-kanji-stats-page').evaluate(n=>(window as any).ng.getComponent(n).reader.workspace.activateUser('k4-synthetic-b'));await ready(page);
  await expect(page.locator('[data-testid="normal-reviews"]')).toHaveText('0');
  await page.locator('app-kanji-stats-page').evaluate(n=>(window as any).ng.getComponent(n).reader.workspace.activateGuest());await ready(page);
  await expect(page.locator('[data-testid="normal-reviews"]')).toHaveText('4');expect(await persisted(page)).toEqual(before);
  await page.locator('.difficult a').click();await expect(page.locator('.detail-character')).toHaveText('食');
});
test('extensive history stays bounded and read-only with a 90-day filter',async({page},info)=>{
  await seed(page,true);await expect(page.locator('[data-testid="normal-reviews"]')).toHaveText('300');
  const before=await persisted(page);
  await page.locator('.filters select').selectOption('90');await ready(page);
  await expect(page.locator('[data-testid="normal-reviews"]')).toHaveText('900');
  await expect(page.locator('[data-testid="accuracy"]')).toHaveText('50%');
  expect(await page.locator('app-kanji-stats-page').evaluate(n=>(window as any).ng.getComponent(n).history().days.length)).toBe(90);
  expect(await persisted(page)).toEqual(before);
  await page.screenshot({path:info.outputPath('extensive.png'),fullPage:true});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
});

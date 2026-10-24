import {test,expect,Page} from '@playwright/test';
const now=new Date('2026-10-09T12:00:00.000Z');
test.beforeEach(async({page})=>{
  await page.clock.setFixedTime(now);
  await page.route('**/supabase-config.js',route=>route.fulfill({contentType:'text/javascript',body:'window.__KANA_STUDY_CONFIG__ = {};'}));
  await page.addInitScript(()=>{if(!localStorage.getItem('kana-study.settings.v1'))localStorage.setItem('kana-study.settings.v1',JSON.stringify({language:'es',theme:'dark'}));});
});
async function ready(page:Page){await expect(page.locator('app-historical-stats [data-testid="attempt-total"]')).toBeVisible();}
async function seed(page:Page){await page.evaluate(async()=>{
  const db=await new Promise<IDBDatabase>((resolve,reject)=>{const r=indexedDB.open('kana-study-attempts-v1',1);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});
  const objective=(id:string,date:string,correct:boolean,module='kana',activity='learn',workspace='guest')=>({workspace,version:1,id,occurredAt:date+'T12:00:00.000Z',module,activity,itemId:'fixture-'+id,questionType:'kana-to-romaji',sessionId:'controlled',firstAttempt:true,result:{source:'objective',correct}});
  const events=[objective('current','2026-10-08',false),objective('month','2026-09-20',true,'vocabulary','listening'),objective('quarter','2026-08-20',true),objective('outside','2026-06-01',true),objective('other','2026-10-08',true,'kana','learn','user:fixture')];
  events.push({...objective('self','2026-10-08',true,'kanji','writing'),result:{source:'self',rating:'hard'}} as any);
  events.push({...objective('corrupt','2026-10-08',true),version:999});
  await new Promise<void>((resolve,reject)=>{const tx=db.transaction('events','readwrite');tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);for(const event of events)tx.objectStore('events').put(event);});db.close();
});await page.reload();await ready(page);}
async function overflow(page:Page){expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);}

test('empty Stats has honest precision, accessible charts, filters and legacy totals',async({page})=>{
  await page.goto('/#/stats');await ready(page);await expect(page.locator('.empty-history')).toBeVisible();
  await expect(page.locator('[data-testid="attempt-total"]')).toHaveText('0');await expect(page.locator('.metrics')).toContainText('Sin datos');
  await expect(page.locator('.historical-recommendation')).toContainText('Todavía no hay evidencia suficiente');
  await expect(page.locator('app-attempt-history-chart svg[role="img"]')).toHaveCount(2);
  await page.locator('#stats-period').focus();await page.keyboard.press('ArrowDown');await page.keyboard.press('Enter');await ready(page);await expect(page.locator('#stats-period')).toBeFocused();
  await overflow(page);await expect(page.locator('.stats-shell')).toContainText('Históricos acumulados');
});

test('controlled historical data uses real dates, filters and separate self results',async({page})=>{
  await page.goto('/#/stats');await ready(page);await seed(page);await expect(page.locator('[data-testid="attempt-total"]')).toHaveText('2');
  await expect(page.locator('.metrics')).toContainText('0%');await expect(page.locator('.metrics')).toContainText('Difícil 1');
  await page.locator('#stats-period').selectOption('30');await expect(page.locator('[data-testid="attempt-total"]')).toHaveText('3');
  await page.locator('#stats-period').selectOption('90');await expect(page.locator('[data-testid="attempt-total"]')).toHaveText('4');
  await page.locator('#stats-module').selectOption('kanji');await expect(page.locator('[data-testid="attempt-total"]')).toHaveText('1');await expect(page.locator('.metrics')).toContainText('Sin datos');
  await page.locator('#stats-skill').selectOption('listening');await expect(page.locator('[data-testid="attempt-total"]')).toHaveText('0');
  await page.locator('#stats-module').selectOption('');await expect(page.locator('[data-testid="attempt-total"]')).toHaveText('1');
  await page.locator('app-attempt-history-chart details summary').first().click();await expect(page.locator('app-attempt-history-chart table').first().locator('tbody tr')).toHaveCount(90);await overflow(page);
});

test('a real Kana writing assessment updates Stats after reveal without grading drawing',async({page})=>{
  await page.goto('/#/writing');await page.getByRole('button',{name:'Empezar',exact:true}).click();
  const svg=page.locator('svg.writing-surface');await expect(svg).toBeVisible();const box=(await svg.boundingBox())!;
  await page.mouse.move(box.x+box.width*.2,box.y+box.height*.2);await page.mouse.down();await page.mouse.move(box.x+box.width*.6,box.y+box.height*.6);await page.mouse.up();
  await page.goto('/#/stats');await ready(page);await expect(page.locator('[data-testid="attempt-total"]')).toHaveText('0');
  await page.goto('/#/writing');await page.getByRole('button',{name:'Empezar',exact:true}).click();await page.getByRole('button',{name:'Mostrar respuesta',exact:true}).click();
  await page.goto('/#/stats');await ready(page);await expect(page.locator('[data-testid="attempt-total"]')).toHaveText('0');
  await page.goto('/#/writing');await page.getByRole('button',{name:'Empezar',exact:true}).click();await page.getByRole('button',{name:'Mostrar respuesta',exact:true}).click();await page.getByRole('button',{name:'Correcto',exact:true}).click();
  await page.goto('/#/stats');await ready(page);await expect(page.locator('[data-testid="attempt-total"]')).toHaveText('1');await expect(page.locator('.metrics')).toContainText('Bien 1');await expect(page.locator('.metrics')).toContainText('Sin datos');
  await page.reload();await ready(page);await expect(page.locator('[data-testid="attempt-total"]')).toHaveText('1');
});

test('workspace changes clear the projection and isolate Guest/account event queries',async({page})=>{
  await page.goto('/#/stats');await ready(page);await seed(page);
  // Exercise the real workspace signal in this test build, without a remote login.
  await page.evaluate(async()=>{
    const root=document.querySelector('app-historical-stats')!;
    const component=(window as any).ng.getComponent(root);
    component.workspace.activateUser('fixture');
  });await expect(page.locator('[data-testid="attempt-total"]')).toHaveText('1');
  await page.evaluate(()=>{(window as any).ng.getComponent(document.querySelector('app-historical-stats')).workspace.activateUser('empty');});await expect(page.locator('[data-testid="attempt-total"]')).toHaveText('0');
  await page.evaluate(()=>{(window as any).ng.getComponent(document.querySelector('app-historical-stats')).workspace.activateGuest();});await expect(page.locator('[data-testid="attempt-total"]')).toHaveText('2');
});

test('Stats themes, languages and tablet layout retain readable text alternatives',async({page},info)=>{
  await page.goto('/#/stats');await ready(page);await seed(page);
  for(const language of ['es','en','ca']){
    await page.evaluate(language=>{const key='kana-study.settings.v1',settings=JSON.parse(localStorage.getItem(key)!);settings.language=language;localStorage.setItem(key,JSON.stringify(settings));},language);
    await page.reload();await ready(page);await expect(page.locator('.history')).not.toContainText(/statsV2\.|\{\{/);
    for(const theme of ['dark','light','nora','nora-dark','anime']){await page.evaluate(theme=>document.documentElement.setAttribute('data-theme',theme),theme);await overflow(page);await page.screenshot({path:info.outputPath(`stats-${language}-${theme}.png`),fullPage:true});}
  }
  await page.setViewportSize({width:768,height:1024});await overflow(page);await page.screenshot({path:info.outputPath('stats-tablet.png'),fullPage:true});
});

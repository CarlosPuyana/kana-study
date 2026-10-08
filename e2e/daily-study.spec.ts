import {test,expect} from '@playwright/test';

test.beforeEach(async({page})=>{
  await page.route('**/supabase-config.js',route=>route.fulfill({contentType:'text/javascript',body:'window.__KANA_STUDY_CONFIG__ = {};'}));
  await page.addInitScript(()=>{if(!localStorage.getItem('kana-study.settings.v1'))localStorage.setItem('kana-study.settings.v1',JSON.stringify({language:'es',theme:'dark'}));});
});
test('Daily entry, read-only offline plan, duration budgets, languages and five responsive themes',async({page},info)=>{
  await page.goto('/#/');await expect(page.locator('.learn-button')).toBeVisible();await expect(page.locator('.learn-button')).toBeEnabled();
  await expect(page.locator('app-home-page app-learning-start-panel')).toHaveCount(0);
  const keys=['kana-study.study-progress.v2','kana-study.kanji-progress.v1','kana-study.vocabulary-progress.v1','kana-study.grammar-progress.v2','kana-study.completed-sessions.v1','kana-study.weaknesses.v1','kana-study.manga-review-events.v1','kana-study.manga-fsrs-settings.v1'];
  const before=await page.evaluate(keys=>keys.map(key=>localStorage.getItem(key)),keys);
  await page.getByRole('link',{name:'Mi estudio diario →',exact:true}).click();await expect(page).toHaveURL(/#\/daily$/);
  await expect(page.getByText('Consultando tus datos locales…')).toHaveCount(0);
  for(const [minutes,count] of [[5,1],[15,3],[30,4]]){await page.getByRole('button',{name:`${minutes} minutos`,exact:true}).click();await expect(page.locator('.activities .activity')).toHaveCount(count);}
  expect(await page.evaluate(keys=>keys.map(key=>localStorage.getItem(key)),keys)).toEqual(before);
  await page.context().setOffline(true);await page.evaluate(()=>window.dispatchEvent(new Event('focus')));await expect(page.getByText(/^Sin conexión:/)).toBeVisible();
  await expect(page.locator('.activities .activity')).toHaveCount(4);await page.context().setOffline(false);
  for(const theme of ['dark','light','nora','nora-dark','anime']){
    await page.evaluate(theme=>document.documentElement.setAttribute('data-theme',theme),theme);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
    await page.screenshot({path:info.outputPath(`daily-${theme}.png`),fullPage:true});
  }
  for(const [language,title] of [['es','Tu plan para hoy'],['en','Your plan for today'],['ca','El teu pla per avui']]){
    await page.evaluate(language=>{const key='kana-study.settings.v1',settings=JSON.parse(localStorage.getItem(key)!);settings.language=language;localStorage.setItem(key,JSON.stringify(settings));},language);
    await page.reload();await expect(page.getByRole('heading',{name:title,exact:true})).toBeVisible();
    await expect(page.locator('app-daily-page')).not.toContainText(/daily\.|grammar\.v2\./);
  }
});

test('normal modules use original panels; completed Kana updates the plan and survives reload',async({page})=>{
  await page.goto('/#/daily');await expect(page.getByText('Consultando tus datos locales…')).toHaveCount(0);
  for(const module of ['kana','kanji','vocabulary']){
    const task=page.locator(`[data-activity-id="normal:${module}"]`);await task.getByRole('button',{name:'Comenzar',exact:true}).click();
    await expect(page.getByRole('dialog')).toBeVisible();await page.keyboard.press('Tab');await page.keyboard.press('Escape');await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(task.getByRole('button',{name:'Comenzar',exact:true})).toBeFocused();
  }
  await page.locator('[data-activity-id="normal:kana"]').getByRole('button',{name:'Comenzar',exact:true}).click();
  await page.locator('app-learning-start-panel .mode').nth(1).click();await expect(page).toHaveURL(/#\/learn$/);
  for(let index=0;index<10;index++){await page.locator('.reveal').click();await page.locator('.ratings .good').click();}
  await expect(page.locator('.results')).toBeVisible();
  await page.goto('/#/daily');await expect(page.getByText('Consultando tus datos locales…')).toHaveCount(0);
  await expect(page.locator('[data-activity-id="normal:kana"]')).toHaveCount(0);
  await expect(page.locator('.performed').first()).toContainText('Kana');await expect(page.locator('.performed').first()).toContainText('Realizada hoy');
  expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('kana-study.completed-sessions.v1')??'[]').filter((s:{module?:string})=>(s.module??'kana')==='kana').length)).toBe(1);
  await page.reload();await expect(page.locator('[data-activity-id="normal:kana"]')).toHaveCount(0);
  await expect(page.locator('[data-activity-id="practice:kana"]')).toBeVisible();
});

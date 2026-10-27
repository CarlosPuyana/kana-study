import {test,expect} from '@playwright/test';
import {grammarAccount,grammarStoragePrefix} from './grammar-access.fixture';

test('Guest stays denied despite URL/storage switches; safe login return and responsive private screen',async({page},info)=>{
  await page.route('**/supabase-config.js',r=>r.fulfill({body:'window.__KANA_STUDY_CONFIG__={};'}));
  await page.addInitScript(()=>{
    localStorage.setItem('grammarAccess','authorized');localStorage.setItem('GRAMMAR_ENABLED','true');
    localStorage.setItem('kana-study.grammar-progress.v2','{"version":2,"concepts":{"saved":{"status":"completed"}}}');
    localStorage.setItem('kana-study.settings.v1',JSON.stringify({language:'es',theme:matchMedia('(prefers-color-scheme: light)').matches?'light':'dark'}));
  });
  await page.goto('/#/more?grammarAccess=true');await expect(page.locator('a[href="#/grammar"]')).toHaveCount(0);
  await page.goto('/#/daily');await expect(page.locator('app-daily-page')).toBeVisible();
  await expect(page.locator('a[href^="#/grammar"],[data-activity-id^="grammar:"]')).toHaveCount(0);
  await page.goto('/#/grammar/n5/07/practice?enabled=true');await expect(page).toHaveURL(/grammar-access/);
  await expect(page.getByRole('heading',{name:'Gramática · Beta privada'})).toBeFocused();
  await expect(page.locator('app-grammar-page,app-grammar-review-page')).toHaveCount(0);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
  expect(await page.evaluate(()=>localStorage.getItem('kana-study.grammar-progress.v2'))).toContain('saved');
  await page.screenshot({path:info.outputPath('private-beta.png'),fullPage:true});
  await page.getByRole('link',{name:'Iniciar sesión',exact:true}).click();await expect(page).toHaveURL(/auth\?return=/);
});

test('authorized account opens children; revocation at foreground blocks without changing progress',async({page})=>{
  const permission=await grammarAccount(page);
  await page.goto('/#/grammar/n5/01/sentence-structure-context');await expect(page.locator('.lesson-heading-card')).toBeVisible();
  const before=await page.evaluate(prefix=>Object.fromEntries(Object.entries(localStorage).filter(([k])=>k.startsWith(prefix)&&k.includes('grammar-progress'))),grammarStoragePrefix);
  permission.enabled=false;
  await page.evaluate(()=>window.dispatchEvent(new Event('focus')));
  await expect(page).toHaveURL(/grammar-access/);await expect(page.locator('.lesson-heading-card')).toHaveCount(0);
  await expect(page.getByRole('status')).toContainText('beta privada');
  expect(await page.evaluate(prefix=>Object.fromEntries(Object.entries(localStorage).filter(([k])=>k.startsWith(prefix)&&k.includes('grammar-progress'))),grammarStoragePrefix)).toEqual(before);
  await page.goto('/#/more');await expect(page.locator('a[href="#/grammar"]')).toHaveCount(0);
});

test('account with no grant and remote failures remain blocked; retry requires a real permission response',async({page})=>{
  const permission=await grammarAccount(page,false);
  await page.goto('/#/grammar/review');await expect(page).toHaveURL(/grammar-access/);
  permission.error=true;await page.getByRole('button',{name:'Comprobar acceso y entrar'}).click();
  await expect(page.getByRole('status')).toContainText('No se ha podido');
  permission.error=false;permission.enabled=true;await page.getByRole('button',{name:'Comprobar acceso y entrar'}).click();
  await expect(page).toHaveURL(/#\/grammar\/review$/);await expect(page.locator('app-grammar-access-shell')).toBeVisible();
});

test('SDK logout in another tab closes the open course and retains stored progress',async({page,context,baseURL})=>{
  const errors:string[]=[];const capture=(tab:typeof page)=>{tab.on('pageerror',error=>errors.push(error.message));tab.on('console',message=>{if(message.type()==='error')errors.push(message.text());});};capture(page);
  await grammarAccount(page);await page.goto('/#/grammar/n5/01/sentence-structure-context');
  await expect(page.locator('.lesson-heading-card')).toBeVisible();
  const progress=await page.evaluate(prefix=>localStorage.getItem(prefix+'kana-study.grammar-progress.v2'),grammarStoragePrefix);
  const other=await context.newPage();capture(other);await grammarAccount(other);await other.goto(baseURL+'/#/profile');
  await other.getByRole('button',{name:'Cerrar sesión',exact:true}).click();
  await expect(page).toHaveURL(/grammar-access/);await expect(page.locator('.lesson-heading-card')).toHaveCount(0);
  expect(await page.evaluate(prefix=>localStorage.getItem(prefix+'kana-study.grammar-progress.v2'),grammarStoragePrefix)).toBe(progress);
  expect(errors).toEqual([]);
  await other.close();
});

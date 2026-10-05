import {test,expect} from '@playwright/test';

test.beforeEach(async({page},info)=>{
  await page.route('**/supabase-config.js',route=>route.fulfill({contentType:'text/javascript',body:'window.__KANA_STUDY_CONFIG__ = {};'}));
  await page.addInitScript(theme=>{if(!localStorage.getItem('kana-study.settings.v1'))localStorage.setItem('kana-study.settings.v1',JSON.stringify({language:'es',theme}));},info.project.use.colorScheme==='light'?'light':'dark');
});

test('More prioritizes tools, opens them, hides Extras and returns Settings to its origin',async({page})=>{
  await page.goto('/#/more');
  const weak=page.locator('a[href="#/weaknesses"]'),stats=page.locator('a[href="#/stats"]');
  for(const link of [weak,stats]){await expect(link).toBeVisible();const box=await link.boundingBox();expect(box!.y+box!.height).toBeLessThan(page.viewportSize()!.height);}
  await expect(page.locator('app-module-card').first()).toBeVisible();
  expect((await weak.boundingBox())!.y).toBeLessThan((await page.locator('app-module-card').first().boundingBox())!.y);
  await expect(page.locator('app-module-card').filter({hasText:'Extras'})).toHaveCount(0);
  await page.screenshot({path:test.info().outputPath('more-layout.png'),fullPage:true});
  await weak.click();await expect(page).toHaveURL(/#\/weaknesses$/);await page.getByRole('link',{name:'Volver',exact:true}).click();
  await stats.click();await expect(page).toHaveURL(/#\/stats$/);await page.getByRole('link',{name:'Volver',exact:true}).click();
  await page.locator('a[href^="#/settings?return="]').click();await expect(page).toHaveURL(/#\/settings\?return=(?:%2F|\/)more$/);
  await page.getByRole('link',{name:'Volver',exact:true}).click();await expect(page).toHaveURL(/#\/more$/);
  await page.goto('/#/settings');await page.getByRole('link',{name:'Volver',exact:true}).click();await expect(page).toHaveURL(/#\/$/);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
});

test('incompatible persisted progress never blanks Kana, Vocabulary or Kanji',async({page})=>{
  test.skip(test.info().project.name!=='desktop-dark');
  await page.addInitScript(()=>{
    localStorage.setItem('kana-study.study-progress.v2','null');
    localStorage.setItem('kana-study.vocabulary-progress.v1','[]');
    localStorage.setItem('kana-study.kanji-progress.v1','{"broken":{"fsrs":{"state":"review"}}}');
  });
  for(const path of ['/','/vocabulary','/kanji']){await page.goto('/#'+path);await expect(page.locator('main')).toBeVisible();await expect(page.locator('h1').first()).toBeVisible();}
});

test('Flags fresh deep links return to Flags instead of leaving the app',async({browser,baseURL})=>{
  test.skip(test.info().project.name!=='desktop-dark');
  for(const path of ['/flags/selection','/flags/countries','/flags/medals']){
    const context=await browser.newContext();const page=await context.newPage();
    await page.route('**/supabase-config.js',r=>r.fulfill({body:'window.__KANA_STUDY_CONFIG__ = {};'}));
    await page.goto(baseURL+'/#'+path);await page.getByRole('button',{name:'Volver',exact:true}).click();await expect(page).toHaveURL(/#\/flags$/);await context.close();
  }
});

test('Vocabulary modal cycles focus, closes on Escape and restores focus',async({page})=>{
  test.skip(test.info().project.name!=='desktop-dark');
  await page.goto('/#/vocabulary');const opener=page.getByRole('button',{name:/APRENDER/i});await opener.click();
  const dialog=page.getByRole('dialog');await expect(dialog).toBeVisible();await expect(dialog).toHaveAttribute('aria-labelledby','vocabulary-start-title');
  await expect(dialog.getByRole('button',{name:'Cerrar',exact:true})).toBeVisible();
  const first=dialog.locator('a,button').first(),last=dialog.locator('a,button').last();await last.focus();await page.keyboard.press('Tab');await expect(first).toBeFocused();
  await page.keyboard.press('Shift+Tab');await expect(last).toBeFocused();await page.keyboard.press('Escape');await expect(dialog).toHaveCount(0);await expect(opener).toBeFocused();
});

test('Kanji detail traps focus, restores its card and keeps the accessible title',async({page})=>{
  test.skip(test.info().project.name!=='desktop-dark');
  await page.goto('/#/kanji/all');const opener=page.locator('.card').first();await opener.click();
  const dialog=page.getByRole('dialog');await expect(dialog).toHaveAttribute('aria-labelledby','kanji-detail-title');
  const first=dialog.getByRole('button',{name:'Cerrar',exact:true}),last=dialog.locator('a,button').last();
  await last.focus();await page.keyboard.press('Tab');await expect(first).toBeFocused();
  await page.keyboard.press('Escape');await expect(dialog).toHaveCount(0);await expect(opener).toBeFocused();
});

test('Grammar translations load before rendering in EN and CA',async({page})=>{
  test.skip(test.info().project.name!=='desktop-dark');
  for(const language of ['en','ca']){
    await page.goto('/#/more');await page.evaluate(language=>localStorage.setItem('kana-study.settings.v1',JSON.stringify({language,theme:'dark'})),language);
    await page.goto('/#/grammar/n5/00/1');await page.reload();
    await expect(page.locator('.lesson-heading-card')).toBeVisible();
    await expect(page.locator('main').first()).not.toContainText('grammar.content.');
    await expect(page.locator('main').first()).not.toContainText('Los sistemas de escritura');
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
  }
});

test('missing Manga volume has a recoverable error without page controls',async({page})=>{
  test.skip(test.info().project.name!=='desktop-dark');await page.goto('/#/manga/read/audit-missing-id');
  await expect(page.getByRole('alert')).toBeVisible();await expect(page.locator('.reader-toolbar')).toHaveCount(0);await expect(page.locator('main')).not.toContainText('1 / 0');
  await page.getByRole('link',{name:'Biblioteca',exact:true}).click();await expect(page).toHaveURL(/#\/manga$/);
});

test('Listening global outage pauses after three requests and can recover',async({page})=>{
  test.skip(test.info().project.name!=='desktop-dark');let attempts=0,broken=true;
  await page.route('**/*.mp3',route=>{attempts++;return broken?route.abort():route.continue();});
  await page.goto('/#/vocabulary/listening');await page.getByRole('button',{name:'Empezar',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Práctica interrumpida',exact:true})).toBeVisible();expect(attempts).toBe(3);
  await expect(page.locator('.finished')).toHaveCount(0);await expect(page.locator('.progress')).toHaveText('0 / 15');
  broken=false;await page.getByRole('button',{name:'Reintentar audio',exact:true}).click();await expect(page.locator('.options button').first()).toBeEnabled();expect(attempts).toBe(4);
});

test('recovery form submits the new password to a simulated backend',async({page})=>{
  test.skip(test.info().project.name!=='desktop-dark');
  const user={id:'11111111-1111-4111-8111-111111111111',email:'audit@example.test',aud:'authenticated',role:'authenticated',app_metadata:{},user_metadata:{},created_at:'2026-01-01T00:00:00Z'};
  await page.route('**/supabase-config.js',r=>r.fulfill({contentType:'text/javascript',body:'window.__KANA_STUDY_CONFIG__={supabaseUrl:"https://audit.supabase.co",supabasePublishableKey:"audit-public-key-not-a-real-secret"};'}));
  await page.addInitScript(user=>{
    localStorage.setItem('kana-study.workspace.active.v1','user:'+user.id);
    localStorage.setItem('sb-audit-auth-token',JSON.stringify({access_token:'audit-token',refresh_token:'audit-refresh',expires_at:Math.floor(Date.now()/1000)+3600,expires_in:3600,token_type:'bearer',user}));
  },user);
  let password:string|undefined;
  await page.route('https://audit.supabase.co/**',async route=>{
    if(new URL(route.request().url()).pathname==='/auth/v1/user'){
      if(route.request().method()==='PUT')password=route.request().postDataJSON().password;
      await route.fulfill({contentType:'application/json',body:JSON.stringify(user)});
    }else await route.fulfill({contentType:'application/json',body:'[]'});
  });
  await page.goto('/#/auth?mode=recovery&return=/manga');await page.locator('input[name=newPassword]').fill('new-audit-password');await page.locator('button[type=submit]').click();
  await expect.poll(()=>password).toBe('new-audit-password');await expect(page.locator('input[name=email]')).toBeVisible();await expect(page.getByRole('status')).toContainText(/contraseña/i);
  await page.getByRole('link',{name:'Cerrar',exact:true}).click();await expect(page).toHaveURL(/#\/manga$/);
});

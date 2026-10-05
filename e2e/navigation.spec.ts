import {test,expect,Page} from '@playwright/test';

async function screen(page:Page,path:string){await expect(page).toHaveURL(new RegExp('#'+path.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'(?:\\?|$)'));await expect(page).toHaveTitle(/ · Kana Study$/);}
async function follow(page:Page,path:string){await page.locator(`a[href="#${path}"]:visible`).first().click();await screen(page,path);}
async function back(page:Page,path:string){await page.getByRole('link',{name:'Volver',exact:true}).first().click();await screen(page,path);}
async function more(page:Page){await page.goto('/#/more');await screen(page,'/more');}
async function noOverflow(page:Page){expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1)).toBe(true);}

test.beforeEach(async({page},info)=>{
  await page.addInitScript(theme=>{if(!localStorage.getItem('kana-study.settings.v1'))localStorage.setItem('kana-study.settings.v1',JSON.stringify({language:'es',theme}));},info.project.use.colorScheme==='light'?'light':'dark');
});

test('Kana selection, writing and RUSH config return to Home',async({page})=>{
  await page.goto('/');await screen(page,'/');await follow(page,'/selection');await page.getByRole('button',{name:'Volver',exact:true}).click();await screen(page,'/');
  await follow(page,'/writing');await back(page,'/');
  await page.getByRole('button',{name:/RUSH/}).click();await expect(page.getByRole('dialog')).toBeVisible();await page.getByRole('button',{name:/Cerrar|Cancelar/}).first().click();await expect(page.getByRole('dialog')).toHaveCount(0);await screen(page,'/');
});
test('Vocabulary writing and listening are reachable with contextual back links',async({page})=>{
  await more(page);await follow(page,'/vocabulary');await follow(page,'/vocabulary/writing');await back(page,'/vocabulary');await follow(page,'/vocabulary/listening');await back(page,'/vocabulary');await back(page,'/more');
});
test('Kanji catalog and Manga guide navigation',async({page})=>{
  await more(page);await follow(page,'/kanji');await follow(page,'/kanji/all');await page.getByRole('button',{name:'Volver',exact:true}).click();await screen(page,'/kanji');await back(page,'/more');
  await follow(page,'/manga');await follow(page,'/manga/guide');await follow(page,'/manga');await page.locator('.remote-entry summary').click();await expect(page.locator('input[name=cbz]')).toBeVisible();
});
test('Grammar roadmap, topic, lesson and lesson practice',async({page})=>{
  await more(page);await follow(page,'/grammar');await follow(page,'/grammar/n5/00');await follow(page,'/grammar/n5/00/1');
  await page.locator('a[href^="#/grammar/n5/00/practice"]:visible').first().click();await screen(page,'/grammar/n5/00/practice');await expect(page.locator('app-grammar-practice')).toBeVisible();await noOverflow(page);await back(page,'/grammar/n5/00');
});
test('Global tools, settings and account access',async({page})=>{
  await more(page);await follow(page,'/weaknesses');await back(page,'/more');await follow(page,'/stats');await back(page,'/more');await follow(page,'/settings');
  await more(page);const account=page.locator('app-account-control a');if(await account.count()){await account.click();await screen(page,'/auth');await page.getByRole('link',{name:/Cerrar|Volver/}).first().click();await screen(page,'/more');}else{await page.goto('/#/auth?return=/more');await screen(page,'/auth');await expect(page.locator('#auth-title')).toBeVisible();await page.getByRole('link',{name:'Cerrar',exact:true}).click();await screen(page,'/more');}
});
test('Priority screens have titles and no horizontal overflow',async({page})=>{
  const audio:string[]=[];page.on('request',request=>{if(/\.mp3(?:\?|$)/.test(request.url()))audio.push(request.url());});
  for(const path of ['/','/more','/vocabulary','/kanji','/stats','/weaknesses','/grammar','/grammar/n5/00/practice','/manga']){await page.goto('/#'+path);await screen(page,path);await expect(page.locator('main').first()).toBeVisible();await noOverflow(page);}
  expect(audio).toEqual([]);
});
test('Shared headers respect all existing themes and 44px touch targets',async({page})=>{
  await more(page);
  for(const theme of ['dark','light','nora','nora-dark','anime']){
    await page.evaluate(theme=>localStorage.setItem('kana-study.settings.v1',JSON.stringify({language:'es',theme})),theme);await page.reload();await expect(page.locator('html')).toHaveAttribute('data-theme',theme);
    for(const path of ['/more','/kanji']){await page.goto('/#'+path);await screen(page,path);await noOverflow(page);const shell=await page.locator('main.page-shell').boundingBox();expect(shell?.width).toBeLessThanOrEqual(page.viewportSize()!.width-19);const header=page.locator('app-page-header');await expect(header.locator('h1')).toBeVisible();for(const button of await header.locator('a').all()){const box=await button.boundingBox();expect(box?.width).toBeGreaterThanOrEqual(44);expect(box?.height).toBeGreaterThanOrEqual(44);}}
  }
});

test('Listening requests only the current audio after starting a session',async({page})=>{
  const requests:string[]=[];page.on('request',request=>{if(/\.mp3(?:\?|$)/.test(request.url()))requests.push(request.url());});
  await page.goto('/#/vocabulary/listening');await screen(page,'/vocabulary/listening');expect(requests).toEqual([]);
  await page.getByRole('button',{name:'Empezar',exact:true}).click();await expect.poll(()=>requests.length).toBeGreaterThan(0);expect(new Set(requests).size).toBe(1);
});

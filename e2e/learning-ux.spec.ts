import {test,expect,Page} from '@playwright/test';

async function configure(page:Page, direction='kana-to-romaji') {
  await page.route('**/supabase-config.js',r=>r.fulfill({contentType:'text/javascript',body:'window.__KANA_STUDY_CONFIG__={};'}));
  await page.addInitScript(direction=>{
    localStorage.setItem('kana-study.settings.v1',JSON.stringify({language:'es',theme:'dark',learning:{
      categories:{hiragana:{basic:true,dakuten:false,handakuten:false,combination:false},katakana:{basic:false,dakuten:false,handakuten:false,combination:false}},questionTypes:[direction]}}));
    localStorage.setItem('kana-study.rush.kana-settings.v1',JSON.stringify({selectedContentIds:['hiragana:basic'],questionTypes:['kana-to-romaji']}));
    Math.random=()=>.999999;
  },direction);
}
async function start(page:Page,quick=false) {
  await page.goto('/#/');await page.locator('.learn-button').click();
  await page.locator('app-learning-start-panel .mode').nth(quick?0:1).click();
  await expect(page.locator('app-learn-page .exercise')).toBeVisible();
  await page.locator('.prompt').click();
}
const events=(page:Page)=>page.evaluate(()=>JSON.parse(localStorage.getItem('kana-study.review-events.v1')??'[]').length);

test('Kana completes a full compatible session with keyboard and records exactly one event per answer',async({page})=>{
  await configure(page);await start(page);await page.keyboard.press('1');expect(await events(page)).toBe(0);
  for(let count=1;count<=10;count++) {
    await page.keyboard.press('Space');await expect(page.locator('.ratings button')).toHaveCount(3);
    await page.keyboard.down('3');await page.keyboard.down('3');await page.keyboard.up('3');
    await expect.poll(()=>events(page)).toBe(count);
    await expect(page.locator('.ratings button')).toHaveCount(0);
    while(await page.locator('.medal-unlock-dialog').count()) {
      const title=await page.locator('.medal-unlock-dialog h2').textContent();
      await page.keyboard.press('Escape');
      await expect.poll(async()=>await page.locator('.medal-unlock-dialog').count()?page.locator('.medal-unlock-dialog h2').textContent():null).not.toBe(title);
    }
  }
  await expect(page.locator('.results')).toBeVisible();await page.keyboard.press('Space');await page.keyboard.press('3');expect(await events(page)).toBe(10);
  const progress=await page.evaluate(()=>Object.values(JSON.parse(localStorage.getItem('kana-study.study-progress.v2')??'{}')));
  expect(progress).toHaveLength(10);expect(progress.every((p:any)=>p.fsrs&&p.lastRating==='good')).toBe(true);
});

test('Kana quick numbers follow the real option order and wait for feedback continuation',async({page})=>{
  await configure(page);await start(page,true);const first=await page.locator('.option-label').first().textContent();
  await page.keyboard.down('1');await page.keyboard.down('1');await page.keyboard.up('1');await expect(page.locator('.feedback')).toContainText('La respuesta');
  await expect.poll(()=>events(page)).toBe(1);await page.keyboard.press('2');await page.keyboard.press('Space');expect(await events(page)).toBe(1);
  expect(first?.trim()).toBeTruthy();await page.getByRole('button',{name:'Continuar',exact:true}).focus();await page.keyboard.press('Enter');await expect(page.locator('.feedback')).toHaveCount(0);
});

test('native button Space is preserved and never performs two actions',async({page})=>{
  await configure(page);await start(page);await page.locator('.reveal').focus();await page.keyboard.press('Space');await expect(page.locator('.ratings')).toBeVisible();expect(await events(page)).toBe(0);
  await page.locator('.ratings .good').focus();await page.keyboard.press('Space');await expect.poll(()=>events(page)).toBe(1);
});

test('text, editable content and IME do not trigger Kana shortcuts',async({page})=>{
  await configure(page);await start(page);
  for(const tag of ['input','textarea','editable']) {
    await page.evaluate(tag=>{const e=document.createElement(tag==='editable'?'div':tag);e.id='typing-fixture';if(tag==='editable')e.contentEditable='true';document.querySelector('.exercise')!.append(e);e.focus();},tag);
    await page.keyboard.type('romaji 123 ');await expect(page.locator('.reveal')).toBeVisible();expect(await events(page)).toBe(0);await page.locator('#typing-fixture').evaluate(e=>e.remove());
  }
  await page.evaluate(()=>document.dispatchEvent(new KeyboardEvent('keydown',{key:' ',code:'Space',isComposing:true,bubbles:true,cancelable:true})));
  await expect(page.locator('.reveal')).toBeVisible();expect(await events(page)).toBe(0);
});

test('drawing and its native controls own keys; the next Kana clears its ink',async({page})=>{
  await configure(page,'romaji-to-kana');await start(page);const svg=page.locator('svg.writing-surface');await expect(svg).toBeVisible();
  await expect(page.locator('app-japanese-writing-canvas .status')).toHaveCount(0);const box=(await svg.boundingBox())!;
  await page.mouse.move(box.x+box.width*.25,box.y+box.height*.25);await page.mouse.down();await page.mouse.move(box.x+box.width*.7,box.y+box.height*.7);
  await page.keyboard.press('Space');await page.keyboard.press('3');await expect(page.locator('.reveal')).toBeVisible();expect(await events(page)).toBe(0);await page.mouse.up();
  await page.getByRole('button',{name:'Deshacer',exact:true}).focus();await page.keyboard.press('Space');await expect(svg.locator('.ink')).toHaveCount(0);await expect(page.locator('.reveal')).toBeVisible();
  await page.locator('.prompt').click();await page.keyboard.press('Space');await expect(page.locator('.revealed-answer')).toBeVisible();await page.keyboard.press('3');await expect.poll(()=>events(page)).toBe(1);await expect(svg.locator('.ink')).toHaveCount(0);
});

test('Kana exit modal captures focus and Escape without grading behind it',async({page})=>{
  await configure(page);await start(page);await page.keyboard.press('Space');await page.keyboard.press('3');await expect.poll(()=>events(page)).toBe(1);
  if(await page.locator('.medal-unlock-dialog').count())await page.keyboard.press('Escape');
  const close=page.locator('.session-header button:last-child');await close.click();const dialog=page.locator('.exit-dialog');await expect(dialog).toBeVisible();
  await page.keyboard.press('1');expect(await events(page)).toBe(1);await expect(dialog).toBeVisible();await page.keyboard.press('Escape');await expect(dialog).toHaveCount(0);await expect(close).toBeFocused();
});

for(const module of ['kana','kanji','vocabulary']) test(`${module} learning panel traps Tab, restores focus and closes with Escape`,async({page})=>{
  await configure(page);await page.goto('/#/'+(module==='kana'?'':module));const opener=page.locator(module==='kana'?'.learn-button':'.play-button');await opener.click();
  const panel=page.locator(module==='kana'?'app-learning-start-panel .panel':`app-${module}-start-panel .panel`);await expect(panel).toBeVisible();
  const controls=panel.locator('a[href],button:enabled');await controls.first().focus();await page.keyboard.press('Shift+Tab');await expect(controls.last()).toBeFocused();await page.keyboard.press('Tab');await expect(controls.first()).toBeFocused();
  await page.keyboard.press('Escape');await expect(panel).toHaveCount(0);await expect(opener).toBeFocused();
});

test('Kana writing uses the existing two ratings and hides keyboard hints on narrow screens',async({page})=>{
  await configure(page);await page.goto('/#/writing');await page.locator('.configuration .primary').click();await expect(page.locator('.practice')).toBeVisible();await expect(page.locator('app-kana-writing-canvas .status')).toHaveCount(0);
  await page.keyboard.press('1');await expect(page.locator('.answer')).toHaveCount(0);await page.keyboard.press('Space');await expect(page.locator('.answer .choices button')).toHaveCount(2);
  if(page.viewportSize()!.width<700)await expect(page.locator('.answer .shortcut').first()).toBeHidden();
  await page.keyboard.press('2');await expect(page.locator('.answer')).toHaveCount(0);await expect(page.locator('.progress')).toContainText('1 /');
});

test('Kana RUSH Space only reveals and existing Enter advances without inventing grades',async({page})=>{
  await configure(page);await page.goto('/#/rush');await expect(page.locator('.rush-shell')).toBeVisible();await page.keyboard.press('Space');await expect(page.locator('.answer')).toBeVisible();
  await page.keyboard.press('Space');await page.keyboard.press('1');await expect(page.locator('.counter')).toContainText('0');
  await page.keyboard.press('Enter');await expect(page.locator('.counter')).toContainText('1');await expect(page.locator('.answer')).toHaveCount(0);
});

for(const module of ['kana','kanji','vocabulary']) test(`${module} reference keeps its specific content and returns focus on Escape`,async({page})=>{
  await configure(page);await page.goto('/#/'+(module==='kana'?'cards':module+'/all'));
  const opener=page.locator(module==='kana'?'app-kana-card button':'.card').first();await opener.click();
  const dialog=page.locator('[data-learning-reference]');await expect(dialog).toBeVisible();
  if(module==='kana') {await expect(dialog.locator('app-kana-writing-canvas')).toBeVisible();await expect(dialog.locator('h2[lang=ja]')).toBeVisible();}
  if(module==='kanji') {await expect(dialog.locator('.readings')).toBeVisible();expect(await dialog.locator('.examples article').count()).toBeGreaterThan(0);}
  if(module==='vocabulary') {await expect(dialog.locator('.reading')).toBeVisible();await expect(dialog.locator('.directions')).toBeVisible();}
  await page.keyboard.press('Escape');await expect(dialog).toHaveCount(0);await expect(opener).toBeFocused();
});

test('Escape closes the Kana reference without also closing its background search',async({page})=>{
  await configure(page);await page.goto('/#/cards');await page.locator('.browse-header button').last().click();
  const search=page.locator('.browse-header input');await search.fill('ka');
  const opener=page.locator('app-kana-card button').first();await opener.click();await expect(page.locator('dialog[open]')).toBeVisible();
  await page.keyboard.press('Escape');await expect(page.locator('dialog[open]')).toHaveCount(0);await expect(search).toHaveValue('ka');await expect(opener).toBeFocused();
});

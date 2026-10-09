import {test,expect,Page} from '@playwright/test';
const protectedKeys=['kana-study.study-progress.v2','kana-study.review-events.v1','kana-study.kanji-progress.v1','kana-study.kanji-review-events.v1'];
async function snapshot(page:Page){return page.evaluate(keys=>keys.map(key=>localStorage.getItem(key)),protectedKeys);}
async function configure(page:Page,module:'kana'|'kanji',direction:string,content?:string[]){
  await page.route('**/supabase-config.js',route=>route.fulfill({contentType:'text/javascript',body:'window.__KANA_STUDY_CONFIG__ = {};'}));
  await page.addInitScript(({module,direction,content})=>{
    localStorage.setItem('kana-study.settings.v1',JSON.stringify({language:'es',theme:'dark'}));
    localStorage.setItem(`kana-study.rush.${module}-settings.v1`,JSON.stringify({selectedContentIds:content??(module==='kana'?['hiragana:basic']:['N5']),questionTypes:[direction]}));
    // Keep the real engine/shuffle with reproducible order across cycles.
    Math.random=()=>0.999999;
  },{module,direction,content});
  await page.goto(module==='kana'?'/#/rush':'/#/kanji/rush');
  await expect(page.locator('.rush-shell')).toBeVisible();
}
async function dismissMedal(page:Page){
  await expect(page.locator('.action')).toBeEnabled();
  const close=page.locator('.medal-toast button');if(await close.isVisible())await close.click();
}
async function draw(page:Page,pointerType='mouse'){
  const svg=page.locator('svg.writing-surface');await svg.scrollIntoViewIfNeeded();
  if(pointerType==='mouse'){
    const box=(await svg.boundingBox())!;await page.mouse.move(box.x+box.width*.2,box.y+box.height*.3);await page.mouse.down();await page.mouse.move(box.x+box.width*.7,box.y+box.height*.7,{steps:5});await page.mouse.up();
  }else await svg.evaluate((element,pointerType)=>{
    const box=element.getBoundingClientRect();
    for(const [type,x,y] of [['pointerdown',.2,.3],['pointermove',.7,.7],['pointerup',.7,.7]] as const)
      element.dispatchEvent(new PointerEvent(type,{bubbles:true,cancelable:true,pointerId:1,pointerType,button:0,buttons:type==='pointerup'?0:1,clientX:box.x+box.width*x,clientY:box.y+box.height*y,pressure:.5}));
  },pointerType);
  await expect(svg.locator('.ink')).toHaveCount(1);
}
for(const module of ['kana','kanji'] as const){
  test(`${module} RUSH writing preserves reveal/Next, controls, timing and finish`,async({page},info)=>{
    await configure(page,module,module==='kana'?'romaji-to-kana':'meaning-to-kanji');
    await expect(page.locator('app-learning-writing-prompt')).toBeVisible();
    await expect(page.locator('.answer,svg .model,svg clipPath')).toHaveCount(0);
    await expect(page.locator('.counter')).toContainText('0');const before=await snapshot(page);
    for(const pointer of ['mouse','touch','pen']){
      await draw(page,pointer);expect(await snapshot(page)).toEqual(before);
      await page.getByRole('button',{name:'Deshacer',exact:true}).focus();await page.keyboard.press('Enter');
      await expect(page.locator('svg .ink,.answer')).toHaveCount(0);
    }
    await draw(page);await page.getByRole('button',{name:'Limpiar',exact:true}).focus();await page.keyboard.press('Space');
    await expect(page.locator('svg .ink,.answer')).toHaveCount(0);await draw(page);
    expect(await page.locator('svg.writing-surface').evaluate(e=>getComputedStyle(e).touchAction)).toBe('none');
    expect(await page.locator('.rush-shell').evaluate(e=>getComputedStyle(e).touchAction)).toBe('auto');
    for(const theme of ['dark','light','nora','nora-dark','anime']){
      await page.evaluate(theme=>document.documentElement.setAttribute('data-theme',theme),theme);
      expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
      await page.screenshot({path:info.outputPath(`${module}-${theme}.png`),fullPage:true});
    }
    await page.locator('.action').click();await expect(page.locator('.answer')).toBeVisible();
    await expect(page.locator('svg .ink')).toHaveCount(1);await expect(page.locator('.counter')).toContainText('0');
    await expect(page.getByRole('button',{name:'Ver trazos',exact:true})).toBeVisible();
    await page.locator('.action').click();await expect(page.locator('.counter')).toContainText('1');await dismissMedal(page);
    await expect(page.locator('.answer,svg .ink,svg .model,svg clipPath')).toHaveCount(0);
    // No drawing is required on the following question.
    await page.locator('.action').click();await expect(page.locator('.answer')).toBeVisible();
    await page.locator('.action').click();await expect(page.locator('.counter')).toContainText('2');
    await page.locator('.back').click();await expect(page.locator('.summary')).toBeVisible();
    await expect(page.locator('.summary-grid div').nth(1).locator('strong')).toHaveText('2');
    expect(await snapshot(page)).toEqual(before);
  });
  test(`${module} opposite RUSH direction retains its existing UI`,async({page})=>{
    await configure(page,module,module==='kana'?'kana-to-romaji':'kanji-to-meaning');
    await expect(page.locator('app-learning-writing-prompt')).toHaveCount(0);
    await page.locator('.action').click();await expect(page.locator('.answer')).toBeVisible();
    await page.locator('.action').click();await expect(page.locator('.counter')).toContainText('1');
  });
}
test('Kanji RUSH remains drawable and revealable when graphical resources fail',async({page})=>{
  await page.route('**/vocabulary-writing/*.json',route=>route.fulfill({status:404,body:''}));
  await configure(page,'kanji','meaning-to-kanji');
  await expect(page.locator('app-learning-writing-prompt [role="status"]')).toBeVisible();
  await draw(page);await page.locator('.action').click();await expect(page.locator('.answer')).toBeVisible();
  await page.locator('.action').click();await expect(page.locator('.counter')).toContainText('1');await expect(page.locator('svg .ink')).toHaveCount(0);
});

test('Kana cycle repeats the same prompt with cleared ink and hidden reference',async({page})=>{
  await configure(page,'kana','romaji-to-kana',['hiragana:handakuten']);
  const first=await page.locator('.question').textContent();
  for(let count=1;count<=5;count++){
    await draw(page);await page.locator('.action').click();await expect(page.locator('.answer')).toBeVisible();
    await page.locator('.action').click();await expect(page.locator('.counter')).toContainText(String(count));await dismissMedal(page);
    await expect(page.locator('svg .ink,svg .model,svg clipPath,.answer')).toHaveCount(0);
  }
  await expect(page.locator('.question')).toHaveText(first!);
});

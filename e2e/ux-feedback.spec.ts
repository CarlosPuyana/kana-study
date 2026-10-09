import {test,expect,Page} from '@playwright/test';

test.beforeEach(async({page})=>{
  await page.route('**/supabase-config.js',route=>route.fulfill({contentType:'text/javascript',body:'window.__KANA_STUDY_CONFIG__ = {};'}));
  await page.addInitScript(()=>{
    if(!localStorage.getItem('kana-study.settings.v1'))localStorage.setItem('kana-study.settings.v1',JSON.stringify({language:'es',theme:'dark',learning:{categories:{hiragana:{basic:true,dakuten:false,handakuten:false,combination:false},katakana:{basic:false,dakuten:false,handakuten:false,combination:false}},questionTypes:['romaji-to-kana']}}));
    if(!localStorage.getItem('kana-study.kanji-selection.v1'))localStorage.setItem('kana-study.kanji-selection.v1',JSON.stringify({levels:{N5:true},questionTypes:['meaning-to-kanji']}));
  });
});
async function draw(page:Page){
  const svg=page.locator('app-learning-writing-prompt svg'),box=(await svg.boundingBox())!;
  await page.mouse.move(box.x+box.width*.2,box.y+box.height*.3);await page.mouse.down();
  await page.mouse.move(box.x+box.width*.7,box.y+box.height*.7,{steps:5});await page.mouse.up();
  await expect(svg.locator('.ink')).toHaveCount(1);
}
async function noOverflow(page:Page){expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);}
async function drawingThemes(page:Page,info:{outputPath:(name:string)=>string},prefix:string){
  for(const theme of ['dark','light','nora','nora-dark','anime']){
    await page.evaluate(theme=>document.documentElement.setAttribute('data-theme',theme),theme);
    await noOverflow(page);await page.screenshot({path:info.outputPath(`${prefix}-${theme}.png`),fullPage:true});
  }
}
const protectedKeys=['kana-study.study-progress.v2','kana-study.review-events.v1','kana-study.kanji-progress.v1','kana-study.kanji-review-events.v1','kana-study.grammar-progress.v2','kana-study.completed-sessions.v1','kana-study.weaknesses.v1'];
async function snapshot(page:Page){return page.evaluate(keys=>keys.map(key=>localStorage.getItem(key)),protectedKeys);}

test('Kana quick drawing has no grading side effects, accessible skip keeps options and next question clears ink',async({page},info)=>{
  await page.goto('/#/');await page.locator('.learn-button').click();await page.locator('app-learning-start-panel .mode').first().click();
  await expect(page.locator('app-learning-writing-prompt')).toBeVisible();await expect(page.locator('.options')).toHaveCount(0);
  const before=await snapshot(page);await draw(page);expect(await snapshot(page)).toEqual(before);
  await expect(page.locator('svg .model,svg clipPath')).toHaveCount(0);
  await page.getByRole('button',{name:'Deshacer',exact:true}).click();await expect(page.locator('svg .ink')).toHaveCount(0);
  await draw(page);await page.getByRole('button',{name:'Limpiar',exact:true}).click();await expect(page.locator('svg .ink')).toHaveCount(0);
  await draw(page);await drawingThemes(page,info,'kana-drawing');
  await page.getByRole('button',{name:'Continuar sin dibujar',exact:true}).click();await expect(page.locator('.options')).toBeVisible();expect(await snapshot(page)).toEqual(before);
  await page.locator('.options button').first().click();await expect(page.locator('.feedback')).toBeVisible();
  expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('kana-study.review-events.v1')??'[]').length)).toBe(1);
  await page.getByRole('button',{name:'Continuar',exact:true}).click();await expect(page.locator('svg .ink')).toHaveCount(0);await expect(page.locator('.options')).toHaveCount(0);
});

test('Kanji self assessment hides reference until reveal and preserves all three ratings',async({page},info)=>{
  await page.goto('/#/kanji');await page.locator('.play-button').click();await page.locator('app-kanji-start-panel .secondary-start').click();
  await expect(page.locator('app-learning-writing-prompt')).toBeVisible();const before=await snapshot(page);await draw(page);expect(await snapshot(page)).toEqual(before);
  await expect(page.locator('svg .model,svg clipPath')).toHaveCount(0);await page.locator('.reveal').click();await expect(page.locator('.ratings button')).toHaveCount(3);
  await expect(page.locator('svg .ink')).toHaveCount(1);await expect(page.locator('.answer-char')).toBeVisible();await noOverflow(page);
  await drawingThemes(page,info,'kanji-revealed');await page.locator('.ratings .yes').click();
  await expect(page.locator('svg .ink')).toHaveCount(0);await expect(page.locator('svg .model')).toHaveCount(0);
  expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('kana-study.kanji-review-events.v1')??'[]').length)).toBe(1);
});

test('Grammar vocabulary and offline dictionary fit all five themes and three languages without changing learning data',async({page},info)=>{
  await page.goto('/#/grammar/n5/01/sentence-structure-context');
  for(const language of ['es','en','ca']){
    await page.evaluate(language=>{const key='kana-study.settings.v1',settings=JSON.parse(localStorage.getItem(key)!);settings.language=language;localStorage.setItem(key,JSON.stringify(settings));},language);
    await page.reload();await page.locator('.vocabulary-note summary').click();await expect(page.locator('.vocabulary-list li')).toHaveCount(8);
    await page.locator('app-grammar-intended-vocabulary .toggle').click();await expect(page.locator('.vocabulary-list li')).toHaveCount(12);
    await page.locator('app-grammar-intended-vocabulary .toggle').click();await expect(page.locator('.vocabulary-list li')).toHaveCount(8);
    const before=await snapshot(page);await page.context().setOffline(true);
    for(const theme of ['dark','light','nora','nora-dark','anime']){
      await page.evaluate(theme=>document.documentElement.setAttribute('data-theme',theme),theme);
      await page.locator('.vocabulary-list .word').first().click();const panel=page.locator('.japanese-dictionary-panel');await expect(panel).toBeVisible();
      await expect(panel).toContainText('学生');await expect(panel).not.toContainText(/grammar\.|learningWriting\./);
      const bounds=(await panel.boundingBox())!,viewport=page.viewportSize()!;expect(bounds.x).toBeGreaterThanOrEqual(0);expect(bounds.x+bounds.width).toBeLessThanOrEqual(viewport.width);expect(bounds.y+bounds.height).toBeLessThanOrEqual(viewport.height);
      await noOverflow(page);await page.screenshot({path:info.outputPath(`grammar-${language}-${theme}.png`)});
      await page.keyboard.press('Escape');await expect(panel).toHaveCount(0);
    }
    expect(await snapshot(page)).toEqual(before);await page.context().setOffline(false);
    await page.locator('.vocabulary-list .word').first().focus();await page.keyboard.press('Enter');await expect(page.locator('.japanese-dictionary-panel button')).toBeFocused();
    await page.keyboard.press('Escape');await expect(page.locator('.vocabulary-list .word').first()).toBeFocused();
    await page.locator('.lesson-heading-card h2').click();await expect(page.locator('.japanese-dictionary-panel')).toHaveCount(0);
  }
});

test('RUSH modals have resolved ES EN CA labels; writing always names its script',async({page},info)=>{
  await page.goto('/#/');
  for(const [language,n5] of [['es','Kanji N5'],['en','N5 Kanji'],['ca','Kanji N5']]){
    await page.evaluate(language=>{const key='kana-study.settings.v1',settings=JSON.parse(localStorage.getItem(key)!);settings.language=language;localStorage.setItem(key,JSON.stringify(settings));},language);
    await page.reload();
    for(const route of ['/','/kanji','/vocabulary']){
      await page.goto('/#'+route);await expect(page.locator((route==='/'?'app-home-page':route==='/kanji'?'app-kanji-page':'app-vocabulary-page')+' main')).toBeVisible();
      await page.locator('button.rush-button').click();const dialog=page.locator('app-rush-config-dialog [role="dialog"]');await expect(dialog).toBeVisible();
      await expect(dialog).not.toContainText(/(?:kanji|rush|content|vocabulary|learn)\.[\w.-]+/);
      if(route==='/kanji')await expect(dialog).toContainText(n5);await noOverflow(page);
      await page.screenshot({path:info.outputPath(`rush-${language}-${route.replaceAll('/','')||'kana'}.png`),fullPage:true});await page.keyboard.press('Escape');await expect(dialog).toHaveCount(0);
    }
  }
  await page.goto('/#/writing');await page.getByRole('button',{name:'Començar',exact:true}).click();await expect(page.locator('.script-label')).toContainText('Hiragana');await noOverflow(page);
});

test('installed offline dictionary stays read-only, retains unrelated imports and bounds long glosses',async({page})=>{
  await page.goto('/#/grammar/n5/01/sentence-structure-context');await expect(page.locator('.lesson-heading-card')).toBeVisible();
  await page.evaluate(async()=>{
    const db=await new Promise<IDBDatabase>((resolve,reject)=>{
      const request=indexedDB.open('kana-study-dictionary',1);
      request.onupgradeneeded=()=>{request.result.createObjectStore('metadata',{keyPath:'id'});const terms=request.result.createObjectStore('terms',{keyPath:'id'});terms.createIndex('expression',['dictionaryId','expression']);terms.createIndex('reading',['dictionaryId','reading']);terms.createIndex('dictionaryId','dictionaryId');};
      request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);
    });
    await new Promise<void>((resolve,reject)=>{
      const tx=db.transaction(['metadata','terms'],'readwrite');tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);
      tx.objectStore('metadata').put({id:'active',dictionaryId:'ux-fixture',title:'Local layout fixture',revision:'1',count:1,status:'ready',updatedAt:new Date().toISOString()});
      tx.objectStore('metadata').put({id:'untouched-import',dictionaryId:'untouched-import',title:'Unrelated staged import',revision:'1',count:0,status:'installing',updatedAt:'1970-01-01T00:00:00Z'});
      tx.objectStore('terms').put({id:'ux-term',dictionaryId:'ux-fixture',expression:'学生',reading:'がくせい',glossaries:Array.from({length:4},(_,i)=>`Layout glossary ${i}: ${'local text '.repeat(100)}`),definitionTags:'',rules:'',score:1,sequence:1,termTags:''});
    });db.close();
  });
  const example=page.locator('app-grammar-v2-lesson p.japanese').filter({hasText:'学生'}).first();
  await example.scrollIntoViewIfNeeded();
  const point=await example.evaluate(element=>{const node=element.firstChild!,index=node.textContent!.indexOf('学生'),range=document.createRange();range.setStart(node,index);range.setEnd(node,index+2);const rect=range.getBoundingClientRect();return {x:rect.left+rect.width/2,y:rect.top+rect.height/2};});
  await page.mouse.click(point.x,point.y);await expect(page.locator('.japanese-dictionary-panel')).toContainText('がくせい');await page.keyboard.press('Escape');
  await example.evaluate(element=>{const node=element.firstChild!,index=node.textContent!.indexOf('学生'),range=document.createRange();range.setStart(node,index);range.setEnd(node,index+2);getSelection()!.removeAllRanges();getSelection()!.addRange(range);});
  await expect(page.locator('.japanese-dictionary-panel')).toContainText('がくせい');await page.keyboard.press('Escape');await page.evaluate(()=>getSelection()?.removeAllRanges());
  await page.locator('.vocabulary-note summary').click();const before=await snapshot(page);await page.context().setOffline(true);
  await page.locator('.vocabulary-list .word').first().click();const panel=page.locator('.japanese-dictionary-panel');await expect(panel).toBeVisible();await expect(panel.locator('li')).toHaveCount(3);
  await expect(panel).toContainText('がくせい');const box=(await panel.boundingBox())!;expect(box.y+box.height).toBeLessThanOrEqual(page.viewportSize()!.height);
  expect(await panel.evaluate(element=>element.scrollHeight>element.clientHeight)).toBe(true);await noOverflow(page);
  await page.keyboard.press('Escape');expect(await snapshot(page)).toEqual(before);
  expect(await page.evaluate(async()=>{
    const db=await new Promise<IDBDatabase>(resolve=>{const request=indexedDB.open('kana-study-dictionary',1);request.onsuccess=()=>resolve(request.result);});
    const found=await new Promise<boolean>(resolve=>{const request=db.transaction('metadata').objectStore('metadata').get('untouched-import');request.onsuccess=()=>resolve(!!request.result);});db.close();return found;
  })).toBe(true);
  await page.locator('.exercise-option').first().click();await expect(panel).toHaveCount(0);await page.context().setOffline(false);
});


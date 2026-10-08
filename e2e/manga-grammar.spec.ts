import {test,expect,Page} from '@playwright/test';

async function selection(page:Page){
  await page.evaluate(()=>{
    const line=document.querySelector('.ocr-line')!;const range=document.createRange();range.selectNodeContents(line);
    const selection=window.getSelection()!;selection.removeAllRanges();selection.addRange(range);document.dispatchEvent(new Event('selectionchange'));
  });
  await expect(page.getByRole('dialog')).toBeVisible();await page.getByRole('button',{name:'Gramática',exact:true}).click();
  await expect(page.locator('app-manga-grammar-reference input')).toBeVisible();
}
test('local Manga grammar reference, exercises and return to the original page',async({page},info)=>{
  const requests:string[]=[];page.on('request',request=>{if(/workers\.dev|supabase\.co/.test(request.url()))requests.push(request.url());});
  await page.route('**/supabase-config.js',route=>route.fulfill({contentType:'text/javascript',body:'window.__KANA_STUDY_CONFIG__ = {};'}));
  await page.addInitScript(()=>{
    localStorage.setItem('kana-study.settings.v1',JSON.stringify({language:'es',theme:'dark'}));
    localStorage.setItem('kana-study.manga-reader.preferences.v1',JSON.stringify({dictionaryEnabled:true,showOcr:true,fitMode:'width'}));
  });
  await page.goto('/#/manga');
  await page.evaluate(async()=>{
    const db=await new Promise<IDBDatabase>((resolve,reject)=>{const req=indexedDB.open('kana-study-manga',1);
      req.onupgradeneeded=()=>{req.result.createObjectStore('volumes',{keyPath:'id'});req.result.createObjectStore('pages',{keyPath:['volumeId','pageIndex']}).createIndex('volumeId','volumeId');req.result.createObjectStore('reading-progress',{keyPath:'volumeId'});};req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);});
    const image=new Blob(['<svg xmlns="http://www.w3.org/2000/svg" width="400" height="500"><rect width="400" height="500" fill="white"/></svg>'],{type:'image/svg+xml'});
    const ocr={img_path:'page.svg',img_width:400,img_height:500,blocks:[{box:[30,40,350,80],vertical:false,font_size:24,lines:['見てください。'],lines_coords:[[[30,40],[350,40],[350,80],[30,80]]]}]};
    const date=new Date().toISOString();await new Promise<void>((resolve,reject)=>{const tx=db.transaction(['volumes','pages','reading-progress'],'readwrite');tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);
      tx.objectStore('volumes').put({id:'grammar-fixture',seriesTitle:'Grammar fixture',title:'Local manga',pageCount:2,storageBytes:image.size*2,mokuro:{version:'0.2.0',title:'Local manga',volume:'1'},createdAt:date,updatedAt:date,complete:true});
      for(const pageIndex of [0,1])tx.objectStore('pages').put({volumeId:'grammar-fixture',pageIndex,image,ocr});
      tx.objectStore('reading-progress').put({volumeId:'grammar-fixture',pageIndex:0,activeSeconds:0,completed:false,lastOpenedAt:date,updatedAt:date});
    });db.close();
  });
  await page.goto('/#/manga/read/grammar-fixture?page=2');await expect(page.locator('.page-counter')).toHaveText('2 / 2');
  const keys=['kana-study.grammar-progress.v1','kana-study.grammar-progress.v2','kana-study.weaknesses.v1','kana-study.completed-sessions.v1','kana-study.manga-review-events.v1','kana-study.manga-fsrs-settings.v1'];
  const before=await page.evaluate(keys=>keys.map(key=>localStorage.getItem(key)),keys);
  await page.context().setOffline(true);await selection(page);const reference=page.locator('app-manga-grammar-reference');
  await expect(reference).toContainText('Coincidencia verificada');await page.context().setOffline(false);await reference.locator('.result').first().click();
  await expect(reference.getByRole('link',{name:'Practicar',exact:true})).toHaveAttribute('href',/lesson=te-kudasai/);
  expect(await page.evaluate(keys=>keys.map(key=>localStorage.getItem(key)),keys)).toEqual(before);
  for(const theme of ['dark','light','nora','nora-dark','anime']){
    await page.evaluate(theme=>document.documentElement.setAttribute('data-theme',theme),theme);
    const dialog=page.getByRole('dialog');expect(await dialog.evaluate(el=>el.scrollWidth<=el.clientWidth+1)).toBe(true);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
    await page.screenshot({path:info.outputPath(`grammar-${theme}.png`),fullPage:true});
  }
  await page.context().setOffline(true);await reference.locator('input').fill('ください');await expect(reference.locator('.result')).not.toHaveCount(0);await page.context().setOffline(false);
  await reference.locator('.result').first().click();await reference.getByRole('link',{name:'Ver lección',exact:true}).click();await expect(page).toHaveURL(/grammar\/n5\/07\/te-kudasai\?return=/);
  await page.getByRole('link',{name:'← Volver al manga',exact:true}).click();await expect(page).toHaveURL(/manga\/read\/grammar-fixture\?page=2$/);
  await selection(page);await reference.locator('.result').first().click();await reference.getByRole('link',{name:'Practicar',exact:true}).click();
  await expect(page).toHaveURL(/grammar\/n5\/07\/practice\?lesson=te-kudasai/);
  await page.locator('.practice-start').click();
  // Use the existing exercise controls regardless of the normal shuffled order.
  await expect(page.locator('.grammar-answer-input, .practice-option, .token-bank button').first()).toBeVisible();
  const input=page.locator('.grammar-answer-input');
  if(await input.count())await input.fill('ください');
  else if(await page.locator('.practice-option').count())await page.locator('.practice-option').first().click();
  else for(const token of await page.locator('.token-bank button').all())await token.click();
  await page.locator('.practice-check').click();
  await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem('kana-study.weaknesses.v1')??'[]').some((record:{module:string;itemId:string;attempts:number})=>record.module==='grammar'&&record.itemId==='te-kudasai'&&record.attempts===1))).toBe(true);
  await page.getByRole('link',{name:'← Volver al manga',exact:true}).click();await expect(page.locator('.page-counter')).toHaveText('2 / 2');
  await selection(page);await page.keyboard.press('Escape');await expect(page.getByRole('dialog')).toHaveCount(0);
  expect(requests).toEqual([]);
});

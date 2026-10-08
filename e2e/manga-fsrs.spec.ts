import {test,expect} from '@playwright/test';

test('Manga FSRS opt-in, reveal, two ratings, persistence and responsive themes',async({page},testInfo)=>{
  await page.addInitScript(()=>localStorage.setItem('kana-study.settings.v1',JSON.stringify({language:'es',theme:'dark'})));
  await page.goto('/#/manga');
  await page.evaluate(async()=>{
    const db=await new Promise<IDBDatabase>((resolve,reject)=>{
      const req=indexedDB.open('kana-study-manga-study',2);
      req.onupgradeneeded=()=>{for(const name of ['saved-items','sync-state','sync-meta'])if(!req.result.objectStoreNames.contains(name))req.result.createObjectStore(name,{keyPath:'id'});};
      req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);
    });
    await new Promise<void>((resolve,reject)=>{
      const tx=db.transaction('saved-items','readwrite');tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);
      tx.objectStore('saved-items').put({schemaVersion:1,id:'fixture',expression:'龍',reading:'りゅう',meaning:'dragon',surface:'龍',context:'<img src=x onerror="alert(1)">龍。',kanji:[],source:{volumeId:'fixture',pageNumber:1},createdAt:1});
    });db.close();
  });
  await page.goto('/#/manga/study/fsrs');await page.reload();
  await expect(page.getByRole('switch')).toHaveAttribute('aria-checked','false');
  await page.getByRole('switch').click();await page.getByRole('button',{name:'Comenzar repaso programado',exact:true}).click();
  await expect(page.locator('[data-rating]')).toHaveCount(0);await expect(page.locator('.answer')).toHaveCount(0);
  await expect(page.locator('blockquote img')).toHaveCount(0);
  await expect(page.locator('blockquote mark')).toHaveText('龍');
  await page.getByRole('button',{name:'Mostrar respuesta',exact:true}).focus();await page.keyboard.press('Enter');
  await expect(page.locator('[data-rating]')).toHaveCount(2);
  await expect(page.getByRole('button',{name:'Otra vez',exact:true})).toBeFocused();
  await expect(page.getByRole('button',{name:/^(Difícil|Fácil)$/})).toHaveCount(0);
  for(const theme of ['dark','light','nora','nora-dark','anime']){
    await page.evaluate(theme=>document.documentElement.setAttribute('data-theme',theme),theme);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
    for(const button of await page.locator('app-manga-fsrs-page button').all()){const box=await button.boundingBox();expect(box!.height).toBeGreaterThanOrEqual(44);}
    await page.screenshot({path:testInfo.outputPath(`ratings-${theme}.png`),fullPage:true});
  }
  await page.getByRole('button',{name:'Bien',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Repaso programado completado'})).toBeVisible();
  const before=await page.evaluate(()=>({events:JSON.parse(localStorage.getItem('kana-study.manga-review-events.v1')!),sessions:JSON.parse(localStorage.getItem('kana-study.completed-sessions.v1')!)}));
  expect(before.events).toHaveLength(1);expect(before.events[0]).toMatchObject({reviewKind:'fsrs',fsrsGrade:3,rating:'good'});
  expect(before.sessions).toHaveLength(1);expect(before.sessions[0]).toMatchObject({module:'manga',mangaSessionKind:'fsrs'});
  expect(before.sessions[0].durationSeconds).toBeLessThanOrEqual(10);
  await page.reload();await expect(page.getByRole('button',{name:'Comenzar repaso programado',exact:true})).toBeDisabled();
  await page.getByRole('switch').click();await page.reload();await expect(page.getByRole('switch')).toHaveAttribute('aria-checked','false');
  expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('kana-study.manga-review-events.v1')!))).toEqual(before.events);
});

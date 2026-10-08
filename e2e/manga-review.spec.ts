import {test,expect} from '@playwright/test';

test('Manga V3 local contextual review, repetition, persistence and mobile layout',async({page},testInfo)=>{
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
      tx.objectStore('saved-items').put({schemaVersion:1,id:'dictionary:fixture',expression:'食べる',reading:'たべる',meaning:'to eat',
        surface:'食べなかった',context:'昨日何も食べなかった。',kanji:[],source:{volumeId:'fixture',pageNumber:1},createdAt:1});
    });db.close();
  });
  // Fixture writes bypass the repository's signals; bootstrap a fresh cache only
  // after the IndexedDB transaction has committed.
  await page.goto('/#/manga/study');await page.reload();await page.getByRole('link',{name:'Repasar palabras guardadas'}).click();
  await expect(page.getByRole('button',{name:'Comenzar',exact:true})).toBeEnabled();
  await expect(page.getByText('Tiempo de estudio:',{exact:false})).toHaveCount(0);
  await page.screenshot({path:testInfo.outputPath('configuration.png'),fullPage:true});
  await page.getByRole('button',{name:'Contextual',exact:true}).click();await page.getByRole('button',{name:'Comenzar',exact:true}).click();
  await expect(page.locator('blockquote mark')).toHaveText('食べなかった');
  await expect(page.locator('blockquote')).toHaveText('昨日何も食べなかった。');
  await expect(page.getByText('Aparición 1 de 1',{exact:true})).toBeVisible();
  for(const theme of ['dark','light','nora','nora-dark','anime']){
    await page.evaluate(theme=>document.documentElement.setAttribute('data-theme',theme),theme);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
    for(const button of await page.locator('app-manga-review-page button').all()){const box=await button.boundingBox();expect(box!.height).toBeGreaterThanOrEqual(44);}
    await page.screenshot({path:testInfo.outputPath(`context-${theme}.png`),fullPage:true});
  }
  await page.screenshot({path:testInfo.outputPath('context-question.png'),fullPage:true});
  // The single saved word deliberately requires self-assessment, never invented distractors.
  await page.getByRole('button',{name:'Mostrar respuesta',exact:true}).focus();await page.keyboard.press('Enter');
  await page.getByRole('button',{name:'No la recordaba',exact:true}).click();
  await expect(page.getByRole('button',{name:'Continuar',exact:true})).toBeFocused();
  await page.getByRole('button',{name:'Continuar',exact:true}).click();
  await page.getByRole('button',{name:'Mostrar respuesta',exact:true}).click();
  await page.getByRole('button',{name:'La recordaba',exact:true}).click();
  await page.getByRole('button',{name:'Continuar',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Resultados del repaso'})).toBeVisible();
  await expect(page.getByText('0%',{exact:true})).toBeVisible();
  await expect(page.getByText('Primera vuelta: 0 de 1. La precisión no incluye repeticiones.',{exact:true})).toBeVisible();
  await page.screenshot({path:testInfo.outputPath('results.png'),fullPage:true});
  const persisted=await page.evaluate(()=>({events:JSON.parse(localStorage.getItem('kana-study.manga-review-events.v1')!),sessions:JSON.parse(localStorage.getItem('kana-study.completed-sessions.v1')!)}));
  expect(persisted.events).toHaveLength(2);expect(persisted.sessions).toHaveLength(1);expect(persisted.sessions[0].module).toBe('manga');
  expect(persisted.events.map((e:{repetition:boolean})=>e.repetition)).toEqual([false,true]);
  await page.reload();expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('kana-study.completed-sessions.v1')!).length)).toBe(1);
});

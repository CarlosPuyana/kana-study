import {test,expect,Page} from '@playwright/test';
const cases=[
 ['kana','kana-to-romaji'],['kana','romaji-to-kana'],
 ['kanji','kanji-to-meaning'],['kanji','meaning-to-kanji'],
 ['vocabulary','japanese-to-meaning'],['vocabulary','meaning-to-japanese'],['vocabulary','japanese-to-reading'],['vocabulary','reading-to-japanese'],
] as const;
const url=(module:string)=>module==='kana'?'./#/rush':`./#/${module}/rush`;

async function configure(page:Page,module:string,type:string,project:string,empty=false){
 const language=project.includes('-en-')?'en':project.includes('-ca-')?'ca':'es',theme=project.endsWith('light')?'light':project.endsWith('nora')?'nora':'dark';
 await page.addInitScript(({module,type,language,theme,empty})=>{
  localStorage.setItem('kana-study.settings.v1',JSON.stringify({language,theme}));
  localStorage.setItem(`kana-study.rush.${module}-settings.v1`,JSON.stringify({selectedContentIds:empty?[]:module==='kana'?['hiragana:handakuten']:module==='kanji'?['N5']:['nouns'],questionTypes:[type]}));
  Math.random=()=>.999999;
 },{module,type,language,theme,empty});
 await page.goto('./');
}
// A real pending IndexedDB transaction exercises loading/saving without mocking
// the session, scheduler, signals or Angular's event handlers.
async function holdStorage(page:Page){await page.evaluate(async()=>{
 const db=await new Promise<IDBDatabase>((resolve,reject)=>{const r=indexedDB.open('kana-study-rush',1);
  r.onupgradeneeded=()=>{const d=r.result,s=d.createObjectStore('sessions',{keyPath:'id'});s.createIndex('module','module');s.createIndex('startedAt','startedAt');s.createIndex('localDay','localDay');d.createObjectStore('coverage',{keyPath:['module','contentId']}).createIndex('module','module');};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);
 });
 const tx=db.transaction(['sessions','coverage'],'readwrite');let keep=true;
 const pump=()=>{const r=tx.objectStore('sessions').get('test-lock');r.onsuccess=()=>{if(keep)pump();};};pump();
 (window as any).releaseRush=()=>{keep=false;};tx.oncomplete=()=>db.close();tx.onabort=()=>db.close();
});}
async function release(page:Page){await page.evaluate(()=>(window as any).releaseRush());}
async function count(page:Page){return Number((await page.locator('.counter').innerText()).match(/\d+/)?.[0]);}
async function at(page:Page,n:number){await expect.poll(()=>count(page)).toBe(n);}
async function dismiss(page:Page){await expect(page.locator('.rush-shell .action')).toBeEnabled();const toast=page.locator('.medal-toast');while(await toast.count()){const previous=await toast.textContent();await toast.locator('button').click();await expect.poll(()=>toast.evaluateAll(nodes=>nodes[0]?.textContent??null)).not.toBe(previous);}}
async function exercise(page:Page){await page.locator('.prompt-label').click();}
async function readyWriting(page:Page){await expect(page.locator('app-japanese-writing-canvas .status')).toHaveCount(0);}
async function stats(page:Page){return page.evaluate(async()=>{
 if(!(await indexedDB.databases()).some(d=>d.name==='kana-study-rush'))return [[],[]];
 const db=await new Promise<IDBDatabase>((resolve,reject)=>{const r=indexedDB.open('kana-study-rush');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});
 try{const tx=db.transaction(['sessions','coverage']);return await Promise.all(['sessions','coverage'].map(n=>new Promise<any[]>((resolve,reject)=>{const r=tx.objectStore(n).getAll();r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);})));
 }finally{db.close();}
});}
async function protect(page:Page){
 for(const modifier of ['Control','Alt','Meta','Shift']){await page.keyboard.press(modifier+'+Space');await page.keyboard.press(modifier+'+Enter');}
 await page.evaluate(()=>{
  const target=document.querySelector('.exercise')!;
  target.dispatchEvent(new KeyboardEvent('keydown',{code:'Space',key:' ',isComposing:true,bubbles:true,cancelable:true}));
  const e=new KeyboardEvent('keydown',{code:'Space',key:' ',bubbles:true,cancelable:true});e.preventDefault();target.dispatchEvent(e);
 });
 await expect(page.locator('.answer')).toHaveCount(0);
 for(const role of ['checkbox','tab','textbox']){
  await page.evaluate(role=>{const el=document.createElement('div');el.id='owned-key';el.setAttribute('role',role);el.tabIndex=0;el.innerHTML='<span>UI control fixture</span>';document.querySelector('.exercise')!.append(el);el.focus();},role);
  await page.keyboard.press('Space');await page.keyboard.press('Enter');await expect(page.locator('.answer')).toHaveCount(0);await page.locator('#owned-key').evaluate(el=>el.remove());
 }
 for(const kind of ['input','textarea','select','editable']){
  await page.evaluate(kind=>{const el=document.createElement(kind==='editable'?'div':kind);el.id='typing';if(kind==='editable')el.setAttribute('contenteditable','true');document.querySelector('.exercise')!.append(el);el.focus();},kind);
  await page.keyboard.press('Space');await page.keyboard.press('Enter');await expect(page.locator('.answer')).toHaveCount(0);await page.locator('#typing').evaluate(el=>el.remove());
 }
 for(const native of [true,false]){
  await page.evaluate(native=>{const d=document.createElement(native?'dialog':'section');d.id='dialog-fixture';d.textContent='Modal fixture';if(native){document.body.append(d);(d as HTMLDialogElement).showModal();}else{d.setAttribute('role','dialog');d.setAttribute('aria-modal','true');document.body.append(d);}},native);
  await page.keyboard.press('Space');await page.keyboard.press('Enter');await expect(page.locator('.answer')).toHaveCount(0);
  await page.locator('#dialog-fixture').evaluate(el=>{if(el instanceof HTMLDialogElement)el.close();el.remove();});
 }
}

for(const [module,type]of cases)test(`${module}: ${type} — real keyboard, native controls, saving, touch and summary`,async({page},info)=>{
 await configure(page,module,type,info.project.name);await holdStorage(page);await page.goto(url(module));
 await expect(page.locator('.missing p')).toBeVisible();await page.keyboard.press('Space');await page.keyboard.press('Enter');await expect(page.locator('.answer,.rush-shell')).toHaveCount(0);await release(page);
 await expect(page.locator('.rush-shell')).toBeVisible();await readyWriting(page);await at(page,0);
 const primary=page.locator('.rush-shell .action');await expect(primary).toHaveAttribute('aria-keyshortcuts','Space Enter');await expect(primary.locator('kbd')).toBeVisible();
 const hint=info.project.name.includes('-en-')?'Space':info.project.name.includes('-ca-')?'Espai':'Espacio';await expect(primary.locator('kbd')).toHaveText(hint);await expect(primary.locator('kbd')).toHaveAttribute('aria-hidden','true');
 const protectedKeys=['kana-study.study-progress.v2','kana-study.review-events.v1','kana-study.kanji-progress.v1','kana-study.kanji-review-events.v1','kana-study.vocabulary-progress.v1','kana-study.vocabulary-review-events.v1'];
 const before=await page.evaluate(keys=>keys.map(k=>localStorage.getItem(k)),protectedKeys);
 await exercise(page);await protect(page);await at(page,0);
 if(type==='romaji-to-kana'||type==='meaning-to-kanji'){
  const svg=page.locator('svg.writing-surface');await svg.scrollIntoViewIfNeeded();const box=(await svg.boundingBox())!;
  await page.mouse.move(box.x+box.width*.3,box.y+box.height*.3);await page.mouse.down();await page.mouse.move(box.x+box.width*.6,box.y+box.height*.6);await page.keyboard.press('Space');await page.keyboard.press('Enter');await expect(page.locator('.answer')).toHaveCount(0);await page.mouse.up();
  const undo=page.locator('.writing-controls button').first();await undo.focus();await page.keyboard.press('Space');await expect(page.locator('svg .ink,.answer')).toHaveCount(0);
 }
 await primary.scrollIntoViewIfNeeded();await primary.screenshot({path:info.outputPath('front-hint.png')});
 await exercise(page);await page.keyboard.press('Space');await expect(page.locator('.answer')).toBeVisible();await at(page,0);
 await expect(primary).toHaveAttribute('aria-keyshortcuts','Space Enter');await expect(primary.locator('kbd')).toBeVisible();await primary.screenshot({path:info.outputPath('back-hint.png')});
 await exercise(page);await page.keyboard.down('Space');await page.keyboard.down('Space');await page.keyboard.up('Space');await at(page,1);await dismiss(page);await expect(page.locator('.answer,svg .ink')).toHaveCount(0);
 await exercise(page);await page.keyboard.press('Enter');await expect(page.locator('.answer')).toBeVisible();await page.keyboard.down('Enter');await page.keyboard.down('Enter');await page.keyboard.up('Enter');await at(page,2);await dismiss(page);await expect(page.locator('.answer')).toHaveCount(0);
 await primary.focus();await page.keyboard.press('Space');await expect(page.locator('.answer')).toBeVisible();await page.keyboard.press('Space');await at(page,3);await dismiss(page);
 await primary.focus();await page.keyboard.down('Enter');await page.keyboard.down('Enter');await expect(page.locator('.answer')).toBeVisible();await at(page,3);await page.keyboard.up('Enter');
 await primary.click();await at(page,4);await dismiss(page);
 if(info.project.use.hasTouch){await primary.tap();await expect(page.locator('.answer')).toBeVisible();await primary.tap();}else{await primary.click();await expect(page.locator('.answer')).toBeVisible();await primary.click();}
 await at(page,5);await dismiss(page);await expect(page.locator('.answer,svg .ink')).toHaveCount(0);
 // The original asynchronous save is genuinely waiting on the fixture lock.
 await primary.click();await holdStorage(page);await primary.focus();await page.keyboard.press('Enter');await expect(primary).toBeDisabled();await page.keyboard.press('Space');await page.keyboard.press('Enter');await at(page,5);await release(page);await at(page,6);await dismiss(page);
 // A failed real repository write remains manually recoverable without duplicate completion.
 await primary.click();await page.evaluate(()=>{const put=IDBObjectStore.prototype.put;let once=true;IDBObjectStore.prototype.put=function(...args:any[]){if(once&&this.name==='sessions'&&this.transaction.db.name==='kana-study-rush'){once=false;throw new DOMException('QA storage failure','QuotaExceededError');}return put.apply(this,args as [any]);};});
 await primary.click();await expect(page.locator('.error')).toBeVisible();await at(page,6);await exercise(page);await page.keyboard.press('Space');await at(page,6);await expect(page.locator('.answer')).toBeVisible();await primary.focus();await page.keyboard.press('Enter');await at(page,7);await dismiss(page);await expect(page.locator('.error')).toHaveCount(0);
 expect(await page.evaluate(keys=>keys.map(k=>localStorage.getItem(k)),protectedKeys)).toEqual(before);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
 const exit=page.locator('.back');await exit.focus();await page.keyboard.down('Space');await expect(page.locator('.answer')).toHaveCount(0);await at(page,7);await page.keyboard.up('Space');await expect(page.locator('.summary')).toBeVisible();
 const saved=await stats(page);expect(saved[0]).toHaveLength(1);expect(saved[0][0].cardsCompleted).toBe(7);expect(saved[0][0].endedAt).not.toBeNull();expect(saved[1]).toHaveLength(module==='kana'?5:7);
 await page.locator('.summary h1').click();await page.keyboard.press('Space');await page.keyboard.press('Enter');expect(await stats(page)).toEqual(saved);await expect(page.locator('.rush-shell')).toHaveCount(0);
});

for(const module of ['kana','kanji','vocabulary'])test(`${module}: empty configuration has no active shortcut`,async({page},info)=>{
 await configure(page,module,module==='kana'?'kana-to-romaji':module==='kanji'?'kanji-to-meaning':'japanese-to-meaning',info.project.name,true);await page.goto(url(module));await expect(page.locator('.missing h1')).toBeVisible();await page.keyboard.press('Space');await page.keyboard.press('Enter');await expect(page.locator('.answer,.rush-shell')).toHaveCount(0);expect((await stats(page))[0]).toHaveLength(0);
});

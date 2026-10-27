import {test,expect,Page} from '@playwright/test';
import {readFileSync} from 'node:fs';
import {ZipReader,Uint8ArrayReader,TextWriter} from '@zip.js/zip.js';

const sentence='大丈夫、大丈夫。一緒に行こう。';
let realRows:any[]=[];
test.beforeAll(async()=>{
  const zip=new ZipReader(new Uint8ArrayReader(readFileSync('public/dictionaries/JMdict_spanish.zip')));
  try{for(const entry of await zip.getEntries())if(/^term_bank_\d+\.json$/.test(entry.filename)){
    for(const row of JSON.parse(await entry.getData!(new TextWriter())))if(row[0]==='大丈夫')realRows.push(row);
  }}finally{await zip.close();}
  expect(realRows).toHaveLength(2);expect(realRows.map(r=>r[1])).toEqual(['だいじょうぶ','だいじょぶ']);
});
async function prepare(page:Page,mode:'actual'|'absent'|'single'='absent',openCard=true){
  await page.route('**/supabase-config.js',r=>r.fulfill({contentType:'text/javascript',body:'window.__KANA_STUDY_CONFIG__={};'}));
  await page.addInitScript(()=>{localStorage.setItem('kana-study.settings.v1',JSON.stringify({language:'es',theme:matchMedia('(prefers-color-scheme: light)').matches?'light':'dark'}));localStorage.setItem('kana-study.manga-reader-preferences.v1',JSON.stringify({ocrVisible:true,dictionaryEnabled:true,fitMode:'width'}));});
  await page.goto('/#/more');
  // Actual rows are read from the distributed ZIP. The single case is an explicitly controlled subset.
  const rows=mode==='actual'?realRows:mode==='single'?[[...realRows[0].slice(0,5),[realRows[0][5][0]],...realRows[0].slice(6)]]:[];
  await page.evaluate(async({rows,sentence})=>{
    const open=(name:string,version:number,upgrade:(db:IDBDatabase)=>void)=>new Promise<IDBDatabase>((resolve,reject)=>{const r=indexedDB.open(name,version);r.onupgradeneeded=()=>upgrade(r.result);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});
    const put=(db:IDBDatabase,data:Record<string,any[]>)=>new Promise<void>((resolve,reject)=>{const tx=db.transaction(Object.keys(data),'readwrite');for(const [store,values]of Object.entries(data))for(const row of values)tx.objectStore(store).put(row);tx.oncomplete=()=>resolve();tx.onabort=()=>reject(tx.error);});
    const d=await open('kana-study-dictionary',1,db=>{db.createObjectStore('metadata',{keyPath:'id'});const s=db.createObjectStore('terms',{keyPath:'id'});s.createIndex('expression',['dictionaryId','expression']);s.createIndex('reading',['dictionaryId','reading']);s.createIndex('dictionaryId','dictionaryId');});
    const now=new Date().toISOString();await put(d,{metadata:[{id:'active',dictionaryId:'ux11',title:'JMdict Spanish QA',revision:'bundled',status:'ready',count:rows.length,updatedAt:now}],terms:rows.map((r,i)=>({id:'ux11:'+i,dictionaryId:'ux11',expression:r[0],reading:r[1]||r[0],definitionTags:r[2],rules:r[3],score:r[4],glossaries:r[5],sequence:r[6],termTags:r[7]}))});d.close();
    const m=await open('kana-study-manga',2,db=>{db.createObjectStore('volumes',{keyPath:'id'});db.createObjectStore('pages',{keyPath:['volumeId','pageIndex']}).createIndex('volumeId','volumeId');db.createObjectStore('reading-progress',{keyPath:'volumeId'});db.createObjectStore('provisioning',{keyPath:'id'});});
    const image=new Blob(['<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"><rect width="800" height="600" fill="white"/></svg>'],{type:'image/svg+xml'});
    const ocr={img_path:'qa.svg',img_width:800,img_height:600,blocks:[{box:[40,80,760,130],vertical:false,font_size:32,lines:[sentence],lines_coords:[[[40,80],[760,80],[760,130],[40,130]]]}]};
    await put(m,{volumes:[{id:'ux11',title:'Prueba de lectura con un título largo para comprobar el espacio del panel',pageCount:2,storageBytes:image.size*2,mokuro:{version:'0.2.0',title:'QA',volume:'1'},createdAt:now,updatedAt:now,complete:true}],pages:[0,1].map(pageIndex=>({volumeId:'ux11',pageIndex,image,ocr})), 'reading-progress':[{volumeId:'ux11',pageIndex:1,activeSeconds:0,completed:false,lastOpenedAt:now,updatedAt:now}]});m.close();
  },{rows,sentence});
  await page.goto('/#/manga/read/ux11?page=2');await expect(page.locator('.page-counter')).toHaveText('2 / 2');
  await select(page);
  await page.evaluate(()=>{const p=(window as any).ng.getComponent(document.querySelector('app-dictionary-popup'));p.customEnabled.set(true);p.assistedEnabled.set(true);});
  if(!openCard)return;
  await page.getByRole('button',{name:'＋ Añadir a Mazos',exact:true}).click();
  await expect(page.locator('app-manga-deck-review .card-preview h4')).toHaveText('大丈夫');
  await expect(page.locator('app-manga-deck-review .add')).toBeEnabled();
  await trackPanel(page);
}
async function trackPanel(page:Page){
  await expect(panel(page)).toBeVisible();
  await page.evaluate(()=>{const c=(window as any).ng.getComponent(document.querySelector('app-manga-deck-review'));(window as any).ux11={repo:c.service.repository,preview:0,confirm:0};
    for(const name of ['preview','confirm']){const original=c.service[name].bind(c.service);c.service[name]=(...args:any[])=>{(window as any).ux11[name]++;return original(...args);};}});
}
async function select(page:Page){
  const line=page.locator('.ocr-line').first();await expect(line).toBeVisible();const b=await line.evaluate(el=>{const r=document.createRange();r.setStart(el.firstChild!,0);r.setEnd(el.firstChild!,3);const b=r.getBoundingClientRect();return {x:b.x,y:b.y,width:b.width,height:b.height};});
  await page.mouse.move(b.x+1,b.y+b.height/2);await page.mouse.down();await page.mouse.move(b.x+b.width-1,b.y+b.height/2,{steps:8});await page.mouse.up();await expect(page.locator('.selected-text')).toHaveText('大丈夫');
}
const panel=(page:Page)=>page.locator('app-manga-deck-review');
const reading=(page:Page)=>panel(page).getByRole('textbox',{name:'Lectura',exact:true});
const meaning=(page:Page)=>panel(page).getByRole('textbox',{name:'Significado',exact:true});
const add=(page:Page)=>panel(page).getByRole('button',{name:'Añadir al mazo',exact:true});
async function inventory(page:Page){return page.evaluate(async()=>{const r=(window as any).ux11.repo;return {...await r.confirmedVocabularyInventory(),journal:await r.journal()};});}
async function readonlyStores(page:Page){return page.evaluate(async()=>{
  const name='kana-study-custom-decks-v1';if(!(await indexedDB.databases()).some(d=>d.name===name))return {};
  const db=await new Promise<IDBDatabase>((resolve,reject)=>{const r=indexedDB.open(name);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});
  try{return Object.fromEntries(await Promise.all(Array.from(db.objectStoreNames).map(async name=>[name,await new Promise<any[]>((resolve,reject)=>{const r=db.transaction(name).objectStore(name).getAll();r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);})])));}finally{db.close();}
});}
async function success(page:Page){await expect(page.locator('app-dictionary-popup')).toHaveCount(0);await expect(page.locator('.manga-reader > [role=status]')).toHaveText('Tarjeta añadida al mazo.');await expect(page.locator('.page-stage')).toBeFocused();}
async function compact(page:Page){
  const rect=await add(page).boundingBox();expect(rect).not.toBeNull();expect(rect!.y).toBeGreaterThanOrEqual(0);expect(rect!.y+rect!.height).toBeLessThanOrEqual(page.viewportSize()!.height);
  await expect(panel(page).getByRole('button',{name:'Editar',exact:true})).toHaveAttribute('aria-expanded','false');
  await expect(panel(page).getByRole('checkbox')).toHaveCount(0);await expect(panel(page).getByRole('textbox',{name:'Palabra japonesa',exact:true})).toHaveCount(0);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
}
test('actual distributed dictionary offers both readings and all senses, then one explicit save',async({page},info)=>{
  const posts:string[]=[];page.on('request',r=>{if(r.method()==='POST')posts.push(r.url());});
  await prepare(page,'actual',false);
  const dictionary=page.locator('app-dictionary-popup'),before=await readonlyStores(page);
  await expect(dictionary.locator('h2')).toHaveText('大丈夫');await expect(dictionary.locator('.reading')).toHaveText('だいじょうぶ');
  for(const gloss of realRows[0][5])await expect(dictionary.locator('article').first()).toContainText(gloss);
  await expect(panel(page)).toHaveCount(0);await expect(dictionary.getByRole('combobox')).toHaveCount(0);
  const more=dictionary.locator('details').filter({has:page.getByText('Más significados',{exact:true})});
  await more.locator('summary').focus();await page.keyboard.press('Enter');
  for(const gloss of realRows[1][5])await expect(more).toContainText(gloss);await expect(more).toContainText('だいじょぶ');
  await expect(dictionary.getByRole('link',{name:'JMdict Español',exact:true})).toHaveAttribute('href',/#\/manga$/);
  await dictionary.getByRole('button',{name:'Contexto',exact:true}).click();await expect(dictionary.locator('.ocr-context mark')).toHaveText('大丈夫');
  await dictionary.getByRole('button',{name:'Gramática',exact:true}).click();await expect(panel(page)).toHaveCount(0);
  await dictionary.getByRole('button',{name:'Palabra',exact:true}).click();expect(await readonlyStores(page)).toEqual(before);expect(posts).toEqual([]);
  await page.screenshot({path:`.cache/dictionary-ux-informative-${info.project.name}.png`,fullPage:true});
  const open=dictionary.getByRole('button',{name:'＋ Añadir a Mazos',exact:true});await open.focus();await page.keyboard.press('Enter');
  await expect(panel(page)).toBeVisible();await panel(page).getByRole('button',{name:'Cancelar',exact:true}).click();await expect(panel(page)).toHaveCount(0);await expect(open).toBeFocused();
  await page.keyboard.press('Enter');await trackPanel(page);await compact(page);
  const choices=panel(page).getByRole('combobox',{name:'Propuesta del diccionario',exact:true});await expect(choices.locator('option')).toHaveCount(4);
  await expect(panel(page).locator('.meaning')).toHaveCount(0);expect((await inventory(page)).journal).toHaveLength(0);
  await page.screenshot({path:`.cache/ux11-after-actual-${info.project.name}.png`,fullPage:true});
  await choices.selectOption('0');await expect(panel(page).getByRole('combobox',{name:'Significado',exact:true})).toBeFocused();
  await panel(page).getByRole('combobox',{name:'Significado',exact:true}).selectOption(realRows[0][5][1]);
  await expect(add(page)).toBeFocused();await page.screenshot({path:`.cache/ux11-after-reviewed-${info.project.name}.png`,fullPage:true});await add(page).click();await success(page);
  const data=await inventory(page);expect(data.cards).toHaveLength(1);expect(data.journal).toHaveLength(1);
  expect(data.cards[0].value).toMatchObject({word:'大丈夫',reading:'だいじょうぶ',context:{text:sentence,pageNumber:2}});
  expect(data.journal[0].payload.confirmation).toMatchObject({expertCertified:false,source:{surface:'大丈夫',range:[0,3],fragment:sentence,pageNumber:2}});
  const deck=data.cards[0].value.deckId;
  await page.evaluate(path=>location.hash=path,'/anki/'+deck+'/study');await expect(page.locator('.front h1')).toHaveText('大丈夫');await page.getByRole('button',{name:/mostrar respuesta/i}).click();await page.locator('.good').click();
  await page.evaluate(()=>location.hash='/manga/vocabulary/ux11');await expect(page.locator('app-manga-volume-vocabulary .state')).toHaveText('Aprendiendo');const reviewed=await inventory(page);expect(reviewed.events).toHaveLength(1);
  await page.evaluate(()=>location.hash='/manga/read/ux11?page=1');await expect(page.locator('.page-counter')).toHaveText('1 / 2');await select(page);
  await expect(dictionary.locator('.reading')).toHaveText('だいじょうぶ');for(const gloss of realRows[0][5])await expect(dictionary.locator('article').first()).toContainText(gloss);await expect(panel(page)).toHaveCount(0);
  await dictionary.getByRole('button',{name:'＋ Añadir a Mazos',exact:true}).click();await choices.selectOption('0');
  await panel(page).getByRole('combobox',{name:'Significado',exact:true}).selectOption(realRows[0][5][1]);
  await panel(page).getByRole('combobox',{name:'Tarjeta relacionada',exact:true}).selectOption({index:1});await add(page).click();await success(page);
  const after=await inventory(page);expect(after.cards).toHaveLength(1);expect(after.progress).toEqual(reviewed.progress);expect(after.events).toEqual(reviewed.events);expect(posts).toEqual([]);
});
test('absent proposal exposes only minimum fields; empty submit focuses reading and never calls persistence',async({page},info)=>{
  await page.setViewportSize({width:320,height:480});await prepare(page);await compact(page);await expect(reading(page)).toBeFocused();
  await expect(panel(page).locator('.manual-hint')).toContainText('Sin propuesta');await add(page).click();await expect(reading(page)).toBeFocused();
  await expect(panel(page).getByRole('alert')).toHaveCount(2);await compact(page);
  expect(await page.evaluate(()=>({preview:(window as any).ux11.preview,confirm:(window as any).ux11.confirm}))).toEqual({preview:0,confirm:0});
  expect((await inventory(page)).journal).toHaveLength(0);await page.screenshot({path:`.cache/ux11-after-absent-${info.project.name}.png`,fullPage:true});
  await reading(page).fill('だいじょうぶ');await meaning(page).fill('bien (entrada manual)');await add(page).click();await success(page);
  const data=await inventory(page);expect(data.journal).toHaveLength(1);expect(data.cards).toHaveLength(1);expect(data.cards[0].value.context).toMatchObject({text:sentence,pageNumber:2});
});
for(const field of ['reading','meaning'] as const)test(`only ${field} missing focuses that field without opening advanced options`,async({page})=>{
  await prepare(page);if(field==='reading')await meaning(page).fill('bien');else await reading(page).fill('だいじょうぶ');
  await add(page).click();await expect(field==='reading'?reading(page):meaning(page)).toBeFocused();await expect(panel(page).getByRole('alert')).toHaveCount(1);await compact(page);
  expect((await inventory(page)).journal).toHaveLength(0);
});
test('controlled complete proposal stays compact and double click persists exactly one received confirmation',async({page},info)=>{
  await prepare(page,'single');await compact(page);await expect(reading(page)).toHaveCount(0);await expect(panel(page).locator('.reading')).toHaveText('だいじょうぶ');
  const distance=await panel(page).evaluate(el=>el.querySelector('.add')!.getBoundingClientRect().top-el.querySelector('h4')!.getBoundingClientRect().bottom);expect(distance).toBeLessThan(250);
  await page.screenshot({path:`.cache/ux11-after-complete-${info.project.name}.png`,fullPage:true});await add(page).dblclick();await success(page);
  expect((await inventory(page)).cards).toHaveLength(1);expect((await inventory(page)).journal).toHaveLength(1);expect(await page.evaluate(()=>(window as any).ux11.confirm)).toBe(1);
});
test('a storage error retains values and retries the same receipt, not an empty validation failure',async({page})=>{
  await prepare(page);await reading(page).fill('だいじょうぶ');await meaning(page).fill('bien');
  await page.evaluate(()=>{const r=(window as any).ux11.repo,original=r.confirmMangaCard.bind(r);let first=true;(window as any).ux11.ids=[];
    r.confirmMangaCard=async(...args:any[])=>{(window as any).ux11.ids.push(args[0].confirmation.id);if(first){first=false;throw Error('synthetic quota');}return original(...args);};});
  await add(page).click();await expect(panel(page).getByRole('alert')).toContainText('No se pudo confirmar o guardar');
  await expect(reading(page)).toHaveValue('だいじょうぶ');await expect(meaning(page)).toHaveValue('bien');expect((await inventory(page)).journal).toHaveLength(0);
  await panel(page).getByRole('button',{name:'Reintentar',exact:true}).click();await success(page);const ids=await page.evaluate(()=>(window as any).ux11.ids);expect(ids).toHaveLength(2);expect(ids[0]).toBe(ids[1]);expect((await inventory(page)).journal).toHaveLength(1);
});
test('keyboard, disclosure and Escape preserve fields and keep save visible without nested scrolling',async({page})=>{
  await page.setViewportSize({width:320,height:480});await prepare(page,'single');await compact(page);
  await panel(page).getByRole('button',{name:'Editar',exact:true}).click();await expect(panel(page).getByRole('textbox',{name:'Palabra japonesa',exact:true})).toBeFocused();
  await panel(page).locator('.source-context summary').click();const box=await add(page).boundingBox();expect(box!.y+box!.height).toBeLessThanOrEqual(480);
  const nested=await page.locator('.dictionary-sheet').evaluate(el=>Array.from(el.querySelectorAll('*')).filter(e=>e.tagName!=='TEXTAREA'&&getComputedStyle(e).overflowY==='auto'&&e.scrollHeight>e.clientHeight+2).length);expect(nested).toBe(0);
  await page.getByRole('button',{name:'Contexto',exact:true}).click();await page.getByRole('button',{name:'Palabra',exact:true}).click();await expect(panel(page).getByRole('textbox',{name:'Lectura',exact:true})).toHaveValue('だいじょうぶ');
  await page.keyboard.press('Escape');await expect(page.locator('app-dictionary-popup')).toHaveCount(0);expect((await inventory(page)).journal).toHaveLength(0);
});
for(const separate of [false,true])test(`existing card ${separate?'separates an explicitly chosen identity':'adds context explicitly'} while original FSRS survives`,async({page})=>{
  await prepare(page);await reading(page).fill('だいじょうぶ');await meaning(page).fill('bien');await add(page).click();await success(page);
  const deck=(await inventory(page)).cards[0].value.deckId;
  await page.evaluate(path=>location.hash=path,'/anki/'+deck+'/study');await expect(page.locator('.front h1')).toHaveText('大丈夫');await page.getByRole('button',{name:/mostrar respuesta/i}).click();await page.locator('.good').click();
  await page.evaluate(()=>location.hash='/manga/vocabulary/ux11');await expect(page.locator('app-manga-volume-vocabulary .state')).toHaveText('Aprendiendo');const before=await inventory(page);
  await page.evaluate(()=>location.hash='/manga/read/ux11?page=1');await expect(page.locator('.page-counter')).toHaveText('1 / 2');await select(page);await page.getByRole('button',{name:'＋ Añadir a Mazos',exact:true}).click();await reading(page).fill('だいじょうぶ');await meaning(page).fill('bien');
  const choice=panel(page).getByRole('combobox',{name:'Tarjeta relacionada',exact:true});await expect(choice).toBeVisible();await expect(panel(page).getByRole('checkbox')).toHaveCount(0);
  const other=panel(page).getByRole('button',{name:'Crear otra identidad (sin heredar repasos)',exact:true});await expect(other).toHaveAttribute('aria-pressed','false');
  await add(page).click();await expect(choice).toBeFocused();expect((await inventory(page)).cards).toHaveLength(1);
  if(separate)await other.click();else{await choice.selectOption({index:1});await expect(panel(page).locator('.reuse-note')).toContainText('conserva sus repasos');}await add(page).click();await success(page);
  const after=await inventory(page);expect(after.cards).toHaveLength(separate?2:1);expect(new Set(after.cards.map((r:any)=>r.value.lexicalIdentity.key)).size).toBe(separate?2:1);expect(after.progress).toEqual(before.progress);expect(after.events).toEqual(before.events);
  expect(after.journal.filter((x:any)=>x.kind==='manga-confirmation')).toHaveLength(2);
});

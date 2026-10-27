import {test,expect,Page,chromium,BrowserContext} from '@playwright/test';
import {mkdtempSync,readFileSync} from 'node:fs';
import path from 'node:path';

async function isolate(context:BrowserContext,posts:string[],theme:string){
 await context.route('**/supabase-config.js',r=>r.fulfill({contentType:'text/javascript',body:'window.__KANA_STUDY_CONFIG__={};'}));
 await context.route('**/*',r=>{const url=new URL(r.request().url());if((url.protocol==='https:'||url.protocol==='http:')&&url.origin!=='http://127.0.0.1:4400'){posts.push(url.href);return r.abort();}if(r.request().method()==='POST')posts.push(url.href);return r.fallback();});
 await context.addInitScript(theme=>{localStorage.setItem('kana-study.settings.v1',JSON.stringify({language:'es',theme}));localStorage.setItem('kana-study.manga-reader-preferences.v1',JSON.stringify({ocrVisible:true,dictionaryEnabled:true,fitMode:'width'}));},theme);
}
async function catalog(page:Page){await page.goto('/#/anki');await expect(page.locator('app-anki-page')).toBeVisible();await page.evaluate(async()=>{const c=(window as any).ng.getComponent(document.querySelector('app-anki-page')).catalog;c.enabled.set(true);await c.refresh();});}
async function inventory(page:Page){return page.evaluate(()=>(window as any).ng.getComponent(document.querySelector('app-anki-page')).catalog.repository.guestInventory());}
async function seedManga(page:Page){
 await page.goto('/#/more');await page.evaluate(async()=>{
  const open=(name:string,version:number,upgrade:(db:IDBDatabase)=>void)=>new Promise<IDBDatabase>((resolve,reject)=>{const r=indexedDB.open(name,version);r.onupgradeneeded=()=>upgrade(r.result);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});
  const put=(db:IDBDatabase,data:Record<string,any[]>)=>new Promise<void>((resolve,reject)=>{const tx=db.transaction(Object.keys(data),'readwrite');for(const [s,rows]of Object.entries(data))for(const row of rows)tx.objectStore(s).put(row);tx.oncomplete=()=>resolve();tx.onabort=()=>reject(tx.error);});
  const d=await open('kana-study-dictionary',1,db=>{db.createObjectStore('metadata',{keyPath:'id'});const s=db.createObjectStore('terms',{keyPath:'id'});s.createIndex('expression',['dictionaryId','expression']);s.createIndex('reading',['dictionaryId','reading']);s.createIndex('dictionaryId','dictionaryId');});
  const now='2026-10-25T12:00:00.000Z';await put(d,{metadata:[{id:'active',dictionaryId:'backup-fixture',title:'JMdict Spanish controlled fixture',revision:'1',status:'ready',count:2,updatedAt:now}],terms:[['猫','ねこ','gato'],['犬','いぬ','perro']].map(([expression,reading,meaning],i)=>({id:'fixture-'+i,dictionaryId:'backup-fixture',expression,reading,glossaries:[meaning],sequence:i+1,definitionTags:'n',rules:'',score:1,termTags:''}))});d.close();
  const m=await open('kana-study-manga',2,db=>{db.createObjectStore('volumes',{keyPath:'id'});db.createObjectStore('pages',{keyPath:['volumeId','pageIndex']}).createIndex('volumeId','volumeId');db.createObjectStore('reading-progress',{keyPath:'volumeId'});db.createObjectStore('provisioning',{keyPath:'id'});});
  const image=new Blob(['<svg xmlns="http://www.w3.org/2000/svg" width="400" height="500"><rect width="400" height="500" fill="white"/></svg>'],{type:'image/svg+xml'});
  const ocr={img_path:'fixture.svg',img_width:400,img_height:500,blocks:['猫がいる。','犬がいる。'].map((line,i)=>({box:[30,40+i*90,350,80+i*90],vertical:false,font_size:32,lines:[line],lines_coords:[[[30,40+i*90],[350,40+i*90],[350,80+i*90],[30,80+i*90]]]}))};
  await put(m,{volumes:[{id:'backup-volume',title:'Backup test volume',pageCount:1,storageBytes:image.size,mokuro:{version:'0.2.0',title:'Synthetic',volume:'1'},createdAt:now,updatedAt:now,complete:true}],pages:[{volumeId:'backup-volume',pageIndex:0,image,ocr}]});m.close();
 });
}
async function addFromOcr(page:Page,index:number){
 const line=page.locator('.ocr-line').nth(index);await expect(line).toBeVisible();const b=await line.evaluate(el=>{const range=document.createRange();range.setStart(el.firstChild!,0);range.setEnd(el.firstChild!,1);const b=range.getBoundingClientRect();return {x:b.x,y:b.y,width:b.width,height:b.height};});
 await page.mouse.move(b.x+1,b.y+b.height/2);await page.mouse.down();await page.mouse.move(b.x+b.width-1,b.y+b.height/2,{steps:8});await page.mouse.up();
 await expect(page.locator('app-dictionary-popup h2')).toHaveText(index?'犬':'猫');await page.evaluate(()=>{const c=(window as any).ng.getComponent(document.querySelector('app-dictionary-popup'));c.customEnabled.set(true);c.assistedEnabled.set(true);});
 await page.getByRole('button',{name:'＋ Añadir a Mazos',exact:true}).click();await expect(page.locator('app-manga-deck-review h4')).toHaveText(index?'犬':'猫');await page.getByRole('button',{name:'Añadir al mazo',exact:true}).click();await expect(page.locator('app-dictionary-popup')).toHaveCount(0);
}

test('complete Guest backup round-trip to a clean Chromium profile survives reload/restart and continues original FSRS',async({page,context},info)=>{
 const posts:string[]=[],theme=info.project.use.colorScheme==='light'?'light':'dark';await isolate(context,posts,theme);await seedManga(page);await page.goto('/#/manga/read/backup-volume');await addFromOcr(page,0);await addFromOcr(page,1);
 await catalog(page);const deck=(await inventory(page)).records.decks[0].value.id;
 await page.goto('/#/anki/'+deck+'/study');await expect(page.locator('.front h1')).toHaveText('猫');await page.locator('.reveal').click();await page.locator('.good').click();await expect(page.locator('.front h1')).toHaveText('犬');await page.locator('.undo').click();await expect(page.locator('.front h1')).toHaveText('猫');await page.locator('.reveal').click();await page.locator('.again').click();await expect(page.locator('.front h1')).toHaveText('犬');
 await catalog(page);const original=await inventory(page);expect(original.records.cards).toHaveLength(2);expect(original.records.events).toHaveLength(2);expect(original.records.events.filter((r:any)=>r.voidedBy)).toHaveLength(1);
 await page.getByRole('link',{name:'Datos y progreso',exact:true}).click();await expect(page.getByRole('heading',{name:'Copias de seguridad de Mazos',exact:true})).toBeVisible();
 const downloadPromise=page.waitForEvent('download');await page.getByRole('button',{name:'Exportar copia',exact:true}).click();const download=await downloadPromise,file=await download.path();expect(file).toBeTruthy();const data=JSON.parse(readFileSync(file!,'utf8'));expect(data.records).toEqual(original.records);
 const saved=path.resolve('.cache/backup-roundtrip-'+info.project.name+'.json');await download.saveAs(saved);await page.screenshot({path:'.cache/backup-export-'+info.project.name+'.png',fullPage:true});
 const profile=mkdtempSync(path.resolve('.cache/backup-target-'+info.project.name+'-'));let target:BrowserContext|null=null;
 async function launch(){target=await chromium.launchPersistentContext(profile,{headless:true,baseURL:'http://127.0.0.1:4400',viewport:info.project.use.viewport,colorScheme:info.project.use.colorScheme});await isolate(target,posts,theme);return target.pages()[0]??await target.newPage();}
 try{
  let next=await launch();await catalog(next);expect((await inventory(next)).records.cards).toHaveLength(0);await next.getByRole('link',{name:'Datos y progreso',exact:true}).click();
  await next.getByLabel('Seleccionar archivo de copia',{exact:true}).setInputFiles(saved);await expect(next.getByRole('heading',{name:'Vista previa verificada'})).toBeVisible();const restore=next.getByRole('button',{name:'Restaurar copia',exact:true});await expect(restore).toBeDisabled();await next.getByRole('checkbox').check();await next.screenshot({path:'.cache/backup-preview-'+info.project.name+'.png',fullPage:true});await restore.click();await expect(next.getByRole('status')).toHaveText('Restauración completa confirmada en IndexedDB.');
  await catalog(next);expect((await inventory(next)).records).toEqual(original.records);
  await next.reload();await catalog(next);expect((await inventory(next)).records).toEqual(original.records);
  await target!.close();target=null;next=await launch();await catalog(next);expect((await inventory(next)).records).toEqual(original.records);
  // The destination has no Manga files; the restored card still has its exact saved context.
  await next.goto('/#/anki/'+deck+'/study');await expect(next.locator('.front h1')).toHaveText('犬');await next.locator('.reveal').click();await expect(next.locator('.back-content')).toContainText('犬がいる。');await next.locator('.good').click();
  await catalog(next);const after=await inventory(next);expect(after.records.identities).toEqual(original.records.identities);expect(after.records.confirmations).toEqual(original.records.confirmations);for(const old of original.records.events)expect(after.records.events.find((r:any)=>r.key===old.key)).toEqual(old);expect(after.records.events).toHaveLength(3);
  await next.getByRole('link',{name:'Datos y progreso',exact:true}).click();await next.getByLabel('Seleccionar archivo de copia',{exact:true}).setInputFiles(saved);await next.getByRole('checkbox').check();await next.getByRole('button',{name:'Restaurar copia',exact:true}).click();await expect(next.getByRole('alert')).toContainText('no está vacío');await catalog(next);expect((await inventory(next)).records).toEqual(after.records);
  expect(posts).toEqual([]);
 }finally{await target?.close();}
});

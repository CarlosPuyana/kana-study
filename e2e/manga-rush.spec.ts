import {test,expect,Page} from '@playwright/test';
import {readFile} from 'node:fs/promises';
import {ZipReader,ZipWriter,Uint8ArrayReader,Uint8ArrayWriter,TextReader,TextWriter} from '@zip.js/zip.js';

async function archive(title:string,text:string) {
  const zip=new ZipWriter(new Uint8ArrayWriter(),{useWebWorkers:false});
  await zip.add('1.png',new Uint8ArrayReader(Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=','base64')));
  await zip.add('test.mokuro',new TextReader(JSON.stringify({version:'0.2.0',title,volume:title,pages:[{
    img_path:'1.png',img_width:1,img_height:1,blocks:[{box:[0,0,1,1],vertical:false,font_size:1,
      lines:[text],lines_coords:[[[0,0],[1,0],[1,1],[0,1]]]}]}]})));
  return Buffer.from(await zip.close());
}
async function importAndAnalyze(page:Page,title:string,text:string) {
  const buffer=await archive(title,text);await page.goto('/#/manga');
  await page.getByLabel('Añadir manga',{exact:true}).setInputFiles({name:'rush.zip',mimeType:'application/zip',buffer});
  const card=page.locator('.library-grid article').filter({has:page.getByRole('heading',{name:title,exact:true})});
  await card.getByRole('link',{name:'Vocabulario de la obra',exact:true}).click();
  await expect(page.locator('.metrics article strong').first()).not.toHaveText('0');
  return {analysis:page.url(),id:decodeURIComponent(page.url().split('/analysis/')[1])};
}
test('Manga RUSH fresh import -> configuration -> self-report -> summary with no learning writes or OCR reads',async({page},info)=>{
  await page.route('**/supabase-config.js',r=>r.fulfill({contentType:'text/javascript',body:'window.__KANA_STUDY_CONFIG__ = {};'}));
  await page.addInitScript(theme=>{
    if(!localStorage.getItem('kana-study.settings.v1'))localStorage.setItem('kana-study.settings.v1',JSON.stringify({language:'es',theme}));
    const state={writes:[] as string[],reads:[] as string[]};(window as any).__m2Io=state;
    for(const method of ['put','add','delete','clear'] as const){const original=IDBObjectStore.prototype[method];
      (IDBObjectStore.prototype as any)[method]=function(...args:unknown[]){state.writes.push(this.transaction.db.name+':'+this.name+':'+method);return Reflect.apply(original,this,args);};}
    for(const method of ['get','getAll','openCursor'] as const){const original=IDBObjectStore.prototype[method];
      (IDBObjectStore.prototype as any)[method]=function(...args:unknown[]){state.reads.push(this.transaction.db.name+':'+this.name);return Reflect.apply(original,this,args);};}
    for(const method of ['setItem','removeItem','clear'] as const){const original=Storage.prototype[method];
      (Storage.prototype as any)[method]=function(...args:unknown[]){state.writes.push('storage:'+method+':'+(args[0]??''));return Reflect.apply(original,this,args);};}
  },info.project.use.colorScheme==='light'?'light':'dark');
  const posts:string[]=[];page.on('request',r=>{if(r.method()==='POST')posts.push(r.url());});
  await page.goto('/#/more');
  const dictionary=new ZipReader(new Uint8ArrayReader(await readFile('public/dictionaries/JMdict_spanish.zip')),{useWebWorkers:false});
  const wanted=new Set(['猫','犬','食べる','に','うん','する','見る','いる','は','と']);const rows:unknown[][]=[];
  for(const bank of (await dictionary.getEntries()).filter(e=>/^term_bank_\d+\.json$/.test(e.filename)))
    for(const row of JSON.parse(await bank.getData!(new TextWriter())))if(wanted.has(row[0]))rows.push(row);
  await dictionary.close();
  await page.evaluate(rows=>new Promise<void>((resolve,reject)=>{
    const r=indexedDB.open('kana-study-dictionary',1);r.onupgradeneeded=()=>{
      r.result.createObjectStore('metadata',{keyPath:'id'});const t=r.result.createObjectStore('terms',{keyPath:'id'});
      t.createIndex('expression',['dictionaryId','expression']);t.createIndex('reading',['dictionaryId','reading']);t.createIndex('dictionaryId','dictionaryId');};
    r.onerror=()=>reject(r.error);r.onsuccess=()=>{const db=r.result,tx=db.transaction(['metadata','terms'],'readwrite');
      tx.objectStore('metadata').put({id:'active',dictionaryId:'rush-fixture',title:'Readonly actual dictionary rows',revision:'1',status:'ready',count:rows.length,updatedAt:'2026-01-01'});
      for(const [i,row] of rows.entries())tx.objectStore('terms').put({id:String(i),dictionaryId:'rush-fixture',expression:row[0],reading:row[1]||row[0],
        definitionTags:row[2]||'',rules:row[3],score:row[4],glossaries:row[5],sequence:row[6],termTags:row[7]});
      tx.oncomplete=()=>{db.close();resolve();};tx.onabort=()=>reject(tx.error);};
  }),rows);
  const first=await importAndAnalyze(page,'M2 fresh volume','猫。猫。猫。犬。食べた。食べる。うん。に。する。見る。いる。は。と。');
  await expect(page.locator('.metrics article strong').first()).toHaveText('13');
  await page.locator('.manga-nav a').nth(1).click();
  await expect(page.locator('.reader-header .reader-title')).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
  await page.locator('.reader-vocabulary').focus();await page.keyboard.press('Enter');await expect(page).toHaveURL(first.analysis);
  await page.locator('.manga-nav a').first().click();await expect(page).toHaveURL(/#\/manga$/);
  const second=await importAndAnalyze(page,'M2 second volume','犬。');
  await page.goto(first.analysis);await expect(page.locator('.practice-action')).toBeVisible();
  await page.evaluate(()=>{const io=(window as any).__m2Io;io.writes.length=0;io.reads.length=0;});
  await page.locator('.practice-action').click();
  const start=page.getByRole('button',{name:'Empezar práctica',exact:true});await expect(start).toBeEnabled();
  const launchIo=await page.evaluate(()=>(window as any).__m2Io);
  expect(launchIo.writes).toEqual([]);
  expect(launchIo.reads.some((name:string)=>name.endsWith(':pages')||name.endsWith(':terms'))).toBe(false);
  await expect(page.locator('.eligibility h2')).toHaveText('Tarjetas elegibles: 4');
  const selects=page.locator('.configuration select');
  await selects.nth(0).selectOption('familiar');await expect(start).toBeDisabled();
  await selects.nth(0).selectOption('unlinked');await expect(start).toBeEnabled();
  await selects.nth(1).selectOption('functional');await expect(page.locator('.eligibility h2')).toHaveText('Tarjetas elegibles: 1');
  await selects.nth(1).selectOption('unclassified');await expect(page.locator('.eligibility h2')).toHaveText('Tarjetas elegibles: 5');
  await selects.nth(1).selectOption('all');await selects.nth(2).selectOption('weighted');await expect(page.locator('.eligibility h2')).toHaveText('Tarjetas elegibles: 13');
  await selects.nth(1).selectOption('lexical');await selects.nth(2).selectOption('frequency');
  // After all read-only setup settles, every mutation during practice is forbidden.
  await page.evaluate(()=>{const io=(window as any).__m2Io;io.writes.length=0;io.reads.length=0;});
  const storageBefore=await page.evaluate(()=>JSON.stringify(localStorage));
  await start.click();await expect(page.locator('.question')).toHaveText('猫');await expect(page.locator('.answer')).toHaveCount(0);
  const surfaces:string[]=[];
  for(let i=0;i<4;i++){
    surfaces.push((await page.locator('.question').textContent())!);
    await expect(page.locator('.reveal')).toBeFocused();const revealKey=i%2===0?'Enter':'Space';await page.keyboard.down(revealKey);await page.keyboard.down(revealKey);await page.keyboard.up(revealKey);
    await expect(page.locator('.meanings li').first()).toBeVisible();await expect(page.locator('.context mark')).toBeVisible();
    await expect(page.locator('.ratings button').first()).toBeFocused();
    if(i===1){await expect(page.locator('.question')).toHaveText('食べた');await expect(page.locator('.reading')).toHaveText('たべた');}
    const rating=i%2===0?'2':'1';await page.keyboard.down(rating);await page.keyboard.down(rating);await page.keyboard.up(rating);
  }
  await expect(page.locator('.summary h2')).toHaveText('Práctica terminada');
  await expect(page.locator('.summary-grid strong')).toHaveText(['4','4','2','2']);
  expect(surfaces).toEqual(expect.arrayContaining(['猫','食べた','うん','犬']));
  expect(await page.evaluate(()=>JSON.stringify(localStorage))).toBe(storageBefore);
  const io=await page.evaluate(()=>(window as any).__m2Io);
  expect(io.writes).toEqual([]);expect(io.reads.some((name:string)=>name.endsWith(':pages')||name.endsWith(':terms'))).toBe(false);expect(posts).toEqual([]);
  await page.screenshot({path:`test-results/manga-rush-summary-${info.project.name}.png`,fullPage:true});
  await page.getByRole('button',{name:'Otra práctica',exact:true}).click();await selects.nth(2).selectOption('weighted');
  await start.click();const repeated:string[]=[];
  for(let i=0;i<7;i++){
    repeated.push((await page.locator('.question').textContent())!);await page.locator('.reveal').click();await page.locator('.ratings button').nth(1).click();
  }
  await expect(page.locator('.summary-grid strong')).toHaveText(['7','4','0','7']);expect(repeated.filter(s=>s==='猫')).toHaveLength(3);
  await page.getByRole('button',{name:'Otra práctica',exact:true}).click();await selects.nth(1).selectOption('unclassified');await selects.nth(2).selectOption('frequency');
  await start.click();await expect(page.locator('.question')).toHaveText('する');await page.locator('.reveal').click();
  expect(await page.locator('.meanings li').count()).toBeGreaterThan(1);await expect(page.locator('.answer')).toContainText('no demuestran el uso en este contexto');
  await page.screenshot({path:`test-results/manga-rush-ambiguous-${info.project.name}.png`,fullPage:true});
  await page.getByRole('button',{name:'Salir de la práctica',exact:true}).click();await expect(page).toHaveURL(first.analysis);
  expect(await page.evaluate(()=>(window as any).__m2Io.writes)).toEqual([]);expect(await page.evaluate(()=>JSON.stringify(localStorage))).toBe(storageBefore);
  await page.locator('.practice-action').click();await expect(start).toBeEnabled();await start.click();await page.reload();
  await expect(start).toBeEnabled();await expect(page.locator('.question')).toHaveCount(0);await expect(page.locator('.summary')).toHaveCount(0);
  for(const [language,title] of [['es','Practicar vocabulario del manga'],['en','Practice manga vocabulary'],['ca','Practica el vocabulari del manga']]){
    await page.evaluate(language=>{const key='kana-study.settings.v1';localStorage.setItem(key,JSON.stringify({...JSON.parse(localStorage.getItem(key)!),language}));},language);
    await page.reload();await expect(page.getByRole('heading',{name:title,exact:true})).toBeVisible();
    await expect(page.locator('.configuration button[type=submit]')).toBeEnabled();await expect(page.locator('main')).not.toContainText('mangaM2.');
    for(const theme of ['dark','light']){
      await page.evaluate(theme=>document.documentElement.dataset['theme']=theme,theme);
      expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
      await page.screenshot({path:`test-results/manga-rush-config-${info.project.name}-${language}-${theme}.png`,fullPage:true});
    }
  }
  await page.goto('/#/manga/practice/'+second.id);await expect(page.locator('.configuration button[type=submit]')).toBeEnabled();
  await expect(page.locator('.eligibility h2')).toContainText('1');await page.locator('.configuration button[type=submit]').click();await expect(page.locator('.question')).toHaveText('犬');
  await page.evaluate(()=>(window as any).ng.getComponent(document.querySelector('app-manga-rush')).workspace.activateUser('m2-other'));
  await expect(page.locator('.question')).toHaveCount(0);await expect(page.locator('.configuration')).toHaveCount(0);
  await page.evaluate(()=>(window as any).ng.getComponent(document.querySelector('app-manga-rush')).workspace.activateGuest());
  await expect(page.locator('.configuration button[type=submit]')).toBeEnabled();await expect(page.locator('.summary')).toHaveCount(0);
  await page.evaluate(id=>new Promise<void>((resolve,reject)=>{
    const r=indexedDB.open('kana-study-manga');r.onerror=()=>reject(r.error);r.onsuccess=()=>{
      const db=r.result,tx=db.transaction('volumes','readwrite'),store=tx.objectStore('volumes'),q=store.get(id);
      q.onsuccess=()=>store.put({...q.result,updatedAt:'changed fixture'});tx.oncomplete=()=>{db.close();resolve();};tx.onabort=()=>reject(tx.error);
    };
  }),second.id);
  await page.reload();await expect(page.locator('.configuration')).toHaveCount(0);await expect(page.locator('a.action')).toHaveAttribute('href','#/manga/analysis/'+second.id);
  expect((await page.evaluate(()=>(window as any).__m2Io.reads)).some((name:string)=>name.endsWith(':pages'))).toBe(false);
});

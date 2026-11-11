import {test, expect} from '@playwright/test';
import {readFile} from 'node:fs/promises';
import {ZipReader, Uint8ArrayReader, TextWriter} from '@zip.js/zip.js';
import type {MangaVocabularyIndex} from '../src/app/core/models/manga-vocabulary-index.model';

test.use({hasTouch:true});
test.beforeEach(async({page})=>{
  await page.route('**/supabase-config.js',r=>r.fulfill({contentType:'text/javascript',body:'window.__KANA_STUDY_CONFIG__ = {};'}));
  await page.addInitScript(()=>localStorage.setItem('kana-study.settings.v1',JSON.stringify({language:'es',theme:'dark'})));
});

test('M1.6 Modules uses the canonical existing destination by pointer, keyboard and touch',async({page},info)=>{
  for(const mode of ['pointer','keyboard',...(info.project.use.viewport!.width<=390?['touch']:[])]){
    await page.goto('/#/manga');const link=page.getByRole('link',{name:'Módulos',exact:true});
    await expect(link).toHaveAttribute('href','#/more');
    if(mode==='keyboard'){await link.focus();await page.keyboard.press('Enter');}
    else if(mode==='touch')await link.tap();else await link.click();
    await expect(page).toHaveURL(/#\/more$/);await expect(page.locator('.module-grid')).toBeVisible();
    await expect(page.locator('.module-grid app-module-card')).not.toHaveCount(0);
  }
});

test('M1.6 actual rows and OCR excerpts preserve identity/counts and expose linguistic uncertainty',async({page},info)=>{
  const zip=new ZipReader(new Uint8ArrayReader(await readFile('public/dictionaries/JMdict_spanish.zip')),{useWebWorkers:false});
  const wanted=new Set(['お母さん','する','見る','いる','は','と','うん','に','が','の']);const rows:unknown[][]=[];
  for(const bank of (await zip.getEntries()).filter(e=>/^term_bank_\d+\.json$/.test(e.filename)))
    for(const row of JSON.parse(await bank.getData!(new TextWriter())))if(wanted.has(row[0]))rows.push(row);
  await zip.close();
  const book=new ZipReader(new Uint8ArrayReader(await readFile('public/manga/default/hajimete-no-irai.zip')),{useWebWorkers:false});
  const doc=JSON.parse(await (await book.getEntries()).find(e=>e.filename.endsWith('.mokuro'))!.getData!(new TextWriter()));await book.close();
  // Copies only: real OCR pages 10, 14, 20 plus an explicit synthetic alias/auxiliary page.
  const pages=[{img_path:'synthetic.png',img_width:1,img_height:1,blocks:[{lines:[
    'お母さん、おかあさん。','料理をする。勉強する。','映画を見る。見てみる。','ここにいる。歩いている。','は。と。うん。に。が。の。']}]},...([9,13,19].map(i=>doc.pages[i]))];
  await page.goto('/#/more');
  await page.evaluate(async({rows,pages})=>{
    const open=(name:string,version:number,upgrade:(db:IDBDatabase)=>void)=>new Promise<IDBDatabase>((resolve,reject)=>{
      const r=indexedDB.open(name,version);r.onupgradeneeded=()=>upgrade(r.result);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);
    });
    const write=(db:IDBDatabase,values:Record<string,unknown[]>)=>new Promise<void>((resolve,reject)=>{
      const tx=db.transaction(Object.keys(values),'readwrite');for(const [name,rows] of Object.entries(values))for(const row of rows)tx.objectStore(name).put(row);
      tx.oncomplete=()=>{db.close();resolve();};tx.onabort=()=>reject(tx.error);
    });
    const dictionary=await open('kana-study-dictionary',1,db=>{
      db.createObjectStore('metadata',{keyPath:'id'});const s=db.createObjectStore('terms',{keyPath:'id'});
      s.createIndex('expression',['dictionaryId','expression']);s.createIndex('reading',['dictionaryId','reading']);s.createIndex('dictionaryId','dictionaryId');
    });
    await write(dictionary,{metadata:[{id:'active',dictionaryId:'m16',revision:'JMdict.2026-10-01',title:'Actual rows fixture',status:'ready',count:rows.length,updatedAt:'2026-01-01'}],
      terms:rows.map((r,i)=>({id:`m16:${i}`,dictionaryId:'m16',expression:r[0],reading:r[1]||r[0],definitionTags:r[2]||'',rules:r[3],
        score:r[4],glossaries:r[5],sequence:r[6],termTags:r[7]}))});
    const manga=await open('kana-study-manga',3,db=>{
      db.createObjectStore('volumes',{keyPath:'id'});db.createObjectStore('pages',{keyPath:['volumeId','pageIndex']}).createIndex('volumeId','volumeId');
      db.createObjectStore('reading-progress',{keyPath:'volumeId'});db.createObjectStore('provisioning',{keyPath:'id'});
      db.createObjectStore('ocr-revisions');db.createObjectStore('vocabulary-index',{keyPath:'volumeId'});
    });
    await write(manga,{volumes:[{id:'m16',title:'M1.6 copied OCR',seriesTitle:'Fixture',pageCount:pages.length,complete:true,storageBytes:0,
      mokuro:{version:'0.2.0',title:'Fixture',volume:'1'},createdAt:'2026-01-01',updatedAt:'2026-01-01'}],
      pages:pages.map((ocr,pageIndex)=>({volumeId:'m16',pageIndex,image:new Blob(['fixture']),ocr}))});
  },{rows,pages});
  await page.goto('/#/manga/analysis/m16');await expect(page.locator('.words')).toContainText('お母さん');
  const readIndex=()=>page.evaluate(()=>new Promise<MangaVocabularyIndex>((resolve,reject)=>{
    const r=indexedDB.open('kana-study-manga');r.onerror=()=>reject(r.error);r.onsuccess=()=>{
      const db=r.result,q=db.transaction('vocabulary-index').objectStore('vocabulary-index').get('m16');
      q.onsuccess=()=>{db.close();resolve(q.result);};q.onerror=()=>reject(q.error);
    };
  }));
  const index=await readIndex(),total=String(index.occurrences);
  const mother=index.entries.find(e=>e.lemma==='お母さん')!;expect(mother.category).toBe('lexical');
  expect(mother.occurrences.map(o=>o.surface)).toEqual(expect.arrayContaining(['お母さん','おかあさん']));
  for(const word of ['する','見る','いる','は','と']){
    const entry=index.entries.find(e=>e.lemma===word)!;expect(entry,word).toBeDefined();expect(entry.category).toBe('unclassified');
    expect(entry.categoryReason).toBe('conflicting-pos');
  }
  expect(index.entries.find(e=>e.lemma==='うん')!.category).toBe('lexical');
  expect(index.entries.find(e=>e.lemma==='に')!.category).toBe('functional');
  await page.locator('.sections button').nth(2).click();await expect(page.locator('.classification-diagnostics')).toContainText('no implica un fallo del OCR');
  await expect(page.locator('.words')).toContainText('Ambigua');
  await page.locator('.words details').filter({has:page.locator('.word-label').filter({hasText:/^は/})}).locator('summary').click();
  await expect(page.locator('.words')).toContainText('Alternativas documentadas');await expect(page.locator('.words')).toContainText('prt');
  await expect(page.locator('.metrics article strong').first()).toHaveText(total);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
  await page.screenshot({path:`test-results/manga-m16-${info.project.name}.png`,fullPage:true});
  await page.reload();await expect(page.locator('.metrics article strong').first()).toHaveText(total);
  const reloaded=await readIndex();expect(reloaded.entries.map(e=>[e.key,e.occurrences])).toEqual(index.entries.map(e=>[e.key,e.occurrences]));
});

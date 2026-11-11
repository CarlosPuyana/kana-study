import {test, expect, Page} from '@playwright/test';
import {readFile} from 'node:fs/promises';
import {ZipReader, Uint8ArrayReader, TextWriter} from '@zip.js/zip.js';

type Term = {expression:string;reading:string;definitionTags:string;rules:string;sequence:number;glossaries:string[]};
type Ocr = {img_path:string;img_width:number;img_height:number;blocks:{lines:string[]}[]};
async function seed(page:Page, terms:Term[], pages:Ocr[], id='m15-a') {
  await page.evaluate(async({terms,pages,id})=>{
    const open=(name:string,version:number,upgrade:(db:IDBDatabase)=>void)=>new Promise<IDBDatabase>((resolve,reject)=>{
      const r=indexedDB.open(name,version);r.onupgradeneeded=()=>upgrade(r.result);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);
    });
    const write=(db:IDBDatabase,rows:Record<string,unknown[]>)=>new Promise<void>((resolve,reject)=>{
      const tx=db.transaction(Object.keys(rows),'readwrite');for(const [name,values] of Object.entries(rows))for(const v of values)tx.objectStore(name).put(v);
      tx.oncomplete=()=>{db.close();resolve();};tx.onabort=()=>reject(tx.error);
    });
    const dictionary=await open('kana-study-dictionary',1,db=>{
      db.createObjectStore('metadata',{keyPath:'id'});const s=db.createObjectStore('terms',{keyPath:'id'});
      s.createIndex('expression',['dictionaryId','expression']);s.createIndex('reading',['dictionaryId','reading']);s.createIndex('dictionaryId','dictionaryId');
    });
    await write(dictionary,{metadata:[{id:'active',dictionaryId:'m15',revision:'test',title:'Readonly sample fixture',status:'ready',count:terms.length,updatedAt:'2026-01-01'}],
      terms:terms.map((t,i)=>({...t,id:`m15:${i}`,dictionaryId:'m15',score:1,termTags:''}))});
    const manga=await open('kana-study-manga',3,db=>{
      db.createObjectStore('volumes',{keyPath:'id'});db.createObjectStore('pages',{keyPath:['volumeId','pageIndex']}).createIndex('volumeId','volumeId');
      db.createObjectStore('reading-progress',{keyPath:'volumeId'});db.createObjectStore('provisioning',{keyPath:'id'});
      db.createObjectStore('ocr-revisions');db.createObjectStore('vocabulary-index',{keyPath:'volumeId'});
    });
    const volume=(volumeId:string,count:number)=>({id:volumeId,title:volumeId,seriesTitle:'M1.5 test',pageCount:count,complete:true,storageBytes:1,
      createdAt:'2026-01-01',updatedAt:'2026-01-01',mokuro:{version:'0.2.0',title:'M1.5 test',volume:'1'}});
    const image=new Blob(['<svg xmlns="http://www.w3.org/2000/svg" width="60" height="80"><rect width="60" height="80" fill="#243b53"/><text x="30" y="42" fill="white" text-anchor="middle" font-size="10">M1.5</text></svg>'],{type:'image/svg+xml'});
    await write(manga,{volumes:[volume(id,pages.length),volume('m15-b',1)],
      pages:[...pages.map((ocr,pageIndex)=>({volumeId:id,pageIndex,image,ocr})),{volumeId:'m15-b',pageIndex:0,image,
        ocr:{img_path:'b.png',img_width:1,img_height:1,blocks:[{lines:['学校。']}]}}],
      'reading-progress':[{volumeId:id,pageIndex:0,activeSeconds:1,completed:false,lastOpenedAt:'2026-01-01',updatedAt:'2026-01-01'}]});
  },{terms,pages,id});
}
test.beforeEach(async({page},info)=>{
  await page.route('**/supabase-config.js',r=>r.fulfill({contentType:'text/javascript',body:'window.__KANA_STUDY_CONFIG__ = {};'}));
  await page.addInitScript(theme=>{
    if(!localStorage.getItem('kana-study.settings.v1'))localStorage.setItem('kana-study.settings.v1',JSON.stringify({language:'es',theme}));
  },info.project.use.colorScheme==='light'?'light':'dark');
  await page.goto('/#/more');
});

test('M1.5 sections, readings, global scope, locale, reload, volume and workspace isolation',async({page},info)=>{
  const rows=[['猫','ねこ','n'],['食べる','たべる','v1'],['に','に','prt conj'],['が','が','prt'],['です','です','cop aux-v'],
    ['うん','うん','int'],['ネコ','ねこ','n'],['学校','がっこう','n'],['謎','なぞ',''],['本','ほん','n prt'],['生','せい','n'],['生','なま','n']];
  const terms=rows.map(([expression,reading,definitionTags],i)=>({expression,reading,definitionTags,rules:definitionTags==='v1'?'v1':'',sequence:i+1,glossaries:['fixture']}));
  await seed(page,terms,[{img_path:'a.png',img_width:1,img_height:1,blocks:[{lines:['猫。猫。食べた。食べなかった。に。が。です。うん。ネコ。学校。謎。本。生。']}]}]);
  await page.goto('/#/manga');
  const card=page.locator('.library-grid article').filter({has:page.getByRole('heading',{name:'m15-a',exact:true})});
  const primary=card.locator('.primary-action');await expect(primary).toHaveText('Continuar leyendo');
  await expect(card.locator('.secondary-action')).toHaveText('Vocabulario de la obra');
  expect((await primary.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  await card.screenshot({path:`test-results/manga-m15-card-${info.project.name}.png`});
  await card.locator('.secondary-action').click();
  await expect(page.locator('.metrics article strong')).toHaveText(['12','10','0.0%','0.0%']);
  await expect(page.locator('.sections button')).toHaveText(['Vocabulario 5','Gramática / palabras funcionales 3','Sin clasificar 2']);
  await expect(page.locator('.words details')).toHaveCount(5);
  const labels=await page.locator('.word-label').allTextContents();expect(labels).toEqual(expect.arrayContaining(['うん','ネコ','学校 · がっこう']));
  await page.locator('.sections button').nth(1).click();await expect(page.locator('.words details')).toHaveCount(3);
  expect(await page.locator('.word-label').allTextContents()).toEqual(expect.arrayContaining(['に','が','です']));
  await page.locator('.words summary').first().click();await expect(page.locator('.knowledge-help').first()).toContainText('No significa desconocida');
  await page.locator('.sections button').nth(2).click();await expect(page.locator('.words details')).toHaveCount(2);
  await expect(page.locator('.metrics article strong').first()).toHaveText('12');
  await page.locator('.controls select').first().selectOption('known');await expect(page.locator('.words details')).toHaveCount(0);
  await page.locator('.controls select').first().selectOption('unlinked');await expect(page.locator('.words details')).toHaveCount(2);
  await page.reload();await expect(page.locator('.sections button').first()).toHaveAttribute('aria-pressed','true');
  for(const [language,title] of [['es','Vocabulario de la obra'],['en','Work vocabulary'],['ca','Vocabulari de l’obra']]) {
    await page.evaluate(language=>{const key='kana-study.settings.v1',settings=JSON.parse(localStorage.getItem(key)!);localStorage.setItem(key,JSON.stringify({...settings,language}));},language);
    await page.reload();await expect(page.getByRole('heading',{name:title,exact:true})).toBeVisible();
    for(const theme of ['dark','light']) {
      await page.evaluate(theme=>document.documentElement.dataset['theme']=theme,theme);
      expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
      await expect(page.locator('main')).not.toContainText('mangaM1.');
      await page.screenshot({path:`test-results/manga-m15-${info.project.name}-${language}-${theme}.png`,fullPage:true});
    }
  }
  await page.goto('/#/manga/analysis/m15-b');await expect(page.locator('.metrics article strong').first()).toHaveText('1');
  await expect(page.locator('.words')).toContainText('学校');
  // Live workspace transition: app auth initialization intentionally restores Guest on reload.
  // Angular's development inspector is test-only; no production switch is added.
  await page.evaluate(()=>(window as any).ng.getComponent(document.querySelector('app-manga-vocabulary-analysis')).workspace.activateUser('m15-isolated'));
  await expect(page.locator('main [role=alert]')).toBeVisible();await expect(page.locator('.words')).toHaveCount(0);
  await page.evaluate(()=>(window as any).ng.getComponent(document.querySelector('app-manga-vocabulary-analysis')).workspace.activateGuest());
  await expect(page.locator('.metrics article strong').first()).toHaveText('1');
});

test('M1.5 real bundled OCR and actual JMdict tags, using copies in an isolated browser',async({page})=>{
  const archive=new ZipReader(new Uint8ArrayReader(await readFile('public/manga/default/hajimete-no-irai.zip')),{useWebWorkers:false});
  const entries=await archive.getEntries();const doc=JSON.parse(await entries.find(e=>e.filename.endsWith('.mokuro'))!.getData!(new TextWriter()));
  await archive.close();const pages=doc.pages.slice(0,2) as Ocr[];
  const text=pages.flatMap(p=>p.blocks.flatMap(b=>b.lines)).join('\n');
  const dictionary=new ZipReader(new Uint8ArrayReader(await readFile('public/dictionaries/JMdict_spanish.zip')),{useWebWorkers:false});
  const terms:Term[]=[];
  for(const bank of (await dictionary.getEntries()).filter(e=>/^term_bank_\d+\.json$/.test(e.filename))) {
    for(const row of JSON.parse(await bank.getData!(new TextWriter())))if(text.includes(row[0]))
      terms.push({expression:row[0],reading:row[1]||row[0],definitionTags:row[2]||'',rules:row[3],glossaries:row[5],sequence:row[6]});
  }
  await dictionary.close();expect(terms.length).toBeGreaterThan(10);
  await seed(page,terms,pages,'m15-real-excerpt');await page.goto('/#/manga/analysis/m15-real-excerpt');
  await expect(page.locator('.words')).toContainText('依頼');
  const total=await page.locator('.metrics article strong').first().textContent();expect(Number(total)).toBeGreaterThan(5);
  await page.locator('.sections button').nth(1).click();await expect(page.locator('.words')).toContainText('に');
  await expect(page.locator('.words')).toContainText('の');await expect(page.locator('.metrics article strong').first()).toHaveText(total!);
  await page.locator('.words summary').first().click();await expect(page.locator('.words code').first()).toBeVisible();
});

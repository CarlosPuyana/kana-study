import {test,expect} from '@playwright/test';

test('configured local manga shares Reader, editions, RTL and Japanese study integration',async({page},info)=>{
  await page.route('**/supabase-config.js',r=>r.fulfill({contentType:'text/javascript',body:'window.__KANA_STUDY_CONFIG__ = {};'}));
  await page.addInitScript(theme=>{
    localStorage.setItem('kana-study.settings.v1',JSON.stringify({language:'es',theme}));
    localStorage.setItem('kana-study.manga-reader-preferences.v1',JSON.stringify({ocrVisible:true,fitMode:'width'}));
  },info.project.use.colorScheme==='light'?'light':'dark');
  const pages=[1,2].map(n=>({id:'p0'+n,width:400,height:500,images:{ja:`pages/jp/p0${n}.svg`,es:`pages/es/p0${n}.svg`}}));
  const metadata={schemaVersion:1,id:'local-fixture',titles:{ja:'テスト',es:'Prueba local'},originalLanguage:'ja',availableLanguages:['ja','es'],readingDirection:'rtl',status:'published',pages,mokuro:{ja:'ja.mokuro'}};
  await page.route('**/manga/index.json',r=>r.fulfill({json:{schemaVersion:1,mangas:['fixture/metadata.json']}}));
  await page.route('**/manga/fixture/metadata.json',r=>r.fulfill({json:metadata}));
  await page.route('**/manga/fixture/pages/**',r=>r.fulfill({contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="400" height="500"><rect width="400" height="500" fill="white"/></svg>'}));
  await page.route('**/manga/fixture/ja.mokuro',r=>r.fulfill({json:{version:'0.2.0',title:'テスト',volume:'Fixture',pages:pages.map(p=>({img_path:p.images.ja,img_width:p.width,img_height:p.height,blocks:[{box:[30,40,200,80],vertical:false,font_size:32,lines:['学校'],lines_coords:[[[30,40],[200,40],[200,80],[30,80]]]}]}))}}));
  const audio:string[]=[];page.on('request',r=>{if(/\.mp3(?:\?|$)/.test(r.url()))audio.push(r.url());});
  await page.goto('/#/manga');await expect(page.getByRole('heading',{name:'Mangas propios',exact:true})).toBeVisible();
  await page.evaluate(()=>new Promise<void>((resolve,reject)=>{
    const req=indexedDB.open('kana-study-dictionary',1);req.onupgradeneeded=()=>{req.result.createObjectStore('metadata',{keyPath:'id'});const terms=req.result.createObjectStore('terms',{keyPath:'id'});terms.createIndex('expression',['dictionaryId','expression']);terms.createIndex('reading',['dictionaryId','reading']);terms.createIndex('dictionaryId','dictionaryId');};
    req.onerror=()=>reject(req.error);req.onsuccess=()=>{const db=req.result,tx=db.transaction(['metadata','terms'],'readwrite');tx.objectStore('metadata').put({id:'active',dictionaryId:'fixture',title:'Controlled dictionary',status:'ready',count:1,updatedAt:new Date().toISOString()});tx.objectStore('terms').put({id:'school',dictionaryId:'fixture',expression:'学校',reading:'がっこう',glossaries:['escuela'],rules:'n',definitionTags:'',score:0,sequence:1,termTags:''});tx.oncomplete=()=>{db.close();resolve();};tx.onerror=()=>reject(tx.error);};
  }));
  await page.locator('a[href="#/manga/read/catalog:local-fixture"]').click();await expect(page.locator('.page-counter')).toHaveText('1 / 2');
  const language=page.getByRole('combobox',{name:'Idioma'});await expect(language).toHaveValue('ja');
  await page.locator('.page-stage').focus();await page.keyboard.press('ArrowLeft');await expect(page.locator('.page-counter')).toHaveText('2 / 2');
  await language.selectOption('es');await expect(language).toBeEnabled();await expect(page.locator('.page-counter')).toHaveText('2 / 2');await expect(page.locator('.ocr-line')).toHaveCount(0);
  await language.selectOption('ja');await expect(language).toBeEnabled();await page.locator('.ocr-line').click({position:{x:4,y:12}});
  await expect(page.locator('.study-integration')).toContainText('学校');await expect(page.locator('.study-kanji strong')).toHaveText(['学','校']);
  await expect(page.locator('.study-integration a[href^="#/vocabulary/all"]')).toHaveCount(1);expect(audio).toEqual([]);
  await page.keyboard.press('Escape');
  for(const theme of ['dark','light','nora','nora-dark','anime']){
    await page.evaluate(theme=>document.documentElement.setAttribute('data-theme',theme),theme);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
    const box=await language.boundingBox();expect(box?.height).toBeGreaterThanOrEqual(44);
  }
  await page.reload();await expect(page.locator('.page-counter')).toHaveText('2 / 2');await expect(language).toHaveValue('ja');expect(audio).toEqual([]);
});

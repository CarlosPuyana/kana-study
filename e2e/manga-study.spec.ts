import {test,expect,Page} from '@playwright/test';

async function installFixture(page:Page){
  await page.goto('/#/more');
  await page.evaluate(async()=>{
    localStorage.setItem('kana-study.manga-reader-preferences.v1',JSON.stringify({ocrVisible:true,dictionaryEnabled:true,fitMode:'width'}));
    const open=(name:string,upgrade:(db:IDBDatabase)=>void)=>new Promise<IDBDatabase>((resolve,reject)=>{const req=indexedDB.open(name,1);req.onupgradeneeded=()=>upgrade(req.result);req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);});
    const write=(db:IDBDatabase,values:Record<string,unknown[]>)=>new Promise<void>((resolve,reject)=>{const tx=db.transaction(Object.keys(values),'readwrite');tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);for(const [store,rows]of Object.entries(values))for(const row of rows)tx.objectStore(store).put(row);});
    const dictionary=await open('kana-study-dictionary',db=>{db.createObjectStore('metadata',{keyPath:'id'});const terms=db.createObjectStore('terms',{keyPath:'id'});terms.createIndex('expression',['dictionaryId','expression']);terms.createIndex('reading',['dictionaryId','reading']);terms.createIndex('dictionaryId','dictionaryId');});
    await write(dictionary,{metadata:[{id:'active',dictionaryId:'local-fixture',title:'Controlled dictionary',status:'ready',count:1,updatedAt:new Date().toISOString()}],terms:[{id:'eat',dictionaryId:'local-fixture',expression:'食べる',reading:'たべる',glossaries:['comer'],rules:'v1',definitionTags:'',score:1,sequence:1,termTags:''}]});dictionary.close();
    const manga=await open('kana-study-manga',db=>{db.createObjectStore('volumes',{keyPath:'id'});db.createObjectStore('pages',{keyPath:['volumeId','pageIndex']}).createIndex('volumeId','volumeId');db.createObjectStore('reading-progress',{keyPath:'volumeId'});});
    const image=new Blob(['<svg xmlns="http://www.w3.org/2000/svg" width="400" height="500"><rect width="400" height="500" fill="white"/></svg>'],{type:'image/svg+xml'});
    const ocr={img_path:'page.svg',img_width:400,img_height:500,blocks:[{box:[30,40,350,80],vertical:false,font_size:32,lines:['食べなかった'],lines_coords:[[[30,40],[350,40],[350,80],[30,80]]]}]};
    const date=new Date().toISOString();
    await write(manga,{volumes:[{id:'study-fixture',seriesTitle:'Local QA',title:'Manga Study fixture',pageCount:2,storageBytes:image.size*2,mokuro:{version:'0.2.0',title:'Local QA',volume:'1'},createdAt:date,updatedAt:date,complete:true}],pages:[0,1].map(pageIndex=>({volumeId:'study-fixture',pageIndex,image,ocr})), 'reading-progress':[{volumeId:'study-fixture',pageIndex:1,activeSeconds:0,completed:false,lastOpenedAt:date,updatedAt:date}]});manga.close();
  });
}

async function lookup(page:Page){
  await expect(page.locator('.page-counter')).toHaveText('2 / 2');
  const line=page.locator('.ocr-line').first();await expect(line).toBeVisible();await line.click({position:{x:5,y:12}});
  const section=page.locator('.study-integration');await expect(section).toBeVisible();await expect(section).toContainText('En Kana Study');await expect(section).toContainText('食べる');await expect(section).toContainText('たべる');await expect(section.locator('.study-kanji strong')).toHaveText('食');return section;
}

test('controlled Manga lookup reuses study details, writing and contextual returns in every theme',async({page},info)=>{
  await page.route('**/supabase-config.js',r=>r.fulfill({contentType:'text/javascript',body:'window.__KANA_STUDY_CONFIG__ = {};'}));
  await page.addInitScript(theme=>localStorage.setItem('kana-study.settings.v1',JSON.stringify({language:'es',theme})),info.project.use.colorScheme==='light'?'light':'dark');
  const requests:string[]=[];page.on('request',r=>{if(/\.mp3(?:\?|$)/.test(r.url()))requests.push(r.url());});
  await installFixture(page);await page.goto('/#/manga/read/study-fixture');
  let section=await lookup(page);expect(requests).toEqual([]);
  await expect(section.locator('a[href^="#/vocabulary/all?entry=n5-euiuyn"]')).toHaveCount(1);await expect(section.locator('button')).toHaveText(/Escuchar/);
  for(const target of ['vocabulary/all','vocabulary/writing','kanji/all','kanji/writing']){
    await section.locator(`a[href^="#/${target}?"]`).click();await expect(page).toHaveURL(new RegExp('#/'+target+'\\?'));
    if(target.endsWith('/all')){await expect(page.getByRole('dialog')).toBeVisible();await page.getByRole('button',{name:'Cerrar',exact:true}).click();await page.getByRole('button',{name:'Volver',exact:true}).click();}
    else{await expect(page.getByRole('img',{name:/Superficie de escritura/})).toBeVisible();await page.getByRole('link',{name:'Volver',exact:true}).click();}
    await expect(page).toHaveURL(/#\/manga\/read\/study-fixture$/);section=await lookup(page);
  }
  for(const theme of ['dark','light','nora','nora-dark','anime']){
    await page.evaluate(theme=>localStorage.setItem('kana-study.settings.v1',JSON.stringify({language:'es',theme})),theme);
    // Avoid the init script overwriting the theme on reload: update the live Angular theme token for visual smoke.
    await page.evaluate(theme=>document.documentElement.setAttribute('data-theme',theme),theme);
    await expect(page.locator('html')).toHaveAttribute('data-theme',theme);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
    expect(await section.evaluate(el=>el.scrollWidth<=el.clientWidth+1)).toBe(true);
    for(const action of await section.locator('a,button').all()){const box=await action.boundingBox();expect(box?.height).toBeGreaterThanOrEqual(44);expect(box?.width).toBeGreaterThanOrEqual(44);}
  }
  expect(requests).toEqual([]);await page.keyboard.press('Escape');await expect(page.getByRole('dialog')).toHaveCount(0);
});

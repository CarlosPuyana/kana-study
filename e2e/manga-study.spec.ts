import {test,expect,Page} from '@playwright/test';

async function installFixture(page:Page){
  await page.goto('/#/more');
  await page.evaluate(async()=>{
    localStorage.setItem('kana-study.manga-reader-preferences.v1',JSON.stringify({ocrVisible:true,dictionaryEnabled:true,fitMode:'width'}));
    const open=(name:string,upgrade:(db:IDBDatabase)=>void)=>new Promise<IDBDatabase>((resolve,reject)=>{const req=indexedDB.open(name,1);req.onupgradeneeded=()=>upgrade(req.result);req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);});
    const write=(db:IDBDatabase,values:Record<string,unknown[]>)=>new Promise<void>((resolve,reject)=>{const tx=db.transaction(Object.keys(values),'readwrite');tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);for(const [store,rows]of Object.entries(values))for(const row of rows)tx.objectStore(store).put(row);});
    const dictionary=await open('kana-study-dictionary',db=>{db.createObjectStore('metadata',{keyPath:'id'});const terms=db.createObjectStore('terms',{keyPath:'id'});terms.createIndex('expression',['dictionaryId','expression']);terms.createIndex('reading',['dictionaryId','reading']);terms.createIndex('dictionaryId','dictionaryId');});
    await write(dictionary,{metadata:[{id:'active',dictionaryId:'local-fixture',title:'Controlled dictionary',status:'ready',count:2,updatedAt:new Date().toISOString()}],terms:[{id:'eat',dictionaryId:'local-fixture',expression:'食べる',reading:'たべる',glossaries:['comer'],rules:'v1',definitionTags:'',score:1,sequence:1,termTags:''},{id:'unknown',dictionaryId:'local-fixture',expression:'未知語',reading:'みちご',glossaries:['palabra desconocida'],rules:'',definitionTags:'',score:1,sequence:2,termTags:''}]});dictionary.close();
    const manga=await open('kana-study-manga',db=>{db.createObjectStore('volumes',{keyPath:'id'});db.createObjectStore('pages',{keyPath:['volumeId','pageIndex']}).createIndex('volumeId','volumeId');db.createObjectStore('reading-progress',{keyPath:'volumeId'});});
    const image=new Blob(['<svg xmlns="http://www.w3.org/2000/svg" width="400" height="500"><rect width="400" height="500" fill="white"/></svg>'],{type:'image/svg+xml'});
    const ocr={img_path:'page.svg',img_width:400,img_height:500,blocks:[{box:[30,40,350,80],vertical:false,font_size:32,lines:['食べなかった'],lines_coords:[[[30,40],[350,40],[350,80],[30,80]]]},{box:[30,120,350,160],vertical:false,font_size:32,lines:['未知語'],lines_coords:[[[30,120],[350,120],[350,160],[30,160]]]}]};
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
  await expect(section.locator('a[href^="#/vocabulary/all?entry=n5-euiuyn"]')).toHaveCount(1);await expect(section.getByRole('button',{name:/Escuchar/})).toHaveCount(1);
  for(const target of ['vocabulary/all','vocabulary/writing','kanji/all','kanji/writing']){
    await section.locator(`a[href^="#/${target}?"]`).click();await expect(page).toHaveURL(new RegExp('#/'+target+'\\?'));
    if(target.endsWith('/all')){await expect(page.getByRole('dialog')).toBeVisible();await page.getByRole('button',{name:'Cerrar',exact:true}).click();await page.getByRole('button',{name:'Volver',exact:true}).click();}
    else{await expect(page.getByRole('img',{name:/Superficie de escritura/})).toBeVisible();await page.getByRole('link',{name:'Volver',exact:true}).click();}
    await expect(page).toHaveURL(/#\/manga\/read\/study-fixture\?page=2$/);section=await lookup(page);
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


test('saved words preserve original page, external terms and reactive collection counts',async({page},info)=>{
  await page.route('**/supabase-config.js',r=>r.fulfill({contentType:'text/javascript',body:'window.__KANA_STUDY_CONFIG__ = {};'}));
  await page.addInitScript(theme=>localStorage.setItem('kana-study.settings.v1',JSON.stringify({language:'es',theme})),info.project.use.colorScheme==='light'?'light':'dark');
  await installFixture(page);await page.goto('/#/manga/read/study-fixture');
  let section=await lookup(page);
  await section.getByRole('button',{name:'＋ Guardar para estudiar',exact:true}).click();
  await expect(section.getByRole('status')).toHaveText('✓ Guardada');
  await page.keyboard.press('Escape');
  // Move away from the saved source; returning must use page=2, not this latest position.
  await page.locator('.previous').click();await expect(page.locator('.page-counter')).toHaveText('1 / 2');
  await page.goto('/#/manga');
  await expect(page.getByRole('link',{name:'📚 Palabras guardadas · 1'})).toBeVisible();await page.getByRole('link',{name:'📚 Palabras guardadas · 1'}).click();
  const card=page.locator('.saved-grid article').first();
  await expect(card).toContainText('食べる');await expect(card).toContainText('食べなかった');await expect(card).toContainText('Manga Study fixture · pág. 2');
  for(const theme of ['dark','light','nora','nora-dark','anime']){
    await page.evaluate(theme=>document.documentElement.setAttribute('data-theme',theme),theme);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
    expect(await card.evaluate(el=>el.scrollWidth<=el.clientWidth+1)).toBe(true);
    for(const action of await card.locator('a,button').all()){const box=await action.boundingBox();expect(box?.height).toBeGreaterThanOrEqual(44);expect(box?.width).toBeGreaterThanOrEqual(44);}
  }
  await card.getByRole('link',{name:'Volver al manga',exact:true}).click();await expect(page.locator('.page-counter')).toHaveText('2 / 2');
  await page.locator('.ocr-line').filter({hasText:'未知語'}).click({position:{x:5,y:12}});
  section=page.locator('.study-integration');await expect(section.locator('.study-vocabulary')).toHaveCount(0);
  await section.getByRole('button',{name:'＋ Guardar para estudiar',exact:true}).click();await expect(section.getByRole('status')).toHaveText('✓ Guardada');
  await page.keyboard.press('Escape');await page.goto('/#/manga');await page.getByRole('link',{name:'📚 Palabras guardadas · 2'}).click();
  const unknown=page.locator('.saved-grid article').filter({has:page.getByRole('heading',{name:'未知語',exact:true})});
  await expect(unknown).toContainText('palabra desconocida');await expect(unknown.locator('a[href*="vocabulary"]')).toHaveCount(0);await expect(unknown.getByRole('button',{name:/Escuchar/})).toHaveCount(0);
  // Removing a volume retains both snapshots and removes return links.
  await page.evaluate(async()=>{const db=await new Promise<IDBDatabase>(resolve=>{const req=indexedDB.open('kana-study-manga',1);req.onsuccess=()=>resolve(req.result);});await new Promise<void>((resolve,reject)=>{const tx=db.transaction('volumes','readwrite');tx.objectStore('volumes').delete('study-fixture');tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);});db.close();});
  await page.reload();await expect(page.locator('.saved-grid article')).toHaveCount(2);await expect(page.locator('.saved-grid a[href*="/manga/read/"]')).toHaveCount(0);
  while(await page.locator('.saved-grid article').count()){
    const remaining=await page.locator('.saved-grid article').count();const current=page.locator('.saved-grid article').first();await current.locator('.footer').getByRole('button',{name:'Quitar',exact:true}).click();
    await current.getByRole('group').getByRole('button',{name:'Quitar',exact:true}).click();
    await expect(page.locator('.saved-grid article')).toHaveCount(remaining-1);
  }
  await expect(page.locator('.empty')).toContainText('Aún no has guardado ninguna palabra.');
  await page.getByRole('link',{name:'Volver al manga',exact:true}).click();await expect(page.getByRole('link',{name:'📚 Palabras guardadas · 0'})).toBeVisible();
});

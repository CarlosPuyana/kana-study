import { test, expect, Page } from '@playwright/test';

test.beforeEach(async ({page}, info) => {
  await page.route('**/supabase-config.js', r => r.fulfill({contentType:'text/javascript',body:'window.__KANA_STUDY_CONFIG__ = {};'}));
  await page.addInitScript(theme => {
    localStorage.setItem('kana-study.settings.v1',JSON.stringify({language:'es',theme}));
    localStorage.setItem('kana-study.manga-reader-preferences.v1',JSON.stringify({ocrVisible:true,dictionaryEnabled:true,fitMode:'width'}));
  }, info.project.use.colorScheme === 'light' ? 'light' : 'dark');
  await page.goto('/#/more');
  await page.evaluate(async () => {
    const open = (name:string,version:number,upgrade:(db:IDBDatabase)=>void) => new Promise<IDBDatabase>((resolve,reject) => {
      const r=indexedDB.open(name,version);r.onupgradeneeded=()=>upgrade(r.result);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);
    });
    const put = (db:IDBDatabase,rows:Record<string,unknown[]>) => new Promise<void>((resolve,reject) => {
      const tx=db.transaction(Object.keys(rows),'readwrite');tx.oncomplete=()=>resolve();tx.onabort=()=>reject(tx.error);
      for(const [name,values] of Object.entries(rows)) for(const value of values) tx.objectStore(name).put(value);
    });
    const dictionary=await open('kana-study-dictionary',1,db=>{
      db.createObjectStore('metadata',{keyPath:'id'});const s=db.createObjectStore('terms',{keyPath:'id'});
      s.createIndex('expression',['dictionaryId','expression']);s.createIndex('reading',['dictionaryId','reading']);s.createIndex('dictionaryId','dictionaryId');
    });
    const now=new Date().toISOString();
    await put(dictionary,{metadata:[{id:'active',dictionaryId:'h2ba-fixture',title:'JMdict Spanish QA',revision:'fixture',status:'ready',count:2,updatedAt:now}],
      terms:[['猫','ねこ','gato'],['犬','いぬ','perro']].map(([expression,reading,meaning],i)=>({id:'fixture-'+i,dictionaryId:'h2ba-fixture',expression,reading,
        glossaries:[meaning],sequence:i+1,definitionTags:'n',rules:'',score:1,termTags:''}))});dictionary.close();
    const manga=await open('kana-study-manga',2,db=>{
      db.createObjectStore('volumes',{keyPath:'id'});db.createObjectStore('pages',{keyPath:['volumeId','pageIndex']}).createIndex('volumeId','volumeId');
      db.createObjectStore('reading-progress',{keyPath:'volumeId'});db.createObjectStore('provisioning',{keyPath:'id'});
    });
    const image=new Blob(['<svg xmlns="http://www.w3.org/2000/svg" width="400" height="500"><rect width="400" height="500" fill="white"/></svg>'],{type:'image/svg+xml'});
    const ocr={img_path:'qa.svg',img_width:400,img_height:500,blocks:['猫がいる。','犬がいる。'].map((line,i)=>({box:[30,40+i*90,350,80+i*90],vertical:false,font_size:32,
      lines:[line],lines_coords:[[[30,40+i*90],[350,40+i*90],[350,80+i*90],[30,80+i*90]]]}))};
    await put(manga,{volumes:[{id:'h2ba-volume',seriesTitle:'QA',title:'Volumen asistido',pageCount:2,storageBytes:image.size*2,
      mokuro:{version:'0.2.0',title:'QA',volume:'1'},createdAt:now,updatedAt:now,complete:true}],
      pages:[0,1].map(pageIndex=>({volumeId:'h2ba-volume',pageIndex,image,ocr})),
      'reading-progress':[{volumeId:'h2ba-volume',pageIndex:1,activeSeconds:0,completed:false,lastOpenedAt:now,updatedAt:now}]});manga.close();
  });
  await page.goto('/#/manga/read/h2ba-volume');
  await expect(page.locator('.page-counter')).toHaveText('2 / 2');
});

async function selectOcr(page:Page, index=0, expectMeaning=true) {
  const line=page.locator('.ocr-line').nth(index); await expect(line).toBeVisible();
  const box=await line.evaluate(el=>{const r=document.createRange();r.setStart(el.firstChild!,0);r.setEnd(el.firstChild!,1);const b=r.getBoundingClientRect();return {x:b.x,y:b.y,width:b.width,height:b.height};});
  await page.mouse.move(box.x+1,box.y+box.height/2);await page.mouse.down();
  await page.mouse.move(box.x+box.width-1,box.y+box.height/2,{steps:8});await page.mouse.up();
  await expect(page.locator('app-dictionary-popup .selected-text')).toHaveText(index===0?'猫':'犬');
  if(expectMeaning)await expect(page.locator('app-dictionary-popup')).toContainText(index===0?'gato':'perro');
}
async function enableDevelopmentGate(page:Page) {
  await page.evaluate(()=>{
    // Angular's dev-only inspector: never a public URL, preference or application control.
    const popup=(window as any).ng.getComponent(document.querySelector('app-dictionary-popup'));
    popup.customEnabled.set(true);popup.assistedEnabled.set(true);
  });
  await page.getByRole('button',{name:'＋ Añadir a Mazos',exact:true}).click();
  await expect(page.locator('app-manga-deck-review')).toBeVisible();
}
async function review(page:Page,pageNumber=2) {
  if(!await page.locator('app-manga-deck-review').count())await page.getByRole('button',{name:'＋ Añadir a Mazos',exact:true}).click();
  const component=page.locator('app-manga-deck-review');
  await expect(component.locator('.source-context')).toContainText('Página '+pageNumber);
  await expect(component.getByRole('button',{name:'Añadir al mazo',exact:true})).toBeFocused();
  await expect(component.locator('fieldset')).toHaveCount(0);
  return component;
}
async function expectSaved(page:Page){
  await expect(page.locator('app-dictionary-popup')).toHaveCount(0);
  await expect(page.locator('.manga-reader > [role=status]')).toHaveText('Tarjeta añadida al mazo.');
  await expect(page.locator('.page-stage')).toBeFocused();
}
async function inspect(page:Page) {
  return page.evaluate(async()=>{
    const db=await new Promise<IDBDatabase>((resolve,reject)=>{const r=indexedDB.open('kana-study-custom-decks-v1');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});
    const read=(name:string)=>new Promise<any[]>(resolve=>{const r=db.transaction(name).objectStore(name).getAll();r.onsuccess=()=>resolve(r.result);});
    const decks=await read('decks'),cards=await read('cards'),journal=await read('journal');db.close();
    return {decks,cards,journal};
  });
}
async function navigate(page:Page,path:string) {await page.evaluate(p=>location.hash=p,path);}

test('the assisted flow stays hidden by default and query parameters do not enable it',async({page})=>{
  await selectOcr(page);await expect(page.locator('app-manga-deck-review')).toHaveCount(0);
  await page.keyboard.press('Escape');
  await expect(page.locator('app-dictionary-popup')).toHaveCount(0);
  await page.goto('/#/manga/read/h2ba-volume?experimental=true&customDecks=true');
  await selectOcr(page);await expect(page.locator('app-manga-deck-review')).toHaveCount(0);
});

test('real Mokuro selection, compact explicit confirmation, same-volume append, FSRS and undo',async({page},info)=>{
  const outgoing:string[]=[];page.on('request',r=>{if(r.method()==='POST'&&!r.url().startsWith('http://127.0.0.1'))outgoing.push(r.url());});
  await selectOcr(page);await enableDevelopmentGate(page);
  let component=await review(page);
  expect((await inspect(page)).decks).toHaveLength(0);
  await component.locator('.card-preview').screenshot({path:`test-results/h2ba-preview-${info.project.name}.png`});
  await component.getByRole('button',{name:'Añadir al mazo',exact:true}).dblclick();
  await expectSaved(page);
  const first=await inspect(page),deckId=first.decks[0].value.id;
  expect(first.cards).toHaveLength(1);expect(first.journal.filter(o=>o.value.kind==='manga-confirmation')).toHaveLength(1);
  expect(first.cards[0].value.lexicalIdentity.anchor.authority).toBe('kana-study-curated');
  expect(first.cards[0].value.context.pageNumber).toBe(2);
  await page.keyboard.press('Escape');await selectOcr(page,1);
  component=await review(page);await component.getByRole('button',{name:'Añadir al mazo',exact:true}).click();
  await expectSaved(page);
  expect((await inspect(page)).decks).toHaveLength(1);expect((await inspect(page)).cards).toHaveLength(2);
  await navigate(page,'/anki/'+deckId+'/study');
  await expect(page.locator('.front h1')).toHaveText('猫');
  await page.getByRole('button',{name:/mostrar respuesta/i}).click();
  await expect(page.locator('.back-content')).toContainText('ねこ');
  await expect(page.locator('.back-content')).toContainText('gato (ES)');
  await expect(page.locator('.back-content')).toContainText('猫がいる。');
  await expect(page.locator('.back-content')).toContainText('Página 2');
  await expect(page.locator('.ratings button')).toHaveCount(2);
  await page.screenshot({path:`test-results/h2ba-study-${info.project.name}.png`,fullPage:true});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
  await page.locator('.good').click();await expect(page.locator('.front h1')).toHaveText('犬');
  await page.locator('button.undo').click();await expect(page.locator('.front h1')).toHaveText('猫');
  expect((await inspect(page)).journal.some(o=>o.value.kind==='undo')).toBe(true);
  expect(outgoing).toEqual([]);
  await page.reload();await expect(page.getByRole('heading',{name:'No se ha encontrado el mazo.'})).toBeVisible();
  await navigate(page,'/anki/japanese-1500/cards');await expect(page.locator('.deck-summary')).toContainText('1500');
  expect(deckId).toMatch(/^md-[a-f0-9]{64}$/);
});

test('quick add shows essential data in one panel, supports keyboard, cancellation and edit without writes',async({page},info)=>{
  await selectOcr(page);await enableDevelopmentGate(page);const component=await review(page),before=await inspect(page);
  await expect(component.locator('.card-preview h4')).toHaveText('猫');await expect(component.locator('.reading')).toHaveText('ねこ');
  await expect(component.locator('.meaning')).toContainText('gato');await expect(component.locator('.destination > span:first-child')).toHaveText('Mazo de destino:');await expect(component.locator('.destination > span:last-child')).toHaveAttribute('title','QA · Volumen asistido');
  await page.screenshot({path:`.cache/h2bux1-quick-${info.project.name}.png`,fullPage:true});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await component.getByRole('button',{name:'Editar',exact:true}).click();await expect(component.getByLabel('Palabra japonesa',{exact:true})).toBeFocused();
  await component.getByLabel('Significado',{exact:true}).fill('gato revisado');
  await page.evaluate(()=>{(window as any).ng.getComponent(document.querySelector('app-manga-reader')).interact();});
  await expect(component.getByLabel('Significado',{exact:true})).toHaveValue('gato revisado');
  await page.getByRole('button',{name:'Contexto',exact:true}).click();await expect(component).toBeHidden();
  await page.getByRole('button',{name:'Palabra',exact:true}).click();await expect(component.getByLabel('Significado',{exact:true})).toHaveValue('gato revisado');
  await page.getByRole('button',{name:'Cerrar',exact:true}).focus();await page.keyboard.press('Shift+Tab');
  await expect(component.getByRole('button',{name:'Cancelar',exact:true})).toBeFocused();await page.keyboard.press('Tab');await expect(page.getByRole('button',{name:'Cerrar',exact:true})).toBeFocused();
  await page.keyboard.press('Escape');await expect(page.locator('app-dictionary-popup')).toHaveCount(0);expect(await inspect(page)).toEqual(before);
  await page.locator('.previous').click();await expect(page.locator('.page-counter')).toHaveText('1 / 2');
  await selectOcr(page);await review(page,1);await expect(component.getByRole('button',{name:'Añadir al mazo',exact:true})).toBeFocused();
  await page.keyboard.press('Enter');await expectSaved(page);expect((await inspect(page)).journal).toHaveLength(1);
});

async function alterDictionary(page:Page,mode:string){
  await page.evaluate(async mode=>{
    const db=await new Promise<IDBDatabase>((resolve,reject)=>{const r=indexedDB.open('kana-study-dictionary');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});
    await new Promise<void>((resolve,reject)=>{const tx=db.transaction('terms','readwrite'),store=tx.objectStore('terms'),get=store.get('fixture-0');
      get.onsuccess=()=>{const row=get.result;if(mode==='ambiguous')row.glossaries=['gato','felino'];if(mode==='reading')row.reading='';if(mode==='meaning')row.glossaries=[];if(mode==='manual')store.delete(row.id);else store.put(row);};tx.oncomplete=()=>resolve();tx.onabort=()=>reject(tx.error);});db.close();
  },mode);
}
for(const mode of ['ambiguous','reading','meaning','manual'])test(`quick add ${mode} uses compact manual fields and preserves original OCR`,async({page},info)=>{
  await alterDictionary(page,mode);await selectOcr(page,0,false);await enableDevelopmentGate(page);const component=page.locator('app-manga-deck-review');
  await expect(component.locator('.essentials')).toBeVisible();await expect(component.getByRole('button',{name:'Editar',exact:true})).toHaveAttribute('aria-expanded','false');expect((await inspect(page)).cards).toHaveLength(0);
  if(mode==='reading'){await expect(component.locator('.meaning')).toContainText('gato');await expect(component.getByLabel('Significado',{exact:true})).toHaveCount(0);}
  if(mode==='ambiguous'){
    await expect(component.getByRole('combobox',{name:'Significado',exact:true})).toHaveValue('');await component.getByRole('combobox',{name:'Significado',exact:true}).selectOption('felino');
    await page.screenshot({path:`.cache/h2bux1-edit-${info.project.name}.png`,fullPage:true});
  }else{
    await component.getByRole('button',{name:'Añadir al mazo',exact:true}).click();await expect(component.locator('[aria-invalid=true]').first()).toBeVisible();
    await component.getByRole('button',{name:'Editar',exact:true}).click();
    await component.getByLabel('Lectura',{exact:true}).fill('ねこ');await expect(component.getByLabel('Lectura',{exact:true})).toHaveValue('ねこ');await expect(component.getByLabel('Palabra japonesa',{exact:true})).toHaveValue('猫');await component.getByLabel('Significado',{exact:true}).fill('cat');
    await component.getByRole('combobox',{name:'Idioma del significado',exact:true}).selectOption('en');
  }
  await component.getByRole('button',{name:'Añadir al mazo',exact:true}).click();await expectSaved(page);
  const data=await inspect(page);expect(data.cards).toHaveLength(1);expect(data.journal).toHaveLength(1);
  expect(data.cards[0].value.context).toMatchObject({text:'猫がいる。',pageNumber:2});
  expect(data.cards[0].value.glosses[0]).toMatchObject({text:mode==='ambiguous'?'felino':'cat',language:mode==='ambiguous'?'es':'en'});
});

test('quick add keeps a failed operation for retry and reuses an explicitly chosen identity without changing FSRS',async({page})=>{
  await confirmedVocabulary(page);await page.getByRole('link',{name:/Estudiar mazo/}).click();await page.getByRole('button',{name:/mostrar respuesta/i}).click();await page.locator('.good').click();
  await navigate(page,'/manga/vocabulary/h2ba-volume');await expect(page.locator('app-manga-volume-vocabulary .state')).toHaveText('Aprendiendo');
  await occurrences(page);const before=await preservedRecords(page);
  await page.getByRole('link',{name:'Abrir página 1',exact:true}).click();await expect(page.locator('app-manga-ocr-location [role=status]')).toContainText('Línea OCR localizada');
  await selectOcr(page);const component=await review(page,1);
  const identities=component.getByRole('combobox',{name:'Tarjeta relacionada',exact:true});
  await expect(identities).toBeVisible();await component.getByRole('button',{name:'Añadir al mazo',exact:true}).click();expect(await preservedRecords(page)).toEqual(before);
  await identities.selectOption({index:1});
  await page.evaluate(()=>{const c=(window as any).ng.getComponent(document.querySelector('app-manga-deck-review')),r=c.service.repository,confirm=r.confirmMangaCard.bind(r);let first=true;
    r.confirmMangaCard=async(...args:any[])=>{if(first){first=false;throw Error('synthetic-quota');}return confirm(...args);};});
  await component.getByRole('button',{name:'Añadir al mazo',exact:true}).click();await expect(component.getByRole('alert').first()).toContainText('No se pudo confirmar o guardar');
  expect(await preservedRecords(page)).toEqual(before);await component.getByRole('button',{name:'Reintentar',exact:true}).click();await expectSaved(page);
  const after=await preservedRecords(page);expect(after.cards).toHaveLength(1);expect(after.progress).toEqual(before.progress);expect(after.events).toEqual(before.events);expect(after.journal).toHaveLength(before.journal.length+1);
});

test('quick add discards a held confirmation when the Reader closes or workspace makes A-B-A',async({page})=>{
  await selectOcr(page);await enableDevelopmentGate(page);await review(page);
  await page.evaluate(()=>{const c=(window as any).ng.getComponent(document.querySelector('app-manga-deck-review')),preview=c.service.preview.bind(c.service);let release!:()=>void;const wait=new Promise<void>(r=>release=r);(window as any).quickRelease=release;
    c.service.preview=async(...args:any[])=>{const p=await preview(...args);await wait;return p;};
    (window as any).quickWorkspace=c.workspace;});
  await page.getByRole('button',{name:'Añadir al mazo',exact:true}).click();
  await page.evaluate(()=>{const w=(window as any).quickWorkspace;w.activateUser('ux-other');w.activateGuest();(window as any).quickRelease();});
  await expect(page.locator('app-manga-page')).toBeVisible();expect((await inspect(page)).journal).toHaveLength(0);
});

test('deleting the manga keeps the confirmed context and deck usable',async({page})=>{
  await selectOcr(page);await enableDevelopmentGate(page);const component=await review(page);
  await component.getByRole('button',{name:'Añadir al mazo',exact:true}).click();
  await expectSaved(page);
  const deckId=(await inspect(page)).decks[0].value.id;
  await navigate(page,'/manga');const volume=page.locator('.library-grid > article').filter({hasText:'Volumen asistido'});
  await volume.locator('.volume-menu summary').click();await volume.getByRole('button',{name:'Eliminar',exact:true}).click();
  await page.getByRole('dialog').getByRole('button',{name:'Eliminar',exact:true}).click();
  await expect(volume).toHaveCount(0);
  await navigate(page,'/anki/'+deckId+'/study');await expect(page.locator('.front h1')).toHaveText('猫');
  await page.getByRole('button',{name:/mostrar respuesta/i}).click();
  await expect(page.locator('.back-content')).toContainText('猫がいる。');
  await expect(page.locator('.back-content')).toContainText('Página 2');
});

test('confirmed volume vocabulary is readonly, searchable, responsive and returns to the original FSRS study',async({page},info)=>{
  await selectOcr(page);await enableDevelopmentGate(page);const component=await review(page);
  await component.getByRole('button',{name:'Añadir al mazo',exact:true}).click();
  await expectSaved(page);
  const before=await inspect(page);let writes=0;page.on('request',r=>{if(r.method()==='POST')writes++;});
  await navigate(page,'/manga');await page.getByRole('link',{name:'Vocabulario confirmado',exact:true}).click();
  const view=page.locator('app-manga-volume-vocabulary');await expect(view.locator('.cards li')).toHaveCount(1);
  await expect(view).toContainText('No representan todo el vocabulario del manga');await expect(view.locator('.state')).toHaveText('Pendiente');
  await view.locator('summary').focus();await page.keyboard.press('Enter');await expect(view.locator('blockquote')).toBeVisible();await expect(view.locator('blockquote')).toHaveText('猫がいる。');await expect(view).toContainText('Página 2');
  await view.getByRole('searchbox').fill('inexistente');await expect(view.locator('.cards li')).toHaveCount(0);
  await view.getByRole('searchbox').fill('GATO');await expect(view.locator('.cards li')).toHaveCount(1);
  await view.getByRole('combobox',{name:'Estado de la tarjeta',exact:true}).selectOption('known');await expect(view.locator('.cards li')).toHaveCount(0);
  await view.getByRole('combobox',{name:'Estado de la tarjeta',exact:true}).selectOption('all');
  await view.locator('summary').focus();await page.keyboard.press('Enter');await expect(view.locator('blockquote')).toBeVisible();
  await page.screenshot({path:`.cache/h3ba-${info.project.name}.png`,fullPage:true});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);expect(await inspect(page)).toEqual(before);expect(writes).toBe(0);
  await view.getByRole('link',{name:/Estudiar mazo/}).click();await expect(page.locator('.front h1')).toHaveText('猫');
  await page.getByRole('button',{name:/mostrar respuesta/i}).click();await page.locator('.good').click();
  await navigate(page,'/manga/vocabulary/h2ba-volume');await expect(view.locator('.state')).toBeVisible();
  await expect(view.locator('.state')).not.toHaveText('Pendiente');
  await expect.poll(()=>view.evaluate(el=>(window as any).ng.getComponent(el).result()?.entries[0]?.classification)).toMatchObject({state:'learning',reasons:[]});
});

test('library and vocabulary deep links remain hidden with default gates',async({page})=>{
  await navigate(page,'/manga');await expect(page.getByRole('heading',{name:'Volumen asistido',exact:true})).toBeVisible();
  await expect(page.getByRole('link',{name:'Vocabulario confirmado',exact:true})).toHaveCount(0);
  const experimentalRequests:string[]=[];page.on('request',r=>{if(r.url().includes('manga-volume-vocabulary')||r.url().includes('manga-ocr-explorer'))experimentalRequests.push(r.url());});
  await navigate(page,'/manga/vocabulary/h2ba-volume?experimental=true');
  await expect(page).not.toHaveURL(/manga\/vocabulary/);
  await expect(page.locator('app-manga-volume-vocabulary')).toHaveCount(0);
  expect(experimentalRequests).toEqual([]);
});

async function confirmedVocabulary(page:Page){
  await selectOcr(page);await enableDevelopmentGate(page);const component=await review(page);
  await component.getByRole('button',{name:'Añadir al mazo',exact:true}).click();
  await expectSaved(page);
  await navigate(page,'/manga/vocabulary/h2ba-volume');await expect(page.locator('app-manga-volume-vocabulary .cards li')).toHaveCount(1);
}
async function customRecords(page:Page){return page.evaluate(async()=>{
  const parent=(window as any).ng.getComponent(document.querySelector('app-manga-volume-vocabulary'));
  return parent.repository.confirmedVocabularyInventory();
});}
test('literal OCR explorer is deferred, readonly, keyboard accessible and navigates only to the original page',async({page},info)=>{
  await confirmedVocabulary(page);
  await page.getByRole('link',{name:/Estudiar mazo/}).click();await expect(page.locator('.front h1')).toHaveText('猫');
  await page.getByRole('button',{name:/mostrar respuesta/i}).click();await page.locator('.good').click();
  await navigate(page,'/manga/vocabulary/h2ba-volume');await expect(page.locator('app-manga-volume-vocabulary .state')).toHaveText('Aprendiendo');
  const before=await customRecords(page);expect(before.progress).toHaveLength(1);expect(before.events).toHaveLength(1);
  let posts=0;page.on('request',r=>{if(r.method()==='POST')posts++;});
  const view=page.locator('app-manga-volume-vocabulary');await expect(page.locator('app-manga-ocr-explorer')).toHaveCount(0);
  const find=view.getByRole('button',{name:'Buscar en OCR · 猫',exact:true});await find.focus();await page.keyboard.press('Enter');
  const explorer=page.locator('app-manga-ocr-explorer');await expect(explorer.getByRole('status')).toHaveText('Exploración completa del OCR disponible en esta captura.');
  await expect(explorer.locator('mark')).toHaveCount(2);await expect(explorer).toContainText('no identidad ni frecuencia léxica');
  await expect(explorer.locator('.counts div').first().locator('dd')).toHaveText('2');
  expect(await customRecords(page)).toEqual(before);expect(posts).toBe(0);
  await page.evaluate(()=>{const p=(window as any).ng.getComponent(document.querySelector('app-manga-volume-vocabulary')),c=(window as any).ng.getComponent(document.querySelector('app-manga-ocr-explorer'));
    (window as any).ocrCalls=0;(window as any).vocabReloads=0;const scan=c.service.scan.bind(c.service),load=p.service.load.bind(p.service);
    c.service.scan=(...args:any[])=>{(window as any).ocrCalls++;return scan(...args);};p.service.load=(...args:any[])=>load(...args).then((r:any)=>{(window as any).vocabReloads++;return r;});p.repository.progressRevision.update((n:number)=>n+1);
  });
  await expect.poll(()=>page.evaluate(()=>(window as any).vocabReloads)).toBe(1);expect(await page.evaluate(()=>(window as any).ocrCalls)).toBe(0);
  await page.screenshot({path:`.cache/h3bb0-${info.project.name}.png`,fullPage:true});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await explorer.getByRole('link',{name:'Abrir página 1',exact:true}).click();await expect(page.locator('.page-counter')).toHaveText('1 / 2');
  await expect(page.locator('app-dictionary-popup')).toHaveCount(0);expect(await page.evaluate(()=>window.getSelection()?.toString()??'')).toBe('');
});
test('OCR cancellation preserves partial counts and explicit fingerprint verification detects text-only edits',async({page})=>{
  await confirmedVocabulary(page);const before=await customRecords(page);
  await page.getByRole('button',{name:'Buscar en OCR · 猫',exact:true}).click();const explorer=page.locator('app-manga-ocr-explorer');
  await expect(explorer.getByRole('status')).toHaveText('Exploración completa del OCR disponible en esta captura.');
  await page.evaluate(()=>{const c=(window as any).ng.getComponent(document.querySelector('app-manga-ocr-explorer')),repo=c.service.source.repository,read=repo.page.bind(repo);
    let release!:()=>void;const gate=new Promise<void>(r=>release=r);(window as any).ocrRelease=release;
    repo.page=async(...args:any[])=>{if(args[1]===1){repo.page=read;await gate;}return read(...args);};
  });
  await explorer.getByRole('button',{name:'Explorar de nuevo',exact:true}).click();
  await expect(explorer.locator('.counts div').nth(2).locator('dd')).toHaveText('1');await expect(explorer.locator('mark')).toHaveCount(1);
  await explorer.getByRole('button',{name:'Cancelar exploración',exact:true}).click();await page.evaluate(()=>(window as any).ocrRelease());
  await expect(explorer.getByRole('status')).toHaveText('Exploración cancelada: solo se conserva el subconjunto examinado.');
  expect(await customRecords(page)).toEqual(before);
  await explorer.getByRole('button',{name:'Explorar de nuevo',exact:true}).click();await expect(explorer.getByRole('status')).toHaveText('Exploración completa del OCR disponible en esta captura.');
  await page.evaluate(async()=>{const c=(window as any).ng.getComponent(document.querySelector('app-manga-ocr-explorer')),r=c.service.source.repository,owner=c.workspace.active(),p=await r.page('h2ba-volume',0,owner);p.ocr.blocks[0].lines[0]+='猫';await r.put('pages',p,owner);});
  await explorer.getByRole('button',{name:'Verificar OCR actual',exact:true}).click();await expect(explorer.getByRole('status')).toContainText('El OCR ha cambiado.');
  expect(await customRecords(page)).toEqual(before);
});

async function occurrences(page:Page){
  await page.getByRole('button',{name:'Buscar en OCR · 猫',exact:true}).click();const explorer=page.locator('app-manga-ocr-explorer');
  await expect(explorer.getByRole('status')).toHaveText('Exploración completa del OCR disponible en esta captura.');
  await page.evaluate(()=>{const p=(window as any).ng.getComponent(document.querySelector('app-manga-volume-vocabulary')),c=(window as any).ng.getComponent(document.querySelector('app-manga-ocr-explorer'));
    (window as any).b1={repository:p.repository,source:c.service.source};});return explorer;
}
async function preservedRecords(page:Page){return page.evaluate(async()=>{const r=(window as any).b1.repository;return {...await r.confirmedVocabularyInventory(),journal:await r.journal()};});}
test('a concrete occurrence is line-localized, survives history by revalidation and continues through the original manual review',async({page},info)=>{
  await page.evaluate(async()=>{const r=(window as any).ng.getComponent(document.querySelector('app-manga-reader')).repository,p=await r.page('h2ba-volume',0,'guest');p.ocr.blocks[0].lines[0]='猫猫がいる。';await r.put('pages',p,'guest');});
  await confirmedVocabulary(page);await page.getByRole('link',{name:/Estudiar mazo/}).click();await expect(page.locator('.front h1')).toHaveText('猫');
  await page.getByRole('button',{name:/mostrar respuesta/i}).click();await page.locator('.good').click();await navigate(page,'/manga/vocabulary/h2ba-volume');
  await expect(page.locator('app-manga-volume-vocabulary .state')).toHaveText('Aprendiendo');
  const explorer=await occurrences(page),before=await preservedRecords(page);expect(before.progress).toHaveLength(1);
  const target=explorer.getByRole('link',{name:'Abrir página 1',exact:true}).nth(1);await target.focus();await page.keyboard.press('Enter');
  const panel=page.locator('app-manga-ocr-location');await expect(panel.getByRole('status')).toHaveText('Línea OCR localizada; el marco no señala caracteres exactos.');
  await expect(page.locator('.page-counter')).toHaveText('1 / 2');await expect(panel).toContainText('[1, 2)');
  await expect(page.locator('.ocr-line.located-line')).toHaveCount(1);await expect(page.locator('.ocr-line.located-line')).toHaveAttribute('data-block-index','0');
  await expect(page.locator('app-dictionary-popup')).toHaveCount(0);expect(await page.evaluate(()=>window.getSelection()?.toString()??'')).toBe('');expect(await preservedRecords(page)).toEqual(before);
  expect(await page.evaluate(()=>{const p=document.querySelector('app-manga-ocr-location')!.getBoundingClientRect(),s=document.querySelector('.page-stage')!.getBoundingClientRect();return p.bottom<=s.top+1&&s.height>150&&document.documentElement.scrollWidth<=innerWidth;})).toBe(true);
  await page.screenshot({path:`.cache/h3bb1-${info.project.name}.png`,fullPage:true});
  await page.locator('.next').click();await expect(page.locator('.page-counter')).toHaveText('2 / 2');await expect(panel).toHaveCount(0);await expect(page.locator('.located-line')).toHaveCount(0);
  await page.goBack();await expect(page.locator('app-manga-volume-vocabulary')).toBeVisible();await page.goForward();
  await expect(panel.getByRole('status')).toContainText('Línea OCR localizada');await expect(panel).toContainText('[1, 2)');
  await panel.getByRole('button',{name:'Quitar localización',exact:true}).focus();await page.keyboard.press('Enter');await expect(panel).toHaveCount(0);await expect(page.locator('.page-stage')).toBeFocused();await expect(page.locator('.located-line')).toHaveCount(0);
  // Manual selection is still the only route to lookup and H2B-A. It can differ from the navigated substring.
  await selectOcr(page);await page.getByRole('button',{name:'＋ Añadir a Mazos',exact:true}).click();const form=page.locator('app-manga-deck-review');
  await expect(form.locator('.card-preview .reading')).toHaveText('ねこ');
  expect(await preservedRecords(page)).toEqual(before);
  // Equal spelling does not imply identity; explicitly choose a separate curated entity.
  await form.getByRole('button',{name:'Crear otra identidad (sin heredar repasos)',exact:true}).click();
  await expect(form.locator('.source-context')).toContainText('Página 1');expect(await preservedRecords(page)).toEqual(before);
  await form.getByRole('button',{name:'Añadir al mazo',exact:true}).click();await expectSaved(page);
  const after=await preservedRecords(page);expect(after.cards).toHaveLength(2);expect(new Set(after.cards.map((c:any)=>c.value.lexicalIdentity.key)).size).toBe(2);
  expect(after.progress).toEqual(before.progress);expect(after.events).toEqual(before.events);expect(after.journal).toHaveLength(before.journal.length+1);
});

test('stale, forged, reimported and deleted-source references fall back without choosing another match',async({page})=>{
  await confirmedVocabulary(page);const explorer=await occurrences(page),before=await preservedRecords(page);
  await page.evaluate(async()=>{const r=(window as any).b1.source.repository,p=await r.page('h2ba-volume',0,'guest');p.ocr.blocks[0].lines[0]+='追記';await r.put('pages',p,'guest');});
  await explorer.getByRole('link',{name:'Abrir página 1',exact:true}).click();const panel=page.locator('app-manga-ocr-location');
  await expect(panel.getByRole('status')).toHaveText('El OCR cambió. Resaltado descartado.');await expect(page.locator('.located-line')).toHaveCount(0);await expect(page.locator('app-dictionary-popup')).toHaveCount(0);
  await page.evaluate(async()=>{const b=(window as any).b1,reader=(window as any).ng.getComponent(document.querySelector('app-manga-reader'));b.reference=history.state.mangaOcrOccurrence;b.router=reader.router;
    await b.router.navigateByUrl('/manga/vocabulary/h2ba-volume');await b.router.navigateByUrl('/manga/read/h2ba-volume?page=1',{state:{mangaOcrOccurrence:{...b.reference,start:9999,end:10000}}});});
  await expect(panel.getByRole('status')).toHaveText('Localización no disponible. La página sigue abierta.');await expect(page.locator('.located-line')).toHaveCount(0);
  // Same route component, another volume with the same title. Its identity must never be adopted.
  await page.evaluate(async()=>{const b=(window as any).b1,r=b.source.repository,v=await r.volume('h2ba-volume','guest');await r.put('volumes',{...v,id:'reimport'},'guest');for(let i=0;i<2;i++){const p=await r.page('h2ba-volume',i,'guest');await r.put('pages',{...p,volumeId:'reimport'},'guest');}
    await b.router.navigateByUrl('/manga/read/reimport?page=1',{state:{mangaOcrOccurrence:b.reference}});});
  await expect(panel.getByRole('status')).toHaveText('Localización no disponible. La página sigue abierta.');
  expect(await page.evaluate(()=>(window as any).ng.getComponent(document.querySelector('app-manga-reader')).current().volumeId)).toBe('reimport');
  await page.evaluate(async()=>{const b=(window as any).b1;await b.source.repository.delete('h2ba-volume','guest');await b.router.navigateByUrl('/manga/read/h2ba-volume?page=1',{state:{mangaOcrOccurrence:b.reference}});});
  await expect(panel.getByRole('status')).toHaveText('Localización no disponible. La página sigue abierta.');await expect(page.locator('.manga-reader [role=alert]')).toBeVisible();
  await expect(page.locator('.located-line')).toHaveCount(0);expect(await preservedRecords(page)).toEqual(before);
});

test('page changes, reader closure and A-B-A fence a held location read without late highlights',async({page})=>{
  await confirmedVocabulary(page);const explorer=await occurrences(page),before=await preservedRecords(page);
  await page.evaluate(()=>{
    const b=(window as any).b1;
    b.arm=()=>{
      let release!:()=>void;const wait=new Promise<void>(r=>release=r);b.release=release;b.entered=false;
      const open=b.source.open.bind(b.source);
      b.source.open=async(...args:any[])=>{
        b.source.open=open;const source=await open(...args);
        return {...source,read:async(index:number)=>{b.entered=true;await wait;return source.read(index);}};
      };
    };
    b.arm();
  });
  await explorer.getByRole('link',{name:'Abrir página 1',exact:true}).click();await expect.poll(()=>page.evaluate(()=>(window as any).b1.entered)).toBe(true);
  await expect(page.locator('.next')).toBeEnabled();await page.evaluate(()=>{const b=(window as any).b1,r=(window as any).ng.getComponent(document.querySelector('app-manga-reader'));b.reference=history.state.mangaOcrOccurrence;b.router=r.router;b.workspace=r.workspaceService;});
  await page.locator('.next').click();await page.evaluate(()=>(window as any).b1.release());await expect(page.locator('.page-counter')).toHaveText('2 / 2');await expect(page.locator('app-manga-ocr-location')).toHaveCount(0);await expect(page.locator('.located-line')).toHaveCount(0);
  await page.evaluate(async()=>{const b=(window as any).b1;b.arm();await b.router.navigateByUrl('/manga/read/h2ba-volume?page=2',{state:{mangaOcrOccurrence:{...b.reference,pageIndex:1}}});});
  await expect.poll(()=>page.evaluate(()=>(window as any).b1.entered)).toBe(true);await page.locator('.reader-header a').click();await page.evaluate(()=>(window as any).b1.release());await expect(page.locator('app-manga-page')).toBeVisible();
  await page.evaluate(async()=>{const b=(window as any).b1;b.arm();await b.router.navigateByUrl('/manga/read/h2ba-volume?page=1',{state:{mangaOcrOccurrence:b.reference}});});
  await expect.poll(()=>page.evaluate(()=>(window as any).b1.entered)).toBe(true);
  await page.evaluate(()=>{const b=(window as any).b1;b.workspace.activateUser('b1-synthetic');b.workspace.activateGuest();b.release();});
  await expect(page.locator('app-manga-page')).toBeVisible();await expect(page.locator('app-manga-ocr-location')).toHaveCount(0);await expect(page.locator('.located-line')).toHaveCount(0);expect(await preservedRecords(page)).toEqual(before);
});

test('a persisted occurrence state cannot instantiate location with default gates',async({page})=>{
  await page.evaluate(async()=>{const r=(window as any).ng.getComponent(document.querySelector('app-manga-reader')),p=await r.repository.page('h2ba-volume',0,'guest');
    const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(p.ocr))),hash=Array.from(new Uint8Array(bytes),n=>n.toString(16).padStart(2,'0')).join('');
    history.replaceState({mangaOcrOccurrence:{schemaVersion:1,volumeId:'h2ba-volume',pageIndex:0,blockIndex:0,lineIndex:0,start:0,end:1,found:'猫',pageFingerprint:hash,workspace:'guest',activationRevision:0}},'', '/#/manga/read/h2ba-volume?page=1');});
  const loaded:string[]=[];page.on('request',r=>{if(r.url().includes('manga-ocr-location'))loaded.push(r.url());});await page.reload();
  await expect(page.locator('.page-counter')).toHaveText('1 / 2');await expect(page.locator('app-manga-ocr-location')).toHaveCount(0);await expect(page.locator('.located-line')).toHaveCount(0);
  expect(await page.evaluate(()=>(window as any).ng.getComponent(document.querySelector('app-manga-reader')).locationEnabled())).toBe(false);
  // Dev-server HMR metadata is distinct from runtime imports; the production build graph is checked separately.
  expect(loaded.every(url=>new URL(url).pathname==='/@ng/component')).toBe(true);
});

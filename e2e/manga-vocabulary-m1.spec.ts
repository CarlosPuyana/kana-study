import {test, expect} from '@playwright/test';
import {ZipWriter, Uint8ArrayWriter, Uint8ArrayReader, TextReader} from '@zip.js/zip.js';

test('M1 imports synthetic Mokuro, analyzes locally, reloads and invalidates changed content', async({page}, info)=>{
  await page.route('**/supabase-config.js',r=>r.fulfill({contentType:'text/javascript',body:'window.__KANA_STUDY_CONFIG__ = {};'}));
  await page.addInitScript(theme=>localStorage.setItem('kana-study.settings.v1',JSON.stringify({language:'es',theme})),
    info.project.use.colorScheme==='light'?'light':'dark');
  await page.goto('/#/more');
  await page.evaluate(()=>new Promise<void>((resolve,reject)=>{
    const req=indexedDB.open('kana-study-dictionary',1);
    req.onupgradeneeded=()=>{
      req.result.createObjectStore('metadata',{keyPath:'id'});const terms=req.result.createObjectStore('terms',{keyPath:'id'});
      terms.createIndex('expression',['dictionaryId','expression']);terms.createIndex('reading',['dictionaryId','reading']);terms.createIndex('dictionaryId','dictionaryId');
    };
    req.onerror=()=>reject(req.error);req.onsuccess=()=>{
      const db=req.result,tx=db.transaction(['metadata','terms'],'readwrite');
      tx.objectStore('metadata').put({id:'active',dictionaryId:'fixture',title:'Synthetic',revision:'1',status:'ready',count:4,updatedAt:'2026-01-01'});
      for(const [i,[expression,reading,rules]] of [['猫','ねこ',''],['食べる','たべる','v1'],['生','せい',''],['生','なま','']].entries())
        tx.objectStore('terms').put({id:`f:${i}`,dictionaryId:'fixture',expression,reading,rules,sequence:i+1,score:1,glossaries:['fixture'],definitionTags:rules || 'n',termTags:''});
      tx.oncomplete=()=>{db.close();resolve();};tx.onerror=()=>reject(tx.error);
    };
  }));
  const zip=new ZipWriter(new Uint8ArrayWriter(),{useWebWorkers:false});
  await zip.add('1.png',new Uint8ArrayReader(Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=','base64')));
  await zip.add('fixture.mokuro',new TextReader(JSON.stringify({version:'0.2.0',title:'M1 Fixture',volume:'M1 Fixture',pages:[{
    img_path:'1.png',img_width:1,img_height:1,blocks:[{box:[0,0,1,1],vertical:false,font_size:1,
      lines:['猫。猫。食べた。食べなかった。生。謎名。'],lines_coords:[[[0,0],[1,0],[1,1],[0,1]]]}]}]})));
  const buffer=Buffer.from(await zip.close());
  await page.goto('/#/manga');
  await page.getByLabel('Añadir manga',{exact:true}).setInputFiles({name:'m1.zip',mimeType:'application/zip',buffer});
  const link=page.locator('.library-grid article').filter({has:page.getByRole('heading',{name:'M1 Fixture',exact:true})})
    .getByRole('link',{name:'Vocabulario de la obra',exact:true});await expect(link).toBeVisible();await link.click();
  await expect(page.locator('.metrics article strong')).toHaveText(['4','2','0.0%','0.0%']);
  await expect(page.locator('.words details')).toHaveCount(2);
  await page.locator('.words summary').first().click();await expect(page.locator('.words')).toContainText('猫。猫。');
  await page.getByRole('combobox',{name:'Estado',exact:true}).selectOption('known');await expect(page.locator('.words details')).toHaveCount(0);
  await page.getByRole('combobox',{name:'Estado',exact:true}).selectOption('all');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
  await page.screenshot({path:`test-results/manga-m1-${info.project.name}.png`,fullPage:true});
  const url=page.url();await page.reload();await expect(page.locator('.metrics article strong').first()).toHaveText('4');
  await page.evaluate(()=>new Promise<void>((resolve,reject)=>{
    const req=indexedDB.open('kana-study-manga');req.onerror=()=>reject(req.error);req.onsuccess=()=>{
      const db=req.result,tx=db.transaction(['volumes','pages'],'readwrite'),v=tx.objectStore('volumes').openCursor();
      v.onsuccess=()=>{const row=v.result;if(row?.value.title==='M1 Fixture'){
        row.update({...row.value,updatedAt:'2026-12-01'});const p=tx.objectStore('pages').get([row.value.id,0]);
        p.onsuccess=()=>{const value=p.result;value.ocr.blocks[0].lines=['猫。'];tx.objectStore('pages').put(value);};
      }else row?.continue();};tx.oncomplete=()=>{db.close();resolve();};tx.onerror=()=>reject(tx.error);
    };
  }));
  await page.goto('/#/more');await expect(page.locator('app-manga-vocabulary-analysis')).toHaveCount(0);
  await page.goto(url);await expect(page.locator('.metrics article strong').first()).toHaveText('1');
});

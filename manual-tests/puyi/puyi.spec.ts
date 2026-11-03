import {test,expect,Page,BrowserContext} from '@playwright/test';
const remote=process.env['PUYI_TEST_REST'];
if(!remote||!/^http:\/\/127\.0\.0\.1:\d+$/.test(remote))throw Error('Run through node scripts/test-puyi-native.mjs --browser; only isolated loopback is accepted.');
const adminId='00000000-0000-0000-0000-000000000001',readerId='00000000-0000-0000-0000-000000000002';
const key='puyi-fixture-public-key-not-a-secret';
const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jB1kAAAAASUVORK5CYII=','base64');
const words={word:'試験',kana:'しけん',meaning:'prueba española',exampleSentence:'試験です。',exampleTranslation:'Es una prueba.'};
async function fixture(context:BrowserContext,name:string){
 const language=name.includes('-en')?'en':name.includes('-ca-')?'ca':'es';const files=new Map<string,Buffer>();
 await context.addInitScript(({language,adminId,readerId})=>{
  window.__KANA_STUDY_CONFIG__={supabaseUrl:'https://puyi-fixture.supabase.co',supabasePublishableKey:'puyi-fixture-public-key-not-a-secret'};
  if(!localStorage.getItem('puyi-fixture-initialized')){
   const prefs=JSON.stringify({language,theme:language==='en'?'light':language==='ca'?'nora':'dark'});
   localStorage.setItem('puyi-fixture-initialized','true');localStorage.setItem('kana-study.settings.v1',prefs);
   for(const id of [adminId,readerId])localStorage.setItem('kana-study.workspace.'+id+'.kana-study.settings.v1',prefs);
   localStorage.setItem('kana-study.workspace.import-decision.v1.'+adminId,'account');localStorage.setItem('kana-study.workspace.import-decision.v1.'+readerId,'account');
  }
 },{language,adminId,readerId});
 await context.route('**/supabase-config.js',route=>route.fulfill({contentType:'text/javascript',body:''}));
 await context.route('https://puyi-fixture.supabase.co/**',async route=>{
  const req=route.request(),url=new URL(req.url()),headers={...req.headers()};delete headers['host'];delete headers['content-length'];delete headers['origin'];
  if(headers['authorization']==='Bearer '+key)delete headers['authorization'];
  if(url.pathname.startsWith('/rest/v1/')){
   const response=await fetch(remote+url.pathname.slice('/rest/v1'.length)+url.search,{method:req.method(),headers,body:['GET','HEAD'].includes(req.method())?undefined:req.postDataBuffer()??undefined});
   await route.fulfill({status:response.status,headers:Object.fromEntries([...response.headers].filter(([k])=>!['content-encoding','content-length','transfer-encoding'].includes(k))),body:Buffer.from(await response.arrayBuffer())});return;
  }
  if(url.pathname.startsWith('/auth/v1/')){
   if(url.pathname.endsWith('/logout')){await route.fulfill({status:204});return;}
   const isReader=(req.postData()??'').includes('reader@')||(headers['authorization']??'').includes(process.env['PUYI_TEST_READER']!);
   const user={id:isReader?readerId:adminId,aud:'authenticated',role:'authenticated',email:isReader?'reader@example.test':'admin@example.test',app_metadata:{provider:'email'},user_metadata:{},created_at:'2026-11-03T00:00:00Z'};
   await route.fulfill({json:url.pathname.endsWith('/user')?user:{access_token:process.env[isReader?'PUYI_TEST_READER':'PUYI_TEST_ADMIN'],token_type:'bearer',expires_in:3600,refresh_token:isReader?'reader-fixture':'admin-fixture',user}});return;
  }
  // File object service is a local fixture; its metadata mutations still pass through actual Storage RLS.
  const prefix='/storage/v1/object/';
  if(url.pathname.startsWith(prefix+'public/puyi-images/')){const path=url.pathname.split('/').at(-1)!;await route.fulfill({status:files.has(path)?200:404,contentType:'image/png',body:files.get(path)??Buffer.alloc(0)});return;}
  if(url.pathname.startsWith(prefix+'puyi-images')){
   const path=decodeURIComponent(url.pathname.split('/').at(-1)!);const h={...headers,'content-type':'application/json','content-profile':'storage','accept-profile':'storage',prefer:'return=representation'};
   if(req.method()==='POST'){
    let buf=req.postDataBuffer()!,type=headers['content-type']?.split(';')[0];
    if(type==='multipart/form-data'){
     const data=await new Request(req.url(),{method:'POST',headers:req.headers(),body:new Uint8Array(buf)}).formData();
     const file=[...data.values()].find(v=>typeof v!=='string') as File;buf=Buffer.from(await file.arrayBuffer());type=file.type;
    }
    if(!['image/png','image/jpeg','image/webp'].includes(type)||buf.length>2097152){await route.fulfill({status:400,json:{message:'invalid image'}});return;}
    const response=await fetch(remote+'/objects',{method:'POST',headers:h,body:JSON.stringify({bucket_id:'puyi-images',name:path,metadata:{mimetype:type,size:buf.length}})});
    if(response.ok)files.set(path,buf);await route.fulfill({status:response.status,json:response.ok?{Key:'puyi-images/'+path}:await response.json()});return;
   }
   if(req.method()==='DELETE'){
    const paths=JSON.parse(req.postData()??'{}').prefixes??[];
    for(const path of paths){await fetch(remote+'/objects?bucket_id=eq.puyi-images&name=eq.'+encodeURIComponent(path),{method:'DELETE',headers:h});files.delete(path);}
    await route.fulfill({json:paths.map((name:string)=>({name}))});return;
   }
  }
  await route.fulfill({status:404,json:{message:'Unknown fixture request'}});
 });
 return {language,files};
}
async function login(page:Page,who:'admin'|'reader'){
 await page.goto('#/auth');await page.locator('input[name=email]').fill(who+'@example.test');await page.locator('input[name=password]').fill('fixture-password');await page.locator('form button[type=submit]').click();await expect(page.locator('.auth-overlay')).toHaveCount(0);
}
async function fill(page:Page,data=words){for(const [field,value]of Object.entries(data))await page.locator('dialog textarea[name='+field+']').fill(value);}
test.beforeEach(async()=>{
 // Each project gets fresh editorial content inside the disposable local cluster.
 const headers={'Content-Type':'application/json',Authorization:'Bearer '+process.env['PUYI_TEST_ADMIN']};
 const rows=await (await fetch(remote+'/puyi_cards',{headers})).json();
 for(const row of rows){const r=await fetch(remote+'/rpc/puyi_save_card',{method:'POST',headers,body:JSON.stringify({p_id:row.id,p_expected_version:row.version,p_content:{},p_delete:true})});expect(r.ok).toBe(true);}
});
test('public catalog, backend-authorized administration, media, study and private histories',async({page,browser},info)=>{
 const {files,language}=await fixture(page.context(),info.project.name);const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.accept());
 await page.goto('#/anki');await expect(page.locator('.deck-card').filter({hasText:'Mazo Puyi'})).toBeVisible();
 await page.goto('#/anki/mazo-puyi/settings');await expect(page.locator('app-puyi-admin section.puyi > h3')).toHaveCount(0);
 await login(page,'admin');await page.goto('#/anki/mazo-puyi/settings');const admin=page.locator('app-puyi-admin');await expect(admin.locator('section.puyi > h3')).toBeVisible();
 await expect(page.locator('html')).toHaveAttribute('lang',language);
 await admin.locator('section.puyi > button').first().click();const dialog=page.locator('dialog[open]');await expect(dialog).toBeVisible();await expect(dialog.locator('textarea').first()).toBeFocused();
 await dialog.locator('button[type=submit]').click();await expect(dialog).toBeVisible(); // native required validation
 await fill(page);await page.locator('input[type=file]').setInputFiles({name:'bad.svg',mimeType:'image/svg+xml',buffer:Buffer.from('<svg/>')});await expect(dialog.locator('[role=alert]')).toBeVisible();
 await page.locator('input[type=file]').setInputFiles({name:'word.png',mimeType:'image/png',buffer:png});await expect(dialog.locator('.preview img')).toBeVisible();await expect(dialog.locator('.preview img')).toHaveJSProperty('naturalWidth',1);
 await dialog.locator('.form-body').evaluate(e=>e.scrollTop=0);await page.screenshot({path:'.cache/puyi/editor-'+info.project.name+'.png'});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
 const button=await dialog.locator('button[type=submit]').boundingBox();expect(button!.height).toBeGreaterThanOrEqual(44);expect(button!.y+button!.height).toBeLessThanOrEqual(page.viewportSize()!.height);
 await dialog.locator('button[type=submit]').click();await expect(dialog).not.toBeVisible();
 await expect(admin.locator('li').filter({hasText:words.meaning})).toHaveCount(1);expect(files.size).toBe(1);
 // Duplicate warning, unsaved close and server idempotency are complementary to direct HTTP tests.
 await admin.locator('section.puyi > button').first().click();await fill(page);await expect(dialog.locator('input[type=checkbox]')).toBeVisible();await dialog.locator('button[type=submit]').click();await expect(dialog).toBeVisible();await page.keyboard.press('Escape');await expect(dialog).not.toBeVisible();
 const row=admin.locator('li').filter({hasText:words.meaning});await row.locator('button').first().click();await fill(page,{...words,meaning:'prueba editada'});await dialog.locator('button[type=submit]').click();await expect(dialog).not.toBeVisible();await expect(admin.locator('li')).toContainText('prueba editada');
 await page.goto('#/anki/mazo-puyi/study');await expect(page.locator('.front h1')).toHaveText(words.word);await expect(page.locator('app-public-deck-image img')).toHaveCount(0);await expect(page.locator('.front')).not.toContainText('prueba editada');await page.locator('button.reveal').click();await page.locator('.translation-toggle').click();await expect(page.locator('.back-content')).toContainText(words.exampleTranslation);await expect(page.locator('app-public-deck-image img')).toBeVisible();await page.locator('.ratings .again').click();
 await page.goto('#/anki/mazo-puyi/stats');await expect(page.locator('main')).toContainText('Mazo Puyi');await page.screenshot({path:'.cache/puyi/stats-'+info.project.name+'.png',fullPage:true});
 // A distinct browser context receives exactly the same public content and a fresh private FSRS state.
 const ctx=await browser.newContext({viewport:info.project.use.viewport});const reader=await ctx.newPage();await fixture(ctx,info.project.name);reader.on('dialog',d=>d.accept());
 await login(reader,'reader');await reader.goto('#/anki/mazo-puyi/settings');await expect(reader.locator('app-puyi-admin section.puyi > h3')).toHaveCount(0);
 await reader.goto('#/anki/mazo-puyi/study');await expect(reader.locator('.front h1')).toHaveText(words.word);await reader.locator('.reveal').click();await reader.locator('.ratings .good').click();await ctx.close();
 await page.goto('#/anki/mazo-puyi/settings');await expect(admin.locator('li')).toContainText('prueba editada');await admin.locator('li button').last().click();await expect(admin.locator('li')).not.toContainText('prueba editada');await expect.poll(()=>files.size).toBe(0);
 await page.goto('#/anki/mazo-puyi/cards');await expect(page.locator('.entry-card')).toHaveCount(0);expect(errors).toEqual([]);
});

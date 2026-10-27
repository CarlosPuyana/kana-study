import {test,expect,Page,BrowserContext} from '@playwright/test';
import {readFileSync} from 'node:fs';
const operation=JSON.parse(readFileSync('supabase/tests/h2ba-fixture.json','utf8'));
const dictionaries=Object.fromEntries(['es','en','ca'].map(l=>[l,JSON.parse(readFileSync('src/assets/i18n/'+l+'.json','utf8'))]));

// Controlled SDK events exercise real AuthService/WorkspaceService, not real Supabase Auth.
// Legacy Sync status is a UI fixture; custom transport must remain unavailable.
async function isolate(context:BrowserContext,theme:string,lang='es'){
 const remote:string[]=[];context.on('request',r=>{if(/^https?:/.test(r.url())&&new URL(r.url()).origin!=='http://127.0.0.1:4400')remote.push(r.url());});
 await context.route('**/supabase-config.js',r=>r.fulfill({contentType:'text/javascript',body:'window.__KANA_STUDY_CONFIG__={};'}));
 await context.route('**/*',r=>/^https?:/.test(r.request().url())&&new URL(r.request().url()).origin!=='http://127.0.0.1:4400'?r.abort():r.fallback());
 await context.addInitScript(({theme,lang})=>{localStorage.setItem('kana-study.settings.v1',JSON.stringify({language:lang,theme}));},{theme,lang});return remote;
}
async function attach(page:Page){
 await expect(page.locator('app-root')).toBeVisible();
 await page.evaluate(async()=>{
  const w=window as any,app=w.ng.getComponent(document.querySelector('app-root')),auth=app.auth;
  if(w.localAuth)return;
  auth.migration.customGate.set(true);auth.migration.mangaGate.set(true);
  app.sync.schedule=()=>{};let callback:any;const rpc:string[]=[];
  const client={auth:{onAuthStateChange:(cb:any)=>{callback=cb;return {data:{subscription:{unsubscribe(){}}}};},
    signInWithPassword:async({email}:{email:string})=>{const id=email.split('@')[0];localStorage.setItem('release2b.synthetic-session',id);callback('SIGNED_IN',{user:{id,email}});return {error:null};},
    signOut:async()=>{localStorage.removeItem('release2b.synthetic-session');callback('SIGNED_OUT',null);}},
    from:()=>({select:()=>({eq:(_k:string,id:string)=>({maybeSingle:async()=>({data:{id,username:id,display_name:id,created_at:'2026-10-25T00:00:00Z'}})})})}),
    rpc:(name:string)=>{rpc.push(name);throw Error('Unexpected RPC in local UX fixture');}};
  auth.supabase.getClient=async()=>client;auth.configured=true;await auth.initialize();
  w.localAuth={auth,workspace:auth.workspace,rpc,emit:async(id:string|null)=>{callback(id?'SIGNED_IN':'SIGNED_OUT',id?{user:{id,email:id+'@example.invalid'}}:null);await auth.handling;}};
  const saved=localStorage.getItem('release2b.synthetic-session');if(saved){callback('INITIAL_SESSION',{user:{id:saved}});await auth.handling;}
 });
}
async function catalog(page:Page){
 await page.evaluate(()=>{location.hash='/anki';});await expect(page.locator('app-anki-page')).toBeVisible();
 await page.evaluate(async()=>{await (window as any).ng.getComponent(document.querySelector('app-anki-page')).catalog.refresh();});
}
async function seed(page:Page,title:string){await expect(page.locator('app-anki-page')).toBeVisible();await page.evaluate(async({operation,title})=>{
 const c=(window as any).ng.getComponent(document.querySelector('app-anki-page')).catalog,op=structuredClone(operation),owner=c.owner();op.deck.title=title;op.confirmation.workspace=owner;op.confirmation.actor.workspace=owner;
 await c.repository.confirmMangaCard(op);await c.refresh();
 },{operation,title});}
async function login(page:Page,id='local-a'){
 await page.evaluate(()=>{location.hash='/auth?return=/anki';});await expect(page.locator('app-auth-page')).toBeVisible();
 await page.locator('input[name=email]').fill(id+'@example.invalid');await page.locator('input[name=password]').fill('controlled-password');await page.locator('button[type=submit]').click();
}
async function records(page:Page){return page.evaluate(async()=>{const c=(window as any).ng.getComponent(document.querySelector('app-anki-page')).catalog;return (await c.repository.guestInventory()).records;});}

test('Guest login, cancel, account A/B, logout, reload and two tabs preserve separate local decks',async({page,context},info)=>{
 const theme=info.project.use.colorScheme==='light'?'light':'dark',remote=await isolate(context,theme);await page.goto('/#/anki');await attach(page);await seed(page,'Guest original');const original=await records(page);
 await login(page);await expect(page.locator('#auth-title')).toHaveText('Espacios locales separados');await expect(page.getByText(dictionaries['es']['localDeck.login'],{exact:true})).toBeVisible();
 const continueButton=page.getByRole('button',{name:'Continuar sin copiar mazos',exact:true});await expect(continueButton).toBeFocused();
 await page.getByRole('button',{name:'Cancelar y seguir en Invitado',exact:true}).click();await expect(page.locator('app-anki-page')).toBeVisible();expect(await records(page)).toEqual(original);
 await login(page);await continueButton.click();await expect(page.locator('app-anki-page')).toBeVisible();await attach(page);await catalog(page);
 await expect(page.getByRole('heading',{name:'Guest original',exact:true})).toHaveCount(0);await seed(page,'Account A only');await page.evaluate(theme=>{(window as any).ng.getComponent(document.querySelector('app-anki-page')).i18n.settingsService.setTheme(theme);},theme);await expect(page.locator('html')).toHaveAttribute('data-theme',theme);await expect(page.getByText('Solo local · sin nube',{exact:true})).toBeVisible();
 await expect(page.getByText(dictionaries['es']['localDeck.unsupported'],{exact:true})).toBeVisible();await expect(page.getByRole('link',{name:'Datos y progreso',exact:true})).toHaveCount(0);
 await page.evaluate(()=>{location.hash='/anki/backups';});await expect(page.getByRole('button',{name:'Exportar copia',exact:true})).toBeDisabled();await expect(page.getByText(dictionaries['es']['localDeck.unsupported'],{exact:true})).toBeVisible();
 await catalog(page);await page.evaluate(()=>(window as any).localAuth.emit('local-b'));await catalog(page);await expect(page.getByRole('heading',{name:'Account A only',exact:true})).toHaveCount(0);await expect(page.getByRole('heading',{name:'Guest original',exact:true})).toHaveCount(0);
 await page.evaluate(()=>(window as any).localAuth.emit('local-a'));await catalog(page);await expect(page.getByRole('heading',{name:'Account A only',exact:true})).toBeVisible();
 // Controlled session restoration after a full document reload.
 await page.reload();await attach(page);await catalog(page);await expect(page.getByRole('heading',{name:'Account A only',exact:true})).toBeVisible();
 const second=await context.newPage();await second.goto('/#/anki');await attach(second);await catalog(second);await expect(second.getByRole('heading',{name:'Account A only',exact:true})).toBeVisible();
 // Simulate the SDK delivering its cross-tab auth event to each subscriber.
 await Promise.all([page.evaluate(()=>(window as any).localAuth.emit('local-b')),second.evaluate(()=>(window as any).localAuth.emit('local-b'))]);
 for(const p of [page,second]){await catalog(p);await expect(p.getByRole('heading',{name:'Account A only',exact:true})).toHaveCount(0);}
 await page.evaluate(async()=>{await (window as any).localAuth.emit('local-a');location.hash='/profile';});await expect(page.locator('app-profile-page')).toBeVisible();
 await page.evaluate(()=>{const a=(window as any).ng.getComponent(document.querySelector('app-root'));a.sync.statusState.set('synced');a.sync.lastSyncState.set('2026-10-25T12:00:00Z');});
 await expect(page.getByText('Sincronizado',{exact:true})).toBeVisible();await expect(page.getByText(dictionaries['es']['localDeck.sync'],{exact:true})).toBeVisible();await expect(page.getByText(dictionaries['es']['localDeck.local'],{exact:true})).toBeVisible();
 await page.screenshot({path:'.cache/release2b-profile-'+info.project.name+'.png',fullPage:true});
 await page.getByRole('button',{name:'Cerrar sesión',exact:true}).click();await expect(page).toHaveURL(/#\/$/);await attach(page);await catalog(page);await expect(page.getByRole('heading',{name:'Guest original',exact:true})).toBeVisible();expect(await records(page)).toEqual(original);
 await expect(page.getByRole('link',{name:'Datos y progreso',exact:true})).toBeVisible();await page.screenshot({path:'.cache/release2b-guest-'+info.project.name+'.png',fullPage:true});
 for(const p of [page,second])expect(await p.evaluate(()=>(window as any).localAuth.rpc)).toEqual([]);expect(remote).toEqual([]);
});

for(const lang of ['es','en','ca'])test('local/legacy separation, backup and keyboard copy in '+lang,async({page,context},info)=>{
 const copy=dictionaries[lang];const remote=await isolate(context,info.project.use.colorScheme==='light'?'light':'dark',lang);await page.goto('/#/anki');await attach(page);await seed(page,'Guest original');
 await page.evaluate(()=>{localStorage.setItem('kana-study.completed-sessions.v1',JSON.stringify([{sessionId:'synthetic-legacy'}]));});
 await login(page);await expect(page.locator('#auth-title')).toHaveText(copy['localDeck.title']);await expect(page.getByText(copy['localDeck.legacy'],{exact:true})).toBeVisible();await expect(page.getByText(copy['localDeck.login'],{exact:true})).toBeVisible();
 const first=page.getByRole('link',{name:copy['common.close'],exact:true}),last=page.getByRole('button',{name:copy['localDeck.cancel'],exact:true});await first.focus();await page.keyboard.press('Shift+Tab');await expect(last).toBeFocused();await page.keyboard.press('Tab');await expect(first).toBeFocused();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);await page.screenshot({path:'.cache/release2b-login-'+lang+'-'+info.project.name+'.png',fullPage:true});
 await page.keyboard.press('Escape');await expect(page.locator('app-anki-page')).toBeVisible();await expect(page.getByRole('heading',{name:'Guest original',exact:true})).toBeVisible();await expect(page.getByText(copy['localDeck.guest'],{exact:true})).toBeVisible();expect(remote).toEqual([]);
});

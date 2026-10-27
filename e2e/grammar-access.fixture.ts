import { Page } from '@playwright/test';
// Explicit SDK/HTTP fixture, never a frontend authorization switch or real Supabase account.
export const grammarFixtureUser='00000000-0000-4000-8000-0000000000a1';
export const grammarStoragePrefix=`kana-study.workspace.${grammarFixtureUser}.`;
export async function grammarAccount(page:Page,enabled=true){
  const permission={enabled,error:false};
  await page.route('**/supabase-config.js',r=>r.fulfill({contentType:'text/javascript',body:'window.__KANA_STUDY_CONFIG__={supabaseUrl:"https://grammar-beta-fixture.supabase.co",supabasePublishableKey:"synthetic-public-fixture-key-only"};'}));
  await page.route('https://grammar-beta-fixture.supabase.co/**',async route=>{
    const url=new URL(route.request().url());
    const user={id:grammarFixtureUser,aud:'authenticated',role:'authenticated',email:'grammar@example.test',app_metadata:{},user_metadata:{},created_at:'2026-01-01T00:00:00Z'};
    if(url.pathname==='/rest/v1/grammar_beta_access')return route.fulfill({status:permission.error?503:200,json:permission.error?{message:'fixture offline'}:{enabled:permission.enabled}});
    if(url.pathname==='/auth/v1/user')return route.fulfill({json:user});
    if(url.pathname==='/auth/v1/logout')return route.fulfill({status:204});
    if(url.pathname==='/rest/v1/profiles')return route.fulfill({json:{id:grammarFixtureUser,display_name:'Beta fixture',username:'beta-fixture',created_at:'2026-01-01T00:00:00Z',updated_at:'2026-01-01T00:00:00Z'}});
    return route.fulfill({status:200,json:[]});
  });
  await page.addInitScript(({id})=>{
    if(sessionStorage.getItem('grammar-fixture-initialized'))return;
    sessionStorage.setItem('grammar-fixture-initialized','true');
    const user={id,aud:'authenticated',role:'authenticated',email:'grammar@example.test',app_metadata:{},user_metadata:{},created_at:'2026-01-01T00:00:00Z'};
    const now=Math.floor(Date.now()/1000),encoded=(v:unknown)=>btoa(JSON.stringify(v)).replaceAll('+','-').replaceAll('/','_').replaceAll('=','');
    localStorage.setItem('sb-grammar-beta-fixture-auth-token',JSON.stringify({access_token:encoded({alg:'HS256',typ:'JWT'})+'.'+encoded({sub:id,aud:'authenticated',role:'authenticated',exp:now+3600,iat:now})+'.synthetic-signature',refresh_token:'synthetic-refresh',expires_at:now+3600,expires_in:3600,token_type:'bearer',user}));
    localStorage.setItem('kana-study.workspace.import-decision.v1.'+id,'account');
    localStorage.setItem('kana-study.workspace.active.v1','user:'+id);
  },{id:grammarFixtureUser});
  return permission;
}

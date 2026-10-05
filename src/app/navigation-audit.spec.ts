import {TestBed} from '@angular/core/testing';
import {Routes} from '@angular/router';
import {routes} from './app.routes';
import {NAVIGATION_AUDIT} from './navigation-audit';
import {TranslationService} from './core/services/translation.service';
import {SettingsService} from './core/services/settings.service';

async function publicRoutes(config:Routes,prefix=''):Promise<{path:string;titleKey:string}[]> {
  const result:{path:string;titleKey:string}[]=[];
  for(const route of config){
    if(route.redirectTo!==undefined)continue;
    const path=[prefix,route.path].filter(Boolean).join('/');
    if(route.component||route.loadComponent)result.push({path,titleKey:route.data?.['titleKey']});
    if(route.children)result.push(...await publicRoutes(route.children,path));
    if(route.loadChildren)result.push(...await publicRoutes(await (route.loadChildren as ()=>Promise<Routes>)(),path));
  }
  return result;
}
describe('public navigation architecture',()=>{
  beforeEach(()=>{localStorage.clear();vi.stubGlobal('matchMedia',()=>({matches:false,addEventListener:vi.fn()}));});
  afterEach(()=>{TestBed.resetTestingModule();vi.unstubAllGlobals();});
  it('registers every public route with an explicit entry point and documents dynamic/deep links',async()=>{
    const all=await publicRoutes(routes);
    expect(all.map(r=>r.path).sort()).toEqual(NAVIGATION_AUDIT.map(r=>r.route).sort());
    expect(new Set(NAVIGATION_AUDIT.map(r=>r.route)).size).toBe(NAVIGATION_AUDIT.length);
    for(const entry of NAVIGATION_AUDIT){expect(entry.entryPoint.length).toBeGreaterThan(5);if(entry.route.includes(':'))expect(entry.type).toBe('dynamic');}
  });
  it('has localized document title metadata for every screen in ES/EN/CA',async()=>{
    const all=await publicRoutes(routes);const i18n=TestBed.inject(TranslationService),settings=TestBed.inject(SettingsService);
    for(const language of ['es','en','ca'] as const){settings.setLanguage(language);for(const route of all){expect(route.titleKey,route.path).toBeTruthy();expect(i18n.t(route.titleKey),route.path).not.toBe(route.titleKey);}}
  });
});

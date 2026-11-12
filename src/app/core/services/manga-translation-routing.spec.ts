import {Component,inject} from '@angular/core';
import {TestBed} from '@angular/core/testing';
import {provideRouter,Router,TitleStrategy} from '@angular/router';
import {Title} from '@angular/platform-browser';
import {RouterTestingHarness} from '@angular/router/testing';
import {routes} from '../../app.routes';
import {TranslationService} from './translation.service';
import {SettingsService} from './settings.service';
import {LocalizedTitleStrategy} from './localized-title.strategy';
@Component({template:'<p>{{i18n.t("manga.remote.title")}}</p>'})class ReaderScreen{readonly i18n=inject(TranslationService);}
describe('reader translation route boundaries',()=>{
 beforeEach(()=>{localStorage.clear();vi.stubGlobal('matchMedia',()=>({matches:false,addEventListener:vi.fn(),removeEventListener:vi.fn()}));TestBed.configureTestingModule({providers:[provideRouter([
  {path:'manga',resolve:routes.find(r=>r.path==='manga')!.resolve,children:[{path:'read/:id',component:ReaderScreen}]},
  {path:'upload',resolve:routes.find(r=>r.path==='upload')!.resolve,data:{titleKey:'manga.remote.title'},component:ReaderScreen},
 ]),{provide:TitleStrategy,useClass:LocalizedTitleStrategy}]});});
 afterEach(()=>{TestBed.resetTestingModule();vi.restoreAllMocks();vi.unstubAllGlobals();localStorage.clear();});
 for(const url of ['/manga/read/synthetic','/upload'])it(url+': waits for real copy loading before rendering and supports language changes',async()=>{
  const i18n=TestBed.inject(TranslationService),load=i18n.loadManga.bind(i18n);let release!:()=>void;const gate=new Promise<void>(r=>release=r);
  const spy=vi.spyOn(i18n,'loadManga').mockImplementation(()=>gate.then(load)),harness=await RouterTestingHarness.create();const navigation=harness.navigateByUrl(url,ReaderScreen);
  await vi.waitFor(()=>expect(spy).toHaveBeenCalledOnce());expect(harness.routeNativeElement?.querySelector('p')).toBeFalsy();release();await navigation;
  const settings=TestBed.inject(SettingsService);for(const language of ['es','en','ca'] as const){settings.setLanguage(language);harness.detectChanges();TestBed.tick();const text=harness.routeNativeElement!.textContent!;expect(text).not.toContain('manga.remote.title');expect(text).toContain(i18n.t('manga.remote.title'));if(url==='/upload')expect(TestBed.inject(Title).getTitle()).toBe(i18n.t('manga.remote.title')+' · Kana Study');}
  expect(TestBed.inject(Router).url).toBe(url);
 });
});

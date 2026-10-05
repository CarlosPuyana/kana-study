import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { ActivatedRoute, convertToParamMap, provideRouter, Router, RouterLink } from '@angular/router';
import { By } from '@angular/platform-browser';
import { of } from 'rxjs';
import { safeReturnUrl } from '../../core/services/return-navigation';
import { authReturnUrl } from '../../core/config/supabase.config';
import { AuthService } from '../../core/services/auth.service';
import { SyncService } from '../../core/services/sync.service';
import { SettingsService } from '../../core/services/settings.service';
import { ProfileStatsService } from '../../core/services/profile-stats.service';
import { AccountControl } from '../../shared/components/account-control/account-control';
import { AuthPage } from './auth.page';
import { ProfilePage } from '../profile/profile.page';
import { SelectionPage } from '../selection/selection.page';
import { MangaPage } from '../manga/manga.page';
import { MangaGuidePage } from '../manga/manga-guide.page';
import { MangaRepository } from '../../core/services/manga.repository';
import { DictionaryRepository } from '../../core/services/dictionary.repository';
import { WeaknessesPage } from '../weaknesses/weaknesses.page';
import { WeaknessService } from '../../core/services/weakness.service';
import { KanaRushPage } from '../rush/kana-rush.page';
import { KanjiRushPage } from '../rush/kanji-rush.page';
import { VocabularyRushPage } from '../rush/vocabulary-rush.page';
import { RushSessionService } from '../../core/services/rush-session.service';
import { ALL_KANA } from '../../data/kana';
import { KANJI_N5 } from '../../data/kanji-n5.generated';

describe('safe return navigation',()=>{
  for(const value of ['https://evil.test','//evil.test','/\\evil.test','/%2f%2fevil.test','/%5cevil.test','/bad%','/manga\n'])it('rejects '+JSON.stringify(value),()=>expect(safeReturnUrl(value,'/profile')).toBe('/profile'));
  it('preserves internal paths and encoded query values',()=>expect(safeReturnUrl('/manga/read/one?from=library')).toBe('/manga/read/one?from=library'));
});
describe('confirmed navigation and UX corrections',()=>{
  const authenticated=signal(true),decision=signal(false);
  const auth={configured:true,authenticated,needsGuestImportDecision:decision,profile:()=>null,initials:()=> 'T',user:()=>null,
    signIn:vi.fn(async()=>({error:null})),signUp:vi.fn(async()=>({error:null,confirmationRequired:false})),chooseGuestImport:vi.fn(async()=>{}),updatePassword:vi.fn(async()=>({error:null})),requestPasswordReset:vi.fn(async()=>({error:null}))};
  beforeEach(()=>{
    vi.stubGlobal('matchMedia',vi.fn(()=>({matches:false,addEventListener:vi.fn(),removeEventListener:vi.fn()})));localStorage.clear();authenticated.set(true);decision.set(false);
    TestBed.configureTestingModule({providers:[provideRouter([]),{provide:AuthService,useValue:auth},{provide:SyncService,useValue:{status:signal('idle'),lastSyncedAt:signal(null),pendingCount:signal(0),schedule:vi.fn()}},
      {provide:ProfileStatsService,useValue:{load:async()=>null}},{provide:MangaRepository,useValue:{cleanup:async()=>false,volumes:async()=>[]}},{provide:DictionaryRepository,useValue:{cleanup:async()=>{},ready:async()=>{}}}]});
  });
  afterEach(()=>{TestBed.resetTestingModule();vi.restoreAllMocks();vi.unstubAllGlobals();});
  function query(params:Record<string,string>){const map=convertToParamMap(params);TestBed.overrideProvider(ActivatedRoute,{useValue:{snapshot:{queryParamMap:map},queryParamMap:of(map)}});}
  for(const origin of ['/manga','/kanji','/vocabulary','/flags','/anki','/grammar','/more','/'])it('AccountControl keeps '+origin,()=>{
    vi.spyOn(TestBed.inject(Router),'url','get').mockReturnValue(origin);const fixture=TestBed.createComponent(AccountControl);fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('a').getAttribute('href')).toBe('/profile?return='+encodeURIComponent(origin));
    authenticated.set(false);fixture.detectChanges();expect(fixture.nativeElement.querySelector('a').getAttribute('href')).toBe('/auth?return='+encodeURIComponent(origin));
  });
  it('Profile back respects return',()=>{query({return:'/manga'});const fixture=TestBed.createComponent(ProfilePage);fixture.detectChanges();expect(fixture.nativeElement.querySelector('.back').getAttribute('href')).toBe('/manga');});
  it('unauthenticated Profile retains return in Auth redirect',()=>{query({return:'/manga'});authenticated.set(false);const navigate=vi.spyOn(TestBed.inject(Router),'navigate').mockResolvedValue(true);TestBed.createComponent(ProfilePage);expect(navigate).toHaveBeenCalledWith(['/auth'],{queryParams:{return:'/manga'}});});
  it('Profile rejects external return',()=>{query({return:'https://evil.test'});const fixture=TestBed.createComponent(ProfilePage);fixture.detectChanges();expect(fixture.nativeElement.querySelector('.back').getAttribute('href')).toBe('/');});
  for(const mode of ['login','signup','import','confirm'] as const)it('Auth success respects return for '+mode,async()=>{
    query({return:'/manga',mode:mode==='signup'?'signup':mode==='confirm'?'confirm':'login'});
    const page=TestBed.createComponent(AuthPage).componentInstance;page.password='password123';page.confirmation='password123';page.username='tester';
    const location={pathname:'/kana-study/',href:'',reload:vi.fn()};vi.stubGlobal('window',{...window,location});
    if(mode==='import')await page.chooseImport('merge');else if(mode==='confirm')page.finishConfirmation();else await page.submit();
    expect(location.href).toBe('/kana-study/#/manga');expect(location.reload).toHaveBeenCalledOnce();
  });
  it('Auth rejects an external target',()=>{query({return:'https://evil.test'});const page=TestBed.createComponent(AuthPage).componentInstance;expect(page.returnUrl).toBe('/');expect(page.closeUrl).toBe('/');});
  it('Auth without return defaults to profile',()=>{query({});expect(TestBed.createComponent(AuthPage).componentInstance.returnUrl).toBe('/profile');});
  it('forgot password retains return in the recovery request',async()=>{query({return:'/manga'});const page=TestBed.createComponent(AuthPage).componentInstance;page.email='student@example.test';await page.forgot();expect(auth.requestPasswordReset).toHaveBeenCalledWith('student@example.test','/manga');});
  it('recovery submit validates and sends the new password, then keeps the login return',async()=>{
    query({mode:'recovery',return:'/manga'});auth.updatePassword.mockClear();
    const navigate=vi.spyOn(TestBed.inject(Router),'navigate').mockResolvedValue(true);
    const replace=vi.spyOn(history,'replaceState').mockImplementation(()=>{});
    const page=TestBed.createComponent(AuthPage).componentInstance;page.newPassword='new-password';
    await page.submit();expect(auth.updatePassword).toHaveBeenCalledWith('new-password');
    expect(page.mode()).toBe('login');expect(page.loading()).toBe(false);expect(page.message()).toBeTruthy();
    expect(replace).toHaveBeenCalledWith(null,'',expect.stringContaining('mode=login&return=%2Fmanga'));
    expect(navigate).toHaveBeenCalledWith([],{queryParams:{mode:'login'},queryParamsHandling:'merge',replaceUrl:true});
  });
  it('recovery rejects a short new password even when the login password is valid',async()=>{
    query({mode:'recovery'});auth.updatePassword.mockClear();const page=TestBed.createComponent(AuthPage).componentInstance;
    page.password='old-password';page.newPassword='short';await page.submit();
    expect(auth.updatePassword).not.toHaveBeenCalled();expect(page.error()).toBeTruthy();expect(page.loading()).toBe(false);
  });
  it('recovery surfaces backend errors and stays on recovery',async()=>{
    query({mode:'recovery'});auth.updatePassword.mockResolvedValueOnce({error:'failed'} as never);
    const page=TestBed.createComponent(AuthPage).componentInstance;page.newPassword='new-password';await page.submit();
    expect(page.error()).toBeTruthy();expect(page.mode()).toBe('recovery');expect(page.loading()).toBe(false);
  });
  it('Auth mode changes keep return',()=>{query({return:'/manga'});const navigate=vi.spyOn(TestBed.inject(Router),'navigate').mockResolvedValue(true);TestBed.createComponent(AuthPage).componentInstance.switchMode('signup');expect(navigate).toHaveBeenCalledWith([],{queryParams:{mode:'signup'},queryParamsHandling:'merge',replaceUrl:true});});
  it('confirmation/recovery callback URLs retain a validated origin',()=>{const url=new URL(authReturnUrl('confirm','/manga'));expect(url.searchParams.get('auth')).toBe('confirm');expect(url.searchParams.get('return')).toBe('/manga');expect(new URL(authReturnUrl('recovery','//evil.test')).searchParams.get('return')).toBe('/');});
  for(const [params,destination] of [[{from:'grammar',kana:'hiragana'},'/grammar/n5/00'],[{from:'grammar',return:'/grammar/n5/00/2'},'/grammar/n5/00/2'],[{},'/']] as const)it('Selection save returns to '+destination,()=>{
    query(params);const navigate=vi.spyOn(TestBed.inject(Router),'navigateByUrl').mockResolvedValue(true);const page=TestBed.createComponent(SelectionPage).componentInstance;page.save();expect(navigate).toHaveBeenCalledWith(destination);
  });
  it('Manga exposes a remote form and sends validated URLs to existing upload flow',()=>{
    const navigate=vi.spyOn(TestBed.inject(Router),'navigate').mockResolvedValue(true);const fixture=TestBed.createComponent(MangaPage);fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.remote-entry summary').textContent).toContain('Importar desde enlace');
    const page=fixture.componentInstance;page.remoteCbz='https://example.test/book.cbz';page.remoteManifest='https://example.test/manifest.json';page.openRemote();expect(navigate).toHaveBeenCalledWith(['/upload'],{queryParams:{cbz:page.remoteCbz,manifest:page.remoteManifest}});
    page.remoteCbz='javascript:alert(1)';page.openRemote();fixture.detectChanges();expect(page.remoteInvalid()).toBe(true);expect(navigate).toHaveBeenCalledTimes(1);expect(fixture.nativeElement.querySelector('.remote-entry [role=alert]').textContent).toContain('El enlace no es válido');
  });
  for(const lang of ['es','en','ca'] as const)it('Manga Guide does not promise Study in '+lang,()=>{
    TestBed.inject(SettingsService).setLanguage(lang);const fixture=TestBed.createComponent(MangaGuidePage);fixture.detectChanges();expect(fixture.nativeElement.textContent).not.toMatch(/Estudiar frase|Study sentence|Estudiar frase|Estudiar la frase/u);expect(fixture.nativeElement.querySelectorAll('.mini-actions span')).toHaveLength(1);
  });
  for(const [module,id,type] of [['kana',ALL_KANA[0].id,'kana-to-romaji'],['kanji',KANJI_N5[0].id,'kanji-to-meaning']] as const)it('Writing label is conditional for '+module,()=>{
    const weaknesses=TestBed.inject(WeaknessService);weaknesses.recordLearn(module,id,type,'again');weaknesses.recordLearn(module,id,type,'again');
    const fixture=TestBed.createComponent(WeaknessesPage);fixture.detectChanges();const section=fixture.nativeElement.querySelectorAll('.sections section')[module==='kana'?0:2];expect(section.textContent).not.toContain('Escritura');
    weaknesses.record(module,id,false);weaknesses.record(module,id,false);fixture.detectChanges();expect(section.textContent).toContain('Escritura');
  });
  for(const page of [KanaRushPage,VocabularyRushPage,KanjiRushPage])it(page.name+' medals use RouterLink',()=>{
    const rush={medals:{newlyUnlocked:signal([])},loading:signal(false),summary:signal({activeSeconds:1,cardsCompleted:1,uniqueContentsSeen:1,cyclesCompleted:0}),start:vi.fn(),checkpoint:vi.fn()};TestBed.overrideProvider(RushSessionService,{useValue:rush});
    const fixture=TestBed.createComponent<KanaRushPage | VocabularyRushPage | KanjiRushPage>(page);fixture.detectChanges();const link=fixture.debugElement.query(By.directive(RouterLink));expect(link.nativeElement.getAttribute('href')).toBe('/rush/medals');expect(link.injector.get(RouterLink).urlTree?.toString()).toBe('/rush/medals');
  });
});

import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { MangaFsrsPage } from './manga-fsrs.page';
import { MangaStudySavedRepository } from '../../core/services/manga-study-saved.repository';
import { SyncOutboxService } from '../../core/services/sync-outbox.service';
import { SyncService } from '../../core/services/sync.service';
import { AuthService } from '../../core/services/auth.service';
import { SettingsService } from '../../core/services/settings.service';

describe('Manga scheduled review two-button UI',()=>{
  beforeEach(()=>{
    localStorage.clear();vi.spyOn(document,'hidden','get').mockReturnValue(false);
    vi.stubGlobal('matchMedia',()=>({matches:false,addEventListener:()=>{},removeEventListener:()=>{}}));
    TestBed.configureTestingModule({providers:[provideRouter([]),{provide:SyncOutboxService,useValue:{enqueue:async()=>{}}},
      {provide:AuthService,useValue:{authenticated:signal(false)}},{provide:SyncService,useValue:{status:signal('guest')}},
      {provide:MangaStudySavedRepository,useValue:{items:signal([{schemaVersion:1,id:'external',expression:'龍',reading:'りゅう',meaning:'dragon',surface:'龍',context:'<img src=x onerror="alert(1)">龍。',kanji:[],source:{volumeId:'fixture',pageNumber:1},createdAt:1}]),loading:signal(false),failed:signal(false)}}]});
  });
  afterEach(()=>{TestBed.resetTestingModule();vi.restoreAllMocks();vi.unstubAllGlobals();});
  it.each([['es','Otra vez','Bien'],['en','Again','Good'],['ca','Una altra vegada','Bé']] as const)('reveals exactly two translated ratings in %s',(language,again,good)=>{
    TestBed.inject(SettingsService).setLanguage(language);
    const fixture=TestBed.createComponent(MangaFsrsPage);fixture.detectChanges();
    fixture.componentInstance.fsrs.setEnabled(true);fixture.componentInstance.session.start();fixture.detectChanges();
    const root=fixture.nativeElement as HTMLElement;
    expect(root.querySelectorAll('[data-rating]')).toHaveLength(0);expect(root.querySelector('.answer')).toBeNull();
    expect(root.querySelector('blockquote img')).toBeNull();expect(root.querySelector('mark')?.textContent).toBe('龍');
    fixture.componentInstance.session.reveal();fixture.detectChanges();
    expect([...root.querySelectorAll('[data-rating]')].map(button=>button.textContent?.trim())).toEqual([again,good]);
    expect(root.querySelector('[data-rating="again"]')).toBe(document.activeElement);
    expect(root.textContent).not.toMatch(/Difícil|Fácil|Hard|Easy/);
  });
});

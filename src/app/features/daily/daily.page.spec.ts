import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { IDBFactory } from 'fake-indexeddb';
import { DailyPage } from './daily.page';
import { TranslationService } from '../../core/services/translation.service';
import { SettingsService } from '../../core/services/settings.service';
import { SyncService } from '../../core/services/sync.service';
import { AuthService } from '../../core/services/auth.service';
import { SyncOutboxService } from '../../core/services/sync-outbox.service';
import { MangaStudySavedRepository } from '../../core/services/manga-study-saved.repository';
import { StorageService } from '../../core/services/storage.service';
import { LearningSessionService } from '../../core/services/learning-session.service';
import { KanjiSessionService } from '../../core/services/kanji-session.service';
import { VocabularySessionService } from '../../core/services/vocabulary-session.service';

describe('Daily Study page',()=>{
  const enqueue=vi.fn(async()=>{}),syncNow=vi.fn(async()=>true);
  beforeEach(()=>{
    TestBed.resetTestingModule();localStorage.clear();enqueue.mockClear();syncNow.mockClear();vi.stubGlobal('indexedDB',new IDBFactory());
    vi.stubGlobal('matchMedia',()=>({matches:false,addEventListener:()=>{},removeEventListener:()=>{}}));
    TestBed.configureTestingModule({providers:[provideRouter([]),{provide:AuthService,useValue:{authenticated:signal(false)}},
      {provide:SyncService,useValue:{lastSyncedAt:signal(null),status:signal('guest'),available:()=>true,syncNow}},
      {provide:SyncOutboxService,useValue:{enqueue}},{provide:MangaStudySavedRepository,useValue:{items:signal([]),loading:signal(false),failed:signal(false)}}]});
  });
  afterEach(()=>{TestBed.resetTestingModule();vi.restoreAllMocks();vi.unstubAllGlobals();});
  async function page(){await TestBed.inject(TranslationService).loadGrammar();const fixture=TestBed.createComponent(DailyPage);fixture.detectChanges();await fixture.componentInstance.planner.refreshDecks();fixture.detectChanges();return fixture;}
  it.each(['es','en','ca'] as const)('renders translated live data in %s without progress, session or outbox writes',async language=>{
    TestBed.inject(SettingsService).setLanguage(language);const fixture=await page();
    const storage=vi.spyOn(TestBed.inject(StorageService),'set');enqueue.mockClear();
    const sessions=[vi.spyOn(TestBed.inject(LearningSessionService),'start'),vi.spyOn(TestBed.inject(KanjiSessionService),'start'),vi.spyOn(TestBed.inject(VocabularySessionService),'start')];
    for(const duration of [5,15,30] as const){fixture.componentInstance.planner.duration.set(duration);fixture.detectChanges();}
    expect(fixture.nativeElement.textContent).not.toMatch(/daily\.|grammar\.v2\./);
    expect(fixture.nativeElement.querySelectorAll('.duration-options button')).toHaveLength(3);
    expect(storage).not.toHaveBeenCalled();expect(enqueue).not.toHaveBeenCalled();for(const session of sessions)expect(session).not.toHaveBeenCalled();
    expect(syncNow).not.toHaveBeenCalled();
  });
  it.each(['kana','kanji','vocabulary'] as const)('opens the original %s panel and retains its sync-before-initialize check',async module=>{
    const fixture=await page(),task=[...fixture.componentInstance.planner.plan().recommended,...fixture.componentInstance.planner.plan().available].find(a=>a.id===`normal:${module}`)!;
    fixture.componentInstance.open(task);fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role=dialog]')).not.toBeNull();
    const service=module==='kana'?TestBed.inject(LearningSessionService):module==='kanji'?TestBed.inject(KanjiSessionService):TestBed.inject(VocabularySessionService);
    const start=vi.spyOn(service,'start').mockReturnValue(false);
    const button=fixture.nativeElement.querySelector(module==='kana'?'.mode':'.start') as HTMLButtonElement;button.click();await fixture.whenStable();
    expect(syncNow).toHaveBeenCalledOnce();expect(start).toHaveBeenCalledWith('quick-practice');
    expect(syncNow.mock.invocationCallOrder[0]).toBeLessThan(start.mock.invocationCallOrder[0]);
  });
});

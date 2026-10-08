import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { IDBFactory } from 'fake-indexeddb';
import { DailyStudyPlannerService } from './daily-study-planner.service';
import { DeckStudyService, emptyDailyState } from './deck-study.service';
import { DeckDatabaseService } from './deck-database.service';
import { SyncService } from './sync.service';
import { SyncOutboxService } from './sync-outbox.service';
import { WorkspaceService } from './workspace.service';
import { StorageService } from './storage.service';
import { SessionHistoryService } from './session-history.service';
import { WeaknessService } from './weakness.service';
import { ProgressService } from './progress.service';
import { GrammarV2ProgressService } from './grammar-v2-progress.service';
import { MangaFsrsService } from './manga-fsrs.service';
import { MangaStudySavedRepository } from './manga-study-saved.repository';
import { SettingsService } from './settings.service';
import { DailyLearningService, getSpainDayKey } from './daily-learning.service';
import { STUDY_DECKS } from '../../data/study-decks';
import { GRAMMAR_V2_CONCEPTS } from '../../data/grammar/grammar-n5-v2.generated';

describe('daily planner reads existing contracts without writes',()=>{
  const enqueue=vi.fn(async()=>{}),lastSyncedAt=signal<string|null>(null);
  beforeEach(()=>{
    TestBed.resetTestingModule();localStorage.clear();vi.stubGlobal('indexedDB',new IDBFactory());
    vi.stubGlobal('matchMedia',()=>({matches:false,addEventListener:()=>{},removeEventListener:()=>{}}));
    enqueue.mockClear();lastSyncedAt.set(null);
    TestBed.configureTestingModule({providers:[DailyStudyPlannerService,provideRouter([]),{provide:SyncOutboxService,useValue:{enqueue}},
      {provide:SyncService,useValue:{lastSyncedAt}},{provide:MangaStudySavedRepository,useValue:{items:signal([]),loading:signal(false),failed:signal(false)}}]});
  });
  afterEach(()=>{TestBed.resetTestingModule();vi.restoreAllMocks();vi.unstubAllGlobals();vi.useRealTimers();});
  async function ready(){const planner=TestBed.inject(DailyStudyPlannerService);TestBed.tick();await planner.refreshDecks();return planner;}
  it('reads real Anki snapshots without creating/modifying daily state, progress or events',async()=>{
    const planner=await ready(),database=TestBed.inject(DeckDatabaseService);
    const before=await database.getAllDailyStates(),writes=vi.spyOn(database,'writeDailyState'),reviews=vi.spyOn(database,'commitReview'),storage=vi.spyOn(TestBed.inject(StorageService),'set');enqueue.mockClear();
    await planner.refreshDecks();expect(planner.snapshot().decks[0].fresh).toBe(STUDY_DECKS[0].settings.newCardsPerDay);
    expect(await database.getAllDailyStates()).toEqual(before);expect(writes).not.toHaveBeenCalled();expect(reviews).not.toHaveBeenCalled();expect(storage).not.toHaveBeenCalled();expect(enqueue).not.toHaveBeenCalled();
  });
  it('immediately hides the previous workspace, and discards stale Guest/A/B IndexedDB responses',async()=>{
    const planner=await ready(),workspace=TestBed.inject(WorkspaceService),study=TestBed.inject(DeckStudyService);
    const original=study.snapshot.bind(study);let release!:()=>void;const held=new Promise<void>(resolve=>release=resolve);
    vi.spyOn(study,'snapshot').mockImplementation(async(deck,index,now)=>{const owner=workspace.active();if(owner==='guest')await held;const value=await original(deck,index,now);return {...value,newAvailable:owner==='guest'?999:owner==='user:A'?111:2};});
    const guest=planner.refreshDecks();workspace.activateUser('A');expect(planner.snapshot().decks).toEqual([]);expect(planner.snapshot().grammar).toEqual([]);
    TestBed.tick();await planner.refreshDecks();expect(planner.snapshot().decks[0].fresh).toBe(111);
    workspace.activateUser('B');expect(planner.snapshot().decks).toEqual([]);TestBed.tick();await planner.refreshDecks();
    release();await guest;expect(planner.snapshot().workspace).toBe('user:B');expect(planner.snapshot().decks[0].fresh).toBe(2);
  });
  it('preserves exact active weakness directions and rejects disabled, obsolete and incompatible units',async()=>{
    const planner=await ready(),progress=TestBed.inject(ProgressService),weak=TestBed.inject(WeaknessService),unit=progress.activeUnits()[0];
    weak.recordLearn('kana',unit.kanaId,unit.questionType,'again');weak.recordLearn('kana',unit.kanaId,unit.questionType,'again');
    weak.recordLearn('kana',unit.kanaId,'romaji-to-kana','again');weak.recordLearn('kana',unit.kanaId,'romaji-to-kana','again');
    weak.recordLearn('kana','obsolete',unit.questionType,'again');weak.recordLearn('kana','obsolete',unit.questionType,'again');
    const resolved=planner.snapshot().weaknesses.filter(w=>w.record.module==='kana');expect(resolved).toHaveLength(1);expect(resolved[0].record.questionType).toBe(unit.questionType);
    const settings=TestBed.inject(SettingsService);settings.saveLearningSelection({...settings.selection(),questionTypes:[]});expect(planner.snapshot().weaknesses.filter(w=>w.record.module==='kana')).toEqual([]);
  });
  it('updates after a real completed session, retains remaining work and never repeats normal initialization',async()=>{
    const planner=await ready(),history=TestBed.inject(SessionHistoryService),time=new Date(planner.now()).toISOString();
    history.record({module:'kana',sessionId:'completed',completedAt:time,mode:'quick-practice',exercisesCompleted:1,firstTrySuccesses:1,attempts:1,needsPracticeCount:0,durationSeconds:4});
    expect(planner.plan().pending.find(a=>a.id==='normal:kana')).toMatchObject({state:'completed'});
    expect(planner.plan().performed.filter(a=>a.id==='session:kana:completed')).toHaveLength(1);
    expect([...planner.plan().recommended,...planner.plan().available].find(a=>a.id==='normal:kana')).toBeUndefined();
    expect([...planner.plan().recommended,...planner.plan().available].some(a=>a.id==='practice:kana')).toBe(true);
  });
  it('reacts to remote data revisions without treating an opened Grammar explanation as completed',async()=>{
    const planner=await ready(),storage=TestBed.inject(StorageService),grammar=TestBed.inject(GrammarV2ProgressService),concept=GRAMMAR_V2_CONCEPTS.find(c=>c.topicId==='01')!;
    grammar.open(concept.id);const raw=structuredClone(grammar.state());
    expect(planner.plan().performed.filter(a=>a.id===`grammar:${concept.id}`)).toEqual([]);
    for(const e of concept.exercises)raw.concepts[concept.id].answers[e.id]={correct:true,solved:true,attempts:1,correctCount:1,answeredAt:new Date(planner.now()).toISOString()};
    raw.concepts[concept.id].completedAt=new Date(planner.now()).toISOString();storage.setFromCloud('kana-study.grammar-progress.v2',raw);TestBed.tick();
    expect(planner.snapshot().grammar.find(g=>g.id===concept.id)?.completed).toBe(true);
    expect(planner.plan().performed.find(a=>a.id===`grammar:${concept.id}`)?.completed).toBe(true);
  });
  it('only includes eligible enabled Manga FSRS work, without writing replay or history',async()=>{
    const planner=await ready(),saved=TestBed.inject(MangaStudySavedRepository),fsrs=TestBed.inject(MangaFsrsService);
    saved.items.set([{schemaVersion:1,id:'word',expression:'龍',reading:'りゅう',meaning:'dragon',kanji:[],source:{volumeId:'fixture',pageNumber:1},createdAt:1}]);
    expect([...planner.plan().recommended,...planner.plan().available].some(a=>a.module==='manga')).toBe(false);
    fsrs.setEnabled(true);enqueue.mockClear();const writes=vi.spyOn(TestBed.inject(StorageService),'set');
    expect([...planner.plan().recommended,...planner.plan().available].find(a=>a.module==='manga')?.path).toBe('/manga/study/fsrs');
    expect(writes).not.toHaveBeenCalled();expect(enqueue).not.toHaveBeenCalled();
  });
  it('keeps local planning available offline and refreshes real time on focus and visibility',async()=>{
    const planner=await ready();vi.spyOn(navigator,'onLine','get').mockReturnValue(false);planner.now.set(0);
    window.dispatchEvent(new Event('focus'));expect(planner.now()).toBeGreaterThan(0);expect(planner.offline()).toBe(true);
    vi.spyOn(document,'hidden','get').mockReturnValue(false);planner.now.set(0);document.dispatchEvent(new Event('visibilitychange'));expect(planner.now()).toBeGreaterThan(0);
  });
  it('refreshes at Madrid midnight and removes yesterday’s normal lock without polling',async()=>{
    const planner=await ready(),database=TestBed.inject(DeckDatabaseService),date=new Date(planner.now());
    await database.writeDailyState({...emptyDailyState(STUDY_DECKS[0].id,getSpainDayKey(date)),completedAt:date.getTime()});await planner.refreshDecks();expect(planner.snapshot().decks[0].completedToday).toBe(true);
    const next=new Date(date.getTime()+27*3600000);TestBed.inject(DailyLearningService).refresh(next);planner.now.set(next.getTime());TestBed.tick();await planner.refreshDecks();expect(planner.snapshot().decks[0].completedToday).toBe(false);
  });
  it('reports IndexedDB errors without throwing away the usable local projection',async()=>{
    const planner=await ready();vi.spyOn(TestBed.inject(DeckStudyService),'snapshot').mockRejectedValue(new Error('database unavailable'));await planner.refreshDecks();
    expect(planner.error()).toBe(true);expect(planner.plan().recommended.length).toBeGreaterThan(0);expect(planner.snapshot().decks).toEqual([]);
  });
  it('automatically crosses Madrid midnight and does not poll IndexedDB between actual boundaries',async()=>{
    const planner=await ready();vi.useFakeTimers({toFake:['Date','setTimeout','clearTimeout']});vi.setSystemTime(new Date('2026-07-15T21:59:59Z'));
    planner.now.set(Date.now());TestBed.inject(DailyLearningService).refresh(new Date());TestBed.tick();
    await vi.advanceTimersByTimeAsync(1001);TestBed.tick();
    expect(planner.snapshot().day).toBe('2026-07-16');expect(TestBed.inject(DailyLearningService).spainDay()).toBe('2026-07-16');
    const read=vi.spyOn(planner,'refreshDecks');await vi.advanceTimersByTimeAsync(10_000);TestBed.tick();expect(read).not.toHaveBeenCalled();
    vi.useRealTimers();await planner.refreshDecks();
  });
});

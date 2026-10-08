import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MangaFsrsService } from './manga-fsrs.service';
import { MangaFsrsSessionService } from './manga-fsrs-session.service';
import { MangaStudySavedRepository } from './manga-study-saved.repository';
import { MangaReviewHistoryService } from './manga-review-history.service';
import { SessionHistoryService } from './session-history.service';
import { SyncOutboxService } from './sync-outbox.service';
import { WorkspaceService } from './workspace.service';
import { StorageService } from './storage.service';
import { STUDY_MONOTONIC_NOW } from './study-clock';
import { MANGA_FSRS_SETTINGS_KEY } from '../models/manga-fsrs.model';
import { MANGA_REVIEW_EVENTS_KEY } from '../models/manga-review.model';
import { MangaStudySavedItem } from '../models/manga-study-saved.model';

const item=(id='word'):MangaStudySavedItem=>({schemaVersion:1,id,expression:'龍',reading:'りゅう',meaning:'dragon',kanji:[],source:{volumeId:'fixture',pageNumber:1},createdAt:1});
describe('Manga FSRS opt-in and durable session',()=>{
  let session:MangaFsrsSessionService,fsrs:MangaFsrsService,now:number;
  const items=signal<readonly MangaStudySavedItem[]>([]);
  function setup():void {
    TestBed.configureTestingModule({providers:[MangaFsrsSessionService,
      {provide:MangaStudySavedRepository,useValue:{items}},{provide:STUDY_MONOTONIC_NOW,useValue:()=>now},
      {provide:SyncOutboxService,useValue:{enqueue:vi.fn(async()=>{}),pending:async()=>[],enqueueIfAbsent:vi.fn(async()=>true)}}]});
    session=TestBed.inject(MangaFsrsSessionService);fsrs=TestBed.inject(MangaFsrsService);TestBed.tick();
  }
  beforeEach(()=>{
    TestBed.resetTestingModule();localStorage.clear();now=0;items.set([item()]);vi.useFakeTimers();
    vi.spyOn(document,'hidden','get').mockReturnValue(false);
    vi.stubGlobal('matchMedia',()=>({matches:false,addEventListener:()=>{},removeEventListener:()=>{}}));
    setup();
  });
  afterEach(()=>{TestBed.resetTestingModule();vi.restoreAllMocks();vi.unstubAllGlobals();vi.useRealTimers();});
  it('is off by default; enabling/disabling never removes cards or history',async()=>{
    session.start();expect(session.state()).toBe('intro');expect(fsrs.enabled()).toBe(false);
    fsrs.setEnabled(true);session.start();session.reveal();await session.rate('good');
    const card=fsrs.cards()[0].card;fsrs.setEnabled(false);TestBed.tick();expect(session.state()).toBe('intro');
    expect(fsrs.cards()[0].card).toEqual(card);expect(TestBed.inject(MangaReviewHistoryService).events()).toHaveLength(1);
    fsrs.setEnabled(true);session.start();expect(session.state()).toBe('intro');
  });
  it('requires reveal, then accepts one rating without a fixed V3 repetition',async()=>{
    fsrs.setEnabled(true);session.start();await session.rate('good');expect(TestBed.inject(MangaReviewHistoryService).events()).toHaveLength(0);
    session.reveal();await Promise.all([session.rate('again'),session.rate('good')]);
    expect(session.state()).toBe('results');const events=TestBed.inject(MangaReviewHistoryService).events();
    expect(events).toHaveLength(1);expect(events[0]).toMatchObject({reviewKind:'fsrs',fsrsGrade:1,rating:'again',repetition:false});
    session.abandon();session.start();expect(session.state()).toBe('intro');
  });
  it('credits 4/15/7 as 21 seconds at reveal; rating/results time adds nothing',async()=>{
    items.set([item('a'),item('b'),item('c')]);fsrs.setEnabled(true);session.start();
    for(const ms of [4000,15000,7000]){now+=ms;session.reveal();now+=60000;await session.rate('good');}
    const sessions=TestBed.inject(SessionHistoryService).sessions();expect(sessions).toHaveLength(1);
    expect(sessions[0]).toMatchObject({module:'manga',mangaSessionKind:'fsrs',durationSeconds:21,attempts:3});
    now+=60000;await session.retry();expect(TestBed.inject(SessionHistoryService).sessions()).toHaveLength(1);
  });
  it('retains one event ID after enqueue failure and retries before moving on',async()=>{
    TestBed.inject(WorkspaceService).activateUser('a');TestBed.tick();fsrs.setEnabled(true);session.start();session.reveal();
    const outbox=TestBed.inject(SyncOutboxService);vi.mocked(outbox.enqueue).mockRejectedValueOnce(new Error('IDB'));
    await session.rate('good');expect(session.error()).toBe(true);expect(session.state()).toBe('question');
    const saved=TestBed.inject(MangaReviewHistoryService).events()[0];await session.retry();
    expect(TestBed.inject(MangaReviewHistoryService).events()).toEqual([saved]);expect(session.state()).toBe('results');
  });
  it('does not advance on local persistence failure, then recovers same event',async()=>{
    fsrs.setEnabled(true);session.start();session.reveal();
    const storage=vi.spyOn(Storage.prototype,'setItem').mockImplementation(()=>{throw new Error('quota');});
    await session.rate('again');expect(session.error()).toBe(true);expect(TestBed.inject(MangaReviewHistoryService).events()).toHaveLength(0);
    storage.mockRestore();await session.retry();expect(TestBed.inject(MangaReviewHistoryService).events()).toHaveLength(1);
  });
  it('retries a completion write without creating another review or duration',async()=>{
    fsrs.setEnabled(true);session.start();now=4000;session.reveal();
    const sessions=TestBed.inject(SessionHistoryService),write=vi.spyOn(sessions,'record').mockImplementationOnce(()=>{throw new Error('quota');});
    await session.rate('good');expect(session.error()).toBe(true);await session.retry();
    expect(write).toHaveBeenCalledTimes(2);expect(TestBed.inject(MangaReviewHistoryService).events()).toHaveLength(1);
    expect(sessions.sessions()[0].durationSeconds).toBe(4);
  });
  it('abandonment and account changes retain reviews but never complete a session',async()=>{
    items.set([item('a'),item('b')]);fsrs.setEnabled(true);session.start();session.reveal();await session.rate('good');
    TestBed.inject(WorkspaceService).activateUser('other');TestBed.tick();expect(session.state()).toBe('intro');expect(fsrs.enabled()).toBe(false);
    expect(TestBed.inject(MangaReviewHistoryService).events()).toEqual([]);
    TestBed.inject(WorkspaceService).activateGuest();TestBed.tick();expect(TestBed.inject(MangaReviewHistoryService).events()).toHaveLength(1);
    expect(TestBed.inject(SessionHistoryService).sessions()).toHaveLength(0);
  });
  it('never completes the new account when a previous rating finishes late',async()=>{
    TestBed.inject(WorkspaceService).activateUser('a');TestBed.tick();fsrs.setEnabled(true);session.start();session.reveal();
    let release!:()=>void;const gate=new Promise<void>(resolve=>release=resolve);
    vi.mocked(TestBed.inject(SyncOutboxService).enqueue).mockImplementationOnce(()=>gate);
    const rating=session.rate('good');TestBed.inject(WorkspaceService).activateUser('b');TestBed.tick();release();await rating;
    expect(session.state()).toBe('intro');expect(TestBed.inject(MangaReviewHistoryService).events()).toEqual([]);
    expect(TestBed.inject(SessionHistoryService).sessions()).toEqual([]);
    TestBed.inject(WorkspaceService).activateUser('a');TestBed.tick();expect(TestBed.inject(MangaReviewHistoryService).events()).toHaveLength(1);
    expect(TestBed.inject(SessionHistoryService).sessions()).toEqual([]);
  });
  it('skips a deleted remaining word without rewriting its saved data',async()=>{
    items.set([item('a'),item('b')]);fsrs.setEnabled(true);session.start();items.set([item('a')]);session.reveal();await session.rate('good');
    expect(session.state()).toBe('results');expect(TestBed.inject(SessionHistoryService).sessions()[0].attempts).toBe(1);
    expect(items().map(row=>row.id)).toEqual(['a']);
  });
  it('imports Guest FSRS IDs once and opt-in only if account lacks its own choice',async()=>{
    fsrs.setEnabled(true);session.start();session.reveal();await session.rate('good');
    const workspace=TestBed.inject(WorkspaceService);workspace.copyGuestLocalStorageToUser('a');workspace.copyGuestLocalStorageToUser('a');
    workspace.activateUser('a');TestBed.tick();expect(fsrs.enabled()).toBe(true);expect(TestBed.inject(MangaReviewHistoryService).events()).toHaveLength(1);
    fsrs.setEnabled(false);workspace.copyGuestLocalStorageToUser('a');TestBed.tick();expect(fsrs.enabled()).toBe(false);
    workspace.activateUser('b');TestBed.tick();expect(fsrs.enabled()).toBe(false);expect(TestBed.inject(MangaReviewHistoryService).events()).toEqual([]);
  });
  it('reopens durable Guest history and preference; empty queue makes no new writes',async()=>{
    fsrs.setEnabled(true);session.start();session.reveal();await session.rate('good');
    let storage=TestBed.inject(StorageService);const event=storage.get(MANGA_REVIEW_EVENTS_KEY,[]),settings=storage.get(MANGA_FSRS_SETTINGS_KEY,{});
    TestBed.resetTestingModule();setup();storage=TestBed.inject(StorageService);
    const set=vi.spyOn(storage,'set');for(let i=0;i<10;i++)session.start();expect(set).not.toHaveBeenCalled();
    expect(fsrs.enabled()).toBe(true);expect(fsrs.cards()[0].card.reps).toBe(1);
    expect(storage.get(MANGA_REVIEW_EVENTS_KEY,[])).toEqual(event);expect(storage.get(MANGA_FSRS_SETTINGS_KEY,{})).toEqual(settings);
  });
});

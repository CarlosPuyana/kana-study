import { TestBed } from '@angular/core/testing';
import { MangaReviewSessionService } from './manga-review-session.service';
import { MangaReviewHistoryService } from './manga-review-history.service';
import { MangaReviewQuestion } from '../models/manga-review.model';
import { SessionHistoryService } from './session-history.service';
import { STUDY_MONOTONIC_NOW } from './study-clock';
import { SyncOutboxService } from './sync-outbox.service';
import { WorkspaceService } from './workspace.service';
import { StorageService } from './storage.service';

const question=(id='word',options:readonly string[]=['dragon','cat']):MangaReviewQuestion=>({item:{schemaVersion:1,id,expression:'龍',reading:'りゅう',meaning:'dragon',kanji:[],source:{volumeId:'fixture',pageNumber:1},createdAt:1},type:'meaning',answer:'dragon',prompt:'龍',options,originalMeaning:true});
describe('Manga review session',()=>{
  let session:MangaReviewSessionService,history:MangaReviewHistoryService,now:number;
  beforeEach(()=>{
    TestBed.resetTestingModule();localStorage.clear();now=0;vi.useFakeTimers();vi.spyOn(document,'hidden','get').mockReturnValue(false);
    TestBed.configureTestingModule({providers:[MangaReviewSessionService,{provide:STUDY_MONOTONIC_NOW,useValue:()=>now},
      {provide:SyncOutboxService,useValue:{enqueue:vi.fn(async()=>{}),pending:async()=>[]}}]});
    session=TestBed.inject(MangaReviewSessionService);history=TestBed.inject(MangaReviewHistoryService);TestBed.tick();
  });
  afterEach(()=>{TestBed.resetTestingModule();vi.restoreAllMocks();vi.useRealTimers();});
  it('never starts empty and does not time the introduction',()=>{now=20000;session.start([]);expect(session.state()).toBe('intro');expect(session.clock.committedSeconds).toBe(0);});
  it('records correct answers once and completes exactly one session',async()=>{
    session.start([question()]);now=4000;await Promise.all([session.answer(true),session.answer(false)]);
    expect(history.events()).toHaveLength(1);expect(session.correct()).toBe(true);
    await Promise.all([session.next(),session.next()]);expect(TestBed.inject(SessionHistoryService).sessions()).toHaveLength(1);
    expect(session.result()).toMatchObject({uniqueWords:1,firstCorrect:1,initialErrors:0,appearances:1,accuracy:100});
  });
  it.each([true,false])('appends at most one repetition and computes first-round accuracy, recovered=%s',async(correct)=>{
    session.start([question()]);await session.answer(false);expect(session.questions()).toHaveLength(2);
    await session.next();await session.answer(correct);expect(session.questions()).toHaveLength(2);await session.next();
    expect(session.result()).toMatchObject({firstCorrect:0,initialErrors:1,recovered:correct?1:0,remainingErrors:correct?0:1,accuracy:0,appearances:2});
    expect(history.events().map(e=>e.repetition)).toEqual([false,true]);expect(new Set(history.events().map(e=>e.id)).size).toBe(2);
  });
  it('credits 4/15/7 as 21 seconds, excluding feedback/results and configuration',async()=>{
    now=100000;session.start([question('a'),question('b'),question('c')]);
    for(const duration of [4000,15000,7000]){now+=duration;await session.answer(true);now+=60000;await session.next();}
    expect(session.clock.committedSeconds).toBe(21);expect(TestBed.inject(SessionHistoryService).sessions()[0].durationSeconds).toBe(21);
    now+=60000;expect(session.clock.committedSeconds).toBe(21);
  });
  it('excludes hidden time and gives repetitions a fresh ten-second budget',async()=>{
    session.start([question()]);now=4000;vi.spyOn(document,'hidden','get').mockReturnValue(true);document.dispatchEvent(new Event('visibilitychange'));
    now+=100000;vi.spyOn(document,'hidden','get').mockReturnValue(false);document.dispatchEvent(new Event('visibilitychange'));
    now+=2000;await session.answer(false);await session.next();now+=15000;await session.answer(true);await session.next();
    expect(session.clock.committedSeconds).toBe(16);
  });
  it('self-assessment requires reveal and freezes time when the answer is shown',async()=>{
    session.start([question('self',[])]);await session.answer(true);expect(history.events()).toHaveLength(0);
    now=4000;session.reveal();now+=50000;await session.answer(true);await session.next();
    expect(history.events()[0].answerMode).toBe('self-assessment');expect(session.clock.committedSeconds).toBe(4);
  });
  it('abandonment preserves confirmed attempts but creates no completed session or profile time',async()=>{
    session.start([question('a'),question('b')]);await session.answer(true);session.abandon();
    expect(history.events()).toHaveLength(1);expect(TestBed.inject(SessionHistoryService).sessions()).toHaveLength(0);
  });
  it('uses a snapshot despite remote changes or deletion of the saved item',async()=>{
    const questions=[question()];session.start(questions);questions[0].item.expression='猫';
    TestBed.inject(StorageService).cloudRevision.update(v=>v+1);expect(session.current().item.expression).toBe('龍');
    await session.answer(true);expect(history.events()[0].savedItemId).toBe('word');
  });
  it('does not write results into a different workspace',async()=>{
    session.start([question()]);TestBed.inject(WorkspaceService).activateUser('other');
    await session.answer(true);expect(history.events()).toHaveLength(0);expect(TestBed.inject(SessionHistoryService).sessions()).toHaveLength(0);
  });
  it('cancels a pending response after an account switch without contaminating the new account',async()=>{
    const workspace=TestBed.inject(WorkspaceService);workspace.activateUser('a');TestBed.tick();session.start([question()]);
    let release!:()=>void;const gate=new Promise<void>(resolve=>release=resolve);
    vi.spyOn(TestBed.inject(SyncOutboxService),'enqueue').mockImplementationOnce(async()=>gate);
    const answering=session.answer(true);workspace.activateUser('b');TestBed.tick();release();await answering;
    expect(history.events()).toHaveLength(0);expect(TestBed.inject(SessionHistoryService).sessions()).toHaveLength(0);expect(session.state()).toBe('intro');
    expect(JSON.parse(localStorage.getItem(workspace.storageKey('kana-study.manga-review-events.v1','user:a'))!)).toHaveLength(1);
  });
  it('recovers a durable attempt after reopening when outbox persistence was interrupted',async()=>{
    const workspace=TestBed.inject(WorkspaceService);workspace.activateUser('a');TestBed.tick();session.start([question()]);
    vi.spyOn(TestBed.inject(SyncOutboxService),'enqueue').mockRejectedValueOnce(new Error('interrupted'));
    await session.answer(true);expect(session.error()).toBe(true);
    TestBed.resetTestingModule();const enqueue=vi.fn(async()=>{});
    TestBed.configureTestingModule({providers:[{provide:SyncOutboxService,useValue:{enqueue,pending:async()=>[]}}]});
    await TestBed.inject(MangaReviewHistoryService).recover();expect(enqueue).toHaveBeenCalledTimes(1);
    expect(enqueue.mock.calls[0]).toHaveLength(1);expect(TestBed.inject(MangaReviewHistoryService).events()).toHaveLength(1);
    expect(TestBed.inject(SessionHistoryService).sessions()).toHaveLength(0);
  });
  it('shows a local persistence failure and retries the same immutable event without extra time',async()=>{
    session.start([question()]);now=4000;const set=vi.spyOn(Storage.prototype,'setItem').mockImplementationOnce(()=>{throw new DOMException('full','QuotaExceededError');});
    await session.answer(true);expect(session.error()).toBe(true);expect(session.state()).toBe('question');expect(history.events()).toHaveLength(0);
    set.mockRestore();now+=30000;await session.retryAnswer();expect(history.events()).toHaveLength(1);await session.next();expect(session.clock.committedSeconds).toBe(4);
  });
  it('recovers a failed outbox enqueue without duplicating a persisted attempt',async()=>{
    TestBed.inject(WorkspaceService).activateUser('account');TestBed.tick();session.start([question()]);
    const outbox=TestBed.inject(SyncOutboxService);vi.spyOn(outbox,'enqueue').mockRejectedValueOnce(new Error('IndexedDB failed'));
    await session.answer(false);expect(session.error()).toBe(true);expect(history.events()).toHaveLength(1);
    await session.retryAnswer();expect(history.events()).toHaveLength(1);expect(session.questions()).toHaveLength(2);
  });
  it('does not record a final result twice when session persistence fails',async()=>{
    session.start([question()]);await session.answer(true);
    vi.spyOn(Storage.prototype,'setItem').mockImplementationOnce(()=>{throw new Error('full');});await session.next();expect(session.error()).toBe(true);
    vi.restoreAllMocks();await session.next();await session.next();expect(TestBed.inject(SessionHistoryService).sessions()).toHaveLength(1);
  });
  it('keeps history across repository recreation and leaves saved/FSRS/Weakness/Daily Learning unchanged',async()=>{
    session.start([question()]);await session.answer(true);await session.next();
    const stored=localStorage.getItem('kana-study.manga-review-events.v1');expect(JSON.parse(stored!)).toHaveLength(1);
    for(const key of ['kana-study.study-progress.v2','kana-study.vocabulary-progress.v1','kana-study.weakness.v1','kana-study.daily-learning.v1'])expect(localStorage.getItem(key)).toBeNull();
    TestBed.resetTestingModule();TestBed.configureTestingModule({providers:[{provide:SyncOutboxService,useValue:{enqueue:async()=>{}}}]});expect(TestBed.inject(MangaReviewHistoryService).events()).toHaveLength(1);
  });
});

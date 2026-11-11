import {TestBed} from '@angular/core/testing';
import {IDBFactory,IDBKeyRange} from 'fake-indexeddb';
import {VOCABULARY_N5} from '../../data/vocabulary-n5.generated';
import {VOCABULARY_QUESTION_TYPES,VocabularyStudyUnit} from '../models/vocabulary.model';
import {AttemptEvent} from '../models/attempt-event.model';
import {VocabularySessionService} from './vocabulary-session.service';
import {VocabularyProgressService} from './vocabulary-progress.service';
import {VocabularyMedalService} from './vocabulary-medal.service';
import {VocabularyUndoStore,VOCABULARY_UNDO_PENDING,VOCABULARY_UNDO_RECEIPT} from './vocabulary-undo-store';
import {VocabularyLessonRepository} from './vocabulary-lesson.repository';
import {VocabularyStatsReader} from './vocabulary-stats-reader';
import {AttemptEventRepository} from './attempt-event.repository';
import {WorkspaceService} from './workspace.service';
import {SyncOutboxService} from './sync-outbox.service';
import {SpacedRepetitionService} from './spaced-repetition.service';
import {SessionHistoryService} from './session-history.service';
import {WEAKNESSES_KEY} from './weakness.service';
import {VOCABULARY_LESSONS_KEY} from '../models/vocabulary-lesson.model';
import {STUDY_MONOTONIC_NOW} from './study-clock';

const NOW=new Date('2026-11-10T12:00:00.000Z'),PROGRESS='kana-study.vocabulary-progress.v1',EVENTS='kana-study.vocabulary-review-events.v1';
describe('Vocabulary explicit durable undo of the last open-lesson answer',()=>{
  let session:VocabularySessionService,progress:VocabularyProgressService,pool:VocabularyStudyUnit[],failOutbox=false;
  const enqueue=vi.fn(async()=>{if(failOutbox)throw Error('Synthetic outbox failure');});
  function configure(){TestBed.configureTestingModule({providers:[{provide:VocabularyMedalService,useValue:{evaluateUnlocks:()=>[]}},{provide:SyncOutboxService,useValue:{enqueue}}]});
    progress=TestBed.inject(VocabularyProgressService);vi.spyOn(progress,'activeUnits').mockImplementation(()=>pool);session=TestBed.inject(VocabularySessionService);}
  function raw<T=unknown>(key:string):T|null{return JSON.parse(localStorage.getItem(TestBed.inject(WorkspaceService).storageKey(key))??'null');}
  async function events(){await progress.flushAttempts();const rows:AttemptEvent[]=[];await TestBed.inject(AttemptEventRepository).scan({from:'0000',to:'9999'},e=>{rows.push(e);});return rows;}
  function answer(rating:'again'|'hard'|'good'){session.reveal();session.rate(rating);expect(session.error()).toBe(false);}
  async function reload(){await progress.flushAttempts();TestBed.resetTestingModule();configure();expect(session.start('self-assessment')).toBe(true);}
  beforeEach(()=>{localStorage.clear();vi.useFakeTimers({toFake:['Date']});vi.setSystemTime(NOW);vi.stubGlobal('indexedDB',new IDBFactory());vi.stubGlobal('IDBKeyRange',IDBKeyRange);failOutbox=false;enqueue.mockClear();
    pool=VOCABULARY_N5.filter(e=>e.enabled).slice(0,2).map(e=>({entryId:e.id,questionType:'japanese-to-meaning',key:`vocab:${e.id}:japanese-to-meaning`}));configure();});
  afterEach(async()=>{await progress.flushAttempts();TestBed.resetTestingModule();vi.restoreAllMocks();vi.unstubAllGlobals();vi.useRealTimers();});

  for(const direction of VOCABULARY_QUESTION_TYPES)for(const mode of ['self-assessment','quick-practice'] as const){
    it.each(['again','good'] as const)(`${direction}/${mode}/%s restores the exact card, FIFO, FSRS, weakness and metrics`,async rating=>{
      pool=pool.map(u=>({...u,questionType:direction,key:`vocab:${u.entryId}:${direction}`}));session.start(mode);
      const before=structuredClone(session.session()),lesson=structuredClone(TestBed.inject(VocabularyLessonRepository).active()),card=session.currentUnit()!;
      if(mode==='self-assessment')answer(rating);else session.answerQuick(rating==='good'?card.entryId:'wrong');
      expect(await events()).toHaveLength(1);expect(session.canUndo()).toBe(true);
      await session.undo();expect(session.error()).toBe(false);expect(session.session()).toEqual(before);expect(TestBed.inject(VocabularyLessonRepository).active()).toEqual(lesson);
      expect(session.currentUnit()).toEqual(card);expect(session.feedback()).toBeNull();expect(session.revealed()).toBe(false);
      expect(progress.get(card.key)).toBeNull();expect(progress.reviewEvents()).toEqual([]);expect(raw(WEAKNESSES_KEY)).toEqual([]);expect(await events()).toEqual([]);
      expect((await TestBed.inject(VocabularyStatsReader).evolution(7,'learn',NOW)).all.total.attempts).toBe(0);
      expect(session.canUndo()).toBe(false);await session.undo();expect(session.session()).toEqual(before);
    });
  }
  it('retains earlier answers and only resets the internal consolidation attempt, never grades FSRS again',async()=>{
    session.start('self-assessment');answer('good');answer('good');await events();
    const before=structuredClone(session.session()),stored=localStorage.getItem(PROGRESS),reviews=localStorage.getItem(EVENTS),weak=raw(WEAKNESSES_KEY),engine=vi.spyOn(TestBed.inject(SpacedRepetitionService),'review');
    answer('again');const removed=(await events()).find(e=>e.id.includes(':learn:3:'))!;expect(session.currentItem()!.consecutiveCorrect).toBe(1);
    await session.undo();expect(session.session()).toEqual(before);expect(localStorage.getItem(PROGRESS)).toBe(stored);expect(localStorage.getItem(EVENTS)).toBe(reviews);expect(raw(WEAKNESSES_KEY)).toEqual(weak);expect(await events()).toHaveLength(2);
    answer('hard');expect(engine).not.toHaveBeenCalled();expect(progress.reviewEvents()).toHaveLength(2);expect(await events()).toHaveLength(3);
    await TestBed.inject(AttemptEventRepository).insert(removed);expect(await events()).toHaveLength(3);expect((await events()).some(e=>e.id===removed.id)).toBe(false);
    await session.undo();expect(session.session()).toEqual(before);expect(await events()).toHaveLength(2);
  });
  it('undoes the final objective feedback before closing, while a simultaneous Continue cannot close it',async()=>{
    pool=pool.slice(0,1);session.start('quick-practice');session.answerQuick(pool[0].entryId);session.continueQuick();
    const before=structuredClone(session.session());session.answerQuick(pool[0].entryId);expect(session.resolvedCount()).toBe(1);expect(session.completed()).toBe(false);
    const reverting=session.undo();session.continueQuick();await reverting;
    expect(session.session()).toEqual(before);expect(session.resolvedCount()).toBe(0);expect(TestBed.inject(SessionHistoryService).sessions()).toHaveLength(0);expect(await events()).toHaveLength(1);
    session.answerQuick(pool[0].entryId);session.continueQuick();expect(session.completed()).toBe(true);expect(progress.reviewEvents()).toHaveLength(1);expect(await events()).toHaveLength(2);
  });
  it('recovers a failed forward receipt before making the full reversal available',async()=>{
    session.start('self-assessment');const before=structuredClone(session.session()),write=Storage.prototype.setItem;
    const fail=vi.spyOn(Storage.prototype,'setItem').mockImplementation(function(this:Storage,k,v){if(k===VOCABULARY_UNDO_RECEIPT)throw Error('Receipt quota');write.call(this,k,v);});
    session.reveal();session.rate('again');expect(session.error()).toBe(true);expect(session.session()!.attempts).toBe(0);fail.mockRestore();session.retryFinish();expect(session.error()).toBe(false);expect(session.canUndo()).toBe(true);
    await session.undo();expect(session.session()).toEqual(before);expect(await events()).toHaveLength(0);
  });
  it('refuses replay of a revoked answer journal, retaining the restored canonical state',async()=>{
    session.start('self-assessment');const write=Storage.prototype.removeItem;
    const crash=vi.spyOn(Storage.prototype,'removeItem').mockImplementation(function(this:Storage,k){if(k==='kana-study.vocabulary-review-intent.v1')throw Error('Crash');write.call(this,k);});
    session.reveal();session.rate('good');const stale=localStorage.getItem('kana-study.vocabulary-review-intent.v1')!;crash.mockRestore();session.retryFinish();await session.undo();
    localStorage.setItem('kana-study.vocabulary-review-intent.v1',stale);progress.recover();expect(progress.error()).toBe(true);expect(raw(PROGRESS)).toEqual({});expect(raw(EVENTS)).toEqual([]);expect(await events()).toHaveLength(0);
  });
  it('restores an existing FSRS card and all dates/counters exactly, preserving other cards',async()=>{
    progress.recordReview(pool[0],'again',false,'historical',new Date('2026-11-09T11:00:00Z'));
    session.start('self-assessment');const before=structuredClone(progress.allProgress()),reviews=structuredClone(progress.reviewEvents());answer('hard');await session.undo();
    expect(progress.allProgress()).toEqual(before);expect(progress.reviewEvents()).toEqual(reviews);expect(await events()).toEqual([]);
  });
  it('retains legacy FSRS serialization without inventing fields when restoring a stored snapshot',async()=>{
    progress.recordReview(pool[0],'again',false,'historical',new Date('2026-11-09T11:00:00Z'));
    const legacy=JSON.parse(localStorage.getItem(PROGRESS)!);delete legacy[pool[0].key].fsrs.learningSteps;localStorage.setItem(PROGRESS,JSON.stringify(legacy));progress.recover();
    session.start('self-assessment');answer('good');await session.undo();expect(raw(PROGRESS)).toEqual(legacy);expect(session.error()).toBe(false);
  });
  it('removes only the reverted credited time and continues timing the restored visible card',async()=>{
    await progress.flushAttempts();TestBed.resetTestingModule();let monotonic=0;TestBed.configureTestingModule({providers:[{provide:STUDY_MONOTONIC_NOW,useValue:()=>monotonic}]});configure();
    session.start('self-assessment');session.clock.attach();monotonic=3000;answer('again');expect(session.clock.committedSeconds).toBe(3);
    await session.undo();expect(session.clock.committedSeconds).toBe(0);monotonic=5000;expect(session.clock.appearanceMilliseconds()).toBe(2000);
  });
  it.each([VOCABULARY_UNDO_PENDING,PROGRESS,EVENTS,WEAKNESSES_KEY,VOCABULARY_LESSONS_KEY,VOCABULARY_UNDO_RECEIPT])('failure writing %s blocks ratings and safely retries the same operation',async key=>{
    session.start('self-assessment');const before=structuredClone(session.session());answer('again');await events();
    const original=Storage.prototype.setItem;let fail=true;vi.spyOn(Storage.prototype,'setItem').mockImplementation(function(this:Storage,k,v){if(fail&&k===key)throw Error('Synthetic quota');original.call(this,k,v);});
    await session.undo();expect(session.error()).toBe(true);const frozen=structuredClone(session.session());session.reveal();session.rate('good');session.continueQuick();expect(session.session()).toEqual(frozen);
    fail=false;session.retryFinish();await vi.waitFor(()=>expect(session.error()).toBe(false));expect(session.session()).toEqual(before);expect(await events()).toHaveLength(0);expect(raw(VOCABULARY_UNDO_PENDING)).toBeNull();
  });
  it('reloads after a partial local commit, stays blocked and retries without duplicating either direction',async()=>{
    session.start('self-assessment');const before=structuredClone(session.session());answer('good');await events();
    const write=Storage.prototype.setItem,spy=vi.spyOn(Storage.prototype,'setItem').mockImplementation(function(this:Storage,k,v){write.call(this,k,v);if(k===VOCABULARY_LESSONS_KEY)throw Error('Crash after local commit');});
    await session.undo();expect(session.error()).toBe(true);expect(raw(VOCABULARY_UNDO_PENDING)).not.toBeNull();spy.mockRestore();await reload();expect(session.error()).toBe(true);expect(session.canUndo()).toBe(false);
    const engine=vi.spyOn(TestBed.inject(SpacedRepetitionService),'review');await session.undo();expect(session.error()).toBe(false);expect(session.session()).toEqual(before);expect(await events()).toEqual([]);expect(engine).not.toHaveBeenCalled();
    answer('good');expect(await events()).toHaveLength(1);expect(progress.reviewEvents()).toHaveLength(1);
  });
  it('retries a failed post-commit read with its journal intact',async()=>{
    session.start('self-assessment');answer('again');await events();const get=Storage.prototype.getItem,write=Storage.prototype.setItem;let committed=false;
    vi.spyOn(Storage.prototype,'setItem').mockImplementation(function(this:Storage,k,v){write.call(this,k,v);if(k===VOCABULARY_LESSONS_KEY)committed=true;});
    const read=vi.spyOn(Storage.prototype,'getItem').mockImplementation(function(this:Storage,k){if(committed&&k===PROGRESS)throw Error('Read denied');return get.call(this,k);});
    await session.undo();expect(session.error()).toBe(true);read.mockRestore();expect(raw(VOCABULARY_UNDO_PENDING)).not.toBeNull();await session.undo();expect(session.error()).toBe(false);expect(await events()).toEqual([]);
  });
  it('verifies the terminal receipt when journal removal committed but reported failure',async()=>{
    session.start('self-assessment');const before=structuredClone(session.session());answer('good');await events();const remove=Storage.prototype.removeItem;
    const fail=vi.spyOn(Storage.prototype,'removeItem').mockImplementation(function(this:Storage,k){remove.call(this,k);if(k===VOCABULARY_UNDO_PENDING)throw Error('Failure after removal');});
    await session.undo();expect(session.error()).toBe(true);expect(raw(VOCABULARY_UNDO_PENDING)).toBeNull();fail.mockRestore();await session.undo();expect(session.error()).toBe(false);expect(session.session()).toEqual(before);expect(await events()).toEqual([]);
  });
  it('keeps an IndexedDB retraction failure recoverable across reload',async()=>{
    session.start('self-assessment');answer('good');await events();const open=vi.spyOn(indexedDB,'open').mockImplementation(()=>{throw Error('IDB unavailable');});await session.undo();expect(session.error()).toBe(true);open.mockRestore();await reload();expect(session.error()).toBe(true);await session.undo();expect(session.error()).toBe(false);expect(await events()).toEqual([]);
  });
  it('waits for outbox confirmation after commit and recovers once after reload in the original account',async()=>{
    TestBed.inject(WorkspaceService).activateUser('synthetic-a');session.start('self-assessment');answer('good');await events();failOutbox=true;await session.undo();expect(session.error()).toBe(true);expect(raw(VOCABULARY_UNDO_PENDING)).not.toBeNull();
    failOutbox=false;await reload();await session.undo();expect(session.error()).toBe(false);expect(await events()).toEqual([]);expect(session.session()!.attempts).toBe(0);
  });
  it('deduplicates double undo and fences A→B→A while IndexedDB is outstanding',async()=>{
    session.start('self-assessment');answer('good');await events();const open=indexedDB.open.bind(indexedDB);let release!:()=>void;
    // Hold the database open result while the durable reverse journal already exists.
    vi.spyOn(indexedDB,'open').mockImplementation((...args)=>{const request=open(...args),add=request.addEventListener.bind(request);Object.defineProperty(request,'onsuccess',{set(fn){add('success',()=>{release=()=>fn.call(request,new Event('success'));});}});return request;});
    const first=session.undo(),second=session.undo();await vi.waitFor(()=>expect(release).toBeDefined());expect(session.undoBusy()).toBe(true);const workspace=TestBed.inject(WorkspaceService);workspace.activateUser('synthetic-b');workspace.activateGuest();release();await Promise.all([first,second]);
    expect(session.session()).toBeNull();expect(localStorage.getItem(workspace.storageKey(PROGRESS,'user:synthetic-b'))).toBeNull();vi.restoreAllMocks();await reload();expect(session.error()).toBe(true);await session.undo();expect(await events()).toEqual([]);
  });
  it('does not offer historical receipts, closed lessons, voluntary practice or an old-day undo',async()=>{
    session.start('self-assessment');answer('good');expect(session.canUndo()).toBe(true);localStorage.removeItem(VOCABULARY_UNDO_RECEIPT);session.clear();session.start('self-assessment');expect(session.canUndo()).toBe(false);
    answer('good');answer('good');answer('good');expect(session.completed()).toBe(true);expect(session.canUndo()).toBe(false);await session.undo();expect(TestBed.inject(SessionHistoryService).sessions()).toHaveLength(1);expect(progress.completedToday()).toBe(true);expect(session.start('self-assessment')).toBe(false);
    session.startPractice(pool);expect(session.canUndo()).toBe(false);
  });
  it('verifies day and head even when a stale button was rendered earlier',async()=>{
    session.start('self-assessment');answer('good');expect(session.canUndo()).toBe(true);vi.setSystemTime(new Date('2026-11-11T12:00:00Z'));await session.undo();expect(session.error()).toBe(true);expect(session.session()!.attempts).toBe(1);expect(await events()).toHaveLength(1);expect(raw(VOCABULARY_UNDO_PENDING)).toBeNull();
  });
});

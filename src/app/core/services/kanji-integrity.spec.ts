import {TestBed} from '@angular/core/testing';
import {provideRouter} from '@angular/router';
import {IDBFactory,IDBKeyRange} from 'fake-indexeddb';
import {KanjiSessionService} from './kanji-session.service';
import {KanjiProgressService} from './kanji-progress.service';
import {KanjiAnswerStore,KANJI_ANSWER_JOURNAL,KANJI_ANSWER_RECEIPT,KANJI_PROGRESS_KEY,KANJI_EVENTS_KEY} from './kanji-answer-store';
import {WorkspaceService} from './workspace.service';
import {WeaknessService,WEAKNESSES_KEY} from './weakness.service';
import {SyncOutboxService} from './sync-outbox.service';
import {AttemptEventRepository} from './attempt-event.repository';
import {SpacedRepetitionService} from './spaced-repetition.service';
import {JapaneseGlyphService} from './japanese-glyph.service';
import {KanjiWritingPage} from '../../features/kanji-writing/kanji-writing.page';
import {StorageService} from './storage.service';
import {DailyLearningService} from './daily-learning.service';
import {SessionHistoryService} from './session-history.service';

describe('Kanji K0 recoverable answers and activation fences',()=>{
  const enqueue=vi.fn(async()=>{});
  function configure(){TestBed.configureTestingModule({providers:[provideRouter([]),{provide:SyncOutboxService,useValue:{enqueue}},{provide:JapaneseGlyphService,useValue:{load:async(character:string)=>[{character,strokes:[],clipPaths:[]}]}}]});}
  const raw=(key:string)=>JSON.parse(localStorage.getItem(TestBed.inject(WorkspaceService).storageKey(key))??'null');
  function begin(){const s=TestBed.inject(KanjiSessionService);expect(s.start('self-assessment')).toBe(true);s.reveal();return s;}
  async function attempts(owner=TestBed.inject(WorkspaceService).active()){
    const rows:unknown[]=[];await TestBed.inject(AttemptEventRepository).scan({from:'0000',to:'9999'},e=>{rows.push(e);},owner);return rows;
  }
  beforeEach(()=>{localStorage.clear();enqueue.mockClear();vi.stubGlobal('matchMedia',vi.fn(()=>({matches:false,addEventListener:vi.fn(),removeEventListener:vi.fn()})));vi.stubGlobal('indexedDB',new IDBFactory());vi.stubGlobal('IDBKeyRange',IDBKeyRange);configure();});
  afterEach(()=>{TestBed.resetTestingModule();vi.restoreAllMocks();vi.unstubAllGlobals();localStorage.clear();});

  it.each([KANJI_ANSWER_JOURNAL,KANJI_PROGRESS_KEY,KANJI_EVENTS_KEY,WEAKNESSES_KEY,KANJI_ANSWER_RECEIPT])('stays on the question when %s fails; retry applies one frozen snapshot',async key=>{
    const s=begin(),unit=s.currentUnit()!,id=s.session()!.id,fsrs=vi.spyOn(TestBed.inject(SpacedRepetitionService),'review');
    const original=Storage.prototype.setItem;let fail=true;
    vi.spyOn(Storage.prototype,'setItem').mockImplementation(function(this:Storage,k,v){if(fail&&k===key)throw new DOMException('Synthetic quota','QuotaExceededError');original.call(this,k,v);});
    await s.rate('good');expect(s.currentUnit()!.key).toBe(unit.key);expect(s.session()!.attempts).toBe(0);expect(s.error()).toBe(true);
    await s.retry();expect(s.session()!.attempts).toBe(0);expect(s.error()).toBe(true);
    fail=false;await s.retry();expect(s.session()!.id).toBe(id);expect(s.session()!.attempts).toBe(1);expect(s.error()).toBe(false);
    expect(fsrs).toHaveBeenCalledTimes(1);expect(raw(KANJI_EVENTS_KEY)).toHaveLength(1);expect(raw(KANJI_EVENTS_KEY)[0].fsrsBefore).toBeNull();
    expect(raw(KANJI_PROGRESS_KEY)[unit.key].fsrs).toEqual(raw(KANJI_EVENTS_KEY)[0].fsrsAfter);expect(raw(KANJI_PROGRESS_KEY)[unit.key].fsrs.reps).toBe(1);
    expect(raw(WEAKNESSES_KEY).filter((r:{module:string})=>r.module==='kanji')[0].attempts).toBe(1);expect(await attempts()).toHaveLength(1);expect(raw(KANJI_ANSWER_JOURNAL)).toBeNull();
  });
  it('handles total write failure without advancing and preserves the original rating for retry',async()=>{
    const s=begin(),original=Storage.prototype.setItem,spy=vi.spyOn(Storage.prototype,'setItem').mockImplementation(()=>{throw new DOMException('quota','QuotaExceededError');});
    await s.rate('again');expect(s.session()!.attempts).toBe(0);expect(s.currentItem()!.initialRating).toBeNull();expect(s.error()).toBe(true);
    spy.mockImplementation(function(this:Storage,k,v){original.call(this,k,v);});await s.retry();expect(s.session()!.attempts).toBe(1);expect(raw(KANJI_EVENTS_KEY)[0].rating).toBe('again');
  });
  it('can retry after read access fails, without losing the chosen rating',async()=>{
    const s=begin(),fsrs=vi.spyOn(TestBed.inject(SpacedRepetitionService),'review');
    const original=Storage.prototype.getItem,spy=vi.spyOn(Storage.prototype,'getItem').mockImplementation(function(this:Storage,key){if(key===KANJI_ANSWER_JOURNAL)throw Error('Synthetic denied storage');return original.call(this,key);});
    await s.rate('again');expect(s.error()).toBe(true);expect(s.session()!.attempts).toBe(0);expect(fsrs).not.toHaveBeenCalled();spy.mockRestore();await s.retry();
    expect(s.session()!.attempts).toBe(1);expect(raw(KANJI_EVENTS_KEY)[0].rating).toBe('again');expect(fsrs).toHaveBeenCalledTimes(1);
  });
  it('waits for IndexedDB confirmation and retries a failed projection with the same ID',async()=>{
    const repo=TestBed.inject(AttemptEventRepository),insert=repo.insert.bind(repo),spy=vi.spyOn(repo,'insert').mockResolvedValue(false),s=begin();
    await s.rate('good');expect(s.error()).toBe(true);expect(s.session()!.attempts).toBe(0);const id=raw(KANJI_ANSWER_JOURNAL).attempt.id;
    spy.mockImplementation(insert);await s.retry();expect(s.session()!.attempts).toBe(1);expect((await attempts())[0]).toEqual(expect.objectContaining({id}));expect(raw(KANJI_EVENTS_KEY)).toHaveLength(1);
  });
  it('deduplicates simultaneous clicks and does not reveal feedback before confirmation',async()=>{
    const repo=TestBed.inject(AttemptEventRepository),insert=repo.insert.bind(repo);let release!:()=>void;const gate=new Promise<void>(r=>release=r);
    vi.spyOn(repo,'insert').mockImplementation(async(e,w)=>{await gate;return insert(e,w);});const s=TestBed.inject(KanjiSessionService);s.start('quick-practice');const id=s.currentUnit()!.kanjiId;
    const first=s.answerQuick(id),second=s.answerQuick(id);expect(s.saving()).toBe(true);expect(s.feedback()).toBeNull();expect(s.session()!.attempts).toBe(0);
    release();await Promise.all([first,second]);expect(s.feedback()!.correct).toBe(true);expect(s.session()!.attempts).toBe(1);expect(await attempts()).toHaveLength(1);
  });
  it.each(['kanji-review-events','kanji-answer-receipt'])('recovers after reload at a partial %s operation without recalculating FSRS',async suffix=>{
    const s=begin(),original=Storage.prototype.setItem;
    const fail=vi.spyOn(Storage.prototype,'setItem').mockImplementation(function(this:Storage,k,v){if(k.includes(suffix))throw Error('synthetic partial');original.call(this,k,v);});
    await s.rate('good');const journal=raw(KANJI_ANSWER_JOURNAL),snapshot=journal.after.fsrs;expect(s.error()).toBe(true);fail.mockRestore();
    TestBed.resetTestingModule();configure();const fsrs=vi.spyOn(TestBed.inject(SpacedRepetitionService),'review');await TestBed.inject(KanjiAnswerStore).recover();
    expect(raw(KANJI_PROGRESS_KEY)[journal.after.key].fsrs).toEqual(snapshot);expect(raw(KANJI_EVENTS_KEY)).toHaveLength(1);expect(await attempts()).toHaveLength(1);expect(fsrs).not.toHaveBeenCalled();
    expect(TestBed.inject(KanjiSessionService).session()).toBeNull();
  });
  it('retries journal removal failure using the already confirmed receipt',async()=>{
    const s=begin(),original=Storage.prototype.removeItem;let fail=true;
    vi.spyOn(Storage.prototype,'removeItem').mockImplementation(function(this:Storage,k){if(fail&&k===KANJI_ANSWER_JOURNAL)throw Error('synthetic');original.call(this,k);});
    await s.rate('good');expect(s.session()!.attempts).toBe(0);expect(raw(KANJI_ANSWER_RECEIPT)).not.toBeNull();fail=false;await s.retry();
    expect(s.session()!.attempts).toBe(1);expect(await attempts()).toHaveLength(1);expect(raw(KANJI_EVENTS_KEY)).toHaveLength(1);
  });
  it.each([['guest','user:a'],['user:a','user:b'],['user:a','guest']])('invalidates %s → %s synchronously, including late answers',async(from,to)=>{
    const w=TestBed.inject(WorkspaceService);w.activate(from as 'guest'|'user:a');const s=begin();w.activate(to as 'guest'|'user:a');
    expect(s.session()).toBeNull();await s.rate('good');expect(s.saving()).toBe(false);expect(raw(KANJI_PROGRESS_KEY)).toBeNull();expect(await attempts()).toHaveLength(0);
    expect(s.start('self-assessment')).toBe(true);expect(s.session()).not.toBeNull();
  });
  it('invalidates A→B→A even with no intermediate session read',async()=>{
    const w=TestBed.inject(WorkspaceService);w.activateUser('a');const s=begin();w.activateUser('b');w.activateUser('a');await s.rate('good');expect(s.session()).toBeNull();expect(raw(KANJI_PROGRESS_KEY)).toBeNull();
  });
  it('fences a workspace change inside a projection and recovers only for its original owner',async()=>{
    const w=TestBed.inject(WorkspaceService);w.activateUser('a');const s=begin(),original=Storage.prototype.setItem;let changed=false;
    vi.spyOn(Storage.prototype,'setItem').mockImplementation(function(this:Storage,k,v){original.call(this,k,v);if(!changed&&k.endsWith(KANJI_PROGRESS_KEY)){changed=true;w.activateUser('b');w.activateUser('a');}});
    await s.rate('good');expect(s.session()).toBeNull();expect(localStorage.getItem(w.storageKey(KANJI_PROGRESS_KEY,'user:b'))).toBeNull();
    await TestBed.inject(KanjiAnswerStore).recover();expect(raw(KANJI_EVENTS_KEY)).toHaveLength(1);expect(await attempts('user:a')).toHaveLength(1);expect(await attempts('user:b')).toHaveLength(0);
  });
  it('an already issued IDB write may finish in A, but cannot revive A UI or write in B',async()=>{
    const w=TestBed.inject(WorkspaceService);w.activateUser('a');const repo=TestBed.inject(AttemptEventRepository),insert=repo.insert.bind(repo);let release!:()=>void;const gate=new Promise<void>(r=>release=r);
    vi.spyOn(repo,'insert').mockImplementation(async(e,owner)=>{await gate;return insert(e,owner);});const s=begin(),write=s.rate('good');w.activateUser('b');expect(s.session()).toBeNull();release();await write;
    expect(raw(KANJI_PROGRESS_KEY)).toBeNull();expect(await attempts('user:b')).toHaveLength(0);expect(await attempts('user:a')).toHaveLength(1);
    expect(s.start('self-assessment')).toBe(true);expect(s.session()!.attempts).toBe(0);
  });
  it('a workspace change between confirmation and the UI continuation cannot put old feedback in a new round',async()=>{
    const s=TestBed.inject(KanjiSessionService),w=TestBed.inject(WorkspaceService);s.start('quick-practice');const answer=s.currentUnit()!.kanjiId;
    const state=(s as unknown as {state:{set:(value:{session:{attempts:number}})=>void}}).state,original=state.set.bind(state);let changed=false;
    vi.spyOn(state,'set').mockImplementation(value=>{original(value);if(!changed&&value?.session.attempts===1){changed=true;queueMicrotask(()=>{w.activateUser('late-ui-b');s.clear();s.start('quick-practice');});}});
    await s.answerQuick(answer);expect(s.session()!.attempts).toBe(0);expect(s.feedback()).toBeNull();expect(raw(KANJI_PROGRESS_KEY)).toBeNull();expect(await attempts('user:late-ui-b')).toHaveLength(0);
  });
  it('preserves unrelated weaknesses and all original FSRS snapshots during replay',async()=>{
    const weak=TestBed.inject(WeaknessService);weak.record('vocabulary','keep',false);const old=raw(WEAKNESSES_KEY)[0];const s=begin();await s.rate('good');
    expect(raw(WEAKNESSES_KEY).find((r:{module:string})=>r.module==='vocabulary')).toEqual(old);const events=raw(KANJI_EVENTS_KEY);await TestBed.inject(KanjiAnswerStore).recover();expect(raw(KANJI_EVENTS_KEY)).toEqual(events);
  });
  it('accepts compatible legacy cards without learningSteps and preserves the historical event literally',async()=>{
    const unit={key:'kanji:日:kanji-to-meaning',kanjiId:'日',questionType:'kanji-to-meaning' as const},at='2020-01-01T00:00:00.000Z';
    const fsrs=Object.fromEntries(Object.entries(TestBed.inject(SpacedRepetitionService).review(null,'again',new Date(at))).filter(([key])=>key!=='learningSteps'));
    const oldEvent={...unit,id:'legacy-event',sessionId:'legacy-session',rating:'again',reviewedAt:at,fsrsBefore:null,fsrsAfter:fsrs};
    localStorage.setItem(KANJI_PROGRESS_KEY,JSON.stringify({[unit.key]:{...unit,fsrs,firstSeenAt:at,lastSeenAt:at,totalAttempts:1,totalFirstTrySuccesses:0,totalFailures:1,lastRating:'again'}}));
    localStorage.setItem(KANJI_EVENTS_KEY,JSON.stringify([oldEvent]));
    vi.spyOn(TestBed.inject(KanjiProgressService),'buildRound').mockReturnValue([unit]);const s=begin();await s.rate('good');expect(s.error()).toBe(false);
    expect(raw(KANJI_EVENTS_KEY)).toHaveLength(2);expect(raw(KANJI_EVENTS_KEY)[0]).toEqual(oldEvent);expect(raw(KANJI_EVENTS_KEY)[1].fsrsBefore).toEqual({...fsrs,learningSteps:0});
    expect(raw(KANJI_PROGRESS_KEY)[unit.key]).toMatchObject({firstSeenAt:at,totalAttempts:2,totalFailures:1,fsrs:{reps:2}});
  });
  it('writing waits, retains its drawing on failure, retries once and never updates FSRS',async()=>{
    const f=TestBed.createComponent(KanjiWritingPage);await f.whenStable();const p=f.componentInstance;p.start();await f.whenStable();const id=p.current()!.id;
    p.revealed.set(true);const drawing=[[{x:.1,y:.2,pressure:1,timestamp:0}]];p.canvas()!.strokes.set(drawing);const original=Storage.prototype.setItem;let fail=true;
    vi.spyOn(Storage.prototype,'setItem').mockImplementation(function(this:Storage,k,v){if(fail&&k===WEAKNESSES_KEY)throw Error('quota');original.call(this,k,v);});
    await p.answer(true);expect(p.current()!.id).toBe(id);expect(p.resolved()).toBe(0);expect(p.saveError()).toBe(true);expect(p.canvas()!.strokes()).toEqual(drawing);fail=false;await p.retrySave();
    expect(p.resolved()).toBe(1);expect(await attempts()).toHaveLength(1);expect(raw(KANJI_PROGRESS_KEY)).toBeNull();expect(raw(KANJI_EVENTS_KEY)).toBeNull();f.destroy();
  });
  it('writing A→B→A clears the round and ignores stale glyph responses',async()=>{
    let resolve!:(value:never[])=>void;TestBed.overrideProvider(JapaneseGlyphService,{useValue:{load:()=>new Promise<never[]>(r=>resolve=r)}});
    const f=TestBed.createComponent(KanjiWritingPage);f.detectChanges();const p=f.componentInstance;p.start();f.detectChanges();const w=TestBed.inject(WorkspaceService);w.activateUser('b');w.activateGuest();
    await p.answer(true);f.detectChanges();resolve([]);await f.whenStable();expect(p.session()).toBeNull();expect(p.active()).toBeNull();expect(p.glyphs()).toBeNull();expect(await attempts()).toHaveLength(0);f.destroy();
  });
  it('writing cannot distribute a pending answer between workspaces',async()=>{
    const f=TestBed.createComponent(KanjiWritingPage);await f.whenStable();const p=f.componentInstance;p.start();await f.whenStable();p.revealed.set(true);
    const repo=TestBed.inject(AttemptEventRepository),insert=repo.insert.bind(repo);let release!:()=>void;const gate=new Promise<void>(r=>release=r);
    vi.spyOn(repo,'insert').mockImplementation(async(e,owner)=>{await gate;return insert(e,owner);});const write=p.answer(false),w=TestBed.inject(WorkspaceService);w.activateUser('other');f.detectChanges();release();await write;
    expect(p.session()).toBeNull();expect(raw(WEAKNESSES_KEY)).toBeNull();expect(await attempts('user:other')).toHaveLength(0);f.destroy();
  });
  it('explicit storage owner also fixes the outbox destination during activation',()=>{
    const w=TestBed.inject(WorkspaceService),storage=TestBed.inject(StorageService);w.activateUser('a');const original=Storage.prototype.setItem;
    vi.spyOn(Storage.prototype,'setItem').mockImplementation(function(this:Storage,k,v){original.call(this,k,v);w.activateUser('b');});storage.set(KANJI_PROGRESS_KEY,{}, {strict:true,owner:'user:a'});
    expect(enqueue).toHaveBeenCalledWith(expect.objectContaining({workspace:'user:a'}));expect(localStorage.getItem(w.storageKey(KANJI_PROGRESS_KEY,'user:b'))).toBeNull();
  });
  it('recovers a failed final summary on reload without bypassing the existing daily limit',async()=>{
    const progress=TestBed.inject(KanjiProgressService),unit=progress.activeUnits()[0];vi.spyOn(progress,'buildRound').mockReturnValue([unit]);
    const s=begin(),original=Storage.prototype.setItem;
    const fail=vi.spyOn(Storage.prototype,'setItem').mockImplementation(function(this:Storage,key,value){if(key==='kana-study.completed-sessions.v1')throw Error('Synthetic full storage');original.call(this,key,value);});
    await s.rate('good');expect(s.completed()).toBe(false);expect(s.error()).toBe(true);expect(s.session()!.attempts).toBe(1);fail.mockRestore();
    TestBed.resetTestingModule();configure();await TestBed.inject(KanjiAnswerStore).recover();
    expect(TestBed.inject(SessionHistoryService).sessions()).toHaveLength(1);expect(TestBed.inject(DailyLearningService).isCompletedToday('kanji')).toBe(true);
    expect(TestBed.inject(KanjiSessionService).start('self-assessment')).toBe(false);expect(raw(KANJI_EVENTS_KEY)).toHaveLength(1);expect(await attempts()).toHaveLength(1);
  });
});

import {TestBed} from '@angular/core/testing';
import {IDBFactory} from 'fake-indexeddb';
import {MangaReviewHistoryService, MangaReviewConfirmed} from './manga-review-history.service';
import {MANGA_REVIEW_EVENTS_KEY, MangaReviewEvent} from '../models/manga-review.model';
import {CompletedSessionSummary} from '../models/learning-session.model';
import {StorageService} from './storage.service';
import {WorkspaceService} from './workspace.service';
import {makeOutboxItem, SyncOutboxService} from './sync-outbox.service';

const event=(id:string):MangaReviewEvent=>({id,key:'word',savedItemId:'word',sessionId:'session',reviewedAt:'2026-10-08T12:00:00Z',exerciseType:'reading',correct:true,repetition:false,answerMode:'self-assessment',rating:'good'});
const session=(sessionId:string):CompletedSessionSummary=>({sessionId,module:'manga',completedAt:'2026-10-08T12:00:00Z',mode:'quick-practice',exercisesCompleted:1,firstTrySuccesses:1,attempts:1,needsPracticeCount:0,durationSeconds:7});
describe('Manga recovery with a real revision-protected IndexedDB outbox',()=>{
  let history:MangaReviewHistoryService,outbox:SyncOutboxService,workspace:WorkspaceService,storage:StorageService;
  const proof=(events:string[]=[],sessions:string[]=[]):MangaReviewConfirmed=>({workspace:'user:a',eventIds:new Set(events),sessionIds:new Set(sessions)});
  beforeEach(()=>{
    TestBed.resetTestingModule();localStorage.clear();vi.stubGlobal('indexedDB',new IDBFactory());
    workspace=TestBed.inject(WorkspaceService);workspace.activateUser('a');history=TestBed.inject(MangaReviewHistoryService);
    outbox=TestBed.inject(SyncOutboxService);storage=TestBed.inject(StorageService);
  });
  afterEach(()=>{TestBed.resetTestingModule();vi.restoreAllMocks();vi.unstubAllGlobals();});
  it('enqueues only missing IDs, never confirmed history or unrelated module sessions',async()=>{
    storage.setFromCloud(MANGA_REVIEW_EVENTS_KEY,[event('confirmed'),event('missing')]);
    storage.setFromCloud('kana-study.completed-sessions.v1',[session('confirmed-session'),session('missing-session'),{...session('grammar'),module:'grammar'}]);
    await history.recover(proof(['confirmed'],['confirmed-session','grammar']));
    const queued=await outbox.pending('user:a');expect(queued).toHaveLength(2);
    expect(queued.find(item=>item.entityKey===MANGA_REVIEW_EVENTS_KEY)?.payload).toEqual([event('missing')]);
    expect(queued.find(item=>item.entityKey==='kana-study.completed-sessions.v1')?.payload).toEqual([session('missing-session')]);
    await outbox.removeProcessed(queued);
    await history.recover(proof(['confirmed','missing'],['confirmed-session','missing-session','grammar']));
    expect(await outbox.pending('user:a')).toEqual([]);
  });
  it('downloaded records with an empty outbox emit no new sync-pending events over ten recoveries',async()=>{
    storage.setFromCloud(MANGA_REVIEW_EVENTS_KEY,[event('remote')]);storage.setFromCloud('kana-study.completed-sessions.v1',[session('remote-session')]);
    const dispatch=vi.spyOn(window,'dispatchEvent');
    for(let i=0;i<10;i++)await history.recover(proof(['remote'],['remote-session']));
    expect(await outbox.pending('user:a')).toEqual([]);expect(dispatch).not.toHaveBeenCalled();
  });
  it('atomic recovery cannot replace a live revision or trigger a redundant notification',async()=>{
    const fresh=makeOutboxItem('user:a','local-storage',MANGA_REVIEW_EVENTS_KEY,[event('new')])!;
    const stale=makeOutboxItem('user:a','local-storage',MANGA_REVIEW_EVENTS_KEY,[event('old')])!;
    await outbox.enqueue(fresh);const dispatch=vi.spyOn(window,'dispatchEvent');
    expect(await outbox.enqueueIfAbsent(stale)).toBe(false);expect(dispatch).not.toHaveBeenCalled();
    await outbox.removeProcessed([stale]);expect(await outbox.pending('user:a')).toEqual([fresh]);
  });
  it('serializes a live enqueue against recovery while the database is opening',async()=>{
    const fresh=makeOutboxItem('user:a','local-storage',MANGA_REVIEW_EVENTS_KEY,[event('new')])!;
    const stale=makeOutboxItem('user:a','local-storage',MANGA_REVIEW_EVENTS_KEY,[event('old')])!;
    const [,inserted]=await Promise.all([outbox.enqueue(fresh),outbox.enqueueIfAbsent(stale)]);
    expect(inserted).toBe(false);expect(await outbox.pending('user:a')).toEqual([fresh]);
  });
  it('does not recover into another account while waiting for the outbox, and recovers after returning to A',async()=>{
    storage.setFromCloud(MANGA_REVIEW_EVENTS_KEY,[event('local-a')]);
    let release!:()=>void;const gate=new Promise<void>(resolve=>release=resolve);
    const pending=outbox.pending.bind(outbox);vi.spyOn(outbox,'pending').mockImplementationOnce(async()=>{await gate;return [];});
    const recovery=history.recover(proof());workspace.activateUser('b');release();
    await expect(recovery).rejects.toThrow('Workspace changed');expect(await pending('user:b')).toEqual([]);expect(history.events()).toEqual([]);
    workspace.activateUser('a');await history.recover(proof());expect(await pending('user:a')).toHaveLength(1);
    expect(history.events()).toEqual([event('local-a')]);
  });
  it('keeps Guest local even when given a successful empty remote snapshot',async()=>{
    workspace.activateGuest();await history.record(event('guest'));
    await history.recover({workspace:'guest',eventIds:new Set(),sessionIds:new Set()});
    expect(await outbox.pending('guest')).toEqual([]);expect(history.events()).toEqual([event('guest')]);
  });
});

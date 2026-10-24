import {TestBed} from '@angular/core/testing';
import {IDBFactory,IDBKeyRange} from 'fake-indexeddb';
import {AttemptEvent,validAttemptEvent} from '../models/attempt-event.model';
import {AttemptEventRepository,ATTEMPT_DATABASE} from './attempt-event.repository';
import {AttemptRecordingService} from './attempt-recording.service';
import {WorkspaceService} from './workspace.service';
export const event=(id='one',occurredAt='2026-10-08T12:00:00.000Z'):AttemptEvent=>({version:1,id,occurredAt,module:'kana',activity:'learn',itemId:'hira-vowel-a',result:{source:'objective',correct:true}});
const RECORDING_NOW=new Date('2026-10-08T12:00:00.000Z');
const query={from:'2026-10-01T00:00:00.000Z',to:'2026-10-09T23:59:59.999Z'};
describe('AttemptEvent local persistence and workspace boundaries',()=>{
  let repo:AttemptEventRepository;
  beforeEach(()=>{vi.useFakeTimers({toFake:['Date']});vi.setSystemTime(RECORDING_NOW);TestBed.resetTestingModule();localStorage.clear();vi.stubGlobal('indexedDB',new IDBFactory());vi.stubGlobal('IDBKeyRange',IDBKeyRange);TestBed.configureTestingModule({});repo=TestBed.inject(AttemptEventRepository);});
  afterEach(async()=>{await TestBed.inject(AttemptRecordingService).settle();TestBed.resetTestingModule();vi.unstubAllGlobals();vi.restoreAllMocks();vi.useRealTimers();});
  async function list(){const values:AttemptEvent[]=[];await repo.scan(query,e=>{values.push(e);});return values;}
  it('validates version, bounded IDs, UTC, ratings and objective provenance',()=>{
    expect(validAttemptEvent(event())).toBe(true);
    for(const patch of [{version:2},{id:''},{itemId:'x'.repeat(2049)},{occurredAt:'2026-02-30T00:00:00.000Z'},{occurredAt:'2026-10-08T12:00:00+00:00'},{result:{source:'self',rating:'easy'}},{result:{source:'objective',correct:1}},{firstAttempt:'yes'}])expect(validAttemptEvent({...event(),...patch})).toBe(false);
    for(const rating of ['again','hard','good'])expect(validAttemptEvent({...event(),result:{source:'self',rating}})).toBe(true);
    expect(validAttemptEvent({...event(),itemId:'漢字"\\'.repeat(400)})).toBe(true);
  });
  it('inserts immutably and deduplicates simultaneous retries, surviving repository recreation',async()=>{
    await Promise.all([repo.insert(event()),repo.insert(event())]);await repo.insert({...event(),result:{source:'objective',correct:false}});
    expect((await list())[0].result).toEqual({source:'objective',correct:true});expect(await list()).toHaveLength(1);
    TestBed.resetTestingModule();TestBed.configureTestingModule({});repo=TestBed.inject(AttemptEventRepository);expect(await list()).toHaveLength(1);
  });
  it('queries date/module/activity together without mixing accounts',async()=>{
    await repo.insert(event('guest'));const workspace=TestBed.inject(WorkspaceService);workspace.activateUser('a:b');await repo.insert(event('account'));
    workspace.activateUser('a_b');expect(await list()).toEqual([]);workspace.activateUser('a:b');
    await repo.insert({...event('writing'),activity:'writing',result:{source:'self',rating:'hard'}});await repo.insert(event('old','2026-09-01T12:00:00.000Z'));
    const filtered:AttemptEvent[]=[];await repo.scan({...query,module:'kana',activity:'writing'},e=>{filtered.push(e);});expect(filtered.map(e=>e.id)).toEqual(['writing']);
    workspace.activateGuest();expect((await list()).map(e=>e.id)).toEqual(['guest']);
  });
  it('ignores corrupt stored records without blocking valid data',async()=>{
    await repo.insert(event());const db=await new Promise<IDBDatabase>(resolve=>{const r=indexedDB.open(ATTEMPT_DATABASE,1);r.onsuccess=()=>resolve(r.result);});
    await new Promise<void>(resolve=>{const tx=db.transaction('events','readwrite');tx.oncomplete=()=>resolve();tx.objectStore('events').put({...event('broken'),workspace:'guest',result:{source:'self',rating:'invented'}});});db.close();
    expect(await list()).toHaveLength(1);
  });
  it('imports Guest by event union, idempotently, retaining originals and account records',async()=>{
    await repo.insert(event('guest'));await repo.insert(event('account'),'user:a');
    await repo.copyGuestToUser('a');await repo.copyGuestToUser('a');TestBed.inject(WorkspaceService).activateUser('a');expect((await list()).map(e=>e.id).sort()).toEqual(['account','guest']);
    TestBed.inject(WorkspaceService).activateGuest();expect((await list()).map(e=>e.id)).toEqual(['guest']);
  });
  it('pages imports beyond 100 events, including bounded escaped/Unicode IDs',async()=>{
    for(let n=0;n<101;n++)await repo.insert(event(`page-${n}`));await repo.insert(event('\uffff-final'));
    await repo.copyGuestToUser('pages');TestBed.inject(WorkspaceService).activateUser('pages');expect(await list()).toHaveLength(102);
    TestBed.inject(WorkspaceService).activateGuest();expect(await list()).toHaveLength(102);
  });
  it('does not mark a failed import as successful and preserves Guest for an idempotent retry',async()=>{
    await repo.insert(event('guest'));const spy=vi.spyOn(repo,'insert').mockResolvedValueOnce(false);
    await expect(repo.copyGuestToUser('retry')).rejects.toThrow();expect(await list()).toHaveLength(1);
    spy.mockRestore();await repo.copyGuestToUser('retry');TestBed.inject(WorkspaceService).activateUser('retry');expect(await list()).toHaveLength(1);
  });
  it('captures workspace at session start even if an async write finishes after switching',async()=>{
    const recorder=TestBed.inject(AttemptRecordingService),session=recorder.begin('kana','learn','session');
    session.record('a',{source:'self',rating:'hard'},'romaji-to-kana');TestBed.inject(WorkspaceService).activateUser('other');await recorder.settle();expect(await list()).toEqual([]);
    TestBed.inject(WorkspaceService).activateGuest();expect((await list())[0]).toMatchObject({id:'session:kana:learn:1',firstAttempt:true,result:{source:'self',rating:'hard'}});
    session.record('a',{source:'self',rating:'good'},'romaji-to-kana');await recorder.settle();expect((await list())[1].firstAttempt).toBe(false);
  });
  it('storage errors do not throw into learning, and explicit retry keeps the original ID and time',async()=>{
    const recorder=TestBed.inject(AttemptRecordingService),original=indexedDB,insert=vi.spyOn(repo,'insert');
    vi.stubGlobal('indexedDB',{open:()=>{throw Error('quota');}});const session=recorder.begin('kana','writing','session');
    expect(()=>session.record('a',{source:'self',rating:'again'})).not.toThrow();await recorder.settle();expect(repo.writeError()).toBe(true);
    const originalEvent=insert.mock.calls[0][0];vi.stubGlobal('indexedDB',original);await recorder.retry();await recorder.retry();expect(await list()).toHaveLength(1);expect((await list())[0].id).toBe('session:kana:writing:1');expect((await list())[0].occurredAt).toBe(originalEvent.occurredAt);expect(repo.writeError()).toBe(false);
  });
  it.each([
    ['2026-10-08T12:00:00.000Z',true],
    ['2026-10-21T12:00:00.000Z',false],
  ] as const)('records the actual clock %s without widening the fixed query',async(instant,inRange)=>{
    vi.setSystemTime(new Date(instant));
    const recorder=TestBed.inject(AttemptRecordingService);
    recorder.begin('kana','learn','clock-fixture').record('a',{source:'objective',correct:true});
    await recorder.settle();
    const stored:AttemptEvent[]=[];
    await repo.scan({from:'0000',to:'9999'},e=>{stored.push(e);});
    expect(stored).toHaveLength(1);expect(stored[0].occurredAt).toBe(instant);
    expect(await list()).toHaveLength(inRange?1:0);
  });
  it('includes exact UTC range endpoints and excludes adjacent milliseconds',async()=>{
    for(const [id,at] of [['before',new Date(Date.parse(query.from)-1).toISOString()],['start',query.from],['end',query.to],['after',new Date(Date.parse(query.to)+1).toISOString()]])await repo.insert(event(id,at));
    expect((await list()).map(e=>e.id)).toEqual(['start','end']);
  });
  it('breaks equal timestamp ties by the IndexedDB primary key, not insertion chronology',async()=>{
    await repo.insert(event('z-first-inserted'));await repo.insert(event('a-second-inserted'));
    expect((await list()).map(e=>e.id)).toEqual(['a-second-inserted','z-first-inserted']);
  });

});

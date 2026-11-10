import {signal} from '@angular/core';
import {TestBed} from '@angular/core/testing';
import {IDBFactory,IDBKeyRange} from 'fake-indexeddb';
import {KanjiStatisticsReader} from './kanji-statistics-reader';
import {KanjiProgressService} from './kanji-progress.service';
import {SessionHistoryService} from './session-history.service';
import {AttemptEventRepository} from './attempt-event.repository';
import {WorkspaceService} from './workspace.service';
import {k4Review,k4Attempt} from './kanji-statistics.test-support';

describe('Kanji K4 workspace reader',()=>{
  beforeEach(()=>{
    localStorage.clear();vi.stubGlobal('indexedDB',new IDBFactory());vi.stubGlobal('IDBKeyRange',IDBKeyRange);
    TestBed.configureTestingModule({providers:[{provide:KanjiProgressService,useValue:{reviewEvents:signal([k4Review()])}},{provide:SessionHistoryService,useValue:{sessions:signal([])}}]});
  });
  afterEach(()=>{TestBed.resetTestingModule();vi.unstubAllGlobals();vi.restoreAllMocks();localStorage.clear();});
  it('reads the real indexed repository independently in A, B and A, without writing',async()=>{
    const reader=TestBed.inject(KanjiStatisticsReader),repo=TestBed.inject(AttemptEventRepository),w=TestBed.inject(WorkspaceService);
    await repo.insert(k4Attempt(k4Review()),'user:a');
    w.activateUser('a');expect((await reader.load(30,new Date('2026-11-10T12:00:00Z'))).value.measured.objective).toBe(1);
    w.activateUser('b');expect((await reader.load(30,new Date('2026-11-10T12:00:00Z'))).value.measured.objective).toBe(0);
    w.activateUser('a');const writes=vi.spyOn(Storage.prototype,'setItem'),insert=vi.spyOn(repo,'insert');
    expect((await reader.load(30,new Date('2026-11-10T12:00:00Z'))).value.measured.objective).toBe(1);
    expect(writes).not.toHaveBeenCalled();expect(insert).not.toHaveBeenCalled();
  });
  it('rejects an old asynchronous A result even after A→B→A',async()=>{
    const reader=TestBed.inject(KanjiStatisticsReader),w=TestBed.inject(WorkspaceService);w.activateUser('a');
    let release!:()=>void;vi.spyOn(reader.repository,'scan').mockImplementation(()=>new Promise<void>(r=>release=r));
    const promise=reader.load(30,new Date());w.activateUser('b');w.activateUser('a');release();
    await expect(promise).rejects.toThrow('Stale Kanji');
  });
});

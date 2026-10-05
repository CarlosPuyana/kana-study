import {TestBed} from '@angular/core/testing';
import {signal} from '@angular/core';
import {WeaknessService, WEAKNESSES_KEY} from './weakness.service';
import {StorageService} from './storage.service';
import {WorkspaceService} from './workspace.service';
import {SyncOutboxService} from './sync-outbox.service';
import {WeaknessRecord} from '../models/weakness.model';

describe('local writing weaknesses', () => {
  it('persists independent writing/listening histories with unchanged scoring and writing defaults',()=>{
    const service=TestBed.inject(WeaknessService);
    service.record('vocabulary','same',true);
    service.record('vocabulary','same',false,'listening');service.record('vocabulary','same',false,'listening');
    expect(service.records()).toHaveLength(2);
    expect(service.records().find(r=>r.activity==='writing')?.score).toBe(0);
    expect(service.records().find(r=>r.activity==='listening')?.score).toBe(4);
    expect(service.items('vocabulary',[{id:'same'}],10)).toEqual([]);
    expect(service.items('vocabulary',[{id:'same'}],10,'listening')).toEqual([{id:'same'}]);
    const reload=TestBed.runInInjectionContext(()=>new WeaknessService());expect(reload.records()).toEqual(service.records());
  });
  let values: Map<string,unknown>;
  let saved: ReturnType<typeof vi.fn>;
  beforeEach(() => {
    values=new Map();saved=vi.fn((key:string,value:unknown)=>values.set(key,value));
    TestBed.configureTestingModule({providers:[{provide:StorageService,useValue:{
      get:(key:string,fallback:unknown)=>values.get(key)??fallback,set:saved,
      rawKey:(key:string)=>key,cloudRevision:signal(0),
    }}]});
  });
  it('records Repeat as one attempt, one failure and two score points', () => {
    const s=TestBed.inject(WeaknessService);s.record('kana','hira-nu',false);
    expect(s.records()[0]).toEqual(expect.objectContaining({attempts:1,failures:1,consecutiveCorrect:0,score:2,activity:'writing'}));
    expect(Number.isFinite(Date.parse(s.records()[0].lastAttemptAt))).toBe(true);
  });
  it('does not mark one isolated Repeat weak, but two failures do', () => {
    const s=TestBed.inject(WeaknessService);s.record('kana','a',false);expect(s.weak()).toEqual([]);
    s.record('kana','a',false);expect(s.weak()[0].score).toBe(4);
  });
  it('reduces score with Correct, retains failure history and removes improved entries from the list', () => {
    const s=TestBed.inject(WeaknessService);s.record('kanji','水',false);s.record('kanji','水',false);
    s.record('kanji','水',true);expect(s.weak()[0].score).toBe(3);
    s.record('kanji','水',true);expect(s.weak()).toEqual([]);
    expect(s.records()[0]).toEqual(expect.objectContaining({attempts:4,failures:2,consecutiveCorrect:2,score:2}));
    s.record('kanji','水',false);expect(s.records()[0].consecutiveCorrect).toBe(0);
  });
  it('clamps score at zero and ten', () => {
    const s=TestBed.inject(WeaknessService);
    for(let i=0;i<8;i++)s.record('kana','a',true);expect(s.records()[0].score).toBe(0);
    for(let i=0;i<8;i++)s.record('kana','a',false);expect(s.records()[0].score).toBe(10);
  });
  it('sorts by score, failure rate, then recency', () => {
    const base={module:'kanji',activity:'writing',attempts:4,failures:2,consecutiveCorrect:0,score:4,lastAttemptAt:'2026-10-01T00:00:00.000Z'};
    values.set(WEAKNESSES_KEY,[{...base,itemId:'recent',lastAttemptAt:'2026-10-02T00:00:00.000Z'},
      {...base,itemId:'older'},{...base,itemId:'rate',attempts:2},{...base,itemId:'score',score:5}]);
    expect(TestBed.inject(WeaknessService).weak().map(r=>r.itemId)).toEqual(['score','rate','recent','older']);
  });
  it('persists only identifiers and counters through StorageService with localOnly', () => {
    const s=TestBed.inject(WeaknessService);s.record('vocabulary','word',false);
    expect(saved).toHaveBeenLastCalledWith(WEAKNESSES_KEY,s.records(),{localOnly:true});
    const reloaded=TestBed.runInInjectionContext(()=>new WeaknessService());expect(reloaded.records()).toEqual(s.records());
    expect(Object.keys(s.records()[0]).sort()).toEqual(['module','activity','itemId','attempts','failures','consecutiveCorrect','score','lastAttemptAt'].sort());
  });
  it('keeps module histories independent even when IDs match', () => {
    const s=TestBed.inject(WeaknessService);s.record('kana','same',false);s.record('kana','same',false);
    s.record('kanji','same',true);s.record('vocabulary','same',false);
    expect(s.records()).toHaveLength(3);expect(s.weak().map(r=>r.module)).toEqual(['kana']);
  });
  it('ignores malformed records and obsolete IDs safely, before applying the result limit', () => {
    const r:WeaknessRecord={module:'kana',activity:'writing',itemId:'obsolete',attempts:2,failures:2,consecutiveCorrect:0,score:10,lastAttemptAt:new Date().toISOString()};
    values.set(WEAKNESSES_KEY,[null,{}, {...r,score:11},{...r,itemId:'bad-date',lastAttemptAt:'invalid'},r,{...r,itemId:'valid',score:4}]);
    const s=TestBed.inject(WeaknessService);expect(s.records()).toHaveLength(2);
    expect(s.items('kana',[{id:'valid'}],1)).toEqual([{id:'valid'}]);
    expect(s.items('kanji',[{id:'valid'}],10)).toEqual([]);
  });
  it('accepts non-array stored data as empty', () => {
    values.set(WEAKNESSES_KEY,{bad:'data'});expect(TestBed.inject(WeaknessService).records()).toEqual([]);
  });
  it('writes to real localStorage without enqueuing cloud work and reloads in the active workspace', () => {
    const active=signal('user:test-weaknesses'),enqueue=vi.fn();
    TestBed.overrideProvider(StorageService,{useFactory:()=>new StorageService()});
    TestBed.overrideProvider(WorkspaceService,{useValue:{active,storageKey:(key:string)=>active()+':'+key}});
    TestBed.overrideProvider(SyncOutboxService,{useValue:{enqueue}});
    const raw='user:test-weaknesses:'+WEAKNESSES_KEY;localStorage.removeItem(raw);
    const s=TestBed.inject(WeaknessService);s.record('kanji','水',false);
    expect(JSON.parse(localStorage.getItem(raw)!)[0].score).toBe(2);expect(enqueue).not.toHaveBeenCalled();
    expect(TestBed.runInInjectionContext(()=>new WeaknessService()).records()).toEqual(s.records());
    TestBed.tick();active.set('guest-test-weaknesses');TestBed.tick();expect(s.records()).toEqual([]);
    active.set('user:test-weaknesses');TestBed.tick();expect(s.records()[0].score).toBe(2);
    localStorage.removeItem(raw);
  });
});

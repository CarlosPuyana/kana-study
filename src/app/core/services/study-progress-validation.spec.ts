import {TestBed} from '@angular/core/testing';
import {ProgressService} from './progress.service';
import {VocabularyProgressService} from './vocabulary-progress.service';
import {KanjiProgressService} from './kanji-progress.service';

describe('incompatible local study progress',()=>{
  beforeEach(()=>{localStorage.clear();vi.stubGlobal('matchMedia',()=>({matches:false,addEventListener:vi.fn(),removeEventListener:vi.fn()}));});
  afterEach(()=>{TestBed.resetTestingModule();vi.unstubAllGlobals();});
  const cases=[
    {key:'kana-study.study-progress.v2',events:'kana-study.review-events.v1',create:()=>TestBed.inject(ProgressService)},
    {key:'kana-study.vocabulary-progress.v1',events:'kana-study.vocabulary-review-events.v1',create:()=>TestBed.inject(VocabularyProgressService)},
    {key:'kana-study.kanji-progress.v1',events:'kana-study.kanji-review-events.v1',create:()=>TestBed.inject(KanjiProgressService)},
  ];
  for(const item of cases){
    for(const value of [null,[],{},'invalid',42,{broken:{}},{broken:{fsrs:{state:'review'}}}])it(item.key+' tolerates '+JSON.stringify(value),()=>{
      localStorage.setItem(item.key,JSON.stringify(value));localStorage.setItem(item.events,'null');
      const service=item.create();expect(service.allProgress()).toEqual({});expect(service.reviewEvents()).toEqual([]);
      expect(service.stats().newCount).toBe(service.stats().total);expect(()=>service.buildRound()).not.toThrow();
      expect(localStorage.getItem(item.key)).toBe(JSON.stringify(value));
    });
    it(item.key+' retains valid/compatible legacy entries without deleting unrelated data',()=>{
      let service=item.create();const unit=service.activeUnits()[0];TestBed.resetTestingModule();
      const valid={...unit,firstSeenAt:'2026-01-01T00:00:00Z',lastSeenAt:'2026-01-01T00:00:00Z',totalAttempts:1,totalFailures:0,totalFirstTrySuccesses:1,lastRating:'good',
        fsrs:{due:'2026-01-02T00:00:00Z',stability:1,difficulty:2,elapsedDays:0,scheduledDays:1,reps:1,lapses:0,state:'review',lastReview:'2026-01-01T00:00:00Z'}};
      const raw=JSON.stringify({[unit.key]:valid,invalid:{...valid,key:'invalid',fsrs:{...valid.fsrs,due:'not-a-date'}}});
      localStorage.setItem(item.key,raw);localStorage.setItem('unrelated','keep');service=item.create();
      expect(Object.keys(service.allProgress())).toEqual([unit.key]);expect(service.get(unit.key)?.fsrs.learningSteps).toBe(0);
      expect(service.stats().memorizedCount).toBe(1);expect(localStorage.getItem(item.key)).toBe(raw);expect(localStorage.getItem('unrelated')).toBe('keep');
      const event={...unit,id:'valid-event',sessionId:'round',rating:'good',reviewedAt:valid.lastSeenAt,fsrsBefore:null,fsrsAfter:valid.fsrs};
      for(const broken of [{...valid,totalAttempts:'1'},{...valid,lastSeenAt:42},{...valid,fsrs:{...valid.fsrs,state:'unexpected'}},{...valid,fsrs:{...valid.fsrs,stability:null}}]){
        TestBed.resetTestingModule();localStorage.setItem(item.key,JSON.stringify({[unit.key]:broken}));
        localStorage.setItem(item.events,JSON.stringify([event,{...event,id:'broken-event',fsrsAfter:{}}]));service=item.create();
        expect(service.allProgress()).toEqual({});expect(service.reviewEvents().map(e=>e.id)).toEqual(['valid-event']);
        expect(()=>service.buildRound()).not.toThrow();
      }
    });
  }
});

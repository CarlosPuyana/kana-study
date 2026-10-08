import { STUDY_MONOTONIC_NOW } from './study-clock';
import { TestBed } from '@angular/core/testing';
import { afterEach,beforeEach,describe,expect,it,vi } from 'vitest';
import { RushAggregateStats,RushSession } from '../models/rush.model';
import { RushMedalService } from './rush-medal.service';
import { LocalRushRepository, RushRepository } from './rush-repository.service';
import { RushSessionService } from './rush-session.service';
class FakeRepository extends RushRepository{sessions=new Map<string,RushSession>();coverage=new Set<string>();async markOpenSessionsInterrupted(){}async createSession(s:RushSession){this.sessions.set(s.id,s)}async saveProgress(s:RushSession,id?:string){this.sessions.set(s.id,s);if(id)this.coverage.add(`${s.module}:${id}`)}async finishSession(s:RushSession){this.sessions.set(s.id,s)}async discardSession(id:string){this.sessions.delete(id)}async getStats():Promise<RushAggregateStats>{return{sessions:[...this.sessions.values()],coverage:[...this.coverage].map(key=>{const [module,contentId]=key.split(':');return{module:module as any,contentId,firstSeenAt:0}})}}}
const fakeMedals={refresh:vi.fn(async()=>[]),newlyUnlocked:()=>[],dismiss:vi.fn(),presentation:vi.fn()};
// Angular's runner shares workers between specs. Leaked fake timers prevent
// fake-indexeddb from dispatching events in subsequent repository tests.
afterEach(() => {
  try {
    TestBed.resetTestingModule();
  } finally {
    vi.clearAllTimers();
    vi.useRealTimers();
  }
});
describe('RushSessionService',()=>{let monotonic=0;let service:RushSessionService;let repo:FakeRepository;beforeEach(()=>{monotonic=0;vi.useFakeTimers();repo=new FakeRepository();TestBed.configureTestingModule({providers:[{provide:STUDY_MONOTONIC_NOW,useValue:()=>monotonic},RushSessionService,{provide:LocalRushRepository,useValue:repo},{provide:RushMedalService,useValue:fakeMedals}]});service=TestBed.inject(RushSessionService)});it('counts only after reveal plus Next and tracks unique content',async()=>{await service.start('kana',[{key:'a1',module:'kana',contentId:'a',questionType:'one'},{key:'a2',module:'kana',contentId:'a',questionType:'two'},{key:'b',module:'kana',contentId:'b',questionType:'one'}]);expect(service.session()!.cardsCompleted).toBe(0);service.reveal();expect(service.session()!.cardsCompleted).toBe(0);await service.next();expect(service.session()!.cardsCompleted).toBe(1);expect(service.session()!.uniqueContentsSeen).toBe(1)});it('does not count a revealed card when exiting',async()=>{await service.start('kanji',[{key:'a',module:'kanji',contentId:'a',questionType:'one'}]);service.reveal();expect((await service.finish())).toBeNull();expect(repo.sessions.size).toBe(0)});it('blocks duplicate Next while persistence is pending',async()=>{let release!:()=>void;repo.saveProgress=vi.fn(async()=>new Promise<void>(resolve=>release=resolve));await service.start('kana',[{key:'a',module:'kana',contentId:'a',questionType:'one'}]);service.reveal();const first=service.next();const second=service.next();expect(repo.saveProgress).toHaveBeenCalledTimes(1);release();await Promise.all([first,second]);expect(service.session()!.cardsCompleted).toBe(1)});it('never modifies normal FSRS progress or review events',async()=>{const keys=['kana-study.study-progress.v2','kana-study.review-events.v1','kana-study.kanji-progress.v1','kana-study.kanji-review-events.v1','kana-study.vocabulary-progress.v1','kana-study.vocabulary-review-events.v1'];for(const key of keys)localStorage.setItem(key,JSON.stringify({sentinel:key}));const before=keys.map(key=>localStorage.getItem(key));await service.start('vocabulary',[{key:'v',module:'vocabulary',contentId:'entry',questionType:'japanese-to-meaning'}]);service.reveal();await service.next();expect(keys.map(key=>localStorage.getItem(key))).toEqual(before)})
 it('finishes with completed-card time, coverage and cycles once, excluding the unfinished card',async()=>{
 await service.start('kana',[{key:'a',module:'kana',contentId:'a',questionType:'one'}]);service.clock.attach();
 for(const seconds of [4,15,7]){monotonic+=seconds*1000;service.reveal();await service.next();}
 monotonic+=60000;const summary=await service.finish();expect(summary).toMatchObject({activeSeconds:21,cardsCompleted:3,uniqueContentsSeen:1,cyclesCompleted:3});
 expect([...repo.sessions.values()][0].activeSeconds).toBe(21);expect(repo.coverage.size).toBe(1);
 monotonic+=60000;expect(service.activeSeconds()).toBe(21);expect(await service.finish()).toEqual(summary);
 service.clear();expect(service.activeSeconds()).toBe(0);
 });
 it('excludes pending saves and retries failed writes without duplicating an appearance',async()=>{
 await service.start('kana',[{key:'a',module:'kana',contentId:'a',questionType:'one'}]);service.clock.attach();monotonic=4000;service.reveal();
 const save=repo.saveProgress.bind(repo);repo.saveProgress=async()=>{monotonic+=60000;throw Error('save');};await service.next();
 expect(service.session()!.cardsCompleted).toBe(0);expect(service.clock.committedSeconds).toBe(0);expect(service.clock.appearanceMilliseconds()).toBe(4000);
 repo.saveProgress=save;monotonic+=3000;await service.next();expect(service.session()!.activeSeconds).toBe(7);expect(service.session()!.cardsCompleted).toBe(1);
 });
});


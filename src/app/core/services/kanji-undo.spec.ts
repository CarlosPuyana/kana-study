import {TestBed} from '@angular/core/testing';
import {IDBFactory,IDBKeyRange} from 'fake-indexeddb';
import {KanjiSessionService} from './kanji-session.service';
import {KanjiMedalService} from './kanji-medal.service';
import {KanjiAnswerStore} from './kanji-answer-store';
import {AttemptEventRepository} from './attempt-event.repository';
import {WorkspaceService} from './workspace.service';
import {KANJI_ROUND_KEY,KanjiRoundRepository} from './kanji-round.repository';
import {KANJI_UNDO_PENDING} from './kanji-undo-store';
import {KANJI_N5} from '../../data/kanji-n5.generated';
import {KanjiProgressService} from './kanji-progress.service';
import {KANJI_QUESTION_TYPES} from '../models/kanji.model';
describe('Kanji durable round and undo',()=>{
  function configure(){TestBed.configureTestingModule({providers:[{provide:KanjiMedalService,useValue:{evaluateUnlocks:()=>[]}}]});return TestBed.inject(KanjiSessionService);}
  beforeEach(()=>{localStorage.clear();vi.stubGlobal('indexedDB',new IDBFactory());vi.stubGlobal('IDBKeyRange',IDBKeyRange);});
  afterEach(()=>{TestBed.resetTestingModule();vi.restoreAllMocks();vi.unstubAllGlobals();});
  async function ledger(){const rows:unknown[]=[];await TestBed.inject(AttemptEventRepository).scan({from:'0000',to:'9999'},e=>{rows.push(e);});return rows;}
  it.each(['good','again','hard'] as const)('restores all snapshots after %s and reuses the round after reload',async rating=>{
    let s=configure();s.start('self-assessment');const before=structuredClone(s.session()),unit=s.currentUnit();s.reveal();await s.rate(rating);expect(s.error()).toBe(false);expect(await ledger()).toHaveLength(1);
    TestBed.resetTestingModule();s=configure();expect(s.start('self-assessment')).toBe(true);expect(s.canUndo()).toBe(true);await s.undo();expect(s.error()).toBe(false);expect(s.session()).toEqual(before);expect(s.currentUnit()).toEqual(unit);expect(await ledger()).toHaveLength(0);
  });
  it('restores objective feedback without retaining an attempt',async()=>{const s=configure();s.start('quick-practice');const before=structuredClone(s.session());await s.answerQuick('wrong');await s.undo();expect(s.session()).toEqual(before);expect(s.feedback()).toBeNull();expect(await ledger()).toEqual([]);});
  it('keeps a failed reverse operation durable and recoverable after reload',async()=>{
    let s=configure();s.start('self-assessment');const before=structuredClone(s.session());s.reveal();await s.rate('good');
    const write=Storage.prototype.setItem,spy=vi.spyOn(Storage.prototype,'setItem').mockImplementation(function(this:Storage,k,v){if(k==='kana-study.kanji-review-events.v1')throw Error('Synthetic quota');write.call(this,k,v);});
    await s.undo();expect(s.error()).toBe(true);expect(localStorage.getItem(KANJI_UNDO_PENDING)).not.toBeNull();spy.mockRestore();TestBed.resetTestingModule();s=configure();s.start('self-assessment');expect(s.error()).toBe(true);await s.retry();expect(s.error()).toBe(false);expect(s.session()).toEqual(before);expect(await ledger()).toEqual([]);
  });
  it.each(['kana-study.kanji-undo-pending.v1','kana-study.kanji-progress.v1','kana-study.weaknesses.v1',KANJI_ROUND_KEY])('retries a reverse write failure at %s without another response',async key=>{
    const s=configure();s.start('self-assessment');s.reveal();await s.rate('again');const before=structuredClone(s.session());
    const write=Storage.prototype.setItem;let fail=true;vi.spyOn(Storage.prototype,'setItem').mockImplementation(function(this:Storage,k,v){if(fail&&k===key)throw Error('Synthetic failure');write.call(this,k,v);});
    await s.undo();expect(s.error()).toBe(true);await s.rate('good');expect(s.session()).toEqual(before);fail=false;await s.retry();expect(s.error()).toBe(false);expect(s.session()!.attempts).toBe(0);expect(await ledger()).toEqual([]);
  });
  it('survives an exception after the round write and verifies the same operation after reload',async()=>{
    let s=configure();s.start('self-assessment');s.reveal();await s.rate('good');const write=Storage.prototype.setItem;
    const fail=vi.spyOn(Storage.prototype,'setItem').mockImplementation(function(this:Storage,k,v){write.call(this,k,v);if(k===KANJI_ROUND_KEY)throw Error('After commit');});
    await s.undo();expect(s.error()).toBe(true);fail.mockRestore();TestBed.resetTestingModule();s=configure();s.start('self-assessment');await s.retry();expect(s.error()).toBe(false);expect(s.session()!.attempts).toBe(0);expect(await ledger()).toEqual([]);
  });
  it('deduplicates undo and fences A→B→A while a retraction is pending',async()=>{
    const s=configure();s.start('self-assessment');s.reveal();await s.rate('good');const first=s.undo(),second=s.undo();const w=TestBed.inject(WorkspaceService);w.activateUser('synthetic-b');w.activateGuest();await Promise.all([first,second]);expect(s.session()).toBeNull();expect(localStorage.getItem(w.storageKey(KANJI_ROUND_KEY,'user:synthetic-b'))).toBeNull();
  });
  it('preserves round snapshots through an exact local backup round trip',()=>{
    const s=configure();s.start('quick-practice');const repo=TestBed.inject(KanjiRoundRepository),before=repo.read(),backup=localStorage.getItem(KANJI_ROUND_KEY)!;
    localStorage.removeItem(KANJI_ROUND_KEY);expect(repo.read()).toBeNull();localStorage.setItem(KANJI_ROUND_KEY,backup);expect(repo.read()).toEqual(before);
  });
  for(const direction of KANJI_QUESTION_TYPES)for(const mode of ['self-assessment','quick-practice'] as const)it(`${direction}/${mode} restores the exact progress, counters and event history`,async()=>{
    const s=configure(),progress=TestBed.inject(KanjiProgressService);vi.spyOn(progress,'buildRound').mockReturnValue(KANJI_N5.slice(0,2).map(k=>({kanjiId:k.id,questionType:direction,key:`kanji:${k.id}:${direction}`})));
    s.start(mode);const before=structuredClone(s.session()),unit=s.currentUnit(),raw=localStorage.getItem('kana-study.kanji-progress.v1');
    if(mode==='self-assessment'){s.reveal();await s.rate('again');}else await s.answerQuick('wrong');await s.undo();expect(s.error()).toBe(false);expect(s.session()).toEqual(before);expect(s.currentUnit()).toEqual(unit);expect(JSON.parse(localStorage.getItem('kana-study.kanji-progress.v1')??'{}')).toEqual(JSON.parse(raw??'{}'));expect(await ledger()).toEqual([]);
  });
  it('retries after a failure reported after removing the reverse journal',async()=>{
    const s=configure();s.start('self-assessment');s.reveal();await s.rate('good');const remove=Storage.prototype.removeItem,spy=vi.spyOn(Storage.prototype,'removeItem').mockImplementation(function(this:Storage,k){remove.call(this,k);if(k===KANJI_UNDO_PENDING)throw Error('Post commit');});
    await s.undo();expect(s.error()).toBe(true);spy.mockRestore();await s.retry();expect(s.error()).toBe(false);expect(s.session()!.attempts).toBe(0);
  });
  it('keeps the operation pending when post-commit reading fails',async()=>{
    const s=configure();s.start('self-assessment');s.reveal();await s.rate('good');const get=Storage.prototype.getItem,write=Storage.prototype.setItem;let committed=false;
    vi.spyOn(Storage.prototype,'setItem').mockImplementation(function(this:Storage,k,v){write.call(this,k,v);if(k===KANJI_ROUND_KEY)committed=true;});const fail=vi.spyOn(Storage.prototype,'getItem').mockImplementation(function(this:Storage,k){if(committed&&k===KANJI_ROUND_KEY)throw Error('Read denied');return get.call(this,k);});
    await s.undo();expect(s.error()).toBe(true);fail.mockRestore();await s.retry();expect(s.error()).toBe(false);expect(await ledger()).toEqual([]);
  });
  it('does not reopen the final normal response or offer Undo in voluntary practice',async()=>{
    const s=configure(),progress=TestBed.inject(KanjiProgressService),k=KANJI_N5[0],unit={kanjiId:k.id,key:`kanji:${k.id}:kanji-to-meaning`,questionType:'kanji-to-meaning' as const};vi.spyOn(progress,'buildRound').mockReturnValue([unit]);
    s.start('self-assessment');s.reveal();await s.rate('good');expect(s.completed()).toBe(true);expect(s.canUndo()).toBe(false);await s.undo();expect(s.completed()).toBe(true);expect(s.start('self-assessment')).toBe(false);s.startPractice([unit]);expect(s.canUndo()).toBe(false);
  });
  it('reverts an internal reinforcement without changing the earlier FSRS review',async()=>{
    const s=configure(),p=TestBed.inject(KanjiProgressService),k=KANJI_N5[0];vi.spyOn(p,'buildRound').mockReturnValue([{kanjiId:k.id,key:`kanji:${k.id}:kanji-to-meaning`,questionType:'kanji-to-meaning'}]);s.start('self-assessment');s.reveal();await s.rate('again');
    const before=structuredClone(s.session()),progress=localStorage.getItem('kana-study.kanji-progress.v1'),events=localStorage.getItem('kana-study.kanji-review-events.v1');s.reveal();await s.rate('hard');await s.undo();
    expect(s.session()).toEqual(before);expect(localStorage.getItem('kana-study.kanji-progress.v1')).toBe(progress);expect(localStorage.getItem('kana-study.kanji-review-events.v1')).toBe(events);expect(await ledger()).toHaveLength(1);
  });
});

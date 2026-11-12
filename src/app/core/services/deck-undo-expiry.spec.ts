import {TestBed} from '@angular/core/testing';
import {IDBFactory,IDBKeyRange} from 'fake-indexeddb';
import {DeckStudyService} from './deck-study.service';
import {DeckUndoPendingService} from './deck-undo-pending.service';
import {DeckSettingsService} from './deck-settings.service';
import {DECK_SCHEDULER_ENABLE_FUZZ} from './deck-scheduler.service';
describe('previously persisted Undo survives midnight',()=>{
 afterEach(()=>{TestBed.resetTestingModule();vi.useRealTimers();vi.unstubAllGlobals();localStorage.clear();});
 it('can inspect a confirmed old Undo instead of permanently rejecting its marker',async()=>{
  localStorage.clear();vi.stubGlobal('indexedDB',new IDBFactory());vi.stubGlobal('IDBKeyRange',IDBKeyRange);vi.useFakeTimers({toFake:['Date']});const now=new Date('2026-11-10T18:00:00Z');vi.setSystemTime(now);
  const deck={id:'japanese-1500',cardCount:1,contentType:'japanese-word' as const,settings:{desiredRetention:.9,newCardsPerDay:1,newCardOrder:'before-reviews' as const}};
  TestBed.configureTestingModule({providers:[{provide:DECK_SCHEDULER_ENABLE_FUZZ,useValue:false},{provide:DeckSettingsService,useValue:{settingsFor:()=>deck.settings}}]});
  const study=TestBed.inject(DeckStudyService),pending=TestBed.inject(DeckUndoPendingService);await study.startSession(deck,now);const choice=study.chooseNext(await study.snapshot(deck,[{id:'a',order:0}],now),deck,{debt:0}).choice!;
  const event=await study.rate(deck,choice,study.preview(deck,choice,now),'again',100,now);pending.begin(event,false);await study.undo(event);vi.setSystemTime(new Date('2026-11-11T18:00:00Z'));
  expect(()=>pending.read(deck.id)).not.toThrow();expect(pending.read(deck.id)?.event).toEqual(event);
 });
});

import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { DeckCardHistory } from './deck-card-history';
import { TranslationService } from '../../../core/services/translation.service';
import { DeckReviewEvent } from '../../../core/models/deck-study.model';
describe('Card history display',()=>{
 beforeEach(()=>TestBed.configureTestingModule({imports:[DeckCardHistory],providers:[{provide:TranslationService,useValue:{language:signal('es'),t:(k:string,v?:Record<string,unknown>)=>k+(v?JSON.stringify(v):'')}}]}));
 afterEach(()=>TestBed.resetTestingModule());
 function create(events:DeckReviewEvent[]=[]){const f=TestBed.createComponent(DeckCardHistory);for(const[k,v]of Object.entries({deckId:'d',entryId:'a',now:new Date('2026-11-05T11:00:00Z'),events}))f.componentRef.setInput(k,v);f.detectChanges();return f;}
 it('shows an honest empty state with no fabricated chart',()=>{
  const f=create();expect(f.nativeElement.querySelector('.empty-history')).not.toBeNull();expect(f.nativeElement.querySelector('figure')).toBeNull();
 });
 it('keeps an incomplete old record visible without inventing its interval or chart',()=>{
  const f=create([{id:'old',deckId:'d',entryId:'a',rating:'good',reviewedAt:Date.parse('2026-01-01T00:00:00Z'),stateBefore:2} as DeckReviewEvent]);
  expect(f.nativeElement.querySelector('.history-note')).not.toBeNull();expect(f.nativeElement.querySelectorAll('.timeline>li')).toHaveLength(1);
  expect(f.nativeElement.querySelector('figure')).toBeNull();expect(f.nativeElement.textContent).toContain('anki.results.history.unavailable');
 });
 it('renders at most twenty events and navigates to older ones without losing exact dates',()=>{
  const events=Array.from({length:45},(_,i)=>({id:String(i),deckId:'d',entryId:'a',reviewedAt:Date.parse('2026-10-01T00:00:00Z')+i*86400000,dueAfter:Date.parse('2026-10-01T00:00:00Z')+i*86400000+600000,rating:i%2?'good':'again',stateBefore:i?2:0,stateAfter:i%2?2:3} as DeckReviewEvent));
  const f=create(events),p=f.componentInstance;expect(f.nativeElement.querySelectorAll('.timeline>li')).toHaveLength(20);expect(p.chart()[0].ordinal).toBe(26);
  (f.nativeElement.querySelectorAll('.pagination button')[1] as HTMLButtonElement).click();f.detectChanges();expect(p.page()[0].ordinal).toBe(25);expect(p.chart()[0].ordinal).toBe(6);
  p.offset.set(40);f.detectChanges();expect(f.nativeElement.querySelectorAll('.timeline>li')).toHaveLength(5);expect(p.date(Date.parse('2026-11-05T23:01:00Z'))).toContain('6 nov');
  f.componentRef.setInput('events',events.slice(0,3));f.detectChanges();expect(p.pageOffset()).toBe(0);expect(p.page()).toHaveLength(3);
 });
 it('calculates current R at the displayed instant with the scheduler UTC convention, without changing recorded R',()=>{
  const f=create(),p=f.componentInstance,at=Date.parse('2026-11-04T23:59:00Z');
  const recorded={id:'old',deckId:'d',entryId:'a',rating:'good',reviewedAt:at,retrievabilityBefore:1} as DeckReviewEvent;
  f.componentRef.setInput('events',[recorded]);
  f.componentRef.setInput('progress',{deckId:'d',entryId:'a',card:{state:2,lastReview:at,stability:30,difficulty:5,reps:3,lapses:1,due:at+86400000,scheduledDays:1}});
  f.componentRef.setInput('now',new Date('2026-11-05T00:01:00Z'));f.detectChanges();
  expect(p.retrievability()).toBe(.99505387);expect(p.retention()).toBeNull();expect(recorded.retrievabilityBefore).toBe(1);
 });
});

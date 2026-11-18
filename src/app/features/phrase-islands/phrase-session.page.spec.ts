import { PHRASE_ISLANDS_CATALOG } from '../../data/phrase-islands/phrase-islands-catalog';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { Component, input, signal } from '@angular/core';
import { PageHeader } from '../../shared/components/page-header/page-header';
import { TranslationService } from '../../core/services/translation.service';
import * as copy from '../../../assets/i18n/phrase-islands.generated';
@Component({selector:'app-page-header',template:''}) class HeaderStub {readonly titleKey=input('');readonly backRoute=input('');readonly backQueryParams=input<unknown>(null);}
import { PhraseSessionPage } from './phrase-session.page';
import { PHRASE_AUDIO_FACTORY } from '../../core/services/phrase-audio.service';
import { WorkspaceService } from '../../core/services/workspace.service';

describe('Phrase sessions: temporary sequencing and cancellation',()=>{
 let audios:any[],workspace:ReturnType<typeof signal<number>>;
 function create(mode='listen',topics='everyday,everyday,conversation'){
  audios=[];workspace=signal(0);
  TestBed.configureTestingModule({imports:[PhraseSessionPage],providers:[provideRouter([]),{provide:TranslationService,useValue:{useStudyCopy:()=>{},t:(k:string)=>copy.es[k]??k}},
   {provide:ActivatedRoute,useValue:{snapshot:{data:{mode}},queryParamMap:of(convertToParamMap({topics}))}},
   {provide:WorkspaceService,useValue:{activationRevision:workspace}},
   {provide:PHRASE_AUDIO_FACTORY,useValue:()=>{const a={play:vi.fn().mockResolvedValue(undefined),pause:vi.fn(),load:vi.fn(),removeAttribute:vi.fn(),onended:null,onpause:null,onplay:null,onerror:null};audios.push(a);return a;}}
  ]}).overrideComponent(PhraseSessionPage,{remove:{imports:[PageHeader]},add:{imports:[HeaderStub]}});
  const f=TestBed.createComponent(PhraseSessionPage);f.detectChanges();return f;
 }
 afterEach(()=>{TestBed.resetTestingModule();vi.useRealTimers();vi.restoreAllMocks();});
 it('filters and deduplicates topics without audio or storage writes',()=>{
  const f=create();const write=vi.spyOn(Storage.prototype,'setItem');expect(f.componentInstance.phrases()).toHaveLength(PHRASE_ISLANDS_CATALOG.filter(p=>['everyday','conversation'].includes(p.topicId)).length);expect(audios).toHaveLength(0);f.componentInstance.move(1);expect(write).not.toHaveBeenCalled();
 });
 it('advances only after ended, repeats clips and cancels gaps on stop',async()=>{
  vi.useFakeTimers();const c=create().componentInstance;c.repeats.set(2);c.start();await Promise.resolve();expect(audios).toHaveLength(1);
  vi.advanceTimersByTime(20000);expect(c.index()).toBe(0);audios[0].onended();vi.advanceTimersByTime(1000);expect(audios).toHaveLength(2);audios[1].onended();vi.advanceTimersByTime(1000);expect(c.index()).toBe(1);audios[2].onended();c.stop();vi.runAllTimers();expect(audios).toHaveLength(3);
 });
 it('pauses and resumes a remaining gap and finishes at the final clip',()=>{
  vi.useFakeTimers();const c=create().componentInstance;c.start();audios[0].onended();vi.advanceTimersByTime(400);c.pause();vi.advanceTimersByTime(5000);expect(c.index()).toBe(0);c.resume();vi.advanceTimersByTime(600);expect(c.index()).toBe(1);c.stop();c.index.set(c.phrases().length-1);c.start();audios.at(-1).onended();expect(c.finished()).toBe(true);vi.runAllTimers();expect(c.audio.state()).toBe('idle');
 });
 it('shadowing allows imitation time but never advances automatically',()=>{
  vi.useFakeTimers();const c=create('shadowing').componentInstance;c.start();audios[0].onended();expect(c.waiting()).toBe(true);vi.advanceTimersByTime(3000);expect(c.running()).toBe(false);expect(c.index()).toBe(0);c.start();expect(audios).toHaveLength(2);c.move(1);expect(c.index()).toBe(1);
 });
 it('recall has no answer in DOM and cannot play before reveal',()=>{
  const f=create('recall'),c=f.componentInstance;c.start();expect(audios).toHaveLength(0);expect(f.nativeElement.textContent).not.toContain(c.current().japanese);expect(f.nativeElement.querySelector('ruby')).toBeNull();c.revealed.set(true);f.detectChanges();expect(f.nativeElement.querySelector('ruby')).not.toBeNull();c.start();expect(audios).toHaveLength(1);c.move(1);expect(c.revealed()).toBe(false);
 });
 it('workspace activation discards session and cancels delayed audio',()=>{
  vi.useFakeTimers();const f=create(),c=f.componentInstance;c.start();const ended=audios[0].onended;ended();workspace.set(1);f.detectChanges();vi.runAllTimers();expect(c.phrases()).toHaveLength(0);expect(audios).toHaveLength(1);expect(c.audio.state()).toBe('idle');
 });
 it('rapid starts and destruction leave no old callbacks or scheduled playback',()=>{
  vi.useFakeTimers();const f=create(),c=f.componentInstance;c.start();const old=audios[0].onended;c.start();old();expect(c.waiting()).toBe(false);audios[1].onended();f.destroy();vi.runAllTimers();expect(audios).toHaveLength(2);expect(c.audio.state()).toBe('idle');
 });
 it('invalid links show an empty session',()=>{const f=create('listen','unknown');expect(f.componentInstance.phrases()).toHaveLength(0);expect(f.nativeElement.querySelector('.session-card')).toBeNull();});
 it('RUSH rejects hidden and repeated ratings and advances to an unassessed phrase',()=>{
  const f=create('recall'),c=f.componentInstance;c.evaluate(true);expect(c.recall.evaluated()).toHaveLength(0);c.revealed.set(true);c.evaluate(false);c.evaluate(true);expect(c.recall.evaluated()).toHaveLength(1);expect(c.recall.round().answers[c.phrases()[0].id]?.known).toBe(false);expect(c.index()).toBe(1);expect(c.revealed()).toBe(false);
 });
 it('RUSH arrows require reveal, ignore repeat/modifiers and preserve editable controls',()=>{
  const f=create('recall'),c=f.componentInstance;const right=()=>new KeyboardEvent('keydown',{key:'ArrowRight',cancelable:true});c.recallKey(right());expect(c.index()).toBe(0);c.revealed.set(true);
  c.recallKey(new KeyboardEvent('keydown',{key:'ArrowRight',repeat:true}));c.recallKey(new KeyboardEvent('keydown',{key:'ArrowRight',ctrlKey:true}));
  const select=document.createElement('select');const container=f.nativeElement as HTMLElement;container.append(select);select.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true}));expect(c.recall.evaluated()).toHaveLength(0);
  const event=right();c.recallKey(event);expect(event.defaultPrevented).toBe(true);expect(c.recall.correct()).toBe(1);c.revealed.set(true);c.recallKey(new KeyboardEvent('keydown',{key:'ArrowLeft'}));expect(c.recall.failedIds()).toHaveLength(1);
 });
 it('RUSH navigation cannot overwrite a prior rating; undo restores reveal and stops audio',()=>{
  const f=create('recall'),c=f.componentInstance;c.revealed.set(true);c.start();c.evaluate(true);expect(audios[0].pause).toHaveBeenCalled();c.move(-1);c.revealed.set(true);c.evaluate(false);expect(c.recall.correct()).toBe(1);c.undoEvaluation();expect(c.index()).toBe(0);expect(c.revealed()).toBe(true);expect(c.recall.evaluated()).toHaveLength(0);expect(c.audio.state()).toBe('idle');
 });
 it('RUSH fills skipped positions before summarizing and repeats only failed IDs',()=>{
  const f=create('recall','everyday'),c=f.componentInstance;const total=c.phrases().length,lastId=c.phrases()[total-1].id;c.move(total-1);c.revealed.set(true);c.evaluate(false);expect(c.index()).toBe(0);
  for(let i=0;i<total-1;i++){c.revealed.set(true);c.evaluate(true);}
  expect(c.recall.complete()).toBe(true);f.detectChanges();expect(f.nativeElement.querySelector('.round-summary')).not.toBeNull();expect(c.recall.evaluated()).toHaveLength(total);
  c.repeatFailed();expect(c.phrases()).toHaveLength(1);expect(c.phrases()[0].id).toBe(lastId);expect(c.revealed()).toBe(false);expect(c.recall.round().number).toBe(2);c.revealed.set(true);c.evaluate(true);expect(c.recall.complete()).toBe(true);expect(c.recall.correct()).toBe(1);
 });
 it('RUSH allows textual self-report after media failure and clears answers on workspace/destroy',async()=>{
  const f=create('recall'),c=f.componentInstance;c.revealed.set(true);c.start();await Promise.resolve();audios[0].onerror();f.detectChanges();c.evaluate(false);expect(c.recall.failedIds()).toHaveLength(1);workspace.set(1);f.detectChanges();expect(c.recall.rounds()).toEqual([]);expect(c.phrases()).toHaveLength(0);f.destroy();expect(c.recall.canUndo()).toBe(false);
 });

});

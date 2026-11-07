import {TestBed} from '@angular/core/testing';
import {signal,inject} from '@angular/core';
import {VocabularyLessonSummary} from './vocabulary-lesson-summary';
import {VocabularyStatistics} from './vocabulary-statistics';
import {VocabularyWordHistory} from './vocabulary-word-history';
import {VocabularyStatsReader} from '../../../core/services/vocabulary-stats-reader';
import {WorkspaceService} from '../../../core/services/workspace.service';
import {TranslationService} from '../../../core/services/translation.service';
import {historicalAccumulator} from '../../../core/services/attempt-analytics';
import {VOCABULARY_N5} from '../../../data/vocabulary-n5.generated';
const NOW=new Date('2026-11-07T11:00:00.000Z');
const local=()=>({progress:{},events:[],lessons:[],invalid:false,pending:false});
const result=(n:number)=>{const all=historicalAccumulator(7,NOW).finish(),first=historicalAccumulator(7,NOW).finish();all.total.attempts=n;return{all,first,unknown:0};};
describe('Vocabulary stats component scope and pagination',()=>{
 beforeEach(()=>{TestBed.resetTestingModule();localStorage.clear();});afterEach(()=>{TestBed.resetTestingModule();vi.restoreAllMocks();});
 const i18n={t:(key:string)=>key,language:signal('es'),useStudyCopy:()=>{}};
 it('clears old results and rejects late responses after workspace A→B→A',async()=>{
  const resolvers:((v:ReturnType<typeof result>)=>void)[]=[];
  TestBed.configureTestingModule({imports:[VocabularyStatistics],providers:[{provide:TranslationService,useValue:i18n},{provide:VocabularyStatsReader,useFactory:()=>({workspace:inject(WorkspaceService),repository:{revision:signal(0)},snapshot:local,evolution:()=>new Promise(resolve=>resolvers.push(resolve))})}]});
  const workspace=TestBed.inject(WorkspaceService),f=TestBed.createComponent(VocabularyStatistics);f.detectChanges();expect(resolvers).toHaveLength(1);workspace.activateUser('B');f.detectChanges();expect(f.componentInstance.result()).toBeNull();workspace.activateGuest();f.detectChanges();expect(resolvers).toHaveLength(3);resolvers[0](result(99));resolvers[1](result(55));await Promise.resolve();expect(f.componentInstance.result()).toBeNull();resolvers[2](result(3));await f.whenStable();f.detectChanges();expect(f.componentInstance.history()!.total.attempts).toBe(3);
 });
 it('reports a failed query without an invented zero evolution',async()=>{
  TestBed.configureTestingModule({imports:[VocabularyStatistics],providers:[{provide:TranslationService,useValue:i18n},{provide:VocabularyStatsReader,useFactory:()=>({workspace:inject(WorkspaceService),repository:{revision:signal(0)},snapshot:()=>({...local(),pending:true}),evolution:()=>Promise.reject(Error('offline'))})}]});const f=TestBed.createComponent(VocabularyStatistics);f.detectChanges();await vi.waitFor(()=>expect(f.componentInstance.error()).toBe(true));f.detectChanges();expect(f.componentInstance.history()).toBeUndefined();expect(f.nativeElement.querySelector('[role=alert]').textContent).toContain('readError');expect(f.nativeElement.querySelector('app-attempt-history-chart')).toBeNull();expect(f.nativeElement.textContent).toContain('stats.pending');
 });
 it('renders at most twenty real reviews, changes direction and keeps practice in its own section',async()=>{
  const entry=VOCABULARY_N5[0],key=`vocab:${entry.id}:japanese-to-meaning`,events=Array.from({length:23},(_,i)=>({id:'review'+i,sessionId:'s'+i,key,entryId:entry.id,questionType:'japanese-to-meaning',rating:'good',reviewedAt:new Date(NOW.getTime()-i*86400000).toISOString(),fsrsBefore:null,fsrsAfter:{due:NOW.toISOString(),lastReview:NOW.toISOString()}}));
  TestBed.configureTestingModule({imports:[VocabularyWordHistory],providers:[{provide:TranslationService,useValue:i18n},{provide:VocabularyStatsReader,useFactory:()=>({workspace:inject(WorkspaceService),repository:{revision:signal(0)},snapshot:()=>({...local(),events}),attempts:()=>Promise.resolve({rows:[],next:null})})}]});const f=TestBed.createComponent(VocabularyWordHistory);f.componentRef.setInput('entry',entry);f.detectChanges();await f.whenStable();f.detectChanges();expect(f.nativeElement.querySelectorAll('tbody tr')).toHaveLength(20);const next=f.nativeElement.querySelector('section.panel .pager button:last-child') as HTMLButtonElement;next.click();f.detectChanges();expect(f.nativeElement.querySelectorAll('tbody tr')).toHaveLength(3);const select=f.nativeElement.querySelector('.history-direction') as HTMLSelectElement;select.value='meaning-to-japanese';select.dispatchEvent(new Event('change'));f.detectChanges();await f.whenStable();f.detectChanges();expect(f.componentInstance.history()).toEqual([]);expect(f.componentInstance.offset()).toBe(0);expect(f.nativeElement.querySelectorAll('tbody tr')).toHaveLength(0);expect(f.nativeElement.querySelector('.practice-history')).not.toBeNull();
 });
 it('refreshes pending summary metadata after confirmed IndexedDB writes without mutating study data',()=>{let pending=true;const revision=signal(0),entry=VOCABULARY_N5[0],key=`vocab:${entry.id}:japanese-to-meaning`;TestBed.configureTestingModule({imports:[VocabularyLessonSummary],providers:[{provide:TranslationService,useValue:i18n},{provide:VocabularyStatsReader,useValue:{repository:{revision},snapshot:()=>({...local(),pending})}}]});const write=vi.spyOn(Storage.prototype,'setItem'),f=TestBed.createComponent(VocabularyLessonSummary);f.componentRef.setInput('session',{id:'s',startedAt:NOW.toISOString(),completedAt:NOW.toISOString(),mode:'self-assessment',sessionSize:1,attempts:2,units:[{key,entryId:entry.id,questionType:'japanese-to-meaning'}],items:[{studyKey:key,attempts:2,appearances:2,initialRating:'good',resolved:true,needsPractice:false,consecutiveCorrect:2}]});f.detectChanges();expect(f.nativeElement.querySelector('[role=status]')).not.toBeNull();pending=false;revision.update(n=>n+1);f.detectChanges();expect(f.nativeElement.querySelector('[role=status]')).toBeNull();expect(write).not.toHaveBeenCalled();});

});

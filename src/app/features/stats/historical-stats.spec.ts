import {TestBed} from '@angular/core/testing';
import {IDBFactory,IDBKeyRange} from 'fake-indexeddb';
import {HistoricalStats} from './historical-stats';
import {AttemptEventRepository} from '../../core/services/attempt-event.repository';
import {AttemptRecordingService} from '../../core/services/attempt-recording.service';
import {WorkspaceService} from '../../core/services/workspace.service';
import {SettingsService} from '../../core/services/settings.service';
import {AttemptHistoryChart} from '../../shared/components/attempt-history-chart/attempt-history-chart';
import {historicalAccumulator} from '../../core/services/attempt-analytics';
describe('Stats V2 UI filters, loading, recovery and accessible charts',()=>{
  beforeEach(()=>{TestBed.resetTestingModule();localStorage.clear();vi.stubGlobal('indexedDB',new IDBFactory());vi.stubGlobal('IDBKeyRange',IDBKeyRange);vi.stubGlobal('matchMedia',vi.fn(()=>({matches:false,addEventListener:vi.fn(),removeEventListener:vi.fn()})));TestBed.configureTestingModule({});});
  afterEach(async()=>{await TestBed.inject(AttemptRecordingService).settle();TestBed.resetTestingModule();vi.unstubAllGlobals();vi.restoreAllMocks();});
  async function render(){const f=TestBed.createComponent(HistoricalStats);await f.whenStable();f.detectChanges();await vi.waitFor(()=>expect(f.componentInstance.loading()).toBe(false));f.detectChanges();return f;}
  async function updated(f:ReturnType<typeof TestBed.createComponent<HistoricalStats>>){await f.whenStable();f.detectChanges();await vi.waitFor(()=>expect(f.componentInstance.loading()).toBe(false));f.detectChanges();}
  it('renders honest empty data and accessible zero-activity charts with keyboard filters',async()=>{
    const f=await render();expect(f.nativeElement.querySelector('.empty-history')).not.toBeNull();expect(f.componentInstance.accuracy()).toBeNull();expect(f.nativeElement.querySelectorAll('svg[role="img"][aria-label]')).toHaveLength(2);expect(f.nativeElement.querySelectorAll('select')).toHaveLength(3);expect(f.nativeElement.textContent).not.toContain('statsV2.');
    f.componentInstance.period.set(90);await updated(f);expect(f.componentInstance.history()!.days).toHaveLength(90);expect(f.nativeElement.querySelector('svg .line').getAttribute('d')).toBe('');
  });
  it('refreshes after a confirmed attempt, filters real results and clears immediately on workspace switch',async()=>{
    const f=await render(),recorder=TestBed.inject(AttemptRecordingService),workspace=TestBed.inject(WorkspaceService);
    recorder.begin('kanji','writing').record('一',{source:'self',rating:'hard'});await recorder.settle();await updated(f);expect(f.componentInstance.history()!.total.hard).toBe(1);expect(f.componentInstance.accuracy()).toBeNull();
    f.componentInstance.module.set('kana');await updated(f);expect(f.componentInstance.history()!.total.attempts).toBe(0);
    f.componentInstance.module.set('');workspace.activateUser('other');await updated(f);expect(f.componentInstance.history()!.total.attempts).toBe(0);
    workspace.activateGuest();await updated(f);expect(f.componentInstance.history()!.total.attempts).toBe(1);
  });
  it('shows a recoverable read error without deleting history',async()=>{
    const repo=TestBed.inject(AttemptEventRepository),spy=vi.spyOn(repo,'scan').mockRejectedValueOnce(Error('unavailable'));
    const f=await render();expect(f.componentInstance.error()).toBe(true);expect(f.nativeElement.querySelector('[role="alert"]')).not.toBeNull();await f.componentInstance.retry();await updated(f);expect(f.componentInstance.error()).toBe(false);expect(spy).toHaveBeenCalledTimes(2);
  });
  for(const lang of ['es','en','ca'] as const)it(`translates all controls in ${lang}`,async()=>{
    TestBed.inject(SettingsService).setLanguage(lang);const f=await render();expect(f.nativeElement.textContent).not.toMatch(/statsV2\.|\{\{/);
  });
  it('breaks the precision line at missing days instead of treating gaps as incorrect answers',()=>{
    const a=historicalAccumulator(7,new Date('2026-10-09T12:00:00Z'));
    for(const day of ['2026-10-03','2026-10-05'])a.accept({version:1,id:day,occurredAt:day+'T12:00:00.000Z',module:'kana',activity:'learn',itemId:'a',result:{source:'objective',correct:true}});
    const f=TestBed.createComponent(AttemptHistoryChart);f.componentRef.setInput('days',a.finish().days);f.componentRef.setInput('accuracy',true);f.detectChanges();expect(f.componentInstance.line().match(/M/g)).toHaveLength(2);expect(f.componentInstance.points()).toHaveLength(2);
  });
});

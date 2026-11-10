import {signal} from '@angular/core';
import {TestBed} from '@angular/core/testing';
import {provideRouter} from '@angular/router';
import {KanjiStatsPage} from './kanji-stats.page';
import {KanjiProgressService} from '../../core/services/kanji-progress.service';
import {SessionHistoryService} from '../../core/services/session-history.service';
import {AttemptEventRepository} from '../../core/services/attempt-event.repository';
import {WorkspaceService} from '../../core/services/workspace.service';
import {SettingsService} from '../../core/services/settings.service';
import {isolatedKanjiAvailability} from '../../core/services/kanji-availability.test-support';
import {NOW,k4Progress,k4Review,k4Attempt} from '../../core/services/kanji-statistics.test-support';
import {KanjiReviewEvent,KanjiStudyProgress} from '../../core/models/kanji-study.model';

describe('Kanji K4 statistics presentation',()=>{
  const progress={allProgress:signal<Record<string,KanjiStudyProgress>>({}),reviewEvents:signal<readonly KanjiReviewEvent[]>([]),availabilityTime:signal<number|null>(NOW.getTime())};
  const scan=vi.fn(async(_query:unknown,visit:(e:ReturnType<typeof k4Attempt>)=>void)=>{for(const e of progress.reviewEvents())visit(k4Attempt(e));});
  beforeEach(()=>{
    localStorage.clear();progress.allProgress.set({});progress.reviewEvents.set([]);scan.mockClear();
    vi.stubGlobal('matchMedia',vi.fn(()=>({matches:false,addEventListener:vi.fn(),removeEventListener:vi.fn()})));
    TestBed.configureTestingModule({providers:[provideRouter([]),isolatedKanjiAvailability,
      {provide:KanjiProgressService,useValue:progress},{provide:SessionHistoryService,useValue:{sessions:signal([])}},
      {provide:AttemptEventRepository,useValue:{scan,revision:signal(0)}}]});
  });
  afterEach(()=>{TestBed.resetTestingModule();vi.unstubAllGlobals();vi.restoreAllMocks();localStorage.clear();});
  async function render(){const f=TestBed.createComponent(KanjiStatsPage);await f.whenStable();f.detectChanges();await vi.waitFor(()=>expect(f.componentInstance.loading()).toBe(false));f.detectChanges();return f;}
  it.each(['es','en','ca'] as const)('renders honest empty data and complete translations in %s',async lang=>{
    TestBed.inject(SettingsService).setLanguage(lang);const f=await render();
    expect(f.componentInstance.overview().new).toBe(80);expect(f.nativeElement.querySelector('[data-testid="empty-history"]')).not.toBeNull();
    expect(f.nativeElement.querySelector('app-attempt-history-chart')).toBeNull();
    expect(f.nativeElement.textContent).not.toMatch(/kanji\.stats\.|statsV2\.|\{\{/);
    expect(f.componentInstance.activity().seconds).toBeNull();
  });
  it('shows partial data, links difficult kanji to their detail, and reloads without study writes',async()=>{
    const p=k4Progress();progress.allProgress.set({[p.key]:p});progress.reviewEvents.set([k4Review(0,'again'),k4Review(1,'again'),k4Review(2,'good')]);
    const f=await render();expect(f.componentInstance.overview().learning).toBe(1);
    expect(f.nativeElement.querySelector('[data-testid="normal-reviews"]').textContent).toBe('3');
    expect(f.nativeElement.querySelector('.difficult a').getAttribute('href')).toContain('/kanji/all?selected=');
    expect(f.nativeElement.querySelector('svg[role="img"][aria-label]')).not.toBeNull();
    const writes=vi.spyOn(Storage.prototype,'setItem');f.componentInstance.refresh();await f.whenStable();f.detectChanges();
    expect(writes).not.toHaveBeenCalled();expect(f.componentInstance.history()!.measured.objective).toBe(3);
  });
  it('shows a recoverable query error and retries without manufacturing empty history',async()=>{
    scan.mockRejectedValueOnce(Error('unavailable'));const f=await render();
    expect(f.nativeElement.querySelector('[role="alert"]')).not.toBeNull();expect(f.componentInstance.history()).toBeNull();
    f.componentInstance.refresh();await f.whenStable();f.detectChanges();expect(f.componentInstance.error()).toBe(false);
  });
  it('clears displayed history immediately on workspace activation and ignores a late result',async()=>{
    progress.reviewEvents.set([k4Review()]);const f=await render(),w=TestBed.inject(WorkspaceService);
    expect(f.componentInstance.history()!.total.reviews).toBe(1);
    let release!:()=>void;scan.mockImplementationOnce(()=>new Promise<void>(r=>release=r));
    f.componentInstance.refresh();f.detectChanges();TestBed.tick();
    w.activateUser('other');expect(f.componentInstance.history()).toBeNull();release();
    progress.reviewEvents.set([]);await f.whenStable();f.detectChanges();
    expect(f.componentInstance.history()!.total.reviews).toBe(0);
  });
});

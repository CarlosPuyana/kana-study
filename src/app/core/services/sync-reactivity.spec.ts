import { TestBed } from '@angular/core/testing';
import { StorageService } from './storage.service';
import { WorkspaceService } from './workspace.service';
import { SyncOutboxService } from './sync-outbox.service';
import { ProgressService } from './progress.service';
import { KanjiProgressService } from './kanji-progress.service';
import { VocabularyProgressService } from './vocabulary-progress.service';
import { FlagProgressService } from './flag-progress.service';
import { SettingsService } from './settings.service';
import { DeckSettingsService } from './deck-settings.service';
import { FlagSettingsService } from './flag-settings.service';
import { KanjiSettingsService } from './kanji-settings.service';
import { VocabularySettingsService } from './vocabulary-settings.service';
import { STUDY_DECKS } from '../../data/study-decks';

describe('sync hydration updates existing services without reloading',()=>{
  const enqueue=vi.fn(async()=>{});
  beforeEach(()=>{localStorage.clear();enqueue.mockClear();vi.stubGlobal('matchMedia',()=>({matches:false,addEventListener(){},removeEventListener(){}}));
    TestBed.configureTestingModule({providers:[{provide:SyncOutboxService,useValue:{enqueue}}]});TestBed.inject(WorkspaceService).activateUser('alice');});
  afterEach(()=>{TestBed.resetTestingModule();vi.unstubAllGlobals();});
  for(const [service,key] of [[ProgressService,'kana-study.study-progress.v2'],[KanjiProgressService,'kana-study.kanji-progress.v1'],
    [VocabularyProgressService,'kana-study.vocabulary-progress.v1'],[FlagProgressService,'kana-study.flags-progress.v1']] as const){
    it(`${service.name}: remote FSRS refreshes signals and account changes cannot carry old reviews`,()=>{
      const progress=TestBed.inject(service as typeof ProgressService) as any,storage=TestBed.inject(StorageService),workspace=TestBed.inject(WorkspaceService);
      const unit=progress.activeUnits()[0];progress.recordReview(unit,'good',true,'s');
      const remote=structuredClone(progress.allProgress());remote[unit.key].totalAttempts=5;storage.setFromCloud(key,remote);
      expect(progress.allProgress()[unit.key].totalAttempts).toBe(5);workspace.activateUser('bob');expect(progress.allProgress()).toEqual({});
      progress.recordReview(unit,'good',true,'b');expect(progress.allProgress()[unit.key].totalAttempts).toBe(1);expect(progress.reviewEvents()).toHaveLength(1);
    });
  }
  it('settings hydrate without automatically writing the stale/default state back to cloud',()=>{
    const settings=TestBed.inject(SettingsService),storage=TestBed.inject(StorageService);
    TestBed.tick();expect(enqueue).not.toHaveBeenCalled();storage.setFromCloud('kana-study.settings.v1',{language:'ca',theme:'light'});
    expect(settings.language()).toBe('ca');TestBed.tick();expect(enqueue).not.toHaveBeenCalled();
    TestBed.inject(WorkspaceService).activateUser('bob');expect(settings.language()).toBe('es');
  });
  it('deck settings hydrate and do not leak into the next account save',()=>{
    const decks=TestBed.inject(DeckSettingsService),storage=TestBed.inject(StorageService),deck=STUDY_DECKS[0];
    storage.setFromCloud('kana-study.deck-settings.v1',{[deck.id]:{...deck.settings,newCardsPerDay:42}});
    expect(decks.settingsFor(deck).newCardsPerDay).toBe(42);TestBed.inject(WorkspaceService).activateUser('bob');
    expect(decks.settingsFor(deck)).toEqual(deck.settings);
  });
  for(const [service,key] of [[FlagSettingsService,'kana-study.flags-selection.v1'],[KanjiSettingsService,'kana-study.kanji-selection.v1'],[VocabularySettingsService,'kana-study.vocabulary-selection.v1']] as const){
    it(`${service.name}: remote selection and workspace are reactive`,()=>{
      const settings=TestBed.inject(service as typeof FlagSettingsService) as any,storage=TestBed.inject(StorageService),baseline=settings.selection();
      storage.setFromCloud(key,{...baseline,questionTypes:[]});expect(settings.selection().questionTypes).toEqual([]);
      TestBed.inject(WorkspaceService).activateUser('bob');expect(settings.selection()).toEqual(baseline);
    });
  }
});

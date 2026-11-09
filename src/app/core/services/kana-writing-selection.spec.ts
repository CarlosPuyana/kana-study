import {signal} from '@angular/core';
import {ActivatedRoute,convertToParamMap,Router} from '@angular/router';
import {Location} from '@angular/common';
import {SelectionPage} from '../../features/selection/selection.page';
import {TranslationService} from './translation.service';
import {TestBed} from '@angular/core/testing';
import {ALL_KANA} from '../../data/kana';
import {SettingsService} from './settings.service';
import {ProgressService} from './progress.service';
import {LearningSessionService} from './learning-session.service';
import {WorkspaceService} from './workspace.service';
import {SyncOutboxService} from './sync-outbox.service';
import {AttemptRecordingService} from './attempt-recording.service';
import {WeaknessService} from './weakness.service';
import {DailyLearningService} from './daily-learning.service';
import {MedalService} from './medal.service';
import {SessionHistoryService} from './session-history.service';
import {QuestionType} from '../models/progress.model';

describe('Kana direction and workspace contract',()=>{
  const categories={hiragana:{basic:true,dakuten:false,handakuten:false,combination:false},katakana:{basic:false,dakuten:false,handakuten:false,combination:false}};
  beforeEach(()=>{localStorage.clear();vi.stubGlobal('matchMedia',()=>({matches:false,addEventListener:vi.fn(),removeEventListener:vi.fn()}));TestBed.configureTestingModule({providers:[
    {provide:SyncOutboxService,useValue:{enqueue:async()=>{}}},
    {provide:AttemptRecordingService,useValue:{begin:()=>({record:vi.fn()})}},
    {provide:WeaknessService,useValue:{recordLearn:vi.fn()}},
    {provide:DailyLearningService,useValue:{isCompletedToday:()=>false,refresh:vi.fn()}},
    {provide:MedalService,useValue:{evaluateUnlocks:()=>[]}},
    {provide:SessionHistoryService,useValue:{record:vi.fn()}},
  ]});});
  afterEach(()=>{TestBed.resetTestingModule();localStorage.clear();vi.unstubAllGlobals();});
  for(const types of [['kana-to-romaji'],['romaji-to-kana'],['kana-to-romaji','romaji-to-kana']] as QuestionType[][]){
    it(`persists ${types.join('/')} and builds only selected unique units`,()=>{
      const settings=TestBed.inject(SettingsService);settings.saveLearningSelection({categories,questionTypes:types});
      const progress=TestBed.inject(ProgressService),session=TestBed.inject(LearningSessionService);
      expect(new Set(progress.activeUnits().map(u=>u.questionType))).toEqual(new Set(types));
      expect(progress.activeUnits()).toHaveLength(ALL_KANA.filter(k=>k.type==='hiragana'&&k.variant==='basic').length*types.length);
      expect(new Set(progress.activeUnits().map(u=>u.key)).size).toBe(progress.activeUnits().length);
      expect(JSON.parse(localStorage.getItem('kana-study.settings.v1')!).learning.questionTypes).toEqual(types);
      expect(session.start('self-assessment')).toBe(true);expect(session.session()!.units.every(u=>types.includes(u.questionType))).toBe(true);
    });
  }
  it('keeps an active snapshot after a selection change; the next session uses the saved selection',()=>{
    const settings=TestBed.inject(SettingsService),session=TestBed.inject(LearningSessionService);
    settings.saveLearningSelection({categories,questionTypes:['romaji-to-kana']});session.start('self-assessment');
    const original=session.session();settings.saveLearningSelection({categories,questionTypes:['kana-to-romaji']});
    expect(session.session()).toBe(original);expect(session.currentUnit()!.questionType).toBe('romaji-to-kana');
    session.clear();session.start('self-assessment');expect(session.currentUnit()!.questionType).toBe('kana-to-romaji');
  });
  it('does not expose or rate an earlier workspace session, even before Angular flush and on A→B→A',()=>{
    const workspace=TestBed.inject(WorkspaceService),settings=TestBed.inject(SettingsService),session=TestBed.inject(LearningSessionService);
    workspace.activateUser('qa-a');settings.saveLearningSelection({categories,questionTypes:['romaji-to-kana']});
    session.start('self-assessment');session.reveal();session.rate('good');session.reveal();
    const saved=localStorage.getItem(workspace.storageKey('kana-study.study-progress.v2'));
    workspace.activateUser('qa-b');settings.saveLearningSelection({categories,questionTypes:['kana-to-romaji']});
    expect(session.session()).toBeNull();session.rate('good');expect(localStorage.getItem(workspace.storageKey('kana-study.study-progress.v2'))).toBeNull();
    workspace.activateUser('qa-a');expect(session.session()).toBeNull();expect(settings.selection().questionTypes).toEqual(['romaji-to-kana']);
    expect(localStorage.getItem(workspace.storageKey('kana-study.study-progress.v2'))).toBe(saved);
    workspace.activateUser('qa-b');session.start('self-assessment');expect(session.currentUnit()!.questionType).toBe('kana-to-romaji');
    workspace.activateUser('qa-a');workspace.activateUser('qa-b');expect(session.session()).toBeNull();
  });
  it('migrates legacy boolean question preferences without enabling writing',()=>{
    localStorage.setItem('kana-study.settings.v1',JSON.stringify({learning:{content:{hiragana:true},variants:{basic:true},questionTypes:{'kana-to-romaji':true,'romaji-to-kana':false}}}));
    expect(TestBed.inject(SettingsService).selection().questionTypes).toEqual(['kana-to-romaji']);
  });
  it('does not enable writing when the Nora colour theme is selected',()=>{
    const settings=TestBed.inject(SettingsService);settings.saveLearningSelection({categories,questionTypes:['kana-to-romaji']});settings.setTheme('nora');
    const session=TestBed.inject(LearningSessionService);session.start('self-assessment');expect(session.session()!.units.every(u=>u.questionType==='kana-to-romaji')).toBe(true);
  });
  it('keeps focused practice independent from normal selection without writing an FSRS review',()=>{
    const settings=TestBed.inject(SettingsService),session=TestBed.inject(LearningSessionService),kana=ALL_KANA[0];
    settings.saveLearningSelection({categories,questionTypes:['kana-to-romaji']});
    expect(session.startPractice([{key:`${kana.id}:romaji-to-kana`,kanaId:kana.id,questionType:'romaji-to-kana'}],'self-assessment')).toBe(true);
    expect(session.isPractice()).toBe(true);expect(session.currentUnit()!.questionType).toBe('romaji-to-kana');session.reveal();session.rate('good');
    expect(localStorage.getItem('kana-study.study-progress.v2')).toBeNull();expect(settings.selection().questionTypes).toEqual(['kana-to-romaji']);
  });
  it('does not save a selection draft from another workspace, including a switch before change detection',()=>{
    TestBed.configureTestingModule({providers:[{provide:ActivatedRoute,useValue:{snapshot:{queryParamMap:convertToParamMap({})}}},{provide:Router,useValue:{navigateByUrl:vi.fn()}},{provide:Location,useValue:{getState:()=>({})}},{provide:TranslationService,useValue:{t:(k:string)=>k,language:signal('es')}}]});
    const workspace=TestBed.inject(WorkspaceService),settings=TestBed.inject(SettingsService);
    workspace.activateUser('qa-a');settings.saveLearningSelection({categories,questionTypes:['romaji-to-kana']});
    const fixture=TestBed.createComponent(SelectionPage);expect(fixture.componentInstance.draft().questionTypes).toEqual(['romaji-to-kana']);
    workspace.activateUser('qa-b');fixture.componentInstance.save();
    expect(settings.selection().questionTypes).toEqual(['kana-to-romaji']);
    workspace.activateUser('qa-a');expect(settings.selection().questionTypes).toEqual(['romaji-to-kana']);fixture.destroy();
  });
});

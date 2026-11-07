import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { VOCABULARY_N5 } from '../../data/vocabulary-n5.generated';
import { RushSessionService } from '../../core/services/rush-session.service';
import { RushSettingsService } from '../../core/services/rush-settings.service';
import { VocabularySettingsService } from '../../core/services/vocabulary-settings.service';
import { VocabularySessionRush } from '../../core/services/vocabulary-session-rush';
import { WorkspaceService } from '../../core/services/workspace.service';
import { TranslationService } from '../../core/services/translation.service';
import { VocabularyRushPage } from './vocabulary-rush.page';

describe('Session-specific vocabulary RUSH page',()=>{
  const start=vi.fn(async(..._args:Parameters<RushSessionService['start']>)=>true),navigate=vi.fn(),initialize=vi.fn(()=>({selectedContentIds:['nouns'],questionTypes:['japanese-to-meaning']}));
  const route={snapshot:{queryParamMap:convertToParamMap({})}};
  beforeEach(()=>{TestBed.resetTestingModule();localStorage.clear();vi.clearAllMocks();route.snapshot.queryParamMap=convertToParamMap({});TestBed.configureTestingModule({providers:[
    {provide:ActivatedRoute,useValue:route},{provide:Router,useValue:{navigateByUrl:navigate}},
    {provide:RushSessionService,useValue:{start,clear:vi.fn(),revealed:signal(false),loading:signal(false),saving:signal(false),currentUnit:()=>null}},
    {provide:RushSettingsService,useValue:{getOrInitialize:initialize}},
    {provide:VocabularySettingsService,useValue:{selection:()=>({categories:{nouns:true},questionTypes:['japanese-to-meaning']})}},
    {provide:TranslationService,useValue:{t:(key:string)=>key,language:()=> 'es'}}
  ]});});afterEach(()=>TestBed.resetTestingModule());
  const page=()=>TestBed.runInInjectionContext(()=>new VocabularyRushPage());
  function selected(){const words=VOCABULARY_N5.slice(0,2);const units=words.map(w=>({key:`vocab:${w.id}:japanese-to-meaning`,entryId:w.id,questionType:'japanese-to-meaning' as const}));const token=TestBed.inject(VocabularySessionRush).prepare(words.map(w=>w.id),units)!;route.snapshot.queryParamMap=convertToParamMap({sessionRush:token});return words;}
  it('uses only the exact two handed-off words and never reads or overwrites normal RUSH filters',async()=>{const words=selected(),p=page();await p.ngOnInit();expect(start.mock.calls[0][0]).toBe('vocabulary');expect(start.mock.calls[0][1].map((u:{contentId:string})=>u.contentId)).toEqual(words.map(w=>w.id));expect(initialize).not.toHaveBeenCalled();p.home();expect(navigate).toHaveBeenLastCalledWith('/vocabulary/play');});
  it('keeps normal category/direction initialization intact',async()=>{await page().ngOnInit();expect(initialize).toHaveBeenCalledOnce();expect(start).toHaveBeenCalledOnce();});
  it('rejects stale/forged handoffs without falling back to a random pool',async()=>{route.snapshot.queryParamMap=convertToParamMap({sessionRush:'forged'});await page().ngOnInit();expect(start).not.toHaveBeenCalled();expect(navigate).toHaveBeenCalledWith('/vocabulary');});
  it('fences delayed session startup with the captured workspace epoch',async()=>{selected();await page().ngOnInit();const guard=start.mock.calls[0][3]!;expect(guard()).toBe(true);const workspace=TestBed.inject(WorkspaceService);workspace.activateUser('B');workspace.activateGuest();expect(guard()).toBe(false);});
});

import {TestBed} from '@angular/core/testing';
import {ConjugationSelectionService,CONJUGATION_SELECTION_KEY,normalizeConjugationSelection} from './conjugation-selection.service';
import {WorkspaceService} from './workspace.service';
import {StorageService} from './storage.service';
import {SyncOutboxService} from './sync-outbox.service';
import {CONJUGATION_CATEGORY_IDS as ids} from '../models/conjugations.model';
describe('Conjugation local selection',()=>{
  const initial=ids.filter(id=>['verb-negative','verb-past','verb-negative-past','verb-te','adjective-negative','adjective-past','adjective-negative-past','adjective-te','adjective-adverbial'].includes(id));
  const enqueue=vi.fn(async()=>{});
  beforeEach(()=>{localStorage.clear();enqueue.mockClear();TestBed.configureTestingModule({providers:[{provide:SyncOutboxService,useValue:{enqueue}}]});});
  afterEach(()=>{vi.restoreAllMocks();TestBed.resetTestingModule();localStorage.clear();});
  it('normalizes duplicates, unknown identifiers and malformed input in canonical order',()=>{
    expect(normalizeConjugationSelection({categoryIds:[ids[3],ids[0],ids[3],'unknown',null,7]})).toEqual([ids[0],ids[3]]);
    for(const value of [null,{},[],{categoryIds:'invalid'}])expect(normalizeConjugationSelection(value)).toEqual([]);
  });
  it('selects one/multiple, deselects and selects/clears the whole catalog durably',()=>{
    const service=TestBed.inject(ConjugationSelectionService);service.setCategory(ids[3],true);service.setCategory(ids[0],true);expect(service.ids()).toEqual([ids[0],ids[3]]);
    service.setCategory(ids[3],false);expect(service.ids()).toEqual([ids[0]]);service.selectAll();expect(service.ids()).toEqual(initial);
    expect(JSON.parse(localStorage.getItem(CONJUGATION_SELECTION_KEY)!)).toEqual({version:6,categoryIds:initial,unlockedIds:initial,autoKana:true,adjectiveTypes:Object.fromEntries(initial.filter(id=>id.startsWith('adjective-')).map(id=>[id,'both']))});service.clear();expect(service.ids()).toEqual([]);
    expect(enqueue).not.toHaveBeenCalled();
  });
  it('restores selection in a new injector and never touches other study preferences',()=>{
    const protectedValues={'kana-study.settings.v1':'{"language":"ca"}','kana-study.rush.kana-settings.v1':'{"questionTypes":["kana-to-romaji"]}','kana-study.vocabulary-selection.v1':'{"lessonSize":15}'};
    for(const [key,value]of Object.entries(protectedValues))localStorage.setItem(key,value);
    TestBed.inject(ConjugationSelectionService).setCategory(ids[0],true);TestBed.resetTestingModule();TestBed.configureTestingModule({providers:[{provide:SyncOutboxService,useValue:{enqueue}}]});
    expect(TestBed.inject(ConjugationSelectionService).ids()).toEqual([ids[0]]);for(const [key,value]of Object.entries(protectedValues))expect(localStorage.getItem(key)).toBe(value);
  });
  it('isolates Guest/A/B/A synchronously, including a return without reading B',()=>{
    const workspace=TestBed.inject(WorkspaceService),service=TestBed.inject(ConjugationSelectionService);
    service.setCategory(ids[0],true);workspace.activateUser('qa-a');expect(service.ids()).toEqual([]);service.setCategory(ids[1],true);
    workspace.activateUser('qa-b');expect(service.ids()).toEqual([]);service.setCategory(ids[2],true);workspace.activateUser('qa-a');expect(service.ids()).toEqual([ids[1]]);
    workspace.activateUser('qa-b');workspace.activateUser('qa-a');expect(service.ids()).toEqual([ids[1]]);workspace.activateGuest();expect(service.ids()).toEqual([ids[0]]);expect(enqueue).not.toHaveBeenCalled();
  });
  it('returns an immutable selection contract copy, not a session or progress event',()=>{
    const service=TestBed.inject(ConjugationSelectionService);expect(service.intent()).toBeNull();service.setUnlocked(ids[4],true);service.setCategory(ids[4],true);
    expect(service.intent()).toEqual({mode:'mixed',categoryIds:[ids[4]]});expect(service.intent(ids[7])).toBeNull();expect(service.ids()).toEqual([ids[4]]);
    expect(Object.keys(localStorage).filter(key=>/progress|review|session|attempt|rush/.test(key))).toEqual([]);
  });
  it('keeps the saved selection after quota failure and isolates the error on account change',()=>{
    const service=TestBed.inject(ConjugationSelectionService),storage=TestBed.inject(StorageService);service.setCategory(ids[0],true);
    const spy=vi.spyOn(storage,'set').mockImplementation(()=>{throw new DOMException('QA quota','QuotaExceededError');});service.setCategory(ids[1],true);expect(service.ids()).toEqual([ids[0]]);expect(service.saveError()).toBe(true);
    TestBed.inject(WorkspaceService).activateUser('qa-b');expect(service.saveError()).toBe(false);spy.mockRestore();
  });
});

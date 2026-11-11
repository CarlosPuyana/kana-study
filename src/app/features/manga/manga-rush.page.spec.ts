import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { IDBObjectStore } from 'fake-indexeddb';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { MangaRushPage } from './manga-rush.page';
import { MangaVocabularyIndexService } from '../../core/services/manga-vocabulary-index.service';
import { LexicalKnowledgeProjectionService } from '../../core/services/lexical-knowledge-projection.service';
import { CustomDeckRepository } from '../../core/services/custom-deck.repository';
import { SettingsService } from '../../core/services/settings.service';
import { WorkspaceService } from '../../core/services/workspace.service';
import { rushIndex, rushWord } from '../../core/services/manga-rush.fixture';

describe('Manga RUSH page: cache-only launch, fresh unlinked words and disposable sessions',()=>{
  const words=[rushWord(),rushWord('うん','うん',2,1),rushWord('いる','いる',3,1,'unclassified')];
  let params:BehaviorSubject<ReturnType<typeof convertToParamMap>>;
  let cached:ReturnType<typeof vi.fn>,knowledge:ReturnType<typeof vi.fn>;
  beforeEach(()=>{
    TestBed.resetTestingModule();localStorage.clear();params=new BehaviorSubject(convertToParamMap({volumeId:'v1'}));
    cached=vi.fn(async(id:string)=>({...rushIndex(words,id),volumeTitle:id}));knowledge=vi.fn(async()=>({units:[]}));
    TestBed.configureTestingModule({imports:[MangaRushPage],providers:[provideRouter([]),
      {provide:SettingsService,useValue:{language:signal('es')}},
      {provide:ActivatedRoute,useValue:{paramMap:params}},
      {provide:MangaVocabularyIndexService,useValue:{cached}},
      {provide:LexicalKnowledgeProjectionService,useValue:{cacheKey:signal('fixture'),load:knowledge}},
      {provide:CustomDeckRepository,useValue:{mangaConfirmations:async()=>[]}}]});
  });
  afterEach(()=>{TestBed.resetTestingModule();vi.restoreAllMocks();localStorage.clear();});
  async function settle(fixture: ReturnType<typeof TestBed.createComponent<MangaRushPage>>){
    await vi.waitFor(()=>{fixture.detectChanges();expect(fixture.componentInstance.loading()).toBe(false);expect(fixture.componentInstance.knowledgeLoading()).toBe(false);});
    fixture.detectChanges();
  }
  async function render(){const fixture=TestBed.createComponent(MangaRushPage);fixture.detectChanges();await settle(fixture);return fixture;}
  it('starts with unlinked vocabulary, hides all senses, self-reports, and makes zero learning writes',async()=>{
    const fixture=await render(),page=fixture.componentInstance;
    expect(page.pool()?.selectedCards).toBe(2);expect(page.words().every(w=>w.state==='unlinked')).toBe(true);
    expect(fixture.nativeElement.textContent).not.toContain('mangaM2.');
    const put=vi.spyOn(IDBObjectStore.prototype,'put'),add=vi.spyOn(IDBObjectStore.prototype,'add'),storage=vi.spyOn(Storage.prototype,'setItem');
    const original=JSON.stringify(words);
    page.start();fixture.detectChanges();expect(fixture.nativeElement.querySelector('.answer')).toBeNull();expect(page.rush.current()?.occurrence.surface).toBe('猫');
    page.reveal();fixture.detectChanges();expect(fixture.nativeElement.querySelector('.meanings').textContent).toContain('gato');
    expect(fixture.nativeElement.querySelector('.meanings').textContent).toContain('felino');
    expect(fixture.nativeElement.querySelector('.context').textContent).toBe('猫。');
    page.rate(true);page.rate(true);expect(page.rush.session()?.answers).toHaveLength(1);
    page.reveal();page.rate(false);fixture.detectChanges();expect(page.rush.summary()).toMatchObject({total:2,knew:1,didNotKnow:1});
    page.another();fixture.detectChanges();expect(page.rush.session()).toBeNull();
    expect(put).not.toHaveBeenCalled();expect(add).not.toHaveBeenCalled();expect(storage).not.toHaveBeenCalled();expect(JSON.stringify(words)).toBe(original);
    fixture.destroy();
  });
  it('clears synchronously fenced scope on volume/workspace changes and never restores a session after disposal',async()=>{
    const fixture=await render(),page=fixture.componentInstance;
    page.start();page.reveal();params.next(convertToParamMap({volumeId:'v2'}));page.rate(true);
    fixture.detectChanges();await settle(fixture);expect(page.rush.session()).toBeNull();expect(page.index()?.volumeId).toBe('v2');
    page.start();page.reveal();TestBed.inject(WorkspaceService).activateUser('other');page.rate(true);expect(page.rush.session()).toBeNull();
    fixture.detectChanges();await settle(fixture);
    page.start();expect(page.rush.current()).not.toBeNull();fixture.destroy();expect(page.rush.session()).toBeNull();
    const fresh=await render();expect(fresh.componentInstance.rush.session()).toBeNull();fresh.destroy();
  });
  it('offers analysis instead of rebuilding OCR when a cache is absent or stale',async()=>{
    cached.mockResolvedValue(null);const fixture=await render();
    expect(fixture.componentInstance.unavailable()).toBe(true);expect(fixture.nativeElement.textContent).toContain('RUSH no recorre el OCR');
    expect(fixture.nativeElement.querySelector('form')).toBeNull();fixture.componentInstance.start();expect(fixture.componentInstance.rush.session()).toBeNull();fixture.destroy();
  });
  it('supports reveal and numeric ratings without repeat, modifier, modal or editable conflicts',async()=>{
    const fixture=await render(),page=fixture.componentInstance;page.start();
    const key=(value:string,extra:KeyboardEventInit={})=>page.key(new KeyboardEvent('keydown',{key:value,...extra}));
    (document.activeElement as HTMLElement)?.blur();
    key('2');expect(page.rush.session()?.answers).toHaveLength(0);
    key('Enter');expect(page.rush.session()?.revealed).toBe(true);
    key('2',{repeat:true});key('1',{ctrlKey:true});expect(page.rush.session()?.answers).toHaveLength(0);
    key('2');expect(page.rush.session()?.answers).toHaveLength(1);key('1');expect(page.rush.session()?.answers).toHaveLength(1);
    const input=document.createElement('input');document.body.append(input);input.focus();key(' ');expect(page.rush.session()?.revealed).toBe(false);input.remove();
    const modal=document.createElement('dialog');modal.setAttribute('open','');document.body.append(modal);key('Enter');expect(page.rush.session()?.revealed).toBe(false);modal.remove();
    key(' ');key('1');expect(page.rush.summary()?.total).toBe(2);key('Enter');key('2');expect(page.rush.summary()?.total).toBe(2);fixture.destroy();
  });
  it('still practices All after a failed knowledge read, and shows empty known/learning filters honestly',async()=>{
    knowledge.mockRejectedValue(Error('unavailable'));const fixture=await render(),page=fixture.componentInstance;
    expect(page.knowledgeFailed()).toBe(true);page.update('knowledge','familiar');expect(page.pool()?.availableCards).toBe(0);
    page.start();expect(page.rush.session()).toBeNull();page.update('knowledge','all');page.start();expect(page.rush.current()).not.toBeNull();fixture.destroy();
  });
});

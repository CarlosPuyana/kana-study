import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { MangaVolumeVocabularyPage } from './manga-volume-vocabulary.page';
import { MangaVolumeVocabularyService } from '../../core/services/manga-volume-vocabulary.service';
import { CustomDeckRepository } from '../../core/services/custom-deck.repository';
import { CUSTOM_DECKS_ENABLED } from '../../core/services/custom-deck-gates';
import { MANGA_DECK_ASSISTED_ENABLED } from '../../core/services/manga-deck-gate';
import { TranslationService } from '../../core/services/translation.service';
import { WorkspaceService } from '../../core/services/workspace.service';
import { VolumeVocabulary } from '../../core/services/manga-volume-vocabulary';
import { customCard, customDeck } from '../../core/services/custom-deck.fixture';

describe('Volume vocabulary UI',()=>{
  const gate=signal(true),revision=signal(0);let data:VolumeVocabulary;
  const service={load:vi.fn()};
  beforeEach(async()=>{
    TestBed.resetTestingModule();localStorage.clear();gate.set(true);revision.set(0);service.load.mockReset();
    const card=await customCard('md-ui','a');
    data={incomplete:false,entries:[{card,deck:customDeck('md-ui'),classification:{deckId:'md-ui',cardId:'a',archived:false,state:'pending',eventIds:[],stability:null,reasons:[]},
      confirmations:[{id:'confirmation',confirmedAt:'2026-10-23T12:00:00Z',source:{fragment:'猫がいる。',pageNumber:2,volumeTitle:'QA'},confirmedMeaning:'gato',meaningLanguage:'es'} as never]}]};
    service.load.mockImplementation(async()=>data);
    await TestBed.configureTestingModule({imports:[MangaVolumeVocabularyPage],providers:[provideRouter([]),
      {provide:ActivatedRoute,useValue:{paramMap:new BehaviorSubject(convertToParamMap({volumeId:'v'}))}},
      {provide:MangaVolumeVocabularyService,useValue:service},
      {provide:CustomDeckRepository,useValue:{catalogRevision:revision,progressRevision:signal(0)}},
      {provide:CUSTOM_DECKS_ENABLED,useValue:gate},{provide:MANGA_DECK_ASSISTED_ENABLED,useValue:signal(true)},
      {provide:TranslationService,useValue:{t:(k:string)=>k}}]}).compileComponents();
  });
  afterEach(()=>{TestBed.resetTestingModule();vi.restoreAllMocks();});
  async function render(){const f=TestBed.createComponent(MangaVolumeVocabularyPage);f.detectChanges();await f.whenStable();f.detectChanges();return f;}
  it('renders only card counts, semantic details, escaped text and an actual study link',async()=>{
    const f=await render(),el:HTMLElement=f.nativeElement;
    expect(el.querySelectorAll('.cards li')).toHaveLength(1);expect(el.querySelector('.study')?.getAttribute('href')).toBe('/anki/md-ui/study');
    expect(el.textContent).toContain('gato <script>');expect(el.querySelector('script')).toBeNull();expect(el.textContent).not.toContain('%');
    expect(el.querySelector('details blockquote')?.textContent).toContain('猫がいる。');expect(el.querySelector('time')?.getAttribute('datetime')).toBe('2026-10-23T12:00:00Z');
    f.componentInstance.search.set('not present');f.detectChanges();expect(el.querySelectorAll('.cards li')).toHaveLength(0);
  });
  it('keeps archived cards visible without offering an unusable study link',async()=>{
    data={...data,entries:data.entries.map(e=>({...e,deck:{...e.deck,status:'archived'}}))};const f=await render();
    expect(f.nativeElement.querySelector('.study')).toBeNull();expect(f.nativeElement.textContent).toContain('mangaVocab.archived');
  });
  it('counts all four states before filtering instead of presenting search results as the volume total',async()=>{
    data={incomplete:false,entries:(['known','learning','pending','indeterminate'] as const).map((state,i)=>({...data.entries[0],card:{...data.entries[0].card,id:'c'+i},classification:{...data.entries[0].classification,state}}))};
    const f=await render();expect(f.componentInstance.counts()).toEqual({known:1,learning:1,pending:1,indeterminate:1});
    f.componentInstance.state.set('known');f.detectChanges();expect(f.componentInstance.entries()).toHaveLength(1);
    expect(f.componentInstance.result()?.entries).toHaveLength(4);expect(f.componentInstance.counts()['pending']).toBe(1);
  });
  it('shows an incomplete association and an empty volume explicitly',async()=>{
    data={entries:[],incomplete:true};const f=await render();expect(f.nativeElement.textContent).toContain('mangaVocab.incomplete');expect(f.nativeElement.textContent).toContain('mangaVocab.empty');
  });
  it('gates off the service as well as the UI',async()=>{
    gate.set(false);const f=await render();expect(service.load).not.toHaveBeenCalled();expect(f.nativeElement.textContent).toContain('mangaVocab.unavailable');
  });
  it('two confirmed cards with the same writing remain separate and request a textual query only',async()=>{
    data={...data,entries:[data.entries[0],{...data.entries[0],card:{...data.entries[0].card,id:'other',lexicalIdentity:{...data.entries[0].card.lexicalIdentity,key:'different-identity'}}}]};
    const f=await render();expect(f.nativeElement.querySelectorAll('.cards li')).toHaveLength(2);
    f.componentInstance.explore('猫');expect(f.componentInstance.ocrQuery()).toBe('猫');expect(f.componentInstance.result()?.entries).toHaveLength(2);
    f.componentInstance.explore('unconfirmed');expect(f.componentInstance.ocrQuery()).toBe('猫');
  });
  it('discards a delayed response after switching workspace and reloads after a revision',async()=>{
    let finish!:(r:VolumeVocabulary)=>void;service.load.mockImplementationOnce(()=>new Promise<VolumeVocabulary>(r=>finish=r));
    const f=TestBed.createComponent(MangaVolumeVocabularyPage);f.detectChanges();
    TestBed.inject(WorkspaceService).activateUser('other');f.detectChanges();await f.whenStable();finish({entries:[],incomplete:true});
    await f.whenStable();f.detectChanges();expect(f.componentInstance.result()?.incomplete).toBe(false);
    revision.update(n=>n+1);f.detectChanges();await f.whenStable();expect(service.load).toHaveBeenCalledTimes(3);
  });
});

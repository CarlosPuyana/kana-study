import 'fake-indexeddb/auto';
import {IDBFactory} from 'fake-indexeddb';
import {TestBed} from '@angular/core/testing';
import {provideRouter} from '@angular/router';
import {MangaStudyPage} from './manga-study.page';
import {DictionaryPopup} from '../../shared/components/dictionary-popup/dictionary-popup';
import {MangaStudyIntegrationService} from '../../core/services/manga-study-integration.service';
import {MangaStudySavedRepository} from '../../core/services/manga-study-saved.repository';
import {MangaSourceService} from '../../core/services/manga-source.service';
import {MangaContextService} from '../../core/services/manga-context.service';
import {JapaneseAudioService,JAPANESE_AUDIO_FACTORY} from '../../core/services/japanese-audio.service';
import {SettingsService} from '../../core/services/settings.service';
import {WeaknessService} from '../../core/services/weakness.service';
import {ProgressService} from '../../core/services/progress.service';
import {VocabularyProgressService} from '../../core/services/vocabulary-progress.service';
import {KanjiProgressService} from '../../core/services/kanji-progress.service';
import {DailyLearningService} from '../../core/services/daily-learning.service';
import {SessionHistoryService} from '../../core/services/session-history.service';
import {SpacedRepetitionService} from '../../core/services/spaced-repetition.service';
import {DictionaryLookup} from '../../core/models/dictionary.model';
import {WorkspaceService} from '../../core/services/workspace.service';

function lookup(expression='食べる',reading='たべる'):DictionaryLookup{return {installed:true,query:expression,surface:expression==='食べる'?'食べなかった':expression,baseForm:expression,terms:[{id:'fixture',dictionaryId:'fixture',expression,reading,glossaries:['meaning'],definitionTags:'',rules:'',score:0,sequence:1,termTags:''}]};}
describe('Manga saved UI',()=>{
  const volume=vi.fn(async()=>({complete:true,pageCount:20}));
  const factory=vi.fn(()=>({play:async()=>{},pause:vi.fn(),load:vi.fn(),removeAttribute:vi.fn(),src:'',preload:'',onended:null,onerror:null}));
  beforeEach(()=>{
    localStorage.clear();volume.mockReset();volume.mockResolvedValue({complete:true,pageCount:20});factory.mockClear();vi.stubGlobal('indexedDB',new IDBFactory());
    vi.stubGlobal('matchMedia',vi.fn(()=>({matches:false,addEventListener:vi.fn(),removeEventListener:vi.fn()})));
    TestBed.configureTestingModule({providers:[provideRouter([]),{provide:MangaSourceService,useValue:{volume}},{provide:MangaContextService,useValue:{available:false}},{provide:JAPANESE_AUDIO_FACTORY,useValue:factory}]});
  });
  afterEach(()=>{TestBed.resetTestingModule();vi.unstubAllGlobals();});
  const repository=()=>TestBed.inject(MangaStudySavedRepository);
  async function save(expression='食べる',reading='たべる'){const item=TestBed.inject(MangaStudyIntegrationService).snapshot(lookup(expression,reading),{volumeId:'fixture',pageNumber:18,volumeTitle:'Volume 1'},'昨日何も食べなかった。')!;await repository().save(item);return item;}
  async function page(){const f=TestBed.createComponent(MangaStudyPage);f.detectChanges();await vi.waitFor(()=>expect(repository().loading()).toBe(false));f.detectChanges();await f.whenStable();await vi.waitFor(()=>expect(Object.keys(f.componentInstance.available())).toHaveLength(repository().count()));f.detectChanges();return f;}
  async function popup(expression='食べる',reading='たべる'){const f=TestBed.createComponent(DictionaryPopup);f.componentRef.setInput('result',lookup(expression,reading));f.componentRef.setInput('context',{text:'昨日何も食べなかった。',offset:5,x:0,y:0});f.componentRef.setInput('location',{volumeId:'fixture',pageIndex:17,blockIndex:0});f.componentRef.setInput('volumeTitle','Volume 1');f.detectChanges();await vi.waitFor(()=>expect(repository().loading()).toBe(false));f.detectChanges();return f;}
  it('shows an explanatory empty state and return link',async()=>{const f=await page();expect(f.nativeElement.textContent).toContain('Aún no has guardado');expect(f.nativeElement.querySelector('.empty a').getAttribute('href')).toBe('/manga');});
  it('saves from popup and reacts without reopening, with lightweight removal confirmation',async()=>{const f=await popup();expect(f.nativeElement.querySelector('.saved-actions').textContent).toContain('Guardar para estudiar');await f.componentInstance.saveWord();f.detectChanges();expect(f.nativeElement.querySelector('.saved-actions').textContent).toContain('✓ Guardada');f.nativeElement.querySelector('.saved-actions button').click();f.detectChanges();expect(await repository().list()).toHaveLength(1);expect(f.nativeElement.querySelector('[role=group]')).not.toBeNull();await f.componentInstance.removeWord();f.detectChanges();expect(f.componentInstance.isSaved()).toBe(false);expect(repository().count()).toBe(0);});
  it('responds to saving/removing elsewhere in the same workspace',async()=>{const f=await popup();const item=await save();f.detectChanges();expect(f.componentInstance.isSaved()).toBe(true);await repository().remove(item.id);f.detectChanges();expect(f.componentInstance.isSaved()).toBe(false);});
  it('reflects remote records and tombstones in an open popup and collection without reloading',async()=>{
    const f=await popup(),collection=await page();
    // PageHeader initializes local Auth; activate the account after that bootstrap.
    TestBed.inject(WorkspaceService).activateUser('a');TestBed.tick();await repository().reload();
    const item=TestBed.inject(MangaStudyIntegrationService).snapshot(lookup(),{volumeId:'fixture',pageNumber:18,volumeTitle:'Volume 1'},'昨日何も食べなかった。')!;
    await repository().mergeFromCloud([{item_id:item.id,payload:item,deleted_at:null,revision:1,last_operation:null}],'user:a');
    f.detectChanges();collection.detectChanges();
    expect(f.componentInstance.isSaved()).toBe(true);expect(f.nativeElement.querySelector('.saved-actions').textContent).toContain('✓ Guardada');
    expect(collection.nativeElement.querySelector('.saved-grid article')).not.toBeNull();expect(repository().count()).toBe(1);
    await repository().mergeFromCloud([{item_id:item.id,payload:null,deleted_at:'2026-10-08T00:00:00Z',revision:2,last_operation:null}],'user:a');
    f.detectChanges();collection.detectChanges();
    expect(f.componentInstance.isSaved()).toBe(false);expect(collection.nativeElement.querySelector('.empty')).not.toBeNull();expect(repository().count()).toBe(0);
  });
  it('permits unknown dictionary terms and never fabricates Vocabulary actions',async()=>{const f=await popup('龍','りゅう');expect(f.nativeElement.querySelector('.saved-actions')).not.toBeNull();await f.componentInstance.saveWord();f.detectChanges();expect(f.componentInstance.isSaved()).toBe(true);expect(f.nativeElement.querySelector('.study-vocabulary')).toBeNull();});
  it('keeps a failed save unsaved and displays an error',async()=>{const f=await popup();vi.spyOn(repository(),'save').mockRejectedValueOnce(new Error('disk'));await f.componentInstance.saveWord();f.detectChanges();expect(f.componentInstance.isSaved()).toBe(false);expect(f.nativeElement.querySelector('[role=alert]')).not.toBeNull();});
  it('does not show saving on loading or failed lookup',async()=>{const f=await popup();f.componentRef.setInput('loading',true);f.detectChanges();expect(f.nativeElement.querySelector('.saved-actions')).toBeNull();f.componentRef.setInput('loading',false);f.componentRef.setInput('failed',true);f.detectChanges();expect(f.nativeElement.querySelector('.saved-actions')).toBeNull();});
  it('shows known word, meaning, context, source and existing actions without preloading audio',async()=>{await save();const f=await page();const card=f.nativeElement.querySelector('.saved-grid article');expect(card.textContent).toContain('食べる');expect(card.textContent).toContain('たべる');expect(card.textContent).toContain('Volume 1 · pág. 18');expect(card.textContent).toContain('昨日何も食べなかった。');expect(card.textContent).toContain('N5');expect(card.querySelector('a[href^="/vocabulary/all"]')).not.toBeNull();expect(card.querySelector('a[href^="/vocabulary/writing"]')).not.toBeNull();expect(card.querySelector('a[href^="/kanji/all"]')).not.toBeNull();expect(card.querySelector('a[href^="/manga/read/fixture?page=18"]')).not.toBeNull();expect(card.textContent).toContain('Escuchar');expect(factory).not.toHaveBeenCalled();});
  it('shows external snapshot but no invented study actions',async()=>{await save('龍','りゅう');const f=await page();const card=f.nativeElement.querySelector('.saved-grid article');expect(card.textContent).toContain('龍');expect(card.textContent).toContain('meaning');expect(card.textContent).toContain('No está actualmente');expect(card.querySelector('a[href^="/vocabulary"]')).toBeNull();expect(card.textContent).not.toContain('Escuchar');});
  it('omits audio for an entry without a production recording',async()=>{await save('九','きゅう');const f=await page();expect(f.nativeElement.textContent).not.toContain('Escuchar');expect(f.nativeElement.querySelector('a[href^="/vocabulary/all"]')).not.toBeNull();});
  it('keeps a deleted-volume snapshot and hides its return action',async()=>{await save();volume.mockResolvedValue(undefined as any);const f=await page();expect(f.nativeElement.textContent).toContain('Volume 1');expect(f.nativeElement.querySelector('a[href^="/manga/read/"]')).toBeNull();});
  it('removes only after confirmation and returns to empty state',async()=>{const item=await save();const f=await page();f.nativeElement.querySelector('.footer button').click();f.detectChanges();expect(await repository().exists(item.id)).toBe(true);expect(f.nativeElement.querySelector('[role=group]')).not.toBeNull();await f.componentInstance.remove(item.id);f.detectChanges();expect(f.nativeElement.querySelector('.empty')).not.toBeNull();});
  it('retains the saved card on deletion failure',async()=>{const item=await save();const f=await page();vi.spyOn(repository(),'remove').mockRejectedValueOnce(new Error('disk'));await f.componentInstance.remove(item.id);f.detectChanges();expect(f.nativeElement.querySelector('.saved-grid article')).not.toBeNull();expect(f.nativeElement.querySelector('[role=alert]')).not.toBeNull();});
  it.each(['es','en','ca'] as const)('translates new UI in %s',async language=>{TestBed.inject(SettingsService).setLanguage(language);await save('龍','りゅう');const f=await page();expect(f.nativeElement.textContent).not.toMatch(/manga\.saved\./);if(language!=='es')expect(f.nativeElement.textContent).not.toContain('No está actualmente');});
  it('saving, removing and passive collection viewing leave learning state unchanged',async()=>{
    const weakness=TestBed.inject(WeaknessService),kana=TestBed.inject(ProgressService),vocabulary=TestBed.inject(VocabularyProgressService),kanji=TestBed.inject(KanjiProgressService),daily=TestBed.inject(DailyLearningService),history=TestBed.inject(SessionHistoryService);
    const fsrs=vi.spyOn(TestBed.inject(SpacedRepetitionService),'review');
    const snapshot=()=>({weak:weakness.records(),progress:[kana.allProgress(),vocabulary.allProgress(),kanji.allProgress()],reviews:[kana.reviewEvents(),vocabulary.reviewEvents(),kanji.reviewEvents()],daily:['kana','vocabulary','kanji'].map(m=>daily.isCompletedToday(m as 'kana'|'vocabulary'|'kanji')),history:history.sessions()});
    const f=await popup();await f.whenStable();const collection=await page();const before=snapshot(),storage={...localStorage};await f.componentInstance.saveWord();await f.componentInstance.removeWord();expect(snapshot()).toEqual(before);expect({...localStorage}).toEqual(storage);expect(fsrs).not.toHaveBeenCalled();collection.destroy();
  });
});

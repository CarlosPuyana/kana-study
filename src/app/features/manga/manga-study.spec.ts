import 'fake-indexeddb/auto';
import {IDBFactory} from 'fake-indexeddb';
import {TestBed} from '@angular/core/testing';
import {ActivatedRoute,convertToParamMap,provideRouter,Router,withHashLocation} from '@angular/router';
import {of} from 'rxjs';
import {DictionaryPopup} from '../../shared/components/dictionary-popup/dictionary-popup';
import {MangaContextService} from '../../core/services/manga-context.service';
import {JapaneseAudioService,JAPANESE_AUDIO_FACTORY} from '../../core/services/japanese-audio.service';
import {JapaneseGlyphService} from '../../core/services/japanese-glyph.service';
import {WeaknessService} from '../../core/services/weakness.service';
import {ProgressService} from '../../core/services/progress.service';
import {VocabularyProgressService} from '../../core/services/vocabulary-progress.service';
import {KanjiProgressService} from '../../core/services/kanji-progress.service';
import {DailyLearningService} from '../../core/services/daily-learning.service';
import {SessionHistoryService} from '../../core/services/session-history.service';
import {SpacedRepetitionService} from '../../core/services/spaced-repetition.service';
import {SettingsService} from '../../core/services/settings.service';
import {VocabularyAllPage} from '../vocabulary-all/vocabulary-all.page';
import {KanjiAllPage} from '../kanji-all/kanji-all.page';
import {VocabularyWritingPage} from '../vocabulary-writing/vocabulary-writing.page';
import {KanjiWritingPage} from '../kanji-writing/kanji-writing.page';
import {DictionaryLookup} from '../../core/models/dictionary.model';
function wordLookup(expression:string,reading=expression):DictionaryLookup{return {installed:true,query:expression,terms:[{id:'fixture',dictionaryId:'fixture',expression,reading,glossaries:['fixture meaning'],definitionTags:'',rules:'',score:0,sequence:1,termTags:''}]};}

describe('Manga study actions',()=>{
  const audioElement={play:vi.fn(async()=>{}),pause:vi.fn(),load:vi.fn(),removeAttribute:vi.fn(),src:'',preload:'',onended:null,onerror:null};
  beforeEach(()=>{
    localStorage.clear();vi.stubGlobal('indexedDB',new IDBFactory());vi.stubGlobal('matchMedia',vi.fn(()=>({matches:false,addEventListener:vi.fn(),removeEventListener:vi.fn()})));
    audioElement.play.mockClear();
    TestBed.configureTestingModule({providers:[provideRouter([],withHashLocation()),{provide:MangaContextService,useValue:{available:false}},{provide:JAPANESE_AUDIO_FACTORY,useValue:()=>audioElement},{provide:JapaneseGlyphService,useValue:{load:async(character:string)=>[{character,strokes:[],clipPaths:[]}]}}]});
  });
  afterEach(()=>{TestBed.resetTestingModule();vi.unstubAllGlobals();});
  function popup(expression='食べる',reading='たべる'){
    const fixture=TestBed.createComponent(DictionaryPopup);fixture.componentRef.setInput('result',wordLookup(expression,reading));fixture.componentRef.setInput('location',{volumeId:'fixture-manga',pageIndex:1,blockIndex:0});fixture.detectChanges();return fixture;
  }
  function route(params:Record<string,string>){const map=convertToParamMap(params);TestBed.overrideProvider(ActivatedRoute,{useValue:{snapshot:{queryParamMap:map},queryParamMap:of(map)}});}
  it.each(['es','en','ca'] as const)('shows localized vocabulary metadata and actions in %s',language=>{
    TestBed.inject(SettingsService).setLanguage(language);const f=popup();const section=f.nativeElement.querySelector('.study-integration');
    expect(section.textContent).toContain('食べる');expect(section.textContent).toContain('たべる');expect(section.textContent).toContain('N5');expect(section.textContent).not.toMatch(/manga\.study\./);
    expect(section.querySelector('a[href^="#/vocabulary/all?entry=n5-euiuyn"]')).not.toBeNull();expect(section.querySelector('a[href^="#/vocabulary/writing?entry=n5-euiuyn"]')).not.toBeNull();
    expect(section.querySelector('button')).not.toBeNull();expect(audioElement.play).not.toHaveBeenCalled();
  });
  it('keeps dictionary content and permits saving words outside Vocabulary',()=>{const f=popup('ありがとう','ありがとう');expect(f.nativeElement.querySelector('h2').textContent).toBe('ありがとう');expect(f.nativeElement.querySelector('.saved-actions')).not.toBeNull();expect(f.nativeElement.querySelector('.study-vocabulary')).toBeNull();});
  it('omits listening when a matched entry has no production audio',()=>{const f=popup('九','きゅう');expect(f.nativeElement.querySelector('.study-vocabulary')).not.toBeNull();expect(f.nativeElement.querySelector('.study-actions button')).toBeNull();expect(f.nativeElement.querySelector('.study-vocabulary a[href^="#/vocabulary/writing"]')).not.toBeNull();});
  it('shows unique Kanji and contextual navigation even without vocabulary',()=>{
    const f=popup('学学校龍','がっこう');expect(f.nativeElement.querySelector('.study-vocabulary')).toBeNull();const rows=f.nativeElement.querySelectorAll('.study-kanji');expect(rows).toHaveLength(2);
    expect([...rows].map((row:any)=>row.querySelector('strong').textContent)).toEqual(['学','校']);
    for(const link of f.nativeElement.querySelectorAll('.study-integration a')){expect(link.getAttribute('href')).toContain('return=%2Fmanga%2Fread%2Ffixture-manga');}
    expect(rows[0].querySelector('a').getAttribute('href')).toContain('selected=');expect(rows[0].querySelectorAll('a')[1].getAttribute('href')).toContain('/kanji/writing?entry=');
  });
  it('never shows integration on the Context tab',()=>{const f=popup();f.componentInstance.tab.set('context');f.detectChanges();expect(f.nativeElement.querySelector('.study-integration')).toBeNull();});
  it('listens only on click without changing local study state, and stops on destroy',async()=>{
    const weakness=TestBed.inject(WeaknessService),kana=TestBed.inject(ProgressService),vocabulary=TestBed.inject(VocabularyProgressService),kanji=TestBed.inject(KanjiProgressService),daily=TestBed.inject(DailyLearningService),history=TestBed.inject(SessionHistoryService);
    const fsrsReview=vi.spyOn(TestBed.inject(SpacedRepetitionService),'review');
    const snapshot=()=>({weakness:weakness.records(),progress:[kana.allProgress(),vocabulary.allProgress(),kanji.allProgress()],reviews:[kana.reviewEvents(),vocabulary.reviewEvents(),kanji.reviewEvents()],daily:['kana','vocabulary','kanji'].map(module=>daily.isCompletedToday(module as 'kana'|'vocabulary'|'kanji')),history:history.sessions()});
    const f=popup();await f.whenStable();const before={...localStorage},studyBefore=snapshot();const stop=vi.spyOn(TestBed.inject(JapaneseAudioService),'stop');
    f.nativeElement.querySelector('.study-actions button').click();await f.whenStable();expect(audioElement.play).toHaveBeenCalledOnce();expect({...localStorage}).toEqual(before);expect(snapshot()).toEqual(studyBefore);expect(fsrsReview).not.toHaveBeenCalled();f.destroy();expect(stop).toHaveBeenCalledTimes(2);
  });
  it('shows accessible playback errors without removing dictionary or actions',async()=>{
    audioElement.play.mockRejectedValueOnce(new Error('audio unavailable'));const f=popup();await f.componentInstance.listen();f.detectChanges();expect(f.nativeElement.querySelector('[role=alert]')).not.toBeNull();expect(f.nativeElement.querySelector('.study-vocabulary')).not.toBeNull();
  });
  it('stops its audio when lookup changes',async()=>{const f=popup();await f.componentInstance.listen();const stop=vi.spyOn(TestBed.inject(JapaneseAudioService),'stop');f.componentRef.setInput('result',wordLookup('ありがとう'));f.detectChanges();expect(stop).toHaveBeenCalledOnce();expect(f.componentInstance.audioRequested()).toBe(false);});
  it('keeps all integration links inside the focus trap',async()=>{
    const f=popup('学校','がっこう');await f.whenStable();const controls=f.nativeElement.querySelectorAll('button:not(:disabled),a,summary');controls[0].focus();const backwards=new KeyboardEvent('keydown',{key:'Tab',shiftKey:true,cancelable:true});f.componentInstance.key(backwards);expect(document.activeElement).toBe(controls[controls.length-1]);expect(backwards.defaultPrevented).toBe(true);
    const forward=new KeyboardEvent('keydown',{key:'Tab',cancelable:true});f.componentInstance.key(forward);expect(document.activeElement).toBe(controls[0]);
  });
  it('opens the existing vocabulary detail and returns to the Reader',async()=>{
    route({entry:'n5-euiuyn',return:'/manga/read/fixture-manga'});const router=TestBed.inject(Router),navigate=vi.spyOn(router,'navigateByUrl').mockResolvedValue(true);const f=TestBed.createComponent(VocabularyAllPage);f.componentInstance.query.set('食べる');f.detectChanges();await f.whenStable();expect(f.componentInstance.selected()?.primaryWrittenForm).toBe('食べる');expect(f.nativeElement.querySelector('[role=dialog]')).not.toBeNull();f.componentInstance.back();expect(navigate).toHaveBeenCalledWith('/manga/read/fixture-manga');
  });
  it('opens the existing Kanji detail with contextual return',()=>{route({selected:'食',return:'/manga/read/fixture-manga'});const f=TestBed.createComponent(KanjiAllPage);f.detectChanges();expect(f.componentInstance.selected()?.character).toBe('食');expect(f.componentInstance.returnUrl).toBe('/manga/read/fixture-manga');});
  it.each([VocabularyWritingPage,KanjiWritingPage])('preserves contextual return in individual Writing: %s',async component=>{
    route({entry:component===VocabularyWritingPage?'n5-euiuyn':'n5-98df',return:'/manga/read/fixture-manga'});
    // Resolve the real Kanji ID below rather than relying on generated identifier spelling.
    if(component===KanjiWritingPage){const {KANJI_N5}=await import('../../data/kanji-n5.generated');route({entry:KANJI_N5.find(k=>k.character==='食')!.id,return:'/manga/read/fixture-manga'});}
    const f=TestBed.createComponent(component as typeof VocabularyWritingPage);await f.whenStable();f.detectChanges();expect(f.componentInstance.individual()).not.toBeNull();expect(f.nativeElement.querySelector('header a').getAttribute('href')).toBe('#/manga/read/fixture-manga');
  });
  it.each([VocabularyWritingPage,KanjiWritingPage])('keeps the original page query in Writing return links: %s',async component=>{
    const {KANJI_N5}=await import('../../data/kanji-n5.generated');
    route({entry:component===VocabularyWritingPage?'n5-euiuyn':KANJI_N5.find(k=>k.character==='食')!.id,return:'/manga/read/fixture-manga?page=18'});
    const f=TestBed.createComponent(component as typeof VocabularyWritingPage);await f.whenStable();f.detectChanges();expect(f.nativeElement.querySelector('header a').getAttribute('href')).toBe('#/manga/read/fixture-manga?page=18');
  });
  it('rejects external return URLs and unknown vocabulary IDs',()=>{route({entry:'unknown',return:'//external.invalid'});const f=TestBed.createComponent(VocabularyAllPage);expect(f.componentInstance.selected()).toBeNull();expect(f.componentInstance.returnUrl).toBe('/vocabulary');});
});

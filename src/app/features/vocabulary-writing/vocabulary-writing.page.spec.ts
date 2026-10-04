import {TestBed} from '@angular/core/testing';
import {provideRouter,ActivatedRoute} from '@angular/router';
import {VocabularyWritingPage} from './vocabulary-writing.page';
import {JapaneseGlyphService} from '../../core/services/japanese-glyph.service';
import {VOCABULARY_N5} from '../../data/vocabulary-n5.generated';
describe('Vocabulary writing modes',()=>{
  beforeEach(()=>{
    vi.stubGlobal('matchMedia',vi.fn(()=>({matches:false,addEventListener:vi.fn(),removeEventListener:vi.fn()})));
    TestBed.configureTestingModule({providers:[provideRouter([]),{provide:JapaneseGlyphService,useValue:{load:async(character:string)=>[{character,strokes:[],clipPaths:[]}]}}]});
  });
  afterEach(()=>vi.unstubAllGlobals());
  it('shows reading only when configured and requires completion then reveal before rating',async()=>{
    const f=TestBed.createComponent(VocabularyWritingPage),c=f.componentInstance;c.withReading.set(false);c.withGuide.set(false);c.start();await f.whenStable();f.detectChanges();
    expect(f.nativeElement.querySelector('.practice>p[lang=ja]')).toBeNull();const first=c.current()!.id;c.answer(true);expect(c.current()!.id).toBe(first);
    c.withReading.set(true);f.detectChanges();expect(f.nativeElement.querySelector('.practice>p[lang=ja]').textContent).toBe(c.current()!.primaryReading);
    c.practice()!.move(c.practice()!.characters().length);c.revealed.set(true);c.answer(false);await f.whenStable();expect(c.resolved()).toBe(0);expect(c.current()!.id).not.toBe(first);
  });
  it('opens the selected catalogue word directly',async()=>{
    TestBed.overrideProvider(ActivatedRoute,{useValue:{snapshot:{queryParamMap:{get:()=>VOCABULARY_N5[0].id}}}});
    const f=TestBed.createComponent(VocabularyWritingPage);await f.whenStable();f.detectChanges();expect(f.componentInstance.individual()?.id).toBe(VOCABULARY_N5[0].id);expect(f.nativeElement.querySelector('fieldset')).toBeNull();
  });
});

import {TestBed} from '@angular/core/testing';
import {signal, Type} from '@angular/core';
import {ActivatedRoute,convertToParamMap,provideRouter} from '@angular/router';
import {of} from 'rxjs';
import {WeaknessesPage} from './weaknesses.page';
import {WeaknessService,WEAKNESSES_KEY} from '../../core/services/weakness.service';
import {StorageService} from '../../core/services/storage.service';
import {JapaneseGlyphService} from '../../core/services/japanese-glyph.service';
import {KanaStrokesService} from '../../core/services/kana-strokes.service';
import {KanaWritingPage} from '../writing/kana-writing.page';
import {VocabularyWritingPage} from '../vocabulary-writing/vocabulary-writing.page';
import {KanjiWritingPage} from '../kanji-writing/kanji-writing.page';
import {ALL_KANA} from '../../data/kana';
import {VOCABULARY_N5} from '../../data/vocabulary-n5.generated';
import {KANJI_N5} from '../../data/kanji-n5.generated';
import {WeaknessModule} from '../../core/models/weakness.model';
import {routes} from '../../app.routes';

type WritingPage=KanaWritingPage|VocabularyWritingPage|KanjiWritingPage;
const modes:readonly {module:WeaknessModule;page:Type<WritingPage>;entries:readonly {id:string}[]}[]=[
  {module:'kana',page:KanaWritingPage,entries:ALL_KANA},
  {module:'vocabulary',page:VocabularyWritingPage,entries:VOCABULARY_N5.filter(e=>e.enabled)},
  {module:'kanji',page:KanjiWritingPage,entries:KANJI_N5.filter(k=>k.enabled)},
];
describe('Weak spots page and Writing integrations',()=>{
  let values:Map<string,unknown>;
  beforeEach(()=>{
    values=new Map();vi.stubGlobal('matchMedia',vi.fn(()=>({matches:false,addEventListener:vi.fn(),removeEventListener:vi.fn()})));
    TestBed.configureTestingModule({providers:[provideRouter([]),
      {provide:StorageService,useValue:{get:(key:string,fallback:unknown)=>values.get(key)??fallback,
        set:(key:string,value:unknown)=>values.set(key,value),rawKey:(key:string)=>key,cloudRevision:signal(0)}},
      {provide:JapaneseGlyphService,useValue:{load:async(character:string)=>[{character,strokes:[],clipPaths:[]}]}},
      {provide:KanaStrokesService,useValue:{load:async()=>[]}},
    ]});
  });
  afterEach(()=>vi.unstubAllGlobals());
  function seed(module:WeaknessModule,entries:readonly {id:string}[],count=entries.length){
    const s=TestBed.inject(WeaknessService);for(const e of entries.slice(0,count)){s.record(module,e.id,false);s.record(module,e.id,false);}return s;
  }
  function weakRoute(){const params=convertToParamMap({weak:'1'});TestBed.overrideProvider(ActivatedRoute,{useValue:{snapshot:{queryParamMap:params},queryParamMap:of(params)}});}
  function reveal(c:WritingPage){if(c instanceof VocabularyWritingPage)c.wordFinished.set(true);c.revealed.set(true);}
  it('exposes a lazy public route with no sign-in guard',async()=>{
    const route=routes.find(r=>r.path==='weaknesses')!;expect(route.canActivate).toBeUndefined();
    expect(await (route.loadComponent as ()=>Promise<unknown>)()).toBe(WeaknessesPage);
  });
  it('shows a positive empty state, three sections and no practice links',async()=>{
    const f=TestBed.createComponent(WeaknessesPage);await f.whenStable();f.detectChanges();
    expect(f.nativeElement.querySelectorAll('.sections section')).toHaveLength(3);
    expect(f.nativeElement.querySelector('.positive')).not.toBeNull();expect(f.nativeElement.querySelectorAll('.practice')).toHaveLength(0);
  });
  it('labels writing/listening separately and routes listening weaknesses to the same listening mode',async()=>{
    const service=seed('vocabulary',VOCABULARY_N5,1),entry=VOCABULARY_N5[0];
    service.record('vocabulary',entry.id,false,'listening');service.record('vocabulary',entry.id,false,'listening');
    const f=TestBed.createComponent(WeaknessesPage);await f.whenStable();f.detectChanges();
    expect(f.componentInstance.vocabulary()[0].id).toBe(entry.id);expect(f.componentInstance.vocabularyListening()[0].id).toBe(entry.id);
    const hrefs=[...f.nativeElement.querySelectorAll('a.practice')].map(a=>(a as HTMLAnchorElement).getAttribute('href'));
    expect(hrefs).toContain('/vocabulary/writing?weak=1');expect(hrefs).toContain('/vocabulary/listening?weak=1');
    expect(f.nativeElement.textContent).toContain('✍');expect(f.nativeElement.textContent).toContain('🎧');
  });
  it('resolves dataset labels, limits previews to five and removes improved items reactively',async()=>{
    const s=seed('kana',ALL_KANA,7);seed('vocabulary',VOCABULARY_N5,1);seed('kanji',KANJI_N5,1);seed('kana',[{id:'obsolete'}],1);
    const f=TestBed.createComponent(WeaknessesPage);await f.whenStable();f.detectChanges();
    expect(f.componentInstance.kana()).toHaveLength(5);expect(f.nativeElement.querySelectorAll('.practice')).toHaveLength(3);
    expect(f.nativeElement.textContent).toContain(VOCABULARY_N5[0].primaryReading);expect(f.nativeElement.textContent).not.toContain('obsolete');
    const item=f.componentInstance.kanji()[0];s.record('kanji',item.id,true);s.record('kanji',item.id,true);
    f.detectChanges();expect(f.componentInstance.kanji()).toEqual([]);expect(f.nativeElement.querySelectorAll('.practice')).toHaveLength(2);
    const hrefs=[...f.nativeElement.querySelectorAll('a.practice')].map((a:unknown)=>(a as HTMLAnchorElement).getAttribute('href'));
    expect(hrefs).toEqual(['/writing?weak=1','/vocabulary/writing?weak=1']);
  });
  for(const mode of modes){
    it(`${mode.module}: normal self-evaluation records exactly once, with reveal gating`,async()=>{
      const f=TestBed.createComponent(mode.page),c=f.componentInstance;c.start();await f.whenStable();
      const id=c.current()!.id,s=TestBed.inject(WeaknessService);expect(s.records()).toEqual([]);
      c.answer(false);expect(s.records()).toEqual([]);reveal(c);c.answer(false);c.answer(false);
      expect(s.records()).toHaveLength(1);expect(s.records()[0]).toEqual(expect.objectContaining({module:mode.module,itemId:id,attempts:1,score:2}));
      const next=c.current()!.id;reveal(c);c.answer(true);
      expect(s.records().find(r=>r.itemId===next)?.consecutiveCorrect).toBe(1);
    });
    it(`${mode.module}: weak entry uses only the ten highest-priority valid items and keeps feeding scores`,async()=>{
      weakRoute();const s=seed(mode.module,mode.entries,13);seed(mode.module,[{id:'obsolete'}],1);
      const expected=s.items(mode.module,mode.entries,10).map(e=>e.id);
      const f=TestBed.createComponent(mode.page),c=f.componentInstance;await f.whenStable();f.detectChanges();
      expect(c.session()!.total).toBe(10);expect(f.nativeElement.querySelector('fieldset')).toBeNull();
      const seen:string[]=[];while(c.current()){seen.push(c.current()!.id);reveal(c);c.answer(true);}
      expect(seen.sort()).toEqual(expected.sort());expect(c.resolved()).toBe(10);
      expect(s.records().filter(r=>expected.includes(r.itemId)).every(r=>r.score===3)).toBe(true);
      c.configure();while(c.current()){reveal(c);c.answer(true);}
      expect(s.weak().filter(r=>r.module===mode.module&&expected.includes(r.itemId)).length).toBeLessThan(10);
      expect(values.has(WEAKNESSES_KEY)).toBe(true);
    });
    it(`${mode.module}: an empty weak entry safely completes without creating attempts`,async()=>{
      weakRoute();const f=TestBed.createComponent(mode.page);await f.whenStable();f.detectChanges();
      expect(f.componentInstance.session()!.total).toBe(0);expect(f.nativeElement.querySelector('.finished')).not.toBeNull();
      expect(TestBed.inject(WeaknessService).records()).toEqual([]);
    });
  }
});

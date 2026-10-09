import {TestBed} from '@angular/core/testing';
import {By} from '@angular/platform-browser';
import {provideRouter} from '@angular/router';
import {KanaRushPage} from './kana-rush.page';
import {KanjiRushPage} from './kanji-rush.page';
import {RushSessionService} from '../../core/services/rush-session.service';
import {LocalRushRepository} from '../../core/services/rush-repository.service';
import {RushMedalService} from '../../core/services/rush-medal.service';
import {STUDY_MONOTONIC_NOW} from '../../core/services/study-clock';
import {KanaStrokesService} from '../../core/services/kana-strokes.service';
import {JapaneseGlyphService} from '../../core/services/japanese-glyph.service';
import {SettingsService} from '../../core/services/settings.service';
import {KanaStrokeGlyph} from '../../core/models/kana-writing.model';
import {ALL_KANA} from '../../data/kana';
import {KANJI_N5} from '../../data/kanji-n5.generated';
import {LearningWritingPrompt} from '../../shared/components/learning-writing-prompt/learning-writing-prompt';
import {KanaWritingCanvas} from '../../shared/components/kana-writing-canvas/kana-writing-canvas';

for(const module of ['kana','kanji'] as const)describe(`${module} RUSH writing with the original reveal/Next contract`,()=>{
  const item=module==='kana'?ALL_KANA[0]:KANJI_N5[0];
  const direction=module==='kana'?'romaji-to-kana':'meaning-to-kanji';
  const opposite=module==='kana'?'kana-to-romaji':'kanji-to-meaning';
  const glyph:KanaStrokeGlyph={character:item.character,strokes:[{id:'1',value:'M0 0L20 20'}],clipPaths:[]};
  let started:Promise<boolean>;
  let now:number,type:string,load:ReturnType<typeof vi.fn>;
  const repo={markOpenSessionsInterrupted:vi.fn(async()=>{}),createSession:vi.fn(async()=>{}),saveProgress:vi.fn(async()=>{}),finishSession:vi.fn(async()=>{}),discardSession:vi.fn(async()=>{})};
  beforeEach(()=>{
    now=0;type=direction;vi.clearAllMocks();
    vi.stubGlobal('matchMedia',vi.fn(()=>({matches:false,addEventListener:vi.fn(),removeEventListener:vi.fn()})));
    load=vi.fn(async()=>[glyph]);
    TestBed.configureTestingModule({providers:[provideRouter([]),{provide:STUDY_MONOTONIC_NOW,useValue:()=>now},
      {provide:LocalRushRepository,useValue:repo},{provide:RushMedalService,useValue:{refresh:async()=>[],newlyUnlocked:()=>[],dismiss:vi.fn()}},
      {provide:KanaStrokesService,useValue:{load}},{provide:JapaneseGlyphService,useValue:{load}}]});
    // A single real engine unit forces a same-character repeat on every Next.
    const rush=TestBed.inject(RushSessionService),start=rush.start.bind(rush);
    vi.spyOn(rush,'start').mockImplementation(()=>started=start(module,[{key:`test:${type}`,module,contentId:item.id,questionType:type}]));
  });
  afterEach(()=>{TestBed.resetTestingModule();vi.restoreAllMocks();vi.unstubAllGlobals();});
  async function render(){const f=module==='kana'?TestBed.createComponent(KanaRushPage):TestBed.createComponent(KanjiRushPage);f.detectChanges();await started;await f.whenStable();f.detectChanges();return f;}
  function draw(f:{debugElement:any,nativeElement:HTMLElement}){
    const canvas=f.debugElement.query(By.directive(KanaWritingCanvas)).componentInstance as KanaWritingCanvas;
    const svg=f.nativeElement.querySelector('svg.writing-surface')!;
    vi.spyOn(svg,'getBoundingClientRect').mockReturnValue({left:0,top:0,width:200,height:200} as DOMRect);
    const e={currentTarget:svg,clientX:100,clientY:100,pointerId:1,button:0,pressure:.5,timeStamp:1,type:'pointerup',preventDefault:vi.fn()} as unknown as PointerEvent;
    canvas.pointerDown(e);canvas.pointerUp(e);return canvas;
  }
  it('drawing does not complete cards and reveal/Next timing, finish and repeated-character reset stay intact',async()=>{
    const f=await render(),rush=f.componentInstance.rush;
    const protectedKeys=['kana-study.study-progress.v2','kana-study.review-events.v1','kana-study.kanji-progress.v1','kana-study.kanji-review-events.v1'];
    const before=protectedKeys.map(key=>localStorage.getItem(key));
    expect(f.nativeElement.querySelector('.answer,svg .model,svg clipPath')).toBeNull();
    now=2000;const canvas=draw(f);expect(canvas.strokes()).toHaveLength(1);
    expect(rush.session()!.cardsCompleted).toBe(0);expect(repo.saveProgress).not.toHaveBeenCalled();
    const undo=f.nativeElement.querySelector('app-learning-writing-prompt button') as HTMLButtonElement;
    undo.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true}));expect(rush.revealed()).toBe(false);
    f.componentInstance.key(new KeyboardEvent('keydown',{code:'Space'}));await f.whenStable();f.detectChanges();
    expect(f.nativeElement.querySelector('.answer')).not.toBeNull();expect(rush.session()!.cardsCompleted).toBe(0);
    now=5000;await rush.next();await f.whenStable();f.detectChanges();
    expect(rush.session()).toMatchObject({cardsCompleted:1,uniqueContentsSeen:1,cyclesCompleted:1,activeSeconds:5});
    expect(canvas.strokes()).toHaveLength(0);expect(f.nativeElement.querySelector('.answer,svg .model,svg clipPath')).toBeNull();
    expect(protectedKeys.map(key=>localStorage.getItem(key))).toEqual(before);
    now=65000;const summary=await rush.finish();expect(summary).toMatchObject({cardsCompleted:1,activeSeconds:5});
    expect(await rush.finish()).toEqual(summary);expect(repo.finishSession).toHaveBeenCalledOnce();
  });
  it('allows revealing and completing without drawing',async()=>{
    const f=await render(),rush=f.componentInstance.rush;
    expect(f.nativeElement.querySelector('svg .ink')).toBeNull();
    f.nativeElement.querySelector('.action').click();await f.whenStable();f.detectChanges();
    expect(f.nativeElement.querySelector('.answer')).not.toBeNull();expect(rush.session()!.cardsCompleted).toBe(0);
    await rush.next();expect(rush.session()!.cardsCompleted).toBe(1);
  });
  it('keeps the opposite direction unchanged',async()=>{
    type=opposite;const f=await render();expect(f.nativeElement.querySelector('app-learning-writing-prompt')).toBeNull();
    f.nativeElement.querySelector('.action').click();await f.whenStable();f.detectChanges();expect(f.nativeElement.querySelector('.answer')).not.toBeNull();
    await f.componentInstance.rush.next();await f.whenStable();expect(f.componentInstance.rush.session()!.cardsCompleted).toBe(1);
  });
  it('blocks duplicate Next during the existing asynchronous save',async()=>{
    const f=await render();f.nativeElement.querySelector('.action').click();f.detectChanges();
    let release!:()=>void;repo.saveProgress.mockImplementationOnce(()=>new Promise<void>(resolve=>release=resolve));
    const first=f.componentInstance.rush.next(),second=f.componentInstance.rush.next();expect(repo.saveProgress).toHaveBeenCalledOnce();
    release();await Promise.all([first,second]);await f.whenStable();f.detectChanges();expect(f.componentInstance.rush.session()!.cardsCompleted).toBe(1);
    expect(f.nativeElement.querySelector('.answer')).toBeNull();
  });
  if(module==='kanji'){
    it('retains valid ink after delayed glyphs and remains usable without assets',async()=>{
      let resolve!:(glyphs:KanaStrokeGlyph[])=>void;load.mockImplementation(()=>new Promise<KanaStrokeGlyph[]>(done=>resolve=done));
      const f=await render(),canvas=draw(f);resolve([glyph]);await f.whenStable();f.detectChanges();
      expect(canvas.strokes()).toHaveLength(1);expect(f.nativeElement.querySelector('svg .model,svg clipPath,.answer')).toBeNull();
      load.mockRejectedValueOnce(Error('missing'));f.componentInstance.rush.clear();f.detectChanges();await f.componentInstance.ngOnInit();await f.whenStable();f.detectChanges();
      expect(f.nativeElement.querySelector('app-learning-writing-prompt [role="status"]')).not.toBeNull();
      expect(draw(f).strokes()).toHaveLength(1);
      expect(f.nativeElement.querySelector('.action')).not.toBeNull();
    });
    it('uses the active Spanish, English and Catalan meaning',async()=>{
      const f=await render(),settings=TestBed.inject(SettingsService);
      for(const language of ['es','en','ca'] as const){settings.setLanguage(language);f.detectChanges();expect(f.nativeElement.querySelector('.question').textContent.trim()).toBe(KANJI_N5[0].meanings[language].join(', '));}
    });
  }
});

describe('RUSH shared writing resources',()=>{
  afterEach(()=>{TestBed.resetTestingModule();vi.unstubAllGlobals();});
  it('ignores stale asynchronous glyphs when the question changes',async()=>{
    vi.stubGlobal('matchMedia',vi.fn(()=>({matches:false,addEventListener:vi.fn(),removeEventListener:vi.fn()})));
    const pending=new Map<string,(glyphs:KanaStrokeGlyph[])=>void>();
    TestBed.configureTestingModule({providers:[{provide:JapaneseGlyphService,useValue:{load:(character:string)=>new Promise<KanaStrokeGlyph[]>(resolve=>pending.set(character,resolve))}}]});
    const f=TestBed.createComponent(LearningWritingPrompt);
    f.componentRef.setInput('kanji',true);f.componentRef.setInput('character','一');f.componentRef.setInput('occurrence','session:0');await f.whenStable();f.detectChanges();
    f.componentRef.setInput('character','二');f.componentRef.setInput('occurrence','session:1');await f.whenStable();f.detectChanges();
    pending.get('二')!([{character:'二',strokes:[],clipPaths:[]}]);await f.whenStable();
    pending.get('一')!([{character:'一',strokes:[{id:'1',value:'M0 0L20 20'}],clipPaths:[]}]);await f.whenStable();f.detectChanges();
    expect(f.componentInstance.glyphs()?.map(glyph=>glyph.character)).toEqual(['二']);
    expect(f.componentInstance.missing()).toBe(true);expect(f.nativeElement.querySelector('svg .model,svg clipPath')).toBeNull();
  });
});

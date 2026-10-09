import {TestBed} from '@angular/core/testing';
import {By} from '@angular/platform-browser';
import {provideRouter} from '@angular/router';
import {LearnPage} from '../../../features/learn/learn.page';
import {KanjiPlayPage} from '../../../features/kanji-play/kanji-play.page';
import {LearningSessionService} from '../../../core/services/learning-session.service';
import {KanjiSessionService} from '../../../core/services/kanji-session.service';
import {ProgressService} from '../../../core/services/progress.service';
import {KanjiProgressService} from '../../../core/services/kanji-progress.service';
import {DailyLearningService} from '../../../core/services/daily-learning.service';
import {MedalService} from '../../../core/services/medal.service';
import {KanjiMedalService} from '../../../core/services/kanji-medal.service';
import {SessionHistoryService} from '../../../core/services/session-history.service';
import {KanaStrokesService} from '../../../core/services/kana-strokes.service';
import {JapaneseGlyphService} from '../../../core/services/japanese-glyph.service';
import {ALL_KANA} from '../../../data/kana';
import {KANJI_N5} from '../../../data/kanji-n5.generated';
import {StudyUnit} from '../../../core/models/progress.model';
import {KanjiStudyUnit} from '../../../core/models/kanji.model';
import {KanaWritingCanvas} from '../kana-writing-canvas/kana-writing-canvas';

for(const module of ['kana','kanji'] as const)describe(`${module} drawing inside the original learning session`,()=>{
  const kana=ALL_KANA[0],kanji=KANJI_N5[0];
  let kanaRound:StudyUnit[],kanjiRound:KanjiStudyUnit[];
  const progress={buildRound:vi.fn(),recordReview:vi.fn(),recordPracticeAttempt:vi.fn(),get:()=>null,roundSummary:()=>({roundNew:0,roundDue:0})};
  const glyph={character:'x',strokes:[{id:'1',value:'M0 0L20 20'}],clipPaths:[]};
  beforeEach(()=>{
    vi.clearAllMocks();vi.stubGlobal('matchMedia',vi.fn(()=>({matches:false,addEventListener:vi.fn(),removeEventListener:vi.fn()})));
    kanaRound=[{key:`${kana.id}:romaji-to-kana`,kanaId:kana.id,questionType:'romaji-to-kana'}];
    kanjiRound=[{key:`kanji:${kanji.id}:meaning-to-kanji`,kanjiId:kanji.id,questionType:'meaning-to-kanji'}];
    progress.buildRound.mockImplementation(()=>module==='kana'?kanaRound:kanjiRound);
    TestBed.configureTestingModule({providers:[provideRouter([]),{provide:ProgressService,useValue:progress},{provide:KanjiProgressService,useValue:progress},
      {provide:MedalService,useValue:{evaluateUnlocks:()=>[]}},{provide:KanjiMedalService,useValue:{evaluateUnlocks:()=>[]}},
      {provide:SessionHistoryService,useValue:{record:vi.fn()}},{provide:DailyLearningService,useValue:{isCompletedToday:()=>false,refresh:vi.fn()}},
      {provide:KanaStrokesService,useValue:{load:async()=>[glyph]}},{provide:JapaneseGlyphService,useValue:{load:async()=>[glyph]}}]});
  });
  afterEach(()=>{TestBed.resetTestingModule();vi.unstubAllGlobals();});
  async function render(mode:'self-assessment'|'quick-practice'='self-assessment'){
    const f=module==='kana'?TestBed.createComponent(LearnPage):TestBed.createComponent(KanjiPlayPage);
    f.componentInstance.learning.start(mode);await f.whenStable();f.detectChanges();return f;
  }
  function draw(canvas:KanaWritingCanvas,svg:SVGSVGElement){
    vi.spyOn(svg,'getBoundingClientRect').mockReturnValue({left:0,top:0,width:200,height:200} as DOMRect);
    const event={currentTarget:svg,clientX:100,clientY:100,pointerId:1,button:0,pressure:.5,timeStamp:1,type:'pointerup',preventDefault:vi.fn()} as unknown as PointerEvent;
    canvas.pointerDown(event);canvas.pointerUp(event);
  }
  it('reveals only after explicit assessment, keeps ratings and clears a repeated character without a second FSRS review',async()=>{
    const f=await render(),learning=f.componentInstance.learning;
    const canvas=f.debugElement.query(By.directive(KanaWritingCanvas)).componentInstance as KanaWritingCanvas;
    expect(f.nativeElement.querySelector('clipPath,.model,.revealed-answer,.answer')).toBeNull();
    draw(canvas,f.nativeElement.querySelector('svg.writing-surface'));expect(canvas.strokes()).toHaveLength(1);
    expect(learning.session()!.attempts).toBe(0);expect(progress.recordReview).not.toHaveBeenCalled();
    canvas.undo();expect(canvas.strokes()).toHaveLength(0);draw(canvas,f.nativeElement.querySelector('svg.writing-surface'));canvas.clear();expect(canvas.strokes()).toHaveLength(0);
    draw(canvas,f.nativeElement.querySelector('svg.writing-surface'));
    f.nativeElement.querySelector('.reveal').click();await f.whenStable();f.detectChanges();
    expect(f.nativeElement.querySelector('.model')).not.toBeNull();expect(canvas.strokes()).toHaveLength(1);expect(f.nativeElement.querySelectorAll('.ratings button')).toHaveLength(3);
    learning.rate('again');await f.whenStable();f.detectChanges();expect(canvas.strokes()).toHaveLength(0);expect(f.nativeElement.querySelector('.model')).toBeNull();
    learning.reveal();learning.rate('hard');learning.reveal();learning.rate('good');
    expect(progress.recordReview).toHaveBeenCalledTimes(1);expect(progress.recordPracticeAttempt).toHaveBeenCalledTimes(2);expect(learning.session()!.attempts).toBe(3);
  });
  it('offers accessible quick options without grading the drawing; resets the gate and strokes on repeat and new sessions',async()=>{
    const f=await render('quick-practice'),learning=f.componentInstance.learning;
    const canvas=f.debugElement.query(By.directive(KanaWritingCanvas)).componentInstance as KanaWritingCanvas;
    expect(f.nativeElement.querySelector('.options')).toBeNull();
    f.nativeElement.querySelector('app-learning-writing-prompt .actions button:last-child').click();f.detectChanges();expect(f.nativeElement.querySelector('.options')).not.toBeNull();
    expect(learning.session()!.attempts).toBe(0);draw(canvas,f.nativeElement.querySelector('svg.writing-surface'));
    const answer=module==='kana'?kana.character:kanji.character;
    const buttons=Array.from(f.nativeElement.querySelectorAll('.options button')) as HTMLButtonElement[];
    const wrong=buttons.find(button=>button.textContent?.trim()!==answer)!;wrong.click();await f.whenStable();f.detectChanges();
    expect(learning.session()!.attempts).toBe(1);expect(progress.recordReview).toHaveBeenCalledOnce();
    learning.continueQuick();await f.whenStable();f.detectChanges();expect(f.nativeElement.querySelector('.options')).toBeNull();expect(canvas.strokes()).toHaveLength(0);
    f.nativeElement.querySelector('app-learning-writing-prompt .actions button').click();f.detectChanges();
    const correct=(Array.from(f.nativeElement.querySelectorAll('.options button')) as HTMLButtonElement[]).find(button=>button.textContent?.trim()===answer)!;correct.click();
    expect(progress.recordReview).toHaveBeenCalledOnce();expect(progress.recordPracticeAttempt).toHaveBeenCalledOnce();
    learning.clear();learning.start('quick-practice');await f.whenStable();f.detectChanges();expect(f.nativeElement.querySelector('.options')).toBeNull();expect(canvas.strokes()).toHaveLength(0);
  });
  it('keeps the opposite direction unchanged',async()=>{
    kanaRound=[{key:`${kana.id}:kana-to-romaji`,kanaId:kana.id,questionType:'kana-to-romaji'}];
    kanjiRound=[{key:`kanji:${kanji.id}:kanji-to-meaning`,kanjiId:kanji.id,questionType:'kanji-to-meaning'}];
    const f=await render('quick-practice');expect(f.nativeElement.querySelector('app-learning-writing-prompt')).toBeNull();expect(f.nativeElement.querySelector('.options')).not.toBeNull();
  });
  if(module==='kanji')it('keeps a blank canvas usable when Kanji assets fail',async()=>{
    TestBed.overrideProvider(JapaneseGlyphService,{useValue:{load:async()=>{throw Error('Missing local resource');}}});
    const f=await render();expect(f.nativeElement.querySelector('app-learning-writing-prompt [role="status"]')).not.toBeNull();
    const canvas=f.debugElement.query(By.directive(KanaWritingCanvas)).componentInstance as KanaWritingCanvas;
    draw(canvas,f.nativeElement.querySelector('svg.writing-surface'));expect(canvas.strokes()).toHaveLength(1);expect(f.nativeElement.querySelector('.reveal')).not.toBeNull();
  });
});

import {TestBed} from '@angular/core/testing';
import {signal} from '@angular/core';
import {provideRouter} from '@angular/router';
import {IDBFactory,IDBKeyRange} from 'fake-indexeddb';
import {AttemptEvent} from '../models/attempt-event.model';
import {AttemptEventRepository} from './attempt-event.repository';
import {AttemptRecordingService} from './attempt-recording.service';
import {LearningSessionService} from './learning-session.service';
import {KanjiSessionService} from './kanji-session.service';
import {VocabularySessionService} from './vocabulary-session.service';
import {ProgressService} from './progress.service';
import {KanjiProgressService} from './kanji-progress.service';
import {VocabularyProgressService} from './vocabulary-progress.service';
import {DailyLearningService} from './daily-learning.service';
import {MedalService} from './medal.service';
import {KanjiMedalService} from './kanji-medal.service';
import {VocabularyMedalService} from './vocabulary-medal.service';
import {SessionHistoryService} from './session-history.service';
import {WeaknessService} from './weakness.service';
import {ALL_KANA} from '../../data/kana';
import {KANJI_N5} from '../../data/kanji-n5.generated';
import {VOCABULARY_N5} from '../../data/vocabulary-n5.generated';
import {GrammarPracticeSession} from '../../features/grammar/services/grammar-practice-session';
import {GRAMMAR_LESSONS} from '../../features/grammar/data/grammar-catalog';
import {KanaWritingPage} from '../../features/writing/kana-writing.page';
import {KanjiWritingPage} from '../../features/kanji-writing/kanji-writing.page';
import {VocabularyWritingPage} from '../../features/vocabulary-writing/vocabulary-writing.page';
import {VocabularyListeningPage} from '../../features/vocabulary-listening/vocabulary-listening.page';
import {JapaneseAudioService} from './japanese-audio.service';
import {JapaneseGlyphService} from './japanese-glyph.service';
import {VOCABULARY_AUDIO_MANIFEST} from '../../data/vocabulary-audio-manifest.generated';
import {KanaStrokesService} from './kana-strokes.service';

describe('AttemptEvent integration at real grading boundaries',()=>{
  const history={record:vi.fn()},daily={isCompletedToday:()=>false,refresh:vi.fn()};
  const progress={buildRound:vi.fn(),recordReview:vi.fn(),recordPracticeAttempt:vi.fn(),roundSummary:()=>({roundNew:0,roundDue:0})};
  const audioState=signal('ready');
  beforeEach(()=>{
    TestBed.resetTestingModule();localStorage.clear();vi.clearAllMocks();audioState.set('ready');
    vi.stubGlobal('indexedDB',new IDBFactory());vi.stubGlobal('IDBKeyRange',IDBKeyRange);
    vi.stubGlobal('matchMedia',vi.fn(()=>({matches:false,addEventListener:vi.fn(),removeEventListener:vi.fn()})));
    TestBed.configureTestingModule({providers:[provideRouter([]),GrammarPracticeSession,
      {provide:SessionHistoryService,useValue:history},{provide:DailyLearningService,useValue:daily},
      ...[ProgressService,KanjiProgressService,VocabularyProgressService].map(provide=>({provide,useValue:progress})),
      ...[MedalService,KanjiMedalService,VocabularyMedalService].map(provide=>({provide,useValue:{evaluateUnlocks:()=>[]}})),
      {provide:JapaneseGlyphService,useValue:{load:async()=>[]}},{provide:KanaStrokesService,useValue:{load:async()=>[]}},
      {provide:JapaneseAudioService,useValue:{state:audioState,hasAudio:(id:string)=>Object.hasOwn(VOCABULARY_AUDIO_MANIFEST,id),play:async()=>'played',stop:()=>{}}}
    ]});
  });
  afterEach(async()=>{await TestBed.inject(AttemptRecordingService).settle();TestBed.resetTestingModule();vi.unstubAllGlobals();vi.restoreAllMocks();vi.useRealTimers();});
  async function events(){await TestBed.inject(AttemptRecordingService).settle();const values:AttemptEvent[]=[];await TestBed.inject(AttemptEventRepository).scan({from:'0000',to:'9999'},e=>{values.push(e);});return values;}
  for(const module of ['kana','kanji','vocabulary'] as const){
    function learning(){
      const unit=module==='kana'?{key:'a',kanaId:ALL_KANA[0].id,questionType:'romaji-to-kana'}:module==='kanji'?{key:'a',kanjiId:KANJI_N5[0].id,questionType:'meaning-to-kanji'}:{key:'a',entryId:VOCABULARY_N5[0].id,questionType:'meaning-to-japanese'};
      progress.buildRound.mockReturnValue([unit]);
      return module==='kana'?TestBed.inject(LearningSessionService):module==='kanji'?TestBed.inject(KanjiSessionService):TestBed.inject(VocabularySessionService);
    }
    it(`${module}: keeps Again/Hard/Good separate, logs repetitions once and leaves FSRS review counts unchanged`,async()=>{
      const service=learning();service.start('self-assessment');expect(await events()).toEqual([]);
      for(const rating of ['again','hard','good'] as const){service.reveal();expect((await events()).length).toBe(service.session()!.attempts);service.rate(rating);}
      const recorded=await events();expect(recorded.map(e=>e.result)).toEqual([{source:'self',rating:'again'},{source:'self',rating:'hard'},{source:'self',rating:'good'}]);
      expect(recorded.map(e=>e.firstAttempt)).toEqual([true,false,false]);expect(new Set(recorded.map(e=>e.id)).size).toBe(3);
      expect(progress.recordReview).toHaveBeenCalledTimes(1);expect(progress.recordPracticeAttempt).toHaveBeenCalledTimes(2);expect(service.session()!.attempts).toBe(3);
    });
    it(`${module}: objective quick answers and compatible practice record exactly once without FSRS changes`,async()=>{
      const service=learning();service.start('quick-practice');
      const correct=module==='kana'?ALL_KANA[0].character:module==='kanji'?KANJI_N5[0].id:VOCABULARY_N5[0].id;
      service.answerQuick(correct);service.answerQuick(correct);const recorded=await events();expect(recorded).toHaveLength(1);expect(recorded[0].result).toEqual({source:'objective',correct:true});
      service.continueQuick();expect(await events()).toHaveLength(1);expect(TestBed.inject(WeaknessService).records()[0].attempts).toBe(1);
      service.clear();progress.recordReview.mockClear();progress.recordPracticeAttempt.mockClear();
      if(module==='kana')TestBed.inject(LearningSessionService).startPractice([{key:'a',kanaId:ALL_KANA[0].id,questionType:'romaji-to-kana'}]);
      else if(module==='kanji')TestBed.inject(KanjiSessionService).startPractice([{key:'a',kanjiId:KANJI_N5[0].id,questionType:'meaning-to-kanji'}]);
      else TestBed.inject(VocabularySessionService).startPractice([{key:'a',entryId:VOCABULARY_N5[0].id,questionType:'meaning-to-japanese'}]);
      service.answerQuick(correct);expect(await events()).toHaveLength(2);expect(progress.recordReview).not.toHaveBeenCalled();expect(progress.recordPracticeAttempt).not.toHaveBeenCalled();
    });
  }
  for(const module of ['kana','kanji','vocabulary'] as const)it(`${module}: writing reveal alone never emits, explicit assessment uses self provenance`,async()=>{
    const f=module==='kana'?TestBed.createComponent(KanaWritingPage):module==='kanji'?TestBed.createComponent(KanjiWritingPage):TestBed.createComponent(VocabularyWritingPage);
    const c=f.componentInstance;c.start();await f.whenStable();f.detectChanges();c.answer(true);expect(await events()).toEqual([]);
    c.revealed.set(true);expect(await events()).toEqual([]);if(c instanceof VocabularyWritingPage)c.wordFinished.set(true);
    c.answer(false);const recorded=await events();expect(recorded).toHaveLength(1);expect(recorded[0]).toMatchObject({module,activity:'writing',result:{source:'self',rating:'again'}});
    c.answer(true);expect(await events()).toHaveLength(1);
  });
  it('listening commits objective assessment on Continue only after valid playback, with no navigation duplicates',async()=>{
    const f=TestBed.createComponent(VocabularyListeningPage),c=f.componentInstance;c.start();await f.whenStable();
    const q=c.question()!;c.answer(q.options.find(o=>o.correct)!.id);expect(await events()).toEqual([]);c.next();c.next();
    expect(await events()).toHaveLength(1);expect((await events())[0]).toMatchObject({module:'vocabulary',activity:'listening',questionType:q.kind,result:{source:'objective',correct:true}});
    await f.whenStable();c.answer(c.question()!.options.find(o=>!o.correct)!.id);audioState.set('error');c.next();expect(await events()).toHaveLength(1);
  });
  it.each([
    ['ffffffff-ffff-4fff-8fff-ffffffffffff','00000000-0000-4000-8000-000000000000'],
    ['00000000-0000-4000-8000-000000000000','ffffffff-ffff-4fff-8fff-ffffffffffff'],
  ] as const)('Grammar practice/error review preserve exact events with tied timestamps and session IDs %s / %s',async(firstSession,secondSession)=>{
    vi.useFakeTimers({toFake:['Date']});vi.setSystemTime(new Date('2026-10-08T12:00:00.000Z'));
    vi.spyOn(crypto,'randomUUID').mockReturnValueOnce(firstSession).mockReturnValueOnce(secondSession);
    const exercise=GRAMMAR_LESSONS.flatMap(l=>l.concept?.exercises??[])[0];expect(exercise).toBeDefined();
    const session=TestBed.inject(GrammarPracticeSession);session.reset([exercise]);session.start();expect(await events()).toEqual([]);
    session.answer(false);session.answer(true);session.next();session.reviewErrors();session.answer(true);session.next();const recorded=await events();
    expect(recorded).toHaveLength(2);
    const firstId=`${firstSession}:grammar:learn:1`,secondId=`${secondSession}:grammar:learn:1`;
    // scan orders equal dates by primary key; chronology across distinct session UUIDs is not guaranteed.
    expect(recorded.map(e=>e.id)).toEqual([firstId,secondId].sort());
    expect(recorded.map(e=>e.occurredAt)).toEqual(['2026-10-08T12:00:00.000Z','2026-10-08T12:00:00.000Z']);
    const byId=new Map(recorded.map(e=>[e.id,e]));
    expect(byId.get(firstId)).toMatchObject({sessionId:firstSession,itemId:exercise.id,firstAttempt:true,result:{source:'objective',correct:false}});
    expect(byId.get(secondId)).toMatchObject({sessionId:secondSession,itemId:exercise.id,firstAttempt:false,result:{source:'objective',correct:true}});
    expect([byId.get(firstId)?.result,byId.get(secondId)?.result]).toEqual([{source:'objective',correct:false},{source:'objective',correct:true}]);
  });
  it('recording Weakness aggregates directly never fabricates or duplicates AttemptEvents',async()=>{
    const weaknesses=TestBed.inject(WeaknessService);weaknesses.record('kana','a',true);weaknesses.recordLearn('kanji','一','kanji-to-meaning','hard');expect(await events()).toEqual([]);
    expect(daily.refresh).not.toHaveBeenCalled();expect(history.record).not.toHaveBeenCalled();expect(progress.recordReview).not.toHaveBeenCalled();
  });
});

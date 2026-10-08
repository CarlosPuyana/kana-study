import { signal, Type } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ALL_KANA } from '../../data/kana';
import { KANJI_N5 } from '../../data/kanji-n5.generated';
import { VOCABULARY_N5 } from '../../data/vocabulary-n5.generated';
import { LearnPage } from '../../features/learn/learn.page';
import { FlagsPlayPage } from '../../features/flags-play/flags-play.page';
import { KanjiPlayPage } from '../../features/kanji-play/kanji-play.page';
import { VocabularyPlayPage } from '../../features/vocabulary-play/vocabulary-play.page';
import { KanaRushPage } from '../../features/rush/kana-rush.page';
import { KanjiRushPage } from '../../features/rush/kanji-rush.page';
import { VocabularyRushPage } from '../../features/rush/vocabulary-rush.page';
import { LearningSessionService } from './learning-session.service';
import { FlagSessionService } from './flag-session.service';
import { KanjiSessionService } from './kanji-session.service';
import { VocabularySessionService } from './vocabulary-session.service';
import { ProgressService } from './progress.service';
import { FlagProgressService } from './flag-progress.service';
import { KanjiProgressService } from './kanji-progress.service';
import { VocabularyProgressService } from './vocabulary-progress.service';
import { MedalService } from './medal.service';
import { FlagMedalService } from './flag-medal.service';
import { KanjiMedalService } from './kanji-medal.service';
import { VocabularyMedalService } from './vocabulary-medal.service';
import { SessionHistoryService } from './session-history.service';
import { DailyLearningService } from './daily-learning.service';
import { WeaknessService } from './weakness.service';
import { TranslationService } from './translation.service';
import { STUDY_MONOTONIC_NOW } from './study-clock';
import { RushSessionService } from './rush-session.service';
import { LocalRushRepository } from './rush-repository.service';
import { RushMedalService } from './rush-medal.service';
import { SettingsService } from './settings.service';
import { KanjiSettingsService } from './kanji-settings.service';
import { VocabularySettingsService } from './vocabulary-settings.service';
import { RushSettingsService } from './rush-settings.service';
import { RushModule } from '../models/rush.model';
import { GrammarPracticeComponent } from '../../features/grammar/components/grammar-practice';
import { GrammarIntegrationComponent } from '../../features/grammar/components/grammar-integration';
import { GrammarReviewPage } from '../../features/grammar/pages/grammar-review.page';
import { GrammarProgressService } from './grammar-progress.service';
import { GrammarV2ProgressService } from './grammar-v2-progress.service';
import { GRAMMAR_PRACTICES } from '../../features/grammar/data/grammar-catalog';
import { grammarTopicRound } from '../../features/grammar/services/grammar-interactive-catalog';
import { GRAMMAR_V2_INTEGRATION } from '../../data/grammar/grammar-n5-v2.generated';

describe('credited time in the actual study pages', () => {
  let now = 0;
  const history = {record: vi.fn()};
  beforeEach(() => { now = 0; history.record.mockClear(); });
  afterEach(() => { TestBed.resetTestingModule(); vi.restoreAllMocks(); });
  const normalCases = [
    {name:'kana', page:LearnPage, service:LearningSessionService, progress:ProgressService, medal:MedalService,
      unit:{key:'kana',kanaId:ALL_KANA[0].id,questionType:'kana-to-romaji'}},
    {name:'flags',page:FlagsPlayPage,service:FlagSessionService,progress:FlagProgressService,medal:FlagMedalService,
      unit:{key:'flags',countryId:'jp',questionType:'flag-to-country'}},
    {name:'kanji',page:KanjiPlayPage,service:KanjiSessionService,progress:KanjiProgressService,medal:KanjiMedalService,
      unit:{key:'kanji',kanjiId:KANJI_N5[0].id,questionType:'kanji-to-meaning'}},
    {name:'vocabulary',page:VocabularyPlayPage,service:VocabularySessionService,progress:VocabularyProgressService,medal:VocabularyMedalService,
      unit:{key:'vocabulary',entryId:VOCABULARY_N5[0].id,questionType:'japanese-to-meaning'}},
  ];
  for (const c of normalCases) it(`${c.name}: visible counter and final time match history, route destruction clears the clock`, () => {
    TestBed.configureTestingModule({imports:[c.page],providers:[provideRouter([]),
      {provide:STUDY_MONOTONIC_NOW,useValue:()=>now},
      {provide:c.progress,useValue:{buildRound:()=>[c.unit],get:()=>null,recordReview:vi.fn(),recordPracticeAttempt:vi.fn(),roundSummary:signal({roundDue:0,roundNew:1})}},
      {provide:c.medal,useValue:{evaluateUnlocks:()=>[]}},
      {provide:SessionHistoryService,useValue:history},
      {provide:WeaknessService,useValue:{recordLearn:vi.fn()}},
      {provide:DailyLearningService,useValue:{isCompletedToday:()=>false,refresh:vi.fn()}},
      {provide:TranslationService,useValue:{t:(key:string)=>key,language:signal('es')}}]});
    const service = TestBed.inject(c.service as Type<LearningSessionService | FlagSessionService | KanjiSessionService | VocabularySessionService>);
    if (service instanceof FlagSessionService) service.start(); else service.start('self-assessment');
    now=60000; // The page has not appeared yet.
    const fixture=TestBed.createComponent(c.page as Type<unknown>); fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="timer"]').textContent).toContain('00:00');
    now+=4000; service.clock.pause(); service.clock.resume(); fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="timer"]').textContent).toContain('00:04');
    if(service instanceof FlagSessionService){service.answer('jp');service.continue();}
    else {service.reveal();service.rate('good');}
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.results app-study-timer').textContent).toContain('00:04');
    expect(history.record).toHaveBeenCalledWith(expect.objectContaining({durationSeconds:4}));
    now+=60000;service.clock.pause();expect(service.clock.label()).toBe('00:04');
    fixture.destroy();expect(service.clock.seconds()).toBe(0);
  });

  for(const [module,page,contentId] of [
    ['kana',KanaRushPage,ALL_KANA[0].id],['kanji',KanjiRushPage,KANJI_N5[0].id],['vocabulary',VocabularyRushPage,VOCABULARY_N5[0].id],
  ] as const) it(`RUSH ${module}: counter starts on the card and the summary freezes completed time`,async()=>{
    vi.spyOn(page.prototype,'ngOnInit').mockImplementation(async()=>{});
    TestBed.configureTestingModule({imports:[page],providers:[provideRouter([]),
      {provide:STUDY_MONOTONIC_NOW,useValue:()=>now},
      {provide:LocalRushRepository,useValue:{markOpenSessionsInterrupted:async()=>{},createSession:async()=>{},saveProgress:async()=>{},finishSession:async()=>{}}},
      {provide:RushMedalService,useValue:{refresh:async()=>[],newlyUnlocked:signal([])}},
      ...[SettingsService,KanjiSettingsService,VocabularySettingsService,RushSettingsService].map(provide=>({provide,useValue:{}})),
      {provide:TranslationService,useValue:{t:(key:string)=>key,language:signal('es')}}]});
    const service=TestBed.inject(RushSessionService);
    await service.start(module as RushModule,[{key:'unit',module,contentId,questionType:module==='kana'?'kana-to-romaji':module==='kanji'?'kanji-to-meaning':'japanese-to-meaning'}]);
    now=60000;const fixture=TestBed.createComponent(page as Type<unknown>);fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="timer"]').textContent).toContain('00:00');
    now+=15000;service.reveal();await service.next();await service.finish();fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.summary app-study-timer').textContent).toContain('00:10');
    now+=60000;service.clock.pause();expect(service.activeSeconds()).toBe(10);
    fixture.destroy();
  });
  for(const page of [GrammarPracticeComponent,GrammarIntegrationComponent,GrammarReviewPage]) it(`${page.name}: no intro timer, visible exercise timer and frozen final time`,()=>{
    vi.spyOn(window,'scrollTo').mockImplementation(()=>{});
    TestBed.configureTestingModule({imports:[page],providers:[provideRouter([]),
      {provide:STUDY_MONOTONIC_NOW,useValue:()=>now},
      {provide:SessionHistoryService,useValue:history},
      {provide:WeaknessService,useValue:{recordLearn:vi.fn()}},
      {provide:GrammarProgressService,useValue:{state:()=>({concepts:{}}),difficulties:()=>[],buildReview:()=>[],flagDifficulty:vi.fn()}},
      {provide:GrammarV2ProgressService,useValue:{integrationStatus:()=> 'new',coreCompleted:()=>false,state:()=>({}),openIntegration:vi.fn(),recordIntegration:vi.fn()}},
      {provide:TranslationService,useValue:{t:(key:string)=>key,language:signal('es')}}]});
    const fixture=TestBed.createComponent(page as Type<GrammarPracticeComponent | GrammarIntegrationComponent | GrammarReviewPage>);
    if(page===GrammarPracticeComponent)fixture.componentRef.setInput('practice',GRAMMAR_PRACTICES.find(p=>p.topicId==='03'));
    if(page===GrammarIntegrationComponent)fixture.componentRef.setInput('activityId',GRAMMAR_V2_INTEGRATION[0].id);
    fixture.detectChanges();expect(fixture.nativeElement.querySelector('app-study-timer')).toBeNull();
    const session=fixture.componentInstance.session;session.reset(grammarTopicRound('03').slice(0,1));now=60000;
    session.start();fixture.detectChanges();expect(fixture.nativeElement.querySelector('[role="timer"]').textContent).toContain('00:00');
    now+=7000;session.answer(true);session.next();fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('app-study-timer').textContent).toContain('00:07');
    expect(history.record).toHaveBeenCalledWith(expect.objectContaining({durationSeconds:7}));
    now+=60000;session.clock.pause();expect(session.clock.seconds()).toBe(7);
  });
});

import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { SettingsService } from '../../../core/services/settings.service';
import { TranslationService } from '../../../core/services/translation.service';
import { KanjiSessionService } from '../../../core/services/kanji-session.service';
import { VocabularySessionService } from '../../../core/services/vocabulary-session.service';
import { KanjiProgressService } from '../../../core/services/kanji-progress.service';
import { VocabularyProgressService } from '../../../core/services/vocabulary-progress.service';
import { KanjiMedalService } from '../../../core/services/kanji-medal.service';
import { VocabularyMedalService } from '../../../core/services/vocabulary-medal.service';
import { DailyLearningService } from '../../../core/services/daily-learning.service';
import { SessionHistoryService } from '../../../core/services/session-history.service';
import { AttemptRecordingService } from '../../../core/services/attempt-recording.service';
import { WeaknessService } from '../../../core/services/weakness.service';
import { KANJI_N5 } from '../../../data/kanji-n5.generated';
import { VOCABULARY_N5 } from '../../../data/vocabulary-n5.generated';
import { KanjiPlayPage } from '../../../features/kanji-play/kanji-play.page';
import { VocabularyPlayPage } from '../../../features/vocabulary-play/vocabulary-play.page';
import { LearningSessionList } from './learning-session-list';
import type { AppLanguage } from '../../../core/models/settings.model';

describe('Learn result lists use actual engines and catalog targets',()=>{
  const language=signal<AppLanguage>('es'),history=vi.fn(),review=vi.fn(),practice=vi.fn(),record=vi.fn(),navigate=vi.fn();
  const kanji=KANJI_N5.filter(k=>k.enabled).slice(0,3),words=VOCABULARY_N5.filter(w=>w.enabled).slice(0,3);
  let kanjiRound=()=>[
    {key:`kanji:${kanji[1].id}:kanji-to-meaning`,kanjiId:kanji[1].id,questionType:'kanji-to-meaning' as const},
    {key:`kanji:${kanji[0].id}:kanji-to-meaning`,kanjiId:kanji[0].id,questionType:'kanji-to-meaning' as const},
    {key:`kanji:${kanji[1].id}:meaning-to-kanji`,kanjiId:kanji[1].id,questionType:'meaning-to-kanji' as const},
  ];
  const wordRound=()=>[
    {key:`vocab:${words[1].id}:japanese-to-meaning`,entryId:words[1].id,questionType:'japanese-to-meaning' as const},
    {key:`vocab:${words[0].id}:japanese-to-reading`,entryId:words[0].id,questionType:'japanese-to-reading' as const},
    {key:`vocab:${words[1].id}:reading-to-japanese`,entryId:words[1].id,questionType:'reading-to-japanese' as const},
  ];
  beforeEach(()=>{
    vi.clearAllMocks();language.set('es');
    const progress=(buildRound:()=>unknown)=>({buildRound,recordReview:review,recordPracticeAttempt:practice,get:()=>null,roundSummary:()=>({roundDue:0,roundNew:10})});
    TestBed.configureTestingModule({providers:[
      {provide:SettingsService,useValue:{language}},
      {provide:KanjiProgressService,useValue:progress(kanjiRound)},
      {provide:VocabularyProgressService,useValue:progress(wordRound)},
      {provide:KanjiMedalService,useValue:{evaluateUnlocks:()=>[]}},
      {provide:VocabularyMedalService,useValue:{evaluateUnlocks:()=>[]}},
      {provide:SessionHistoryService,useValue:{record:history}},
      {provide:AttemptRecordingService,useValue:{begin:()=>({record})}},
      {provide:WeaknessService,useValue:{recordLearn:()=>{}}},
      {provide:DailyLearningService,useValue:{isCompletedToday:()=>false,refresh:()=>{}}},
      {provide:Router,useValue:{navigateByUrl:navigate}},
    ]});
  });
  afterEach(()=>{TestBed.resetTestingModule();vi.restoreAllMocks();});
  for(const module of ['kanji','vocabulary'] as const)for(const mode of ['self-assessment','quick-practice'] as const)for(const extra of [false,true]){
    it(`${module}, ${mode}, ${extra?'additional practice':'daily Learn'}: repeated targets, order, unique count and unchanged totals`,()=>{
      const k=module==='kanji',engine=k?TestBed.inject(KanjiSessionService):TestBed.inject(VocabularySessionService);
      const fixture=k?TestBed.createComponent(KanjiPlayPage):TestBed.createComponent(VocabularyPlayPage);
      if(extra){if(k)TestBed.inject(KanjiSessionService).startPractice(kanjiRound(),mode);else TestBed.inject(VocabularySessionService).startPractice(wordRound(),mode);}else engine.start(mode);
      fixture.detectChanges();expect(fixture.nativeElement.querySelector('app-learning-session-list')).toBeNull();
      expect(fixture.nativeElement.querySelector('.results-shell')).toBeNull();
      let turns=0;
      while(!engine.completed()&&turns<10){
        const target=k?TestBed.inject(KanjiSessionService).currentKanji()!.id:TestBed.inject(VocabularySessionService).currentEntry()!.id;
        if(mode==='self-assessment'){engine.reveal();engine.rate(turns===0?'again':'good');}
        else {const wrong=engine.options('es').find(o=>o.id!==target)!;engine.answerQuick(turns===0?wrong.id:target);engine.continueQuick();}
        turns++;
      }
      expect(engine.completed()).toBe(true);expect(turns).toBe(4);
      const before=structuredClone(engine.session()),writes=[review.mock.calls.length,practice.mock.calls.length,record.mock.calls.length,history.mock.calls.length];
      fixture.detectChanges();
      const root=fixture.nativeElement as HTMLElement,list=root.querySelector('app-learning-session-list')!;
      expect([...list.querySelectorAll('li')].map(li=>li.getAttribute('data-entry-id'))).toEqual(k?[kanji[1].id,kanji[0].id]:[words[1].id,words[0].id]);
      expect(list.querySelector('.unique-count')?.textContent).toBe(k?'2 kanji únicos':'2 palabras únicas');
      expect(root.querySelector('.round-stats div strong')?.textContent).toBe('4');
      expect(root.querySelector('.results>p')?.textContent).toContain('3');
      expect(list.querySelector('button,a,input,[tabindex]')).toBeNull();
      expect(list.querySelector('[lang=ja]')).not.toBeNull();
      expect(engine.session()).toEqual(before);
      expect([review.mock.calls.length,practice.mock.calls.length,record.mock.calls.length,history.mock.calls.length]).toEqual(writes);
      expect(review).toHaveBeenCalledTimes(extra?0:3);expect(practice).toHaveBeenCalledTimes(extra?0:1);expect(history).toHaveBeenCalledTimes(extra?0:1);
      if(!extra)expect(history).toHaveBeenCalledWith(expect.objectContaining({module,exercisesCompleted:3,attempts:4,needsPracticeCount:1}));
      expect(root.querySelector<HTMLButtonElement>('.results .secondary')?.disabled).toBe(false);
      if(extra){
        fixture.componentInstance.anotherRound();fixture.detectChanges();expect(root.querySelector('app-learning-session-list')).toBeNull();expect(engine.session()?.attempts).toBe(0);
        if(k)TestBed.inject(KanjiSessionService).startPractice([{key:'new',kanjiId:kanji[2].id,questionType:'kanji-to-meaning'}],mode);
        else TestBed.inject(VocabularySessionService).startPractice([{key:'new',entryId:words[2].id,questionType:'japanese-to-meaning'}],mode);
        if(mode==='self-assessment'){engine.reveal();engine.rate('good');}else{engine.answerQuick(k?kanji[2].id:words[2].id);engine.continueQuick();}
        fixture.detectChanges();expect([...root.querySelectorAll('app-learning-session-list li')].map(li=>li.getAttribute('data-entry-id'))).toEqual([k?kanji[2].id:words[2].id]);
      }
      fixture.componentInstance.exit();fixture.detectChanges();expect(root.querySelector('app-learning-session-list')).toBeNull();expect(navigate).toHaveBeenCalledWith('/'+module);
    });
  }
  for(const lang of ['es','en','ca'] as const)it('renders original catalog content, labelled readings, furigana and singular/plural in '+lang,()=>{
    language.set(lang);const fixture=TestBed.createComponent(LearningSessionList);
    fixture.componentRef.setInput('content',{kind:'kanji',entries:[kanji[0]]});fixture.detectChanges();
    const i18n=TestBed.inject(TranslationService),root=fixture.nativeElement as HTMLElement;
    expect(root.querySelector('h2')?.textContent).toBe(i18n.t('sessionList.kanji.title'));
    expect(root.textContent).toContain(kanji[0].character);expect(root.textContent).toContain(kanji[0].meanings[lang].join(' · '));
    if(kanji[0].onyomi.length)expect(root.querySelector('dl')?.textContent).toContain(i18n.t('kanji.onyomi'));
    if(kanji[0].kunyomi.length)expect(root.querySelector('dl')?.textContent).toContain(kanji[0].kunyomi.join(' · '));
    expect(root.querySelector('.unique-count')?.textContent).toBe(i18n.t('sessionList.kanji.one',{count:1}));
    const entry=VOCABULARY_N5.find(w=>w.furigana.some(s=>s.reading))!;
    fixture.componentRef.setInput('content',{kind:'vocabulary',entries:[entry]});fixture.detectChanges();
    expect(root.querySelector('h2')?.textContent).toBe(i18n.t('sessionList.vocabulary.title'));
    expect(root.querySelector('.reading')?.textContent).toBe(entry.primaryReading);
    expect(root.textContent).toContain(entry.quizMeaning[lang]);expect(root.querySelector('ruby')).not.toBeNull();
    expect(root.querySelector('.unique-count')?.textContent).toBe(i18n.t('sessionList.vocabulary.one',{count:1}));
    fixture.componentRef.setInput('content',{kind:'vocabulary',entries:words});fixture.detectChanges();
    expect(root.querySelector('.unique-count')?.textContent).toBe(i18n.t('sessionList.vocabulary.many',{count:3}));
    expect(root.textContent).not.toContain('sessionList.');
  });
  it('retains two controlled homographs with distinct IDs as separate neutral rows',()=>{
    const fixture=TestBed.createComponent(LearningSessionList),a={...words[0],id:'homograph-a'},b={...words[0],id:'homograph-b'};
    fixture.componentRef.setInput('content',{kind:'vocabulary',entries:[a,b]});fixture.detectChanges();
    expect([...fixture.nativeElement.querySelectorAll('li')].map((li:HTMLElement)=>li.getAttribute('data-entry-id'))).toEqual(['homograph-a','homograph-b']);
    expect(fixture.nativeElement.querySelector('.unique-count').textContent).toBe('2 palabras únicas');
  });
});

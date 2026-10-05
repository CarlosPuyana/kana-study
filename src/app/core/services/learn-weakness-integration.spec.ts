import {signal} from '@angular/core';
import {TestBed} from '@angular/core/testing';
import {ALL_KANA} from '../../data/kana';
import {VOCABULARY_N5} from '../../data/vocabulary-n5.generated';
import {KANJI_N5} from '../../data/kanji-n5.generated';
import {StudyUnit} from '../models/progress.model';
import {VocabularyStudyUnit} from '../models/vocabulary.model';
import {KanjiStudyUnit} from '../models/kanji.model';
import {WeaknessService} from './weakness.service';
import {StorageService} from './storage.service';
import {LearningSessionService} from './learning-session.service';
import {VocabularySessionService} from './vocabulary-session.service';
import {KanjiSessionService} from './kanji-session.service';
import {ProgressService} from './progress.service';
import {VocabularyProgressService} from './vocabulary-progress.service';
import {KanjiProgressService} from './kanji-progress.service';
import {MedalService} from './medal.service';
import {VocabularyMedalService} from './vocabulary-medal.service';
import {KanjiMedalService} from './kanji-medal.service';
import {DailyLearningService} from './daily-learning.service';
import {SessionHistoryService} from './session-history.service';

for(const module of ['kana','vocabulary','kanji'] as const){
  describe(`${module} Learn weakness integration`,()=>{
    function setup(){
      const kanaUnits:StudyUnit[]=ALL_KANA.slice(0,2).map(k=>({key:`${k.id}:kana-to-romaji`,kanaId:k.id,questionType:'kana-to-romaji'}));
      const vocabularyUnits:VocabularyStudyUnit[]=VOCABULARY_N5.slice(0,2).map(e=>({key:`vocab:${e.id}:japanese-to-meaning`,entryId:e.id,questionType:'japanese-to-meaning'}));
      const kanjiUnits:KanjiStudyUnit[]=KANJI_N5.slice(0,2).map(k=>({key:`kanji:${k.id}:kanji-to-meaning`,kanjiId:k.id,questionType:'kanji-to-meaning'}));
      const units=module==='kana'?kanaUnits:module==='vocabulary'?vocabularyUnits:kanjiUnits;
      const progress={buildRound:vi.fn(()=>units.slice(0,1)),recordReview:vi.fn(),recordPracticeAttempt:vi.fn()};
      const history={record:vi.fn()},daily={isCompletedToday:vi.fn(()=>false),refresh:vi.fn()},medals={evaluateUnlocks:vi.fn(()=>[])};
      const stored=new Map<string,unknown>();
      TestBed.configureTestingModule({providers:[
        {provide:StorageService,useValue:{get:(key:string,fallback:unknown)=>stored.get(key)??fallback,set:(key:string,value:unknown)=>stored.set(key,value),rawKey:(key:string)=>key,cloudRevision:signal(0)}},
        ...[ProgressService,VocabularyProgressService,KanjiProgressService].map(provide=>({provide,useValue:progress})),
        ...[MedalService,VocabularyMedalService,KanjiMedalService].map(provide=>({provide,useValue:medals})),
        {provide:DailyLearningService,useValue:daily},{provide:SessionHistoryService,useValue:history},
      ]});
      const kana=TestBed.inject(LearningSessionService),vocabulary=TestBed.inject(VocabularySessionService),kanji=TestBed.inject(KanjiSessionService);
      const service=module==='kana'?kana:module==='vocabulary'?vocabulary:kanji;
      const focus=(mode:'quick-practice'|'self-assessment'='quick-practice')=>module==='kana'?kana.startPractice([kanaUnits[1],kanaUnits[1]],mode):module==='vocabulary'?vocabulary.startPractice([vocabularyUnits[1],vocabularyUnits[1]],mode):kanji.startPractice([kanjiUnits[1],kanjiUnits[1]],mode);
      const twoDirections=()=>module==='kana'?kana.startPractice([kanaUnits[0],{...kanaUnits[0],questionType:'romaji-to-kana'}]):module==='vocabulary'?vocabulary.startPractice([vocabularyUnits[0],{...vocabularyUnits[0],questionType:'meaning-to-japanese'}]):kanji.startPractice([kanjiUnits[0],{...kanjiUnits[0],questionType:'meaning-to-kanji'}]);
      const answer=()=>module==='kana'?kana.answer():module==='vocabulary'?vocabulary.currentUnit()!.entryId:kanji.currentUnit()!.kanjiId;
      return {service,focus,twoDirections,answer,progress,history,daily,medals,units,weakness:TestBed.inject(WeaknessService)};
    }
    afterEach(()=>TestBed.resetTestingModule());
    it('records quick Good once per evaluation and ignores duplicate clicks',()=>{
      const s=setup();s.service.start('quick-practice');s.service.answerQuick(s.answer());s.service.answerQuick(s.answer());
      expect(s.weakness.records()[0]).toEqual(expect.objectContaining({module,activity:'learn',attempts:1,score:0,failures:0,consecutiveCorrect:1,questionType:s.units[0].questionType}));
      expect(s.progress.recordReview).toHaveBeenCalledTimes(1);
    });
    it('records quick Again and later Good as separate evaluations with only one FSRS review',()=>{
      const s=setup();s.service.start('quick-practice');s.service.answerQuick('wrong');s.service.continueQuick();
      expect(s.weakness.records()[0].score).toBe(2);s.service.answerQuick(s.answer());s.service.continueQuick();
      expect(s.weakness.records()[0]).toEqual(expect.objectContaining({score:1,attempts:2,failures:1,consecutiveCorrect:1}));
      expect(s.progress.recordReview).toHaveBeenCalledTimes(1);expect(s.progress.recordPracticeAttempt).toHaveBeenCalledTimes(1);
    });
    it('records self-assessment Again, Hard and Good and preserves FSRS first-review semantics',()=>{
      const s=setup();s.service.start('self-assessment');
      for(const rating of ['again','hard','good'] as const){s.service.reveal();s.service.rate(rating);}
      expect(s.weakness.records()[0]).toEqual(expect.objectContaining({score:2,attempts:3,failures:1,consecutiveCorrect:1}));
      expect(s.progress.recordReview).toHaveBeenCalledTimes(1);expect(s.progress.recordPracticeAttempt).toHaveBeenCalledTimes(2);
    });
    it('focuses only supplied unique units even after Daily Learning is completed',()=>{
      const s=setup();s.daily.isCompletedToday.mockReturnValue(true);expect(s.focus()).toBe(true);
      expect(s.service.session()?.units.map(u=>u.key)).toEqual([s.units[1].key]);
      expect(s.service.isPractice()).toBe(true);expect(s.progress.buildRound).not.toHaveBeenCalled();
    });
    it('additional practice updates weaknesses without FSRS, daily history or medals',()=>{
      const s=setup();s.focus('self-assessment');
      for(const rating of ['again','hard','good'] as const){s.service.reveal();s.service.rate(rating);}
      expect(s.service.completed()).toBe(true);expect(s.weakness.records()[0].attempts).toBe(3);
      expect(s.progress.recordReview).not.toHaveBeenCalled();expect(s.progress.recordPracticeAttempt).not.toHaveBeenCalled();
      expect(s.history.record).not.toHaveBeenCalled();expect(s.daily.refresh).not.toHaveBeenCalled();expect(s.medals.evaluateUnlocks).not.toHaveBeenCalled();
    });
    it('normal sessions still update FSRS, daily history and medals',()=>{
      const s=setup();s.service.start('quick-practice');s.service.answerQuick(s.answer());s.service.continueQuick();
      expect(s.progress.recordReview).toHaveBeenCalledTimes(1);expect(s.history.record).toHaveBeenCalledTimes(1);
      expect(s.daily.refresh).toHaveBeenCalledTimes(1);expect(s.medals.evaluateUnlocks).toHaveBeenCalledTimes(1);
    });
    it('restart retains additional-practice isolation',()=>{
      const s=setup();s.focus();s.service.answerQuick(s.answer());s.service.continueQuick();
      expect(s.service.restart()).toBe(true);s.service.answerQuick(s.answer());s.service.continueQuick();
      expect(s.service.isPractice()).toBe(true);expect(s.progress.buildRound).not.toHaveBeenCalled();expect(s.history.record).not.toHaveBeenCalled();
    });
    it('keeps two question directions of the same item as different practice units and histories',()=>{
      const s=setup();s.twoDirections();expect(s.service.session()?.sessionSize).toBe(2);
      for(let n=0;n<2;n++){s.service.answerQuick('wrong');s.service.continueQuick();}
      const records=s.weakness.records();expect(records).toHaveLength(2);
      expect(new Set(records.map(r=>r.questionType)).size).toBe(2);
      expect(new Set(records.map(r=>r.itemId)).size).toBe(1);
    });
  });
}

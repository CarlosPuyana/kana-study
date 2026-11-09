import {inject,Provider,signal} from '@angular/core';
import {KanjiAnswerIntent,KanjiAnswerRequest,KanjiAnswerStore} from './kanji-answer-store';
import {KanjiProgressService} from './kanji-progress.service';
import {WeaknessService} from './weakness.service';
import {AttemptEventRepository} from './attempt-event.repository';
import {SessionHistoryService} from './session-history.service';

/** Adapter for pre-existing engine/presentation unit tests with mocked progress.
 * Real persistence/failure/activation contracts are exercised with the real store in kanji-integrity.spec.
 */
export const isolatedKanjiAnswers:Provider={provide:KanjiAnswerStore,useFactory:()=>{
  const progress=inject(KanjiProgressService),weakness=inject(WeaknessService),attempts=inject(AttemptEventRepository),history=inject(SessionHistoryService);
  return {error:signal(false),hasPending:()=>false,recover:async()=>{},
    finish:(summary:Parameters<SessionHistoryService['record']>[0])=>history.record(summary,{strict:true}),
    prepare:(request:KanjiAnswerRequest)=>({...request,attempt:request.attempt}) as unknown as KanjiAnswerIntent,
    commit:async(intent:KanjiAnswerRequest)=>{
      const a=intent.attempt;
      if(intent.progress==='review')progress.recordReview(intent.unit!,intent.rating,intent.rating==='good',a.sessionId!);
      if(intent.progress==='practice')progress.recordPracticeAttempt(intent.unit!,intent.rating==='good');
      if(a.activity==='learn')weakness.recordLearn('kanji',a.itemId,a.questionType!,intent.rating);
      else weakness.record('kanji',a.itemId,intent.rating==='good');
      await attempts.insert(a);
    },
  };
}};

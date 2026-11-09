import { inject, Injectable } from '@angular/core';
import { VocabularyDailyLesson, VOCABULARY_LESSONS_KEY } from '../models/vocabulary-lesson.model';
import { VOCABULARY_QUESTION_TYPES } from '../models/vocabulary.model';
import { StorageService } from './storage.service';
import { getSpainDayKey } from './daily-learning.service';
import { CARD_STUDY_LIMIT_MS } from './card-study-time';

const count=(n:unknown):n is number=>typeof n==='number'&&Number.isInteger(n)&&n>=0;
export function validVocabularyLesson(value:unknown):value is VocabularyDailyLesson {
  try {
    if(!value||typeof value!=='object')return false;
    const v=value as VocabularyDailyLesson,s=v.session;
    if(![1,2].includes(v.version)||!/^\d{4}-\d{2}-\d{2}$/.test(v.day)||![10,15].includes(v.size)||!s||!s.id
      ||!Number.isFinite(Date.parse(s.startedAt))||!(s.completedAt===null||Number.isFinite(Date.parse(s.completedAt)))
      ||!['quick-practice','self-assessment'].includes(s.mode)||!Array.isArray(s.units)||!s.units.length||s.units.length>v.size
      ||new Set(s.units.map(u=>u.entryId)).size!==s.units.length
      ||!s.units.every(u=>typeof u.entryId==='string'&&VOCABULARY_QUESTION_TYPES.includes(u.questionType)&&u.key===`vocab:${u.entryId}:${u.questionType}`&&['new','review','direction'].includes(v.kinds?.[u.key]))
      ||!Array.isArray(s.items)||s.items.length!==s.units.length||!s.units.every(u=>s.items.filter(i=>i.studyKey===u.key).length===1)
      ||!s.items.every(i=>count(i.attempts)&&count(i.appearances)&&typeof i.resolved==='boolean'&&typeof i.needsPractice==='boolean'&&(i.initialRating===null||['again','hard','good'].includes(i.initialRating)))
      ||s.attempts!==s.items.reduce((sum,i)=>sum+i.attempts,0)||s.sessionSize!==s.units.length
      ||!count(v.durationSeconds)||v.durationSeconds>s.attempts*(CARD_STUDY_LIMIT_MS/1000)||s.completedAt&&!s.items.every(i=>i.resolved))return false;
    if(v.version===1)return s.items.every(i=>[0,1].includes(i.attempts)&&i.resolved===(i.attempts===1));
    const legacy=v.legacyResolvedKeys??[],pending=v.pendingKeys;
    return Array.isArray(legacy)&&new Set(legacy).size===legacy.length&&legacy.every(key=>s.items.some(i=>i.studyKey===key&&i.resolved&&i.attempts===1&&i.consecutiveCorrect===0))
      &&s.items.every(i=>count(i.consecutiveCorrect)&&i.consecutiveCorrect<=2&&[i.againCount,i.hardCount,i.goodCount].every(count)
        &&i.attempts===i.againCount!+i.hardCount!+i.goodCount!&&i.consecutiveCorrect<=i.goodCount!
        &&(i.attempts===0)===(i.initialRating===null)&&i.resolved===(i.consecutiveCorrect===2||legacy.includes(i.studyKey)))
      &&Array.isArray(pending)&&new Set(pending).size===pending.length&&pending.length===s.items.filter(i=>!i.resolved).length
      &&pending.every(key=>s.items.some(i=>i.studyKey===key&&!i.resolved));
  }catch{return false;}
}
/** Preserve the old completion contract; only unanswered V1 words adopt consolidation. */
export function consolidateVocabularyLesson(value:VocabularyDailyLesson):VocabularyDailyLesson {
  if(value.version===2||value.session.completedAt)return value;
  return {...value,version:2,legacyResolvedKeys:value.session.items.filter(i=>i.resolved).map(i=>i.studyKey),
    pendingKeys:value.session.units.filter(u=>!value.session.items.find(i=>i.studyKey===u.key)!.resolved).map(u=>u.key),
    session:{...value.session,items:value.session.items.map(i=>({...i,consecutiveCorrect:0,
      againCount:i.againCount??Number(i.initialRating==='again'),hardCount:i.hardCount??Number(i.initialRating==='hard'),goodCount:i.goodCount??Number(i.initialRating==='good')}))}};
}
@Injectable({providedIn:'root'})
export class VocabularyLessonRepository {
  private readonly storage=inject(StorageService);
  all():Record<string,VocabularyDailyLesson>{const value=this.storage.get<Record<string,VocabularyDailyLesson>>(VOCABULARY_LESSONS_KEY,{});if(!value||typeof value!=='object'||Array.isArray(value)||Object.entries(value).some(([day,v])=>!validVocabularyLesson(v)||v.day!==day))throw Error('Invalid daily vocabulary lessons');return value;}
  active():VocabularyDailyLesson|null{return Object.values(this.all()).filter(v=>!v.session.completedAt).sort((a,b)=>a.day.localeCompare(b.day))[0]??null;}
  completed(now=new Date()):boolean {const day=getSpainDayKey(now);return Object.values(this.all()).some(v=>v.day===day&&!!v.session.completedAt||v.session.completedAt&&getSpainDayKey(new Date(v.session.completedAt))===day);}
  save(value:VocabularyDailyLesson):void{
    if(!validVocabularyLesson(value))throw Error('Invalid vocabulary lesson');
    const all=this.all(),previous=all[value.day];
    if(previous){
      const identity=(v:VocabularyDailyLesson)=>JSON.stringify([v.session.id,v.day,v.size,v.kinds,v.session.mode,v.session.startedAt,v.session.units]);
      if(identity(previous)!==identity(value)||previous.version>value.version||previous.session.attempts>value.session.attempts
        ||previous.session.completedAt&&previous.session.completedAt!==value.session.completedAt
        ||previous.session.items.some(i=>i.resolved&&!value.session.items.find(n=>n.studyKey===i.studyKey)?.resolved))throw Error('Vocabulary lesson changed');
      if(previous.version===value.version&&previous.session.attempts===value.session.attempts&&JSON.stringify(previous.session)!==JSON.stringify(value.session)
        &&!(previous.session.completedAt===null&&value.session.completedAt))throw Error('Vocabulary receipt conflict');
    }
    this.storage.set(VOCABULARY_LESSONS_KEY,{...all,[value.day]:value},{strict:true,localOnly:true});
  }
}

import {inject,Injectable} from '@angular/core';
import {LocalWorkspaceId} from '../models/account.model';
import {KanjiLearningSession,KanjiSessionFeedback} from '../models/kanji-session.model';
import {WorkspaceService} from './workspace.service';
import {StorageService} from './storage.service';
import {getSpainDayKey} from './daily-learning.service';
export const KANJI_ROUND_KEY='kana-study.kanji-open-round.v1';
export interface KanjiRoundSnapshot {
  version:1;owner:LocalWorkspaceId;day:string;session:KanjiLearningSession;
  queue:readonly string[];queueIndex:number;revealed:boolean;feedback:KanjiSessionFeedback|null;
  durationSeconds:number;advancePending:boolean;
}
export function validKanjiRound(v:unknown):v is KanjiRoundSnapshot {
  if(!v||typeof v!=='object')return false;const r=v as KanjiRoundSnapshot,s=r.session;
  return r.version===1&&typeof r.owner==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(r.day)&&!!s&&typeof s.id==='string'
    &&Number.isFinite(Date.parse(s.startedAt))&&s.completedAt===null&&['quick-practice','self-assessment'].includes(s.mode)
    &&Array.isArray(s.units)&&s.units.length>0&&new Set(s.units.map(u=>u.key)).size===s.units.length
    &&s.units.every(u=>u.key===`kanji:${u.kanjiId}:${u.questionType}`&&['kanji-to-meaning','meaning-to-kanji'].includes(u.questionType))
    &&Array.isArray(s.items)&&s.items.length===s.units.length&&s.units.every(u=>s.items.filter(i=>i.studyKey===u.key).length===1)
    &&s.items.every(i=>Number.isInteger(i.attempts)&&i.attempts>=0&&Number.isInteger(i.appearances)&&i.appearances>=i.attempts&&typeof i.resolved==='boolean'&&typeof i.needsPractice==='boolean'&&(i.initialRating===null||['again','hard','good'].includes(i.initialRating)))
    &&s.attempts===s.items.reduce((n,i)=>n+i.attempts,0)&&s.sessionSize===s.units.length
    &&Array.isArray(r.queue)&&r.queue.every(k=>s.units.some(u=>u.key===k))&&Number.isInteger(r.queueIndex)&&r.queueIndex>=0&&r.queueIndex<r.queue.length
    &&typeof r.revealed==='boolean'&&typeof r.advancePending==='boolean'&&Number.isInteger(r.durationSeconds)&&r.durationSeconds>=0;
}
@Injectable({providedIn:'root'})
export class KanjiRoundRepository {
  private readonly workspace=inject(WorkspaceService);private readonly storage=inject(StorageService);
  read():KanjiRoundSnapshot|null{
    const raw=localStorage.getItem(this.workspace.storageKey(KANJI_ROUND_KEY));if(raw===null)return null;
    const value:unknown=JSON.parse(raw);if(value&&typeof value==='object'&&'closed'in value&&value.closed===true)return null;if(!validKanjiRound(value)||value.owner!==this.workspace.active())throw Error('Invalid durable Kanji round');
    return value;
  }
  active():KanjiRoundSnapshot|null{const r=this.read();return r&&r.day===getSpainDayKey(new Date())&&!(JSON.parse(localStorage.getItem(this.workspace.storageKey('kana-study.completed-sessions.v1'))??'[]') as {sessionId:string}[]).some(s=>s.sessionId===r.session.id)?r:null;}
  save(r:KanjiRoundSnapshot,epoch:number):void{
    const guard=()=>{if(r.owner!==this.workspace.active()||epoch!==this.workspace.activationRevision())throw Error('Stale Kanji round');};guard();
    if(!validKanjiRound(r))throw Error('Invalid Kanji round snapshot');const raw=JSON.parse(localStorage.getItem(this.workspace.storageKey(KANJI_ROUND_KEY))??'null');if(raw?.closed&&raw.sessionId===r.session.id)throw Error('Kanji round already closed');const previous=this.read();
    if(previous?.session.id===r.session.id&&previous.session.attempts>r.session.attempts)throw Error('Stale Kanji round snapshot');
    if((JSON.parse(localStorage.getItem(this.workspace.storageKey('kana-study.completed-sessions.v1'))??'[]') as {sessionId:string}[]).some(s=>s.sessionId===r.session.id))throw Error('Kanji round already closed');
    this.storage.set(KANJI_ROUND_KEY,r,{strict:true,localOnly:true,owner:r.owner});guard();
  }
  close(sessionId:string,epoch:number){const owner=this.workspace.active();if(epoch!==this.workspace.activationRevision())throw Error('Stale Kanji closure');this.storage.set(KANJI_ROUND_KEY,{closed:true,sessionId,owner},{strict:true,localOnly:true,owner});if(epoch!==this.workspace.activationRevision())throw Error('Stale Kanji closure');}
}

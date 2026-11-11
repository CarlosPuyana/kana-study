import {inject,Injectable,signal} from '@angular/core';
import type {KanjiAnswerIntent} from './kanji-answer-store';
import {KanjiRoundRepository,KANJI_ROUND_KEY,validKanjiRound} from './kanji-round.repository';
import {WorkspaceService} from './workspace.service';
import {StorageService} from './storage.service';
import {AttemptEventRepository} from './attempt-event.repository';
import {retractKanjiAttempt} from './kanji-attempt-retraction';
import {WEAKNESSES_KEY,weaknessKey} from './weakness.service';
import {WeaknessRecord} from '../models/weakness.model';
import {getSpainDayKey} from './daily-learning.service';
import {makeOutboxItem,SyncOutboxService} from './sync-outbox.service';
export const KANJI_UNDO_PENDING='kana-study.kanji-undo-pending.v1';
export const KANJI_REVOKED='kana-study.kanji-revoked.v1';
const RECEIPT='kana-study.kanji-answer-receipt.v1',PROGRESS='kana-study.kanji-progress.v1',EVENTS='kana-study.kanji-review-events.v1';
const same=(a:unknown,b:unknown)=>JSON.stringify(a)===JSON.stringify(b);
@Injectable({providedIn:'root'})
export class KanjiUndoStore {
  private readonly workspace=inject(WorkspaceService);private readonly storage=inject(StorageService);private readonly rounds=inject(KanjiRoundRepository);private readonly attempts=inject(AttemptEventRepository);
  readonly busy=signal(false);readonly revision=signal(0);
  private readonly outbox=inject(SyncOutboxService);
  private read<T>(key:string,fallback:T):T{const raw=localStorage.getItem(this.workspace.storageKey(key));return raw===null?fallback:JSON.parse(raw);}
  pending(){return this.read(KANJI_UNDO_PENDING,null)!==null;}
  eligible(id:string){this.revision();try{const r=this.read<KanjiAnswerIntent|null>(RECEIPT,null),round=this.rounds.active();return !this.busy()&&!this.pending()&&!!r?.roundBefore&&!!r.roundAfter&&round?.session.id===id&&r.attempt.sessionId===id&&round.session.attempts===r.roundAfter.session.attempts&&!this.revoked(r.attempt.id);}catch{return false;}}
  revoked(id:string){return this.read<string[]>(KANJI_REVOKED,[]).includes(id);}
  async undo(id:string){
    if(this.busy())throw Error('Kanji undo running');this.busy.set(true);const owner=this.workspace.active(),epoch=this.workspace.activationRevision();
    const guard=()=>{if(owner!==this.workspace.active()||epoch!==this.workspace.activationRevision())throw Error('Stale Kanji undo');};
    const write=(key:string,value:unknown)=>{guard();this.storage.set(key,value,{strict:true,localOnly:true,owner});guard();};
    try{
      let pending=this.read<{intent:KanjiAnswerIntent;head:unknown}|null>(KANJI_UNDO_PENDING,null);
      if(!pending){const intent=this.read<KanjiAnswerIntent|null>(RECEIPT,null),head=this.rounds.active();
        if(!intent?.roundBefore||!intent.roundAfter||!head||head.session.id!==id||intent.attempt.sessionId!==id||head.day!==getSpainDayKey(new Date())||head.session.attempts!==intent.roundAfter.session.attempts&&!(this.revoked(intent.attempt.id)&&same(head,intent.roundBefore)))throw Error('Kanji undo unavailable');
        pending={intent,head};write(KANJI_UNDO_PENDING,pending);
      }
      const r=pending.intent,before=r.roundBefore,after=r.roundAfter;
      if(r.owner!==owner||!before||!after||!validKanjiRound(before)||!validKanjiRound(after)||before.session.id!==id||after.session.id!==id||after.session.attempts!==before.session.attempts+1)throw Error('Invalid Kanji undo receipt');
      const current=this.rounds.active();if(!same(current,pending.head)&&!same(current,before))throw Error('Kanji round changed');
      const progress=this.read<Record<string,unknown>>(PROGRESS,{}),key=r.after?.key??r.before?.key;
      if(key&&!same(progress[key]??null,r.after)&&!same(progress[key]??null,r.before))throw Error('Kanji card changed');
      const events=this.read<{id:string}[]>(EVENTS,[]),existing=events.find(e=>e.id===r.event?.id);if(existing&&!same(existing,r.event))throw Error('Kanji event changed');
      const records=this.read<WeaknessRecord[]>(WEAKNESSES_KEY,[]),wk=weaknessKey(r.weaknessAfter),weak=records.find(w=>weaknessKey(w)===wk)??null;
      if(!same(weak,r.weaknessBefore)&&!same(weak,r.weaknessAfter))throw Error('Kanji weakness changed');
      const ids=this.read<string[]>(KANJI_REVOKED,[]);write(KANJI_REVOKED,ids.includes(r.attempt.id)?ids:[...ids,r.attempt.id]);
      await retractKanjiAttempt(r.attempt,owner);guard();
      if(key){if(r.before)progress[key]=r.before;else delete progress[key];write(PROGRESS,progress);}
      write(EVENTS,events.filter(e=>e.id!==r.event?.id));const restored=records.filter(w=>weaknessKey(w)!==wk);if(r.weaknessBefore)restored.splice(Math.max(0,Math.min(r.weaknessIndex??restored.length,restored.length)),0,r.weaknessBefore);write(WEAKNESSES_KEY,restored);
      write(KANJI_ROUND_KEY,before);
      for(const [key,value] of [[PROGRESS,progress],[EVENTS,events.filter(e=>e.id!==r.event?.id)]] as const){const item=makeOutboxItem(owner,'local-storage',key,value,'upsert');if(item)await this.outbox.enqueue(item);guard();}
      if(!same(this.rounds.active(),before)||key&&!same(this.read<Record<string,unknown>>(PROGRESS,{})[key]??null,r.before)||this.read<{id:string}[]>(EVENTS,[]).some(e=>e.id===r.event?.id)||!same(this.read<WeaknessRecord[]>(WEAKNESSES_KEY,[]).find(w=>weaknessKey(w)===wk)??null,r.weaknessBefore))throw Error('Kanji undo verification failed');
      guard();localStorage.removeItem(this.workspace.storageKey(KANJI_UNDO_PENDING,owner));guard();
      this.attempts.revision.update(n=>n+1);this.storage.cloudRevision.update(n=>n+1);this.revision.update(n=>n+1);return before;
    }finally{this.busy.set(false);}
  }
}

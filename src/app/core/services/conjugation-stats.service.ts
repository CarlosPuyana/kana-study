import {computed,inject,Injectable,linkedSignal} from '@angular/core';
import {ADJECTIVE_CATEGORIES,COPULA_CATEGORIES,VERB_CATEGORIES,ConjugationCounters,ConjugationStats,ConjugationStatsBucket} from '../models/conjugation-practice.model';
import {StorageService} from './storage.service';
import {WorkspaceService} from './workspace.service';
import {CARD_STUDY_LIMIT_MS} from './card-study-time';

export const CONJUGATION_STATS_KEY='kana-study.conjugation-stats.v1';
const empty=():ConjugationCounters=>({attempts:0,correct:0,wrong:0,bestStreak:0});
export function normalizeConjugationStats(value:unknown):ConjugationStats {
  const keys=[...ADJECTIVE_CATEGORIES,'adjective-i','adjective-na',...VERB_CATEGORIES,...COPULA_CATEGORIES,'mixed'] as const;
  const result:ConjugationStats={version:1,buckets:Object.fromEntries(keys.map(key=>[key,empty()])) as ConjugationStats['buckets']};
  if(!value||typeof value!=='object'||(value as ConjugationStats).version!==1)return result;
  for(const key of keys){
    const c=(value as ConjugationStats).buckets?.[key];
    if(c&&[c.attempts,c.correct,c.wrong,c.bestStreak].every(n=>Number.isSafeInteger(n)&&n>=0)&&c.correct+c.wrong===c.attempts&&c.bestStreak<=c.correct){
      const counters:ConjugationCounters={attempts:c.attempts,correct:c.correct,wrong:c.wrong,bestStreak:c.bestStreak};
      const seconds=c.durationSeconds,timed=c.timedAttempts;
      if(typeof seconds==='number'&&Number.isSafeInteger(seconds)&&seconds>=0&&typeof timed==='number'&&Number.isSafeInteger(timed)&&timed>=0&&timed<=c.attempts&&seconds<=timed*CARD_STUDY_LIMIT_MS/1000){counters.durationSeconds=seconds;counters.timedAttempts=timed;}
      result.buckets[key]=counters;
    }
  }return result;
}
@Injectable({providedIn:'root'})
export class ConjugationStatsService {
  private readonly storage=inject(StorageService);
  private readonly workspace=inject(WorkspaceService);
  private readonly state=linkedSignal(()=>{this.workspace.activationRevision();this.workspace.dataRevision();return normalizeConjugationStats(this.storage.get<unknown>(CONJUGATION_STATS_KEY,null));});
  readonly stats=computed(()=>this.state());
  get(bucket:ConjugationStatsBucket):ConjugationCounters{return this.state().buckets[bucket];}
  record(bucket:ConjugationStatsBucket,correct:boolean,streak:number,durationSeconds:number):void {
    if(!Number.isSafeInteger(durationSeconds)||durationSeconds<0||durationSeconds>CARD_STUDY_LIMIT_MS/1000)throw new RangeError('Invalid credited conjugation time');
    const previous=this.state(),old=previous.buckets[bucket];
    const next:ConjugationStats={version:1,buckets:{...previous.buckets,[bucket]:{attempts:old.attempts+1,correct:old.correct+(correct?1:0),wrong:old.wrong+(correct?0:1),bestStreak:Math.max(old.bestStreak,streak),durationSeconds:(old.durationSeconds??0)+durationSeconds,timedAttempts:(old.timedAttempts??0)+1}}};
    this.storage.set(CONJUGATION_STATS_KEY,next,{localOnly:true,strict:true});this.state.set(next);
  }
}

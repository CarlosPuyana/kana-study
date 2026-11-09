import {computed,inject,Injectable,linkedSignal} from '@angular/core';
import {ConjugationCounters,ConjugationStats,ConjugationStatsBucket} from '../models/conjugation-practice.model';
import {StorageService} from './storage.service';
import {WorkspaceService} from './workspace.service';

export const CONJUGATION_STATS_KEY='kana-study.conjugation-stats.v1';
const empty=():ConjugationCounters=>({attempts:0,correct:0,wrong:0,bestStreak:0});
export function normalizeConjugationStats(value:unknown):ConjugationStats {
  const result:ConjugationStats={version:1,buckets:{'adjective-i':empty(),'adjective-na':empty(),mixed:empty()}};
  if(!value||typeof value!=='object'||(value as ConjugationStats).version!==1)return result;
  for(const key of ['adjective-i','adjective-na','mixed'] as const){
    const c=(value as ConjugationStats).buckets?.[key];
    if(c&&[c.attempts,c.correct,c.wrong,c.bestStreak].every(n=>Number.isSafeInteger(n)&&n>=0)&&c.correct+c.wrong===c.attempts&&c.bestStreak<=c.correct)result.buckets[key]={attempts:c.attempts,correct:c.correct,wrong:c.wrong,bestStreak:c.bestStreak};
  }return result;
}
@Injectable({providedIn:'root'})
export class ConjugationStatsService {
  private readonly storage=inject(StorageService);
  private readonly workspace=inject(WorkspaceService);
  private readonly state=linkedSignal(()=>{this.workspace.activationRevision();this.workspace.dataRevision();return normalizeConjugationStats(this.storage.get<unknown>(CONJUGATION_STATS_KEY,null));});
  readonly stats=computed(()=>this.state());
  get(bucket:ConjugationStatsBucket):ConjugationCounters{return this.state().buckets[bucket];}
  record(bucket:ConjugationStatsBucket,correct:boolean,streak:number):void {
    const previous=this.state(),old=previous.buckets[bucket];
    const next:ConjugationStats={version:1,buckets:{...previous.buckets,[bucket]:{attempts:old.attempts+1,correct:old.correct+(correct?1:0),wrong:old.wrong+(correct?0:1),bestStreak:Math.max(old.bestStreak,streak)}}};
    this.storage.set(CONJUGATION_STATS_KEY,next,{localOnly:true,strict:true});this.state.set(next);
  }
}

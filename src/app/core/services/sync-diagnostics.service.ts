import {Injectable} from '@angular/core';
import {SyncEntityType, SyncOutboxItem, SyncStatus} from '../models/account.model';
import {MangaSavedSyncState} from '../models/manga-study-saved.model';

export type SyncPhase='connect'|'prepare'|'journal-recovery'|'push'|'manga-ack'|'pull'|'outbox-ack'|'pending'|'metadata';
interface Context {phase:SyncPhase;target:string;item?:SyncOutboxItem}
class SyncFailure {constructor(readonly error:unknown,readonly context:Context){}}
export interface SyncDiagnosticReport {
  status:SyncStatus;
  failure:{phase:SyncPhase;target:string;entityType:SyncEntityType|null;category:string|null;code:string;message:string}|null;
  pending:readonly {entityType:SyncEntityType;category:string;ageSeconds:number|null;attempts:number;journalAssociated:boolean;journalMatchesRevision:boolean;inOutbox:boolean;serverResponseReceived:boolean;remote:'unverified'|'confirmed';confirmedAwaitingCleanup:boolean}[];
}
const category=(item:Pick<SyncOutboxItem,'entityType'|'entityKey'>):string=>{
  if(item.entityType!=='local-storage')return item.entityType;
  const key=item.entityKey;
  if(key==='kana-study.grammar-progress.v2')return 'grammar-v2';
  if(key==='kana-study.grammar-progress.v1')return 'grammar-v1';
  if(key==='kana-study.completed-sessions.v1')return 'completed-sessions';
  if(key==='kana-study.deck-settings.v1')return 'deck-settings';
  if(key.includes('settings'))return 'settings';
  if(key.includes('medal-unlocks'))return 'medals';
  if(key.includes('review-events'))return 'review-events';
  if(key.includes('progress'))return 'study-progress';
  return 'other-local-storage';
};

/** Opt-in, memory-only diagnostics. Never expose identifiers, payloads or raw
 * server messages: those can contain private words, user IDs and credentials. */
@Injectable({providedIn:'root'})
export class SyncDiagnosticsService {
  private verified=new Map<string,SyncOutboxItem>();
  private failure:SyncFailure|null=null;
  private attempted=new Set<string>();
  private received=new Set<string>();
  private key(item:SyncOutboxItem):string{return JSON.stringify([item.id,item.revision]);}
  reset():void {this.verified.clear();this.failure=null;this.attempted.clear();this.received.clear();}
  begin():void {this.failure=null;this.attempted.clear();}
  attempting(items:readonly SyncOutboxItem[]):void {for(const item of items)this.attempted.add(this.key(item));}
  attemptedItems(items:readonly SyncOutboxItem[]):SyncOutboxItem[]{return items.filter(item=>this.attempted.has(this.key(item)));}
  responded(item:SyncOutboxItem):void {this.received.add(this.key(item));}
  confirmed(item:SyncOutboxItem):void {this.responded(item);this.verified.set(this.key(item),item);}
  confirmedItems(items:readonly SyncOutboxItem[]):SyncOutboxItem[]{return items.filter(item=>this.verified.has(this.key(item)));}
  cleaned(items:readonly SyncOutboxItem[]):void {for(const item of items){this.verified.delete(this.key(item));this.received.delete(this.key(item));}}
  capture(error:unknown,phase:SyncPhase,target:string):void {this.failure=error instanceof SyncFailure?error:new SyncFailure(error,{phase,target});}
  async run<T>(phase:SyncPhase,target:string,work:()=>Promise<T>,item?:SyncOutboxItem):Promise<T>{
    if(phase==='push'&&item)this.attempting([item]);
    try{return await work();}
    catch(error){
      if(error instanceof SyncFailure)throw new SyncFailure(error.error,{...error.context,item:error.context.item??item});
      throw new SyncFailure(error,{phase,target,item});
    }
  }
  report(status:SyncStatus,queued:readonly SyncOutboxItem[],journals:readonly MangaSavedSyncState[]):SyncDiagnosticReport {
    const f=this.failure,e=f?.error as {code?:unknown;name?:unknown}|undefined;
    const code=typeof e?.code==='string'&&/^(?:[0-9]{2}[A-Z0-9]{3}|XX000|PGRST[0-9]{3})$/.test(e.code)?e.code:
      typeof e?.name==='string'&&['QuotaExceededError','AbortError','InvalidStateError','VersionError','NetworkError','TypeError'].includes(e.name)?e.name:'UNKNOWN';
    const messages:Record<string,string>={'42501':'Server denied the operation.','PGRST301':'Authentication rejected.','PGRST204':'Server schema mismatch.','42P01':'Server table missing.',QuotaExceededError:'Local storage quota exceeded.',AbortError:'Local transaction aborted.',NetworkError:'Network request failed.'};
    const targetTypes:Record<string,SyncEntityType>={deck_card_progress:'deck-card-progress',deck_review_events:'deck-review-event',deck_daily_state:'deck-daily-state',rush_sessions:'rush-session',rush_coverage:'rush-coverage',manga_saved_items:'manga-saved-item',apply_manga_saved_change_v1:'manga-saved-item'};
    const failure=f?{phase:f.context.phase,target:f.context.target,entityType:f.context.item?.entityType??targetTypes[f.context.target]??null,category:f.context.item?category(f.context.item):null,code,message:messages[code]??'Operation failed; raw technical message withheld for privacy.'}:null;
    const pending=queued.map(item=>{
      const date=Date.parse(item.createdAt),confirmed=this.verified.has(this.key(item));
      return {entityType:item.entityType,category:category(item),ageSeconds:Number.isFinite(date)?Math.max(0,Math.floor((Date.now()-date)/1000)):null,attempts:Number.isSafeInteger(item.attempts)&&item.attempts>=0?item.attempts:0,journalAssociated:item.entityType==='manga-saved-item'&&journals.some(s=>s.id===item.entityKey),journalMatchesRevision:item.entityType==='manga-saved-item'&&journals.some(s=>s.id===item.entityKey&&s.pending?.token===item.revision),inOutbox:true,serverResponseReceived:this.received.has(this.key(item)),remote:confirmed?'confirmed' as const:'unverified' as const,confirmedAwaitingCleanup:confirmed};
    });
    for(const journal of journals)if(!queued.some(item=>item.entityType==='manga-saved-item'&&item.entityKey===journal.id))pending.push({entityType:'manga-saved-item',category:'manga-saved-item',ageSeconds:null,attempts:0,journalAssociated:true,journalMatchesRevision:false,inOutbox:false,serverResponseReceived:false,remote:'unverified',confirmedAwaitingCleanup:false});
    return {status,failure,pending};
  }
}

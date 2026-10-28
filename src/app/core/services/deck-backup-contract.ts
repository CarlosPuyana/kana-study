import { deckCardEligible, getLocalStudyDayKey } from './deck-study-time';
import {canonical,digest,validateCard,validateDeck,progressValid,eventValid,dailyValid,settingsValid,id} from './custom-deck-validation';
import {validateMangaConfirmedOperation} from './manga-deck-confirmation';

export const BACKUP_STORES=['decks','cards','progress','events','daily','identities','registry-meta','confirmations','volume-links','journal','reconciliation'] as const;
export type BackupStore=typeof BACKUP_STORES[number];
export type BackupRow={workspace:string;key:string;value:any;head?:string|null;voidedBy?:string;count?:number;canonical?:boolean};
export type BackupRecords=Record<BackupStore,BackupRow[]>;
export const BACKUP_MAX_BYTES=16*1024*1024,BACKUP_MAX_ROWS=30000,BACKUP_MAX_ROW_BYTES=3*1024*1024;
export class DeckBackupError extends Error {constructor(readonly code:string){super(code);}}
export function check(value:unknown,code='invalid'):asserts value {if(!value)throw new DeckBackupError(code);}
const equal=(a:unknown,b:unknown)=>canonical(a)===canonical(b);
const key=(...s:string[])=>JSON.stringify(s);
export function keys(v:any,required:string[],optional:string[]=[]){check(v&&typeof v==='object'&&!Array.isArray(v));check(required.every(k=>Object.hasOwn(v,k))&&Object.keys(v).every(k=>required.includes(k)||optional.includes(k)));}
const date=(s:any)=>typeof s==='string'&&Number.isFinite(Date.parse(s))&&new Date(s).toISOString()===s;
const row=(key:string,value:any,extra:object={}):BackupRow=>({workspace:'guest',key,value,...extra});
export const emptyBackupRecords=():BackupRecords=>({decks:[],cards:[],progress:[],events:[],daily:[],identities:[],'registry-meta':[],confirmations:[],'volume-links':[],journal:[],reconciliation:[]});
export function boundedJson(value:unknown){let nodes=0;function visit(v:any,depth:number){check(++nodes<=400000&&depth<=40,'limit');if(v===null||typeof v==='boolean')return;if(typeof v==='number'){check(Number.isFinite(v));return;}if(typeof v==='string'){check(!/[\uD800-\uDFFF]/u.test(v));return;}check(v&&typeof v==='object');if(Array.isArray(v)){for(const x of v)visit(x,depth+1);}else{check(Object.getPrototypeOf(v)===null||Object.getPrototypeOf(v)?.constructor?.name==='Object');for(const k of Object.keys(v)){check(!['__proto__','constructor','prototype','access_token','refresh_token','accessToken','authorization','cookie','password','privateKey'].includes(k));visit(v[k],depth+1);}}}visit(value,0);}
const card=async(v:any)=>{check(equal(v,await validateCard(v)));};
const deck=(v:any)=>{check(equal(v,validateDeck(v)));};
function fsrs(v:any){keys(v,['due','stability','difficulty','elapsedDays','scheduledDays','learningSteps','reps','lapses','state','lastReview']);}
function daily(v:any){keys(v,['deckId','localDate','introducedEntryIds','newLimitOverride'],['completedAt']);check(dailyValid(v));}
function event(v:any){keys(v,['id','deckId','entryId','reviewedAt','rating','fsrsRating','stateBefore','stateAfter','dueBefore','dueAfter','stabilityBefore','stabilityAfter','difficultyBefore','difficultyAfter','retrievabilityBefore','desiredRetention','elapsedAnswerMs','fsrsLog','cardBefore']);check(eventValid(v));if(v.cardBefore)fsrs(v.cardBefore);keys(v.fsrsLog,['rating','state','due','stability','difficulty','elapsedDays','lastElapsedDays','scheduledDays','learningSteps','review']);}
async function confirmation(p:any){
 keys(p,['schemaVersion','deck','card','expectedContentVersion','confirmation']);await validateMangaConfirmedOperation(p);deck(p.deck);await card(p.card);
 const c=p.confirmation;keys(c,['schemaVersion','id','workspace','actor','confirmedAt','source','entity','selectedProposal','alternatives','totalAlternatives','confirmedMeaning','meaningLanguage','reusedEntity','expertCertified']);check(c.workspace==='guest','owner');keys(c.actor,['kind','workspace']);
 keys(c.source,['volumeId','volumeTitle','pageNumber','blockIndex','lineIndex','range','fragment','surface'],['savedItemId']);keys(c.entity,['schemaVersion','id','identity','word','reading','origin','expertCertified','originReference','registryNamespace','branch']);
 const proposal=(v:any)=>keys(v,['localId','dictionaryId','expression','reading','sequence','glosses','glossLanguage','totalGlosses']);if(c.selectedProposal)proposal(c.selectedProposal);c.alternatives.forEach(proposal);
}

/** Verify persisted documents and local lineage, never calculate a scheduling interval. */
export async function validateBackupRecords(records:BackupRecords):Promise<void>{
 keys(records,[...BACKUP_STORES]);boundedJson(records);let total=0;
 for(const s of BACKUP_STORES){check(Array.isArray(records[s]));const seen=new Set();for(const r of records[s]){check(++total<=BACKUP_MAX_ROWS,'limit');keys(r,['workspace','key','value'],['head','voidedBy','count','canonical']);check(r.workspace==='guest','owner');check(typeof r.key==='string'&&r.key.length<=1024&&!seen.has(r.key));seen.add(r.key);check(new TextEncoder().encode(JSON.stringify(r)).length<=BACKUP_MAX_ROW_BYTES,'limit');}}
 // Remote receipts/checkpoints cannot be authenticated from a file. Preserve the source by blocking,
 // never discard or convert them into new ACKs. V1 accepts only pristine local coordination.
 for(const r of records.reconciliation){check(r.key==='v1'&&equal(r,row('v1',{version:0,entities:[],prepared:{},conflicts:{},stage:null})),'coordination');}
 const maps=Object.fromEntries(BACKUP_STORES.map(s=>[s,new Map<string,BackupRow>()])) as Record<BackupStore,Map<string,BackupRow>>;
 const journal=[...records.journal].sort((a,b)=>a.value.localRevision-b.value.localRevision);
 let revision=0;let namespace:string|undefined;
 for(const jr of journal){
  const op=jr.value;keys(op,['schemaVersion','id','workspace','kind','entityId','createdAt','localRevision','state','request','payload','context']);
  check(op.schemaVersion===1&&op.workspace==='guest'&&op.id===jr.key&&id(op.id)&&id(op.entityId)&&op.state==='committed'&&date(op.createdAt)&&op.localRevision===++revision);
  check(equal(jr,row(op.id,op)));const p=op.payload,ctx=op.context;keys(ctx,['beforeHead','before'],['deck','card','daily']);
  if(ctx.deck)deck(ctx.deck);if(ctx.card)await card(ctx.card);if(ctx.daily)daily(ctx.daily);
  if(ctx.before)fsrs(ctx.before);check(ctx.beforeHead===null||id(ctx.beforeHead));
  check(op.request===canonical({kind:op.kind,entityId:op.entityId,payload:['review','undo'].includes(op.kind)?{event:p.event}:p}));
  const d=maps.decks.get(op.entityId),c=p.card,prev=c?maps.cards.get(key(op.entityId,c.id)):undefined;
  if(op.kind==='create'){
   keys(p,['deck','cards']);deck(p.deck);check(p.deck.id===op.entityId&&Array.isArray(p.cards)&&p.cards.length<=1000);
   const ids=new Set(),lex=new Set();for(const v of p.cards){await card(v);check(v.deckId===p.deck.id&&!ids.has(v.id)&&!lex.has(v.lexicalIdentity.key));ids.add(v.id);lex.add(v.lexicalIdentity.key);}
   if(d){check(equal(d.value,p.deck));check(equal([...maps.cards.values()].filter(r=>r.value.deckId===op.entityId).map(r=>r.value).sort((a,b)=>a.id.localeCompare(b.id)),[...p.cards].sort((a,b)=>a.id.localeCompare(b.id))));}
   else{maps.decks.set(op.entityId,row(op.entityId,p.deck,{count:p.cards.length}));for(const v of p.cards)maps.cards.set(key(v.deckId,v.id),row(key(v.deckId,v.id),v));}
  }else if(op.kind==='manga-confirmation'){
   await confirmation(p);check(p.deck.id===op.entityId&&p.confirmation.id===op.id);const conf=p.confirmation,entity=maps.identities.get(conf.entity.id),old=maps.cards.get(key(op.entityId,p.card.id));
   if(!conf.reusedEntity){check(!namespace||namespace===conf.entity.registryNamespace);namespace=conf.entity.registryNamespace;}
   check(!conf.reusedEntity||!!entity);check(!entity||equal(entity.value,conf.entity));
   if(old){check(d?.value.status==='active'&&p.expectedContentVersion===old.value.contentVersion&&equal(old.value.lexicalIdentity,p.card.lexicalIdentity));maps.cards.set(old.key,{...old,value:{...p.card,order:old.value.order,createdAt:old.value.createdAt}});}
   else{check(p.expectedContentVersion===null);if(d)check([...maps.confirmations.values()].some(r=>r.value.confirmation.source.volumeId===conf.source.volumeId));if(!d)maps.decks.set(op.entityId,row(op.entityId,p.deck,{count:0}));check(maps.decks.get(op.entityId)!.value.status==='active');const cards=[...maps.cards.values()].filter(r=>r.value.deckId===op.entityId);check(cards.length<1000&&!cards.some(r=>r.value.lexicalIdentity.key===p.card.lexicalIdentity.key));maps.cards.set(key(op.entityId,p.card.id),row(key(op.entityId,p.card.id),{...p.card,order:Math.max(0,...cards.map(r=>r.value.order))+1}));maps.decks.get(op.entityId)!.count=cards.length+1;}
   maps.identities.set(conf.entity.id,row(conf.entity.id,conf.entity));maps.confirmations.set(conf.id,row(conf.id,p,{count:op.localRevision}));
   const link={schemaVersion:1,volumeId:conf.source.volumeId,deckId:op.entityId};check(!maps['volume-links'].has(op.entityId)||equal(maps['volume-links'].get(op.entityId)!.value,link));maps['volume-links'].set(op.entityId,row(op.entityId,link));
  }else if(op.kind==='edit-card'){
   keys(p,['card','expectedVersion']);await card(c);check(prev&&c.deckId===op.entityId&&prev.value.contentVersion===p.expectedVersion&&c.contentVersion===p.expectedVersion+1&&prev.value.lexicalIdentity.key===c.lexicalIdentity.key);maps.cards.set(prev.key,{...prev,value:c});
  }else if(op.kind==='settings'){
   keys(p,['settings']);check(d&&settingsValid(p.settings)&&equal(ctx.deck?.settings,p.settings));maps.decks.set(d.key,{...d,value:ctx.deck});
  }else if(op.kind==='daily'){
   daily(p);check(d&&p.deckId===op.entityId);const k=key(p.deckId,p.localDate),old=maps.daily.get(k)?.value;
   maps.daily.set(k,row(k,{...p,introducedEntryIds:old?.introducedEntryIds??p.introducedEntryIds,completedAt:p.completedAt===null&&ctx.daily?.completedAt===null?null:old?.completedAt??p.completedAt}));
  }else if(op.kind==='review'||op.kind==='undo'){
   keys(p,op.kind==='review'?['progress','event','daily']:['event','daily']);event(p.event);daily(p.daily);const e=p.event,k=key(e.deckId,e.entryId),before=maps.progress.get(k);check(d&&e.deckId===op.entityId&&maps.cards.has(k)&&p.daily.deckId===op.entityId);
   check(equal(ctx.before,before?.value?.card??null)&&ctx.beforeHead===(before?.head??null));
   if(op.kind==='review'){
    keys(p.progress,['deckId','entryId','due','state','card']);fsrs(p.progress.card);check(progressValid(p.progress)&&equal(e.cardBefore,ctx.before)&&e.id===op.id&&p.progress.deckId===e.deckId&&p.progress.entryId===e.entryId);
    const a=p.progress.card;check(a.due===e.dueAfter&&a.state===e.stateAfter&&a.stability===e.stabilityAfter&&a.difficulty===e.difficultyAfter&&a.lastReview===e.fsrsLog.review);
    const b=e.cardBefore;check(e.stateBefore===(b?.state??0)&&e.stabilityBefore===(b?.stability??0)&&e.difficultyBefore===(b?.difficulty??0));if(b)check(e.dueBefore===b.due);check(e.fsrsLog.state===e.stateBefore&&e.fsrsLog.stability===e.stabilityBefore&&e.fsrsLog.difficulty===e.difficultyBefore);
    const old=maps.daily.get(key(p.daily.deckId,p.daily.localDate))?.value;check((old?.completedAt==null||b&&getLocalStudyDayKey(new Date(e.reviewedAt))===p.daily.localDate&&deckCardEligible(b,new Date(e.reviewedAt),true))&&!maps.events.has(e.id));
    maps.progress.set(k,row(k,p.progress,{head:e.id}));maps.events.set(e.id,row(e.id,e,{head:before?.head??null}));maps.daily.set(key(p.daily.deckId,p.daily.localDate),row(key(p.daily.deckId,p.daily.localDate),{...p.daily,introducedEntryIds:[...new Set([...(old?.introducedEntryIds??[]),...p.daily.introducedEntryIds])]}));
   }else{
    const original=maps.events.get(e.id);check(original&&!original.voidedBy&&before?.head===e.id&&equal(original.value,e)&&op.id===await digest('undo-',e.id));original.voidedBy=op.id;
    maps.progress.set(k,{...before!,value:e.cardBefore?{deckId:e.deckId,entryId:e.entryId,due:e.cardBefore.due,state:e.cardBefore.state,card:e.cardBefore}:null,head:original.head??null});const old=maps.daily.get(key(p.daily.deckId,p.daily.localDate))?.value??p.daily;
    maps.daily.set(key(p.daily.deckId,p.daily.localDate),row(key(p.daily.deckId,p.daily.localDate),{...old,...(p.daily.completedAt===null&&ctx.daily?.completedAt===null?{completedAt:null}:{}),introducedEntryIds:e.cardBefore===null?old.introducedEntryIds.filter((v:string)=>v!==e.entryId):old.introducedEntryIds}));
   }
  }else if(['delete','restore','archive'].includes(op.kind)){
   // The current local lifecycle API journals intent without applying remote state locally.
   keys(p,['kind','id','payload']);check(['card','deck'].includes(p.kind));if(p.kind==='card')await card(p.payload);else deck(p.payload);check(equal(p.payload,p.kind==='card'?maps.cards.get(key(op.entityId,p.id))?.value:maps.decks.get(p.id)?.value));
  }else throw new DeckBackupError('version');
  check(equal(ctx.deck,maps.decks.get(op.entityId)?.value));if(ctx.card)check(equal(ctx.card,maps.cards.get(key(op.entityId,ctx.card.id))?.value));if(ctx.daily)check(equal(ctx.daily,maps.daily.get(key(ctx.daily.deckId,ctx.daily.localDate))?.value));
 }
 // All persistent content must be explained by its original operations, including null/voided history.
 for(const s of ['decks','cards','progress','events','daily','identities','confirmations','volume-links'] as BackupStore[]){const sort=(a:BackupRow,b:BackupRow)=>a.key.localeCompare(b.key);check(equal([...maps[s].values()].sort(sort),[...records[s]].sort(sort)),'lineage');}
 for(const r of records['registry-meta']){
  keys(r,['workspace','key','value']);keys(r.value,['schemaVersion','complete'],r.key==='local-namespace'?['localNamespace']:[]);check(r.value.schemaVersion===1&&r.value.complete===true&&['v1','local-namespace'].includes(r.key));
  if(r.key==='local-namespace'){check(/^[a-f0-9-]{36}$/.test(r.value.localNamespace));check([...maps.identities.values()].some(e=>e.value.registryNamespace===r.value.localNamespace));}
 }
 if(maps.confirmations.size)check(records['registry-meta'].some(r=>r.key==='v1'));
 // Historical verified registry backfills have v1 but may lack the optional local-namespace row.
 // Preserve that absence; the original journal still proves the namespace. Never synthesize it.
 if(namespace)check(records['registry-meta'].filter(r=>r.key==='local-namespace').every(r=>r.value.localNamespace===namespace));
 for(const r of records.daily)check(r.value.introducedEntryIds.every((id:string)=>maps.cards.has(key(r.value.deckId,id))),'lineage');
}

export interface DeckBackup {format:'kana-study-local-decks';version:1;databaseVersion:3;exporter:'release-manga-2a.1';scope:'guest';exportedAt:string;compatibility:'guest-local-empty-only';counts:Record<BackupStore,number>;records:BackupRecords;sha256:string;}
export async function encodeBackup(records:BackupRecords,exportedAt=new Date().toISOString()):Promise<string>{
 await validateBackupRecords(records);const data={format:'kana-study-local-decks' as const,version:1 as const,databaseVersion:3 as const,exporter:'release-manga-2a.1' as const,scope:'guest' as const,exportedAt,compatibility:'guest-local-empty-only' as const,counts:Object.fromEntries(BACKUP_STORES.map(s=>[s,records[s].length])) as Record<BackupStore,number>,records};
 const raw=JSON.stringify({...data,sha256:await digest('',data)});check(new TextEncoder().encode(raw).length<=BACKUP_MAX_BYTES,'limit');return raw;
}
export async function decodeBackup(raw:string):Promise<DeckBackup>{
 check(new TextEncoder().encode(raw).length<=BACKUP_MAX_BYTES,'limit');let data:any;try{data=JSON.parse(raw);}catch{throw new DeckBackupError('invalid');}
 boundedJson(data);keys(data,['format','version','databaseVersion','exporter','scope','exportedAt','compatibility','counts','records','sha256']);
 check(data.format==='kana-study-local-decks'&&data.version===1&&data.databaseVersion===3&&data.exporter==='release-manga-2a.1'&&data.compatibility==='guest-local-empty-only','version');check(data.scope==='guest','owner');check(date(data.exportedAt));
 const {sha256,...body}=data;check(typeof sha256==='string'&&/^[a-f0-9]{64}$/.test(sha256)&&sha256===await digest('',body),'hash');keys(data.counts,[...BACKUP_STORES]);
 await validateBackupRecords(data.records);check(BACKUP_STORES.every(s=>data.counts[s]===data.records[s].length));return data;
}

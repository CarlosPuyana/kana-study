import { CustomDeck, CustomDeckCard } from '../models/deck-catalog.model';
import { CustomPublicationManifest, CustomRemoteBundle, CustomRemoteOperation } from '../models/custom-deck-sync.model';
import { DeckCardProgress, DeckDailyState, DeckReviewEvent } from '../models/deck-study.model';
import { MangaCardConfirmation, MangaCuratedEntity } from '../models/manga-deck-confirmation.model';
import { canonical, dailyValid, eventValid, id, progressValid, requireValid, text, validateCard, validateDeck } from './custom-deck-validation';
import { validateCuratedEntity, validateMangaConfirmation, validateMangaConfirmedOperation } from './manga-deck-confirmation';

export const CUSTOM_SYNC_SCHEMA_VERSION=1;
export const CUSTOM_SYNC_REQUEST_BYTES=524288;
const kinds=['deck','card','identity','volume-link','confirmation','equivalence','progress','review-event','daily','manifest'];
const actions=['stage','publish','edit','daily','review','undo','import-history','archive','delete','restore','revoke'];
export const validServerRevision=(s:unknown):s is string=>typeof s==='string'&&/^(0|[1-9][0-9]{0,18})$/u.test(s)&&BigInt(s)<=9223372036854775807n;
function keys(value:object,required:readonly string[],optional:readonly string[]=[]):boolean {
  return !!value&&typeof value==='object'&&required.every(k=>k in value)&&Object.keys(value).every(k=>required.includes(k)||optional.includes(k));
}
/** Exact jsonb text byte count for finite JSON numbers, escaped strings and structural spaces. */
export function customSyncJsonBytes(value:unknown):number {
  const encode=(v:unknown):string=>{
    if(v===null)return 'null';
    if(typeof v==='string'){requireValid(!/[\u0000\uD800-\uDFFF]/u.test(v));return JSON.stringify(v);}
    if(typeof v==='number'){
      requireValid(Number.isFinite(v));const s=JSON.stringify(v);if(!s.includes('e'))return s;
      const [mantissa,exponent]=s.split('e'),negative=mantissa.startsWith('-'),absolute=negative?mantissa.slice(1):mantissa;
      const digits=absolute.replace('.',''),point=(absolute.indexOf('.')<0?absolute.length:absolute.indexOf('.'))+Number(exponent);
      return (negative?'-':'')+(point<=0?'0.'+'0'.repeat(-point)+digits:point>=digits.length?digits+'0'.repeat(point-digits.length):digits.slice(0,point)+'.'+digits.slice(point));
    }
    if(typeof v==='boolean')return String(v);
    if(Array.isArray(v))return '['+v.map(encode).join(', ')+']';
    requireValid(!!v&&typeof v==='object');return '{'+Object.entries(v).map(([k,x])=>encode(k)+': '+encode(x)).join(', ')+'}';
  };return new TextEncoder().encode(encode(value)).length;
}
/** Preflight only. PostgreSQL remains authoritative for authorization, CAS and relational semantics. */
export async function validateCustomRemoteOperation(op:CustomRemoteOperation):Promise<void>{
  requireValid(keys(op,['schemaVersion','operationId','action','changes'],['expectedHead','before','intent','resolvesOperationId'])&&op.schemaVersion===1&&id(op.operationId)&&actions.includes(op.action)&&
    Array.isArray(op.changes)&&op.changes.length>0&&op.changes.length<=64&&customSyncJsonBytes(op)<=CUSTOM_SYNC_REQUEST_BYTES);
  requireValid(new Set(op.changes.map(c=>JSON.stringify([c.kind,c.id]))).size===op.changes.length);
  if(op.intent)await validateMangaConfirmedOperation(op.intent);
  for(const c of op.changes){
    requireValid(keys(c,['kind','id','baseRevision','payload'],['parentHead','voidedBy'])&&kinds.includes(c.kind)&&id(c.id)&&validServerRevision(c.baseRevision));
    if(c.parentHead!==undefined||c.voidedBy!==undefined)requireValid(op.action==='import-history'&&c.kind==='review-event'&&
      (c.parentHead==null||id(c.parentHead))&&(c.voidedBy==null||id(c.voidedBy)));
    if(['delete','archive','revoke'].includes(op.action)){requireValid(c.payload===null);continue;}
    const p=c.payload;
    requireValid(customSyncJsonBytes(p)<=(c.kind==='confirmation'?262144:c.kind==='manifest'?1048576:32768));
    switch(c.kind){
      case 'deck':requireValid((p as CustomDeck)?.id===c.id&&canonical(validateDeck(p as CustomDeck))===canonical(p));break;
      case 'card':requireValid((p as CustomDeckCard)?.id===c.id&&canonical(await validateCard(p as CustomDeckCard))===canonical(p));break;
      case 'identity':requireValid((p as MangaCuratedEntity)?.id===c.id&&keys(p!,['schemaVersion','id','identity','word','reading','origin','expertCertified','originReference','registryNamespace','branch']));await validateCuratedEntity(p as MangaCuratedEntity);break;
      case 'confirmation':{
        const receipt=p as MangaCardConfirmation;
        requireValid(receipt?.id===c.id&&keys(receipt,['schemaVersion','id','workspace','actor','confirmedAt','source','entity','selectedProposal','alternatives','totalAlternatives','confirmedMeaning','meaningLanguage','reusedEntity','expertCertified'])&&
          keys(receipt.source,['volumeId','volumeTitle','pageNumber','blockIndex','lineIndex','range','fragment','surface'],['savedItemId'])&&keys(receipt.actor,['kind','workspace']));
        await validateMangaConfirmation(receipt);break;
      }
      case 'progress':requireValid(p===null||progressValid(p as DeckCardProgress)&&(p as DeckCardProgress).entryId===c.id);break;
      case 'review-event':requireValid(eventValid(p as DeckReviewEvent)&&(p as DeckReviewEvent).id===c.id);break;
      case 'daily':requireValid(dailyValid(p as DeckDailyState));break;
      case 'manifest':{
        const m=p as CustomPublicationManifest;requireValid(m?.schemaVersion===1&&m.deckId===c.id&&Array.isArray(m.cardIds)&&m.cardIds.length<=1000&&m.cardIds.every(id)&&new Set(m.cardIds).size===m.cardIds.length);break;
      }
      case 'volume-link':{
        const l=p as {schemaVersion:1;deckId:string;volumeId:string};requireValid(keys(l,['schemaVersion','deckId','volumeId'])&&l.schemaVersion===1&&l.deckId===c.id&&text(l.volumeId,4096));break;
      }
      case 'equivalence':{
        const e=p as {schemaVersion:1;id:string;scope:string;left:string;right:string;evidence:string;revoked:boolean;expertCertified:boolean};
        requireValid(keys(e,['schemaVersion','id','left','right','scope','evidence','revoked','expertCertified'])&&e.schemaVersion===1&&e.id===c.id&&e.scope==='owner-local'&&e.left!==e.right&&
          /^lex1-[a-f0-9]{64}$/u.test(e.left)&&/^lex1-[a-f0-9]{64}$/u.test(e.right)&&text(e.evidence,8192)&&typeof e.revoked==='boolean'&&e.expertCertified===false);break;
      }
    }
  }
}
/** Partial/staged/paged content is never a ready empty deck. No FSRS or storage writes. */
export function customBundleReadiness(bundle:CustomRemoteBundle|null):'ready'|'incomplete'{
  if(!bundle||bundle.schemaVersion!==1||bundle.status!=='complete'||bundle.manifest.kind!=='manifest'||bundle.manifest.deleted)return 'incomplete';
  const m=bundle.manifest.payload as CustomPublicationManifest;
  if(!m?.references||!Array.isArray(m.cardIds)||!Array.isArray(bundle.entities)||!validServerRevision(bundle.manifest.revision))return 'incomplete';
  const byKey=new Map(bundle.entities.map(e=>[JSON.stringify([e.kind,e.id]),e]));
  if(byKey.size!==bundle.entities.length)return 'incomplete';
  for(const ref of m.references){const e=byKey.get(JSON.stringify([ref.kind,ref.id]));if(!e||e.deleted||e.revision!==ref.revision)return 'incomplete';}
  if(!m.references.some(r=>r.kind==='deck'&&r.id===m.deckId))return 'incomplete';
  const cards=bundle.entities.filter(e=>e.kind==='card'&&!e.deleted);
  for(const row of cards){
    const p=row.payload as CustomDeckCard;
    if(!p||p.id!==row.id||p.deckId!==m.deckId||!m.references.some(r=>r.kind==='card'&&r.id===row.id))return 'incomplete';
    const identity=p.lexicalIdentity?.anchor?.entryId,confirmation=p.glosses?.[0]?.source?.sourceId;
    if(!identity||!confirmation||!m.references.some(r=>r.kind==='identity'&&r.id===identity)||!m.references.some(r=>r.kind==='confirmation'&&r.id===confirmation))return 'incomplete';
  }
  return new Set(m.cardIds).size===m.cardIds.length&&cards.length===m.cardIds.length&&cards.every(e=>m.cardIds.includes(e.id))?'ready':'incomplete';
}
/** A paged bundle may only be assembled from the already staged, revision-checked feed. */
export function materializeCustomBundle(bundle:CustomRemoteBundle|null,manifest:CustomRemoteBundle['manifest'],staged:readonly CustomRemoteBundle['manifest'][]):CustomRemoteBundle|null{
  if(!bundle||bundle.schemaVersion!==1||canonical(bundle.manifest)!==canonical(manifest))return null;
  if(bundle.status==='complete')return bundle;
  if(bundle.status!=='paged-required'||bundle.entities.length)return null;
  const refs=(manifest.payload as CustomPublicationManifest)?.references;if(!Array.isArray(refs))return null;
  const rows=new Map(staged.map(e=>[JSON.stringify([e.kind,e.id]),e]));
  const entities=refs.map(ref=>rows.get(JSON.stringify([ref.kind,ref.id])));
  if(entities.some((e,i)=>!e||e.deleted||e.revision!==refs[i].revision))return null;
  const complete:CustomRemoteBundle={schemaVersion:1,status:'complete',manifest,entities:entities as CustomRemoteBundle['entities']};
  return customBundleReadiness(complete)==='ready'?complete:null;
}
export function assertCustomSyncWorkspace(captured:string,current:string):void {
  requireValid(captured.startsWith('user:')&&captured.length>5&&captured===current);
}

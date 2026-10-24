import {CustomCatalogOperation} from '../models/deck-catalog.model';
import {CustomGuestInventory,CustomConflictKind} from '../models/custom-guest-import.model';
import {CustomPreparedOperation} from '../models/custom-deck-reconciliation.model';
import {MangaConfirmedCardOperation} from '../models/manga-deck-confirmation.model';
import {digest} from './custom-deck-validation';

export const inventoryRows=(i:CustomGuestInventory,store:string)=>i.records[store]??[];
export function guestConfirmations(i:CustomGuestInventory):MangaConfirmedCardOperation[]{
 const fromJournal=inventoryRows(i,'journal').map(r=>r.value as CustomCatalogOperation).filter(o=>o.kind==='manga-confirmation').sort((a,b)=>a.localRevision-b.localRevision).map(o=>o.payload as MangaConfirmedCardOperation);
 const all=[...fromJournal,...inventoryRows(i,'confirmations').map(r=>r.value as MangaConfirmedCardOperation)];
 return [...new Map(all.map(p=>[p.confirmation.id,p])).values()];
}
export const guestHasData=(i:CustomGuestInventory)=>['decks','cards','events','journal','identities','confirmations'].some(s=>inventoryRows(i,s).length>0);
export const guestFingerprint=(i:CustomGuestInventory)=>digest('guest-',i);
export function classifyCustomConflict(p:CustomPreparedOperation):CustomConflictKind{
 const op=p.operation,reason=p.receipt?.reason??'';
 if(reason==='immutable-evidence')return 'identity';if(reason==='parent-deleted'||reason==='tombstoned')return 'delete-edit';
 if(reason==='published-content-requires-manifest')return 'dependency';
 if(op.action==='undo')return 'undo';if(op.action==='restore')return 'restore';if(op.action==='review')return 'review';if(op.action==='import-history')return 'guest-progress';
 return op.intent?.expectedContentVersion===null?'duplicate':'content';
}

/** Iterative ancestry validation: no recursion or quadratic parent searches for long histories. */
export function orderedGuestEvents(rows:import('../models/custom-guest-import.model').CustomInventoryRow[]){
 const byId=new Map(rows.map(r=>[r.key,r])),seen=new Set<string>(),ordered:typeof rows=[];
 if(byId.size!==rows.length)throw new Error('Duplicate Guest event');
 for(const row of rows){let cursor:typeof row|undefined=row;const chain:typeof rows=[],path=new Set<string>();
  while(cursor&&!seen.has(cursor.key)){
   if(path.has(cursor.key))throw new Error('Cyclic Guest history');path.add(cursor.key);chain.push(cursor);
   if(!cursor.head)break;const parent=byId.get(cursor.head);if(!parent)throw new Error('Missing Guest ancestor');
   const a=cursor.value as {entryId:string;deckId:string},b=parent.value as typeof a;if(a.entryId!==b.entryId||a.deckId!==b.deckId)throw new Error('Foreign Guest ancestor');cursor=parent;
  }
  for(const item of chain.reverse()){seen.add(item.key);ordered.push(item);}
 }
 return ordered;
}
export function guestHeadFamily(rows:import('../models/custom-guest-import.model').CustomInventoryRow[],head:string|null|undefined){
 const included=new Set<string>();for(const row of orderedGuestEvents(rows))if(row.key===head||row.head&&included.has(row.head))included.add(row.key);return rows.filter(r=>included.has(r.key));
}

import { CustomCatalogOperation, CustomDeck, CustomDeckCard } from '../models/deck-catalog.model';
import { CustomReconciliationState } from '../models/custom-deck-reconciliation.model';
import { CustomRemoteChange, CustomRemoteEntity, CustomRemoteKind, CustomRemoteOperation } from '../models/custom-deck-sync.model';
import { MangaConfirmedCardOperation } from '../models/manga-deck-confirmation.model';
import { DeckCardProgress, DeckDailyState, DeckReviewEvent } from '../models/deck-study.model';
import { canonical, digest, requireValid } from './custom-deck-validation';

export const remoteKey=(e:Pick<CustomRemoteEntity,'kind'|'id'>)=>JSON.stringify([e.kind,e.id]);
export function mergeCustomEntities(old:readonly CustomRemoteEntity[],incoming:readonly CustomRemoteEntity[]):CustomRemoteEntity[]{
  const map=new Map(old.map(e=>[remoteKey(e),e]));for(const e of incoming){const p=map.get(remoteKey(e));if(!p||BigInt(e.revision)>BigInt(p.revision))map.set(remoteKey(e),e);else if(e.revision===p.revision)requireValid(canonical(e)===canonical(p));}return [...map.values()];
}
/** Real journal events only. No FSRS event is ever synthesized from a progress snapshot. */
export async function prepareCustomOperation(source:CustomCatalogOperation,state:CustomReconciliationState,context=source.context):Promise<CustomRemoteOperation>{
  const rows=state.entities,find=(kind:CustomRemoteKind,id:string)=>rows.find(e=>e.kind===kind&&e.id===id);
  const change=(kind:CustomRemoteKind,id:string,payload:CustomRemoteChange['payload']):CustomRemoteChange=>({kind,id,payload,baseRevision:find(kind,id)?.revision??'0'});
  const manifest=(id:string,cardId?:string)=>{
    const ids=rows.filter(e=>e.kind==='card'&&!e.deleted&&(e.payload as CustomDeckCard).deckId===id).map(e=>e.id);
    return change('manifest',id,{schemaVersion:1,deckId:id,cardIds:[...new Set([...ids,...(cardId?[cardId]:[])])]});
  };
  const base={schemaVersion:1 as const,operationId:source.id};
  if(source.kind==='manga-confirmation'){
    const p=source.payload as MangaConfirmedCardOperation;requireValid(context?.card&&context.deck);
    const c=context.card;
    return {...base,action:'publish',intent:p,changes:[change('identity',p.confirmation.entity.id,p.confirmation.entity),
      ...(!find('deck',p.deck.id)?[change('deck',p.deck.id,context.deck)]:[]),change('card',c.id,c),
      change('confirmation',p.confirmation.id,p.confirmation),change('volume-link',p.deck.id,{schemaVersion:1,deckId:p.deck.id,volumeId:p.confirmation.source.volumeId}),manifest(p.deck.id,c.id)]};
  }
  if(source.kind==='review'||source.kind==='undo'){
    const p=source.payload as {progress:DeckCardProgress;event:DeckReviewEvent;daily:DeckDailyState},ctx=context;
    requireValid(ctx?.daily&&ctx.before!==undefined);
    const progress=source.kind==='review'?p.progress:(p.event.cardBefore?{deckId:p.event.deckId,entryId:p.event.entryId,due:p.event.cardBefore.due,state:p.event.cardBefore.state,card:p.event.cardBefore}:null);
    const day=await digest('day-',[p.daily.deckId,p.daily.localDate]);
    return {...base,action:source.kind,expectedHead:ctx.beforeHead,before:ctx.before,changes:[change('progress',p.event.entryId,progress),change('review-event',p.event.id,p.event),change('daily',day,ctx.daily)]};
  }
  if(source.kind==='daily'){
    const d=context?.daily??source.payload as DeckDailyState;return {...base,action:'daily',changes:[change('daily',await digest('day-',[d.deckId,d.localDate]),d)]};
  }
  if(source.kind==='settings'){
    requireValid(context?.deck);return {...base,action:'publish',changes:[change('deck',source.entityId,context.deck),manifest(source.entityId)]};
  }
  if(source.kind==='edit-card'){
    const p=source.payload as {card:CustomDeckCard};return {...base,action:'publish',changes:[change('card',p.card.id,p.card),manifest(p.card.deckId,p.card.id)]};
  }
  if(source.kind==='delete'||source.kind==='restore'||source.kind==='archive'){
    const p=source.payload as {kind:'card'|'deck';id:string;payload:CustomDeckCard|CustomDeck};return {...base,action:source.kind,changes:[change(p.kind,p.id,source.kind==='restore'?p.payload:null)]};
  }
  throw new Error('This historical journal operation has no verified H4A identity/provenance; explicit migration is required');
}

// Synthetic limits only; no external database, text, credentials or scheduler.
import assert from 'node:assert/strict';
import {fixture,publish,review,change,hash} from './custom-decks.fixture.mjs';
export function paddedFixture(volume,word='猫'){
 const p=fixture(volume,word);p.confirmation.alternatives=Array.from({length:12},(_,i)=>({localId:'proposal-'+i,dictionaryId:'synthetic',expression:word,reading:'ねこ',sequence:i,glosses:Array(4).fill('x'.repeat(2000)),glossLanguage:'es',totalGlosses:4}));p.confirmation.totalAlternatives=12;return p;
}
export async function measureCustomLimits({apply,bundle,row,query,large=true}){
 const samples=[];const size=async op=>Number((await query('select octet_length($1::jsonb::text) bytes',[JSON.stringify(op)])).rows[0].bytes);
 // An active head and 61 annulled children require exactly 64 atomic changes.
 const p=fixture('limits-family');assert.equal((await apply(publish(p))).status,'accepted');const first=review(p,'limits-head'),head=first.changes.find(c=>c.kind==='review-event'),progress=first.changes.find(c=>c.kind==='progress');
 const children=Array.from({length:62},(_,i)=>{const event=review(p,'limits-child-'+i,head.id,progress.payload.card).changes.find(c=>c.kind==='review-event');return {...event,parentHead:head.id,voidedBy:'original-undo-'+i};});
 const op={...first,operationId:'limits-family-64',action:'import-history',expectedHead:head.id,changes:[progress,{...head,parentHead:null,voidedBy:null},...children.slice(0,61),first.changes.find(c=>c.kind==='daily')]};
 assert.equal(op.changes.length,64);const bytes64=await size(op);assert.equal((await apply(op)).status,'accepted');assert.equal((await row('progress',p.card.id)).payload.card.reps,1);
 const tooMany={...op,operationId:'limits-family-65',changes:[...op.changes,children[61]]};await assert.rejects(()=>apply(tooMany));assert.equal(await row('review-event',children[61].id),undefined);samples.push({case:'atomic-family',acceptedChanges:64,rejectedChanges:65,acceptedBytes:bytes64});
 // Find and fill an otherwise valid request to the exact PostgreSQL jsonb byte limit.
 const q=fixture('limits-exact');q.confirmation.alternatives=Array.from({length:16},(_,i)=>({localId:'proposal-'+i,dictionaryId:'synthetic',expression:'猫',reading:'ねこ',sequence:i,glosses:Array(4).fill('語'.repeat(1000)),glossLanguage:'es',totalGlosses:4}));q.confirmation.totalAlternatives=16;
 let lo=1000,hi=1500;while(lo<hi){const mid=Math.ceil((lo+hi)/2);for(const proposal of q.confirmation.alternatives)proposal.glosses=Array(4).fill('語'.repeat(mid));if(await size(publish(q))<=524288)lo=mid;else hi=mid-1;}
 for(const proposal of q.confirmation.alternatives)proposal.glosses=Array(4).fill('語'.repeat(lo));const exact=publish(q);const remaining=524288-await size(exact);q.confirmation.alternatives[0].glosses[0]+='x'.repeat(Math.floor(remaining/2));if(remaining%2)exact.operationId+='x';assert.equal(await size(exact),524288);assert.equal((await apply(exact)).status,'accepted');
 const overflow={...exact,operationId:exact.operationId+'x'};assert.equal(await size(overflow),524289);await assert.rejects(()=>apply(overflow));samples.push({case:'request-jsonb-bytes',acceptedBytes:524288,rejectedBytes:524289});
 const invalid=publish(fixture('limits-card-count'));invalid.changes.find(c=>c.kind==='manifest').payload.cardIds=Array.from({length:1001},(_,i)=>'synthetic-'+i);await assert.rejects(()=>apply(invalid));assert.equal(await row('deck',invalid.intent.deck.id),undefined);samples.push({case:'manifest',rejectedCards:1001,noPartialDeck:true});
 let largeDeck=null;
 if(large){
  const ids=[];for(let i=0;i<50;i++){
   const p=paddedFixture('limits-large','猫'+i),op=publish(p);largeDeck=p.deck.id;
   op.changes=op.changes.filter(c=>i===0||c.kind!=='deck');
   // CAS is refreshed from the actual database. Only the new card/identity/confirmation are absent.
   for(const c of op.changes)c.baseRevision=String((await row(c.kind,c.id))?.revision??0);
   ids.push(p.card.id);op.changes.find(c=>c.kind==='manifest').payload.cardIds=[...ids];assert.equal((await apply(op)).status,'accepted');
   if([10,25,50].includes(i+1)){const b=await bundle(largeDeck);const bytes=Number((await query("select sum(octet_length(e.payload::text)) bytes from public.custom_sync_entities_v1 e where exists(select 1 from public.custom_sync_entities_v1 m,jsonb_array_elements(m.payload->'references') r where m.kind='manifest' and m.entity_id=$1 and m.user_id=e.user_id and r->>'kind'=e.kind and r->>'id'=e.entity_id)",[largeDeck])).rows[0].bytes);samples.push({case:'bundle',cards:i+1,bytes,status:b.status});}
  }
  assert.equal((await bundle(largeDeck)).status,'paged-required');
 }
 for(const count of [10,50,200,1000]){const start=performance.now(),before=process.memoryUsage(),cards=Array.from({length:count},(_,i)=>fixture('catalog-'+Math.floor(i/100),'猫'+i));const bytes=Buffer.byteLength(JSON.stringify(cards));const after=process.memoryUsage();samples.push({case:'synthetic-inventory-materialization',cards:count,decks:Math.ceil(count/100),bytes,ms:Math.round((performance.now()-start)*100)/100,heapDelta:after.heapUsed-before.heapUsed,rss:after.rss});}
 return {samples,largeDeck};
}

// Original, controlled test data. Not linguistic certification or a real manga excerpt.
import {createHash} from 'node:crypto';
export const canonical=v=>Array.isArray(v)?'['+v.map(canonical).join(',')+']':v&&typeof v==='object'?'{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+canonical(v[k])).join(',')+'}':JSON.stringify(v);
export const hash=(prefix,v)=>prefix+createHash('sha256').update(canonical(v)).digest('hex');
export function fixture(volume='fixture-volume',word='猫',reading='ねこ'){
 const source={volumeId:volume,volumeTitle:'QA volume',pageNumber:2,blockIndex:0,lineIndex:0,range:[0,word.length],fragment:word+'がいる。',surface:word};
 const originReference=hash('ocr-',{volumeId:volume,page:2,block:0,line:0,range:source.range,fragment:source.fragment,surface:word});
 const policy='manga-user-entity-v1',registryNamespace='00000000-0000-4000-8000-000000000001',branch='initial';
 const entityId=hash('mce-',{registryNamespace,originReference,word,reading,branch,policy});
 const anchor={authority:'kana-study-curated',entryId:entityId,canonicalReading:reading,homographGroup:policy};
 const identity={schemaVersion:1,key:hash('lex1-',anchor),anchor,spellings:[word],evidenceVersion:policy};
 const entity={schemaVersion:1,id:entityId,identity,word,reading,origin:'explicit-user-confirmation',expertCertified:false,originReference,branch,registryNamespace};
 const deckId=hash('md-',['manga-assisted-v1',volume]),cardId=hash('mc-',[deckId,identity.key,'japanese-to-meaning']);
 const id='confirmation-'+volume+'-'+word,at='2026-10-22T12:00:00.000Z';
 const confirmation={schemaVersion:1,id,workspace:'guest',actor:{kind:'local-workspace-user',workspace:'guest'},confirmedAt:at,source,entity,
  selectedProposal:null,alternatives:[],totalAlternatives:0,confirmedMeaning:'Confirmed user meaning',meaningLanguage:'es',reusedEntity:false,expertCertified:false};
 const deck={schemaVersion:1,id:deckId,title:source.volumeTitle,contentType:'japanese-word',settings:{desiredRetention:.9,newCardsPerDay:10,newCardOrder:'mixed'},status:'active',createdAt:at,updatedAt:at};
 const card={schemaVersion:1,id:cardId,deckId,lexicalIdentity:identity,direction:'japanese-to-meaning',word,reading,
  glosses:[{text:confirmation.confirmedMeaning,language:'es',source:{kind:'user',sourceId:id,revision:'receipt-v1'}}],context:{text:source.fragment,sourceTitle:source.volumeTitle,pageNumber:2},order:0,contentVersion:1,createdAt:at,updatedAt:at};
 return {schemaVersion:1,deck,card,expectedContentVersion:null,confirmation};
}
export const change=(kind,id,payload,baseRevision='0',extra={})=>({kind,id,baseRevision:String(baseRevision),payload,...extra});
export function publish(p,operationId='publish-'+p.confirmation.id){return {schemaVersion:1,operationId,action:'publish',intent:p,changes:[
 change('identity',p.confirmation.entity.id,p.confirmation.entity),change('deck',p.deck.id,p.deck),change('card',p.card.id,p.card),
 change('confirmation',p.confirmation.id,p.confirmation),change('volume-link',p.deck.id,{schemaVersion:1,volumeId:p.confirmation.source.volumeId,deckId:p.deck.id}),
 change('manifest',p.deck.id,{schemaVersion:1,deckId:p.deck.id,cardIds:[p.card.id]})]};}
export function review(p,operationId='review',head=null,before=null){
 const at=Date.parse('2026-10-22T12:00:00Z'),card={due:at+86400000,stability:20,difficulty:4,elapsedDays:1,scheduledDays:1,learningSteps:0,reps:(before?.reps??0)+1,lapses:0,state:2,lastReview:at};
 const event={id:'event-'+operationId,deckId:p.deck.id,entryId:p.card.id,reviewedAt:at,rating:'good',fsrsRating:3,stateBefore:before?.state??0,stateAfter:2,
 dueBefore:before?.due??at,dueAfter:card.due,stabilityBefore:before?.stability??0,stabilityAfter:20,difficultyBefore:before?.difficulty??0,difficultyAfter:4,
 retrievabilityBefore:null,desiredRetention:.9,elapsedAnswerMs:900,cardBefore:before,
 fsrsLog:{rating:3,state:before?.state??0,due:before?.due??at,stability:20,difficulty:4,elapsedDays:1,lastElapsedDays:1,scheduledDays:1,learningSteps:0,review:at}};
 const progress={deckId:p.deck.id,entryId:p.card.id,due:card.due,state:2,card};
 const daily={deckId:p.deck.id,localDate:'2026-10-22',introducedEntryIds:[p.card.id],newLimitOverride:null};
 return {schemaVersion:1,operationId,action:'review',expectedHead:head,before,changes:[change('progress',p.card.id,progress),change('review-event',event.id,event),change('daily',hash('day-',[p.deck.id,daily.localDate]),daily)]};
}

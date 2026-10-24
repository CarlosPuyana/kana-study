// Controlled contract fixtures only. Not linguistic certification and never imported by production.
import { LexicalCardEvidence, LexicalVerification, ProvenLexicalIdentity } from '../models/lexical-knowledge.model';
import { DeckCardProgress, DeckReviewEvent, SerializedFsrsCard } from '../models/deck-study.model';
import { lexicalIdentity } from './custom-deck-validation';
export const KNOWLEDGE_NOW=Date.parse('2026-10-22T12:00:00.000Z');
export const verification:LexicalVerification={source:'controlled test fixture',version:'fixture-1',sha256:'a'.repeat(64),
  reference:'test-only-entry-restrictions',restrictions:'explicit controlled reading/group; no external claim',review:'contract fixture, not independent Japanese review'};
export const provenIdentity=async(id='1',word='猫',reading='ねこ'):Promise<ProvenLexicalIdentity>=>({
  identity:await lexicalIdentity({authority:'jmdict',entryId:id,canonicalReading:reading,homographGroup:'fixture-group'},[word],'fixture-1'),
  proof:{kind:'verified',evidence:verification}});
export function memory(deckId:string,cardId:string,state:0|1|2|3=2,stability=20):{progress:DeckCardProgress;event:DeckReviewEvent} {
  const before:SerializedFsrsCard={due:KNOWLEDGE_NOW,stability:10,difficulty:4,elapsedDays:1,scheduledDays:1,
    learningSteps:0,reps:1,lapses:0,state:2,lastReview:KNOWLEDGE_NOW-86400000};
  const card:SerializedFsrsCard={...before,state,stability,reps:2,lapses:state===3?1:0,
    due:KNOWLEDGE_NOW+86400000,lastReview:KNOWLEDGE_NOW};
  const event:DeckReviewEvent={id:`event-${deckId}-${cardId}`,deckId,entryId:cardId,reviewedAt:KNOWLEDGE_NOW,
    rating:'good',fsrsRating:3,stateBefore:2,stateAfter:state,dueBefore:before.due,dueAfter:card.due,
    stabilityBefore:before.stability,stabilityAfter:stability,difficultyBefore:4,difficultyAfter:4,
    retrievabilityBefore:.9,desiredRetention:.9,elapsedAnswerMs:1000,cardBefore:before,
    fsrsLog:{rating:3,state:2,due:before.due,stability, difficulty:4,elapsedDays:1,lastElapsedDays:1,
      scheduledDays:1,learningSteps:0,review:KNOWLEDGE_NOW}};
  return {progress:{deckId,entryId:cardId,due:card.due,state,card},event};
}
export function lexicalCard(identityKey:string,state:0|1|2|3|null=2,stability=20,deckId='md-a',cardId='a'):LexicalCardEvidence {
  const m=memory(deckId,cardId,state??0,stability);
  return {deckId,cardId,identityKey,archived:false,readable:true,
    progress:state===null?null:state===0?{...m.progress,card:{...m.progress.card,reps:0,lapses:0,lastReview:null}}:m.progress,
    events:state===null||state===0?[]:[m.event]};
}

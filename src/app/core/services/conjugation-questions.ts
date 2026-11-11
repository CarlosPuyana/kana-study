import {ConjugationQuestion,VerbCategory,VerbTransformation,VERB_CATEGORIES,COPULA_CATEGORIES,COPULA_TRANSFORMATIONS,CopulaCategory} from '../models/conjugation-practice.model';
import {CONJUGATION_COPULAS} from '../../data/conjugation-copulas';
import {CONJUGATION_VERBS} from '../../data/conjugation-verbs';
import {AdjectiveCategory,AdjectiveQuestion,AdjectiveTransformation,ADJECTIVE_CATEGORIES} from '../models/conjugation-practice.model';
import {ConjugationPracticeIntent,ConjugationCategoryId} from '../models/conjugations.model';
import {CONJUGATION_ADJECTIVES} from '../../data/conjugation-adjectives';

const adjectiveForms:Record<AdjectiveCategory,AdjectiveTransformation>={'adjective-negative':'negative','adjective-past':'past','adjective-negative-past':'negativePast','adjective-te':'te','adjective-adverbial':'adverbial'};
export function isAdjectiveCategory(id:ConjugationCategoryId|string):id is AdjectiveCategory{return ADJECTIVE_CATEGORIES.some(category=>category===id);}
export function validAdjectiveIntent(intent:ConjugationPracticeIntent):boolean {
  return ['single','mixed'].includes(intent.mode)&&intent.categoryIds.length>0&&
    (intent.mode!=='single'||intent.categoryIds.length===1)&&new Set(intent.categoryIds).size===intent.categoryIds.length&&intent.categoryIds.every(isAdjectiveCategory)&&validAdjectiveTypes(intent);
}
function validAdjectiveTypes(intent:ConjugationPracticeIntent):boolean{return intent.categoryIds.every(id=>!isAdjectiveCategory(id)||['i','na','both'].includes(intent.adjectiveTypes?.[id]??'both'));}
function shuffle<T>(items:readonly T[],random:()=>number):T[]{
  const result=[...items];for(let i=result.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[result[i],result[j]]=[result[j],result[i]];}return result;
}
/** Shuffles explicit records, never constructs a conjugated answer. Exhaustive finite round. */
export function adjectiveQuestions(intent:ConjugationPracticeIntent,random:()=>number=Math.random,previousId?:string):AdjectiveQuestion[]{
  if(!validAdjectiveIntent(intent))return [];
  const pools=intent.categoryIds.map(category=>{const transformation=adjectiveForms[category as AdjectiveCategory],type=intent.adjectiveTypes?.[category]??'both';
    if(!['i','na','both'].includes(type))return [];
    return shuffle(CONJUGATION_ADJECTIVES.filter(a=>type==='both'||a.type===type).map(word=>({id:word.id+':'+transformation,word,transformation,answers:word.conjugations[transformation]})),random);});
  const result:AdjectiveQuestion[]=[];let family=random()<.5?0:pools.length-1;
  while(pools.some(pool=>pool.length)){if(pools[family].length)result.push(pools[family].pop()!);family=(family+1)%pools.length;}
  if(result.length>1&&result[0].id===previousId)[result[0],result[1]]=[result[1],result[0]];
  return result;
}

/** Implemented forms read explicit catalog records; session permissions are checked before generation. */
export function isCopulaCategory(id:ConjugationCategoryId|string):id is CopulaCategory{return COPULA_CATEGORIES.some(category=>category===id);}
export function isPracticeCategory(id:ConjugationCategoryId|string):id is AdjectiveCategory|VerbCategory|CopulaCategory {
  return isAdjectiveCategory(id)||isCopulaCategory(id)||VERB_CATEGORIES.some(category=>category===id);
}
const verbForms:Record<VerbCategory,VerbTransformation>={'verb-negative':'negative','verb-past':'past','verb-negative-past':'negativePast','verb-te':'te','verb-continuous':'continuous','verb-desire':'desire','verb-polite':'polite','verb-conditional-tara':'conditionalTara','verb-conditional-ba':'conditionalBa','verb-volitional':'volitional','verb-potential':'potential','verb-passive':'passive','verb-causative':'causative','verb-causative-passive':'causativePassive','verb-imperative':'imperative','verb-prohibitive':'prohibitive'};
function copulaQuestions(category:CopulaCategory,random:()=>number):ConjugationQuestion[]{
  const register=category==='copula-plain'?'plain':'polite';
  return shuffle(CONJUGATION_COPULAS.flatMap(expression=>COPULA_TRANSFORMATIONS.map(transformation=>{
    // Affirmative converts register instead of asking the learner to copy the prompt.
    const prompt=expression.registers[transformation==='affirmative'?(register==='plain'?'polite':'plain'):register];
    return {id:'copula:'+register+':'+expression.id+':'+transformation,register,transformation,
      word:{id:expression.id,type:expression.type,japanese:prompt.japanese,kana:prompt.kana,meaningKey:expression.meaningKey},answers:expression.registers[register].conjugations[transformation]};
  })),random);
}
export function practiceQuestions(intent:ConjugationPracticeIntent,random:()=>number=Math.random,previousId?:string):ConjugationQuestion[]{
  if(!['single','mixed'].includes(intent.mode)||!intent.categoryIds.length||(intent.mode==='single'&&intent.categoryIds.length!==1)||new Set(intent.categoryIds).size!==intent.categoryIds.length||!intent.categoryIds.every(isPracticeCategory)||!validAdjectiveTypes(intent))return [];
  const pools=intent.categoryIds.map(category=>isAdjectiveCategory(category)
    ?adjectiveQuestions({mode:'single',categoryIds:[category],adjectiveTypes:intent.adjectiveTypes},random)
    :isCopulaCategory(category)?copulaQuestions(category,random)
    :shuffle(CONJUGATION_VERBS.filter(word=>!!word.conjugations[verbForms[category]]).map(word=>{const transformation=verbForms[category];return {id:'verb:'+word.id+':'+transformation,word,transformation,answers:word.conjugations[transformation]!};}),random));
  const result:ConjugationQuestion[]=[];let family=Math.floor(random()*pools.length);
  while(pools.some(pool=>pool.length)){if(pools[family].length)result.push(pools[family].pop()!);family=(family+1)%pools.length;}
  if(result.length>1&&result[0].id===previousId)[result[0],result[1]]=[result[1],result[0]];
  return result;
}

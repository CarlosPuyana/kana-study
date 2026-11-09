import {AdjectiveCategory,AdjectiveQuestion,ADJECTIVE_TRANSFORMATIONS} from '../models/conjugation-practice.model';
import {ConjugationPracticeIntent,ConjugationCategoryId} from '../models/conjugations.model';
import {CONJUGATION_ADJECTIVES} from '../../data/conjugation-adjectives';

export function isAdjectiveCategory(id:ConjugationCategoryId|string):id is AdjectiveCategory{return id==='adjective-i'||id==='adjective-na';}
export function validAdjectiveIntent(intent:ConjugationPracticeIntent):boolean {
  return ['single','mixed'].includes(intent.mode)&&intent.categoryIds.length>0&&
    (intent.mode!=='single'||intent.categoryIds.length===1)&&new Set(intent.categoryIds).size===intent.categoryIds.length&&intent.categoryIds.every(isAdjectiveCategory);
}
function shuffle<T>(items:readonly T[],random:()=>number):T[]{
  const result=[...items];for(let i=result.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[result[i],result[j]]=[result[j],result[i]];}return result;
}
/** Shuffles explicit records, never constructs a conjugated answer. Exhaustive finite round. */
export function adjectiveQuestions(intent:ConjugationPracticeIntent,random:()=>number=Math.random,previousId?:string):AdjectiveQuestion[]{
  if(!validAdjectiveIntent(intent))return [];
  const pools=intent.categoryIds.map(category=>shuffle(CONJUGATION_ADJECTIVES.filter(a=>'adjective-'+a.type===category).flatMap(adjective=>
    ADJECTIVE_TRANSFORMATIONS.map(transformation=>({id:adjective.id+':'+transformation,adjective,transformation,answers:adjective.conjugations[transformation]}))),random));
  const result:AdjectiveQuestion[]=[];let family=random()<.5?0:pools.length-1;
  while(pools.some(pool=>pool.length)){if(pools[family].length)result.push(pools[family].pop()!);family=(family+1)%pools.length;}
  if(result.length>1&&result[0].id===previousId)[result[0],result[1]]=[result[1],result[0]];
  return result;
}

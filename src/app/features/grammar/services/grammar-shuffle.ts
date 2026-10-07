import { GrammarExercise } from '../models/grammar.model';

export function shuffleGrammar<T>(values:readonly T[],random:()=>number=Math.random):T[] {
  const result=[...values];
  for(let i=result.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[result[i],result[j]]=[result[j],result[i]];}
  return result;
}
export function shuffleGrammarExercise(exercise:GrammarExercise,random:()=>number=Math.random):GrammarExercise {
  if(exercise.kind==='multiple-choice'){
    const order=shuffleGrammar(exercise.optionKeys.map((_,i)=>i),random);
    return {...exercise,optionKeys:order.map(i=>exercise.optionKeys[i]),...(exercise.options?{options:order.map(i=>exercise.options![i])}:{}),answer:order.indexOf(exercise.answer)};
  }
  if(exercise.kind==='sentence-builder'||exercise.kind==='sentence-order'){
    const order=shuffleGrammar(exercise.tokenKeys.map((_,i)=>i),random);
    return {...exercise,tokenKeys:order.map(i=>exercise.tokenKeys[i]),solution:exercise.solution.map(i=>order.indexOf(i)),...(exercise.acceptedOrders?{acceptedOrders:exercise.acceptedOrders.map(solution=>solution.map(i=>order.indexOf(i)))}:{})};
  }
  if(exercise.kind==='matching')return {...exercise,rightOrder:shuffleGrammar(exercise.pairs.map((_,i)=>i),random)};
  return exercise; // Sentence segments keep syntactic order; typed answers have no options.
}

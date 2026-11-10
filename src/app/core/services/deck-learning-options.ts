import {DeckSettings} from '../models/deck.model';

export const DEFAULT_DECK_LEARNING_STEPS=Object.freeze([1,10]);
export const DEFAULT_DECK_RELEARNING_STEPS=Object.freeze([10]);
export function validDeckSteps(value:unknown):value is readonly number[]{
  return Array.isArray(value)&&value.length>0&&value.length<=10&&value.every(n=>Number.isSafeInteger(n)&&n>0&&n<1440);
}
export function validDeckLearningOptions(settings:Pick<DeckSettings,'learningSteps'|'relearningSteps'>):boolean {
  return [settings.learningSteps,settings.relearningSteps].every(v=>v===undefined||validDeckSteps(v));
}
export function parseDeckSteps(text:string):readonly number[]|null {
  const parts=text.trim().split(/\s+/),values=parts.map(part=>{const m=/^(\d+)(m|h)$/.exec(part);return m?Number(m[1])*(m[2]==='h'?60:1):NaN;});
  return validDeckSteps(values)?values:null;
}

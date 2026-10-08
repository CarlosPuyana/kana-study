import { DictionaryLookup } from '../models/dictionary.model';
import { GrammarConcept } from '../models/grammar-v2.model';
import { GRAMMAR_V2_CONCEPTS } from '../../data/grammar/grammar-n5-v2.generated';
import { GRAMMAR_LESSONS } from '../../features/grammar/data/grammar-catalog';
import { grammarTopicRound } from '../../features/grammar/services/grammar-interactive-catalog';

export interface MangaGrammarInput {
  readonly selectedText: string;
  readonly surface?: string;
  readonly baseForm?: string;
  readonly contextText?: string;
  readonly start?: number;
  readonly end?: number;
  readonly dictionary?: DictionaryLookup;
}
export interface MangaGrammarMatch {
  readonly concept: GrammarConcept;
  readonly confidence: 'verified'|'possible';
  readonly evidence: string;
  readonly reasonKey: string;
}
/** Curated complete utterances only. These forms are documented by the named
 * course lessons. No suffix/particle scan and no morphological inference. */
export const MANGA_GRAMMAR_RULES = [
  {conceptId:'te-kudasai', forms:['見てください','書いてください']},
  {conceptId:'nai-de-kudasai', forms:['食べないでください','撮らないでください']},
  {conceptId:'polite-verb-masu-system', forms:['食べます','飲みます']},
] as const;
export const mangaGrammarCatalog = GRAMMAR_V2_CONCEPTS.filter(concept =>
  Number(concept.topicId)>=1 && Number(concept.topicId)<=10
  && GRAMMAR_LESSONS.some(lesson=>lesson.topicId===concept.topicId&&lesson.id===concept.id));
export function mangaGrammarLinks(conceptId: string) {
  const concept=mangaGrammarCatalog.find(concept=>concept.id===conceptId);
  if(!concept)return null;
  return {lesson:`/grammar/n5/${concept.topicId}/${concept.id}`,
    practice:grammarTopicRound(concept.topicId,concept.id).length?`/grammar/n5/${concept.topicId}/practice`:null,lessonId:concept.id};
}
// Only surrounding space and a single terminal Japanese sentence mark may be
// ignored. Inner characters, line breaks, conjugations and punctuation remain.
const utterance=(text:string)=>text.trim().replace(/[。！？]$/u,'');
export function matchMangaGrammar(input: MangaGrammarInput): {state:'ready'|'empty'|'non-japanese'|'too-long'; matches:readonly MangaGrammarMatch[]} {
  const selected=input.selectedText;
  if(!selected.trim())return {state:'empty',matches:[]};
  if(selected.length>1200||(input.contextText?.length??0)>1200)return {state:'too-long',matches:[]};
  if(!/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/u.test(selected))return {state:'non-japanese',matches:[]};
  const candidates=[selected];
  const context=input.contextText;
  if(context && Number.isInteger(input.start) && Number.isInteger(input.end) && input.start!>=0 && input.end!>input.start!
    && context.slice(input.start,input.end)===selected)candidates.push(context);
  const matches:MangaGrammarMatch[]=[];
  for(const rule of MANGA_GRAMMAR_RULES){
    const evidence=candidates.find(text=>rule.forms.some(form=>utterance(text)===form));
    const concept=mangaGrammarCatalog.find(concept=>concept.id===rule.conceptId);
    if(evidence&&concept)matches.push({concept,confidence:'verified',evidence,reasonKey:'manga.grammar.curated'});
  }
  // A dictionary-confirmed te form suggests formation only, never a complete
  // construction (sequence/progressive/request). Deinflection reasons alone
  // are insufficient: require the exact written pair and matching verb POS.
  const pairs=[['食べて','食べる','v1'],['読んで','読む','v5']] as const;
  const dictionary=input.dictionary;
  if(!matches.length && dictionary && pairs.some(([surface,base,pos])=>selected===surface && input.surface===surface
    && input.baseForm===base && dictionary.reasons?.some(reason=>reason==='te')
    && dictionary.terms.some(term=>term.expression===base&&term.rules.split(/\s+/u).some(rule=>rule===pos)))){
    const concept=mangaGrammarCatalog.find(concept=>concept.id==='te-form-formation');
    if(concept)matches.push({concept,confidence:'possible',evidence:selected,reasonKey:'manga.grammar.possibleHelp'});
  }
  return {state:'ready',matches};
}
export function searchMangaGrammar(query:string,translate:(key:string)=>string,limit=8):readonly GrammarConcept[] {
  const normalize=(text:string)=>text.normalize('NFKC').normalize('NFD').replace(/\p{M}/gu,'').toLowerCase();
  const needle=normalize(query.trim());
  if(!needle || needle.length>1200)return [];
  return mangaGrammarCatalog.filter(concept=>normalize([translate(concept.titleKey),translate(concept.summaryKey),
    ...concept.lesson.formation.map(row=>row.pattern)].join('\n')).includes(needle)).slice(0,Math.max(0,Math.min(8,limit)));
}

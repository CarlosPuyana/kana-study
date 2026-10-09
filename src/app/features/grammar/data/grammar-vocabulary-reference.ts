import {AppLanguage} from '../../../core/models/settings.model';
import {LocalVocabularyWord} from '../../../core/services/japanese-local-vocabulary';

/** Small reviewed reference subset: exact written form + reading from the local
 * Japanese 1500 deck, preserving its ES/EN glosses and adding reviewed Catalan.
 * No deck data, IDs or pedagogical vocabulary are changed. */
export const GRAMMAR_VOCABULARY_REFERENCE:readonly {
  expression:string;reading:string;sourceId:string;meanings:Record<AppLanguage,string>;
}[]=[
  {expression:'私',reading:'わたし',sourceId:'n-jp1500-en-ue*r{>Er!]',meanings:{es:'yo (general, neutro)',en:'I (polite, general)',ca:'jo (general, neutre)'}},
  {expression:'日本',reading:'にほん',sourceId:'n-jp1500-en-vKY%B:h@cQ',meanings:{es:'Japón',en:'Japan',ca:'Japó'}},
  {expression:'日本語',reading:'にほんご',sourceId:'n-jp1500-en-BjMgplFn)5',meanings:{es:'lengua japonesa, japonés (idioma)',en:'Japanese language',ca:'llengua japonesa, japonès (idioma)'}},
  {expression:'思う',reading:'おもう',sourceId:'n-jp1500-en-p)DJ8=TN`r',meanings:{es:'pensar, creer',en:'think',ca:'pensar, creure'}},
  {expression:'急ぐ',reading:'いそぐ',sourceId:'n-jp1500-en-xu$U7r7k:d',meanings:{es:'darse prisa, apresurarse',en:'to hurry',ca:'afanyar-se, donar-se pressa'}},
  {expression:'食事',reading:'しょくじ',sourceId:'n-jp1500-en-vDG>9HX_l',meanings:{es:'comida, cena',en:'meal, dinner',ca:'àpat, sopar'}},
  {expression:'速い',reading:'はやい',sourceId:'n-jp1500-en-kJ{POw4boD',meanings:{es:'rápido (de velocidad)',en:'fast (in terms of speed)',ca:'ràpid (de velocitat)'}},
];
export function grammarReferenceMeaning(word:LocalVocabularyWord,language:AppLanguage):string {
  const entries=GRAMMAR_VOCABULARY_REFERENCE.filter(entry=>entry.expression===word.expression && entry.reading===word.reading);
  return entries.length===1?entries[0].meanings[language]:'';
}

import { VocabularyQuestionType } from '../models/vocabulary.model';
export function showFuriganaInPrompt(type:VocabularyQuestionType):boolean{return type==='japanese-to-meaning'}
export function showFuriganaInOption(type:VocabularyQuestionType,answered:boolean,correct:boolean):boolean{return type==='meaning-to-japanese'||(type==='reading-to-japanese'&&answered&&correct)}
export function showFuriganaInRevealedAnswer(revealedOrAnswered:boolean):boolean{return revealedOrAnswered}

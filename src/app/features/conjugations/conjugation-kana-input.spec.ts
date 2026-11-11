import {conjugationKanaInput as convert,conjugationAnswerInput} from './conjugation-kana-input';
import {CONJUGATION_ADJECTIVES} from '../../data/conjugation-adjectives';
import {CONJUGATION_VERBS} from '../../data/conjugation-verbs';
import {validateConjugationAnswer} from '../../core/services/conjugation-answer-validator';
describe('Conjugations progressive romaji input',()=>{
 it.each([['s','s'],['sh','sh'],['shi','し'],['ch','ch'],['chi','ち'],['ts','ts'],['tsu','つ'],['yasui','やすい'],['yasukatta','やすかった'],['shizukadatta','しずかだった'],['kya','きゃ'],['sya','しゃ'],['tyo','ちょ'],['fu','ふ'],['hu','ふ'],['si','し'],['n','n'],["n'",'ん'],['nn','んn'],['nna','んな'],['nya','にゃ'],['shinbun','しんぶn'],['konnichiha','こんにちは'],['mattya','まっちゃ'],['matcha','まっちゃ'],['切るtaberuし','切るたべるし'],['YOKATTA','よかった'],['ka!','か!']])('%s → %s',(raw,kana)=>expect(convert(raw).value).toBe(kana));
 it('converts sequential keystrokes without losing pending consonants or n',()=>{
  for(const [raw,kana]of [['konnichiha','こんにちは'],['yasukatta','やすかった'],['shizukadatta','しずかだった'],['kanpai','かんぱい']]){let value='';for(const c of raw)value=convert(value+c).value;expect(value).toBe(kana);}
 });
 it('finalizes pending n without deleting pre-existing kana',()=>{expect(convert('hon',true).value).toBe('ほん');expect(convert('nn',true).value).toBe('ん');expect(convert('んn',true).value).toBe('んん');expect(convert('sh',true).value).toBe('sh');});
 it('maps caret and selection offsets after compacting text, preserving the suffix',()=>{const result=convert('漢字shizukadatta後');expect(result.value).toBe('漢字しずかだった後');expect(result.offsets[2]).toBe(2);expect(result.offsets[5]).toBe(3);expect(result.offsets.at(-1)).toBe(result.value.length);expect(convert('かk後').value).toBe('かk後');});
 it('preserves every explicit adjective and C1–C3 verb romaji answer through progressive conversion',()=>{
  for(const word of [...CONJUGATION_ADJECTIVES,...CONJUGATION_VERBS])for(const answers of Object.values(word.conjugations))for(const alias of answers.romaji){let text='';for(const letter of alias)text=conjugationAnswerInput(text+letter,answers).value;expect(validateConjugationAnswer(conjugationAnswerInput(text,answers,true).value,answers),alias).toBe(true);}
 });
 it('does not repair incorrect conjugations or introduce colloquial potential forms',()=>{const a=CONJUGATION_VERBS.find(v=>v.id==='taberu')!.conjugations.potential!;expect(validateConjugationAnswer(conjugationAnswerInput('tabereru',a,true).value,a)).toBe(false);});
 it('preserves kana already supplied by paste or IME, including incorrect particle spelling',()=>{const a=CONJUGATION_ADJECTIVES.find(v=>v.id==='shizuka')!.conjugations.negative;expect(conjugationAnswerInput('しずかでわない',a,true).value).toBe('しずかでわない');expect(validateConjugationAnswer('しずかでわない',a)).toBe(false);});
});

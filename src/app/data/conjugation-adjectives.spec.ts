import {CONJUGATION_ADJECTIVES as words} from './conjugation-adjectives';
import {ADJECTIVE_TRANSFORMATIONS as forms} from '../core/models/conjugation-practice.model';
import * as copy from '../../assets/i18n/conjugations.generated';

// Independent editorial answer sheet. Literal kana, not generated from production data or suffix rules.
const sheet=`
takai|たかくない|たかかった|たかくなかった|たかくて|たかく
yasui|やすくない|やすかった|やすくなかった|やすくて|やすく
ookii|おおきくない|おおきかった|おおきくなかった|おおきくて|おおきく
chiisai|ちいさくない|ちいさかった|ちいさくなかった|ちいさくて|ちいさく
atarashii|あたらしくない|あたらしかった|あたらしくなかった|あたらしくて|あたらしく
furui|ふるくない|ふるかった|ふるくなかった|ふるくて|ふるく
atsui|あつくない|あつかった|あつくなかった|あつくて|あつく
samui|さむくない|さむかった|さむくなかった|さむくて|さむく
isogashii|いそがしくない|いそがしかった|いそがしくなかった|いそがしくて|いそがしく
tanoshii|たのしくない|たのしかった|たのしくなかった|たのしくて|たのしく
muzukashii|むずかしくない|むずかしかった|むずかしくなかった|むずかしくて|むずかしく
yasashii|やさしくない|やさしかった|やさしくなかった|やさしくて|やさしく
omoshiroi|おもしろくない|おもしろかった|おもしろくなかった|おもしろくて|おもしろく
oishii|おいしくない|おいしかった|おいしくなかった|おいしくて|おいしく
ii|よくない|よかった|よくなかった|よくて|よく
shizuka|しずかじゃない,しずかではない|しずかだった|しずかじゃなかった,しずかではなかった|しずかで|しずかに
genki|げんきじゃない,げんきではない|げんきだった|げんきじゃなかった,げんきではなかった|げんきで|げんきに
benri|べんりじゃない,べんりではない|べんりだった|べんりじゃなかった,べんりではなかった|べんりで|べんりに
kirei|きれいじゃない,きれいではない|きれいだった|きれいじゃなかった,きれいではなかった|きれいで|きれいに
yuumei|ゆうめいじゃない,ゆうめいではない|ゆうめいだった|ゆうめいじゃなかった,ゆうめいではなかった|ゆうめいで|ゆうめいに
shinsetsu|しんせつじゃない,しんせつではない|しんせつだった|しんせつじゃなかった,しんせつではなかった|しんせつで|しんせつに
kantan|かんたんじゃない,かんたんではない|かんたんだった|かんたんじゃなかった,かんたんではなかった|かんたんで|かんたんに
taisetsu|たいせつじゃない,たいせつではない|たいせつだった|たいせつじゃなかった,たいせつではなかった|たいせつで|たいせつに
suki|すきじゃない,すきではない|すきだった|すきじゃなかった,すきではなかった|すきで|すきに
kirai|きらいじゃない,きらいではない|きらいだった|きらいじゃなかった,きらいではなかった|きらいで|きらいに`.trim().split('\n').map(line=>line.split('|'));

// Test-only reading audit. This transliterates written kana; it does not conjugate words.
const mora:Record<string,string>={あ:'a',い:'i',う:'u',え:'e',お:'o',か:'ka',き:'ki',く:'ku',け:'ke',こ:'ko',さ:'sa',し:'shi',す:'su',せ:'se',そ:'so',た:'ta',ち:'chi',つ:'tsu',て:'te',と:'to',な:'na',に:'ni',ぬ:'nu',ね:'ne',の:'no',は:'ha',ひ:'hi',ふ:'fu',へ:'he',ほ:'ho',ま:'ma',み:'mi',む:'mu',め:'me',も:'mo',や:'ya',ゆ:'yu',よ:'yo',ら:'ra',り:'ri',る:'ru',れ:'re',ろ:'ro',わ:'wa',ん:'n',が:'ga',ぎ:'gi',ぐ:'gu',げ:'ge',ご:'go',ざ:'za',じ:'ji',ず:'zu',ぜ:'ze',ぞ:'zo',だ:'da',で:'de',ど:'do',ば:'ba',び:'bi',ぶ:'bu',べ:'be',ぼ:'bo',じゃ:'ja'};
function romanize(kana:string):string {let result='';for(let i=0;i<kana.length;i++){if(kana.slice(i,i+2)==='では'){result+='dewa';i++;continue;}if(kana[i]==='っ'){result+=mora[kana[i+1]][0];continue;}const pair=mora[kana.slice(i,i+2)];if(pair){result+=pair;i++;}else{expect(mora[kana[i]],kana).toBeTruthy();result+=mora[kana[i]];}}return result;}
const readings=[['高','たか'],['安','やす'],['大き','おおき'],['小さ','ちいさ'],['新し','あたらし'],['古','ふる'],['暑','あつ'],['寒','さむ'],['忙し','いそがし'],['楽し','たのし'],['難し','むずかし'],['易し','やさし'],['面白','おもしろ'],['静か','しずか'],['元気','げんき'],['便利','べんり'],['有名','ゆうめい'],['親切','しんせつ'],['簡単','かんたん'],['大切','たいせつ'],['好き','すき'],['嫌い','きらい']];

describe('Explicit adjective editorial catalog',()=>{
  it('has exactly 25 stable unique identities, 15 i and 10 na, and 125 answer sets',()=>{
    expect(words.map(w=>w.id)).toEqual(sheet.map(row=>row[0]));expect(new Set(words.map(w=>w.id)).size).toBe(25);expect(words.filter(w=>w.type==='i')).toHaveLength(15);expect(words.filter(w=>w.type==='na')).toHaveLength(10);
    expect(words.flatMap(w=>Object.keys(w.conjugations))).toHaveLength(125);
    for(const w of words){expect(Object.keys(w.conjugations)).toEqual([...forms]);for(const form of forms){const a=w.conjugations[form];expect(a.kana.length+a.romaji.length+a.kanji.length).toBeGreaterThan(0);for(const list of Object.values(a)){expect(new Set(list).size).toBe(list.length);expect(list.every((s:string)=>!!s.trim()&&s===s.normalize('NFKC').trim())).toBe(true);}}}
  });
  for(const [id,...answers]of sheet)it(`matches the independent five-form sheet and consistent readings: ${id}`,()=>{
    const word=words.find(w=>w.id===id)!;
    forms.forEach((form,i)=>{const a=word.conjugations[form];expect(a.kana).toEqual(answers[i].split(','));expect(a.romaji).toEqual(a.kana.map(romanize));for(const answer of a.kanji){let kana=answer;for(const [written,reading]of readings)if(kana.startsWith(written)){kana=reading+kana.slice(written.length);break;}expect(a.kana).toContain(kana);}});
  });
  it('keeps irregular ii and misleading final-i na adjectives explicit, with kana-only orthographies',()=>{
    expect(words.find(w=>w.id==='ii')!.conjugations.past).toEqual({romaji:['yokatta'],kana:['よかった'],kanji:[]});for(const id of ['kirei','kirai','suki'])expect(words.find(w=>w.id===id)?.type).toBe('na');
    for(const id of ['ii','kirei','oishii'])for(const a of Object.values(words.find(w=>w.id===id)!.conjugations))expect(a.kanji).toEqual([]);
  });
  it('has localized meanings and rules for each family/transformation without leaking concrete answers',()=>{
    for(const language of ['es','en','ca'] as const){for(const w of words){expect(copy[language][w.meaningKey]).toBeTruthy();for(const form of forms){const rule=copy[language]['conjugations.rule.'+w.type+'.'+form];expect(rule).toBeTruthy();for(const a of [...w.conjugations[form].kana,...w.conjugations[form].kanji])expect(rule).not.toContain(a);}}}
  });
});



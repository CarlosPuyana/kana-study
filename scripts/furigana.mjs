const KANA=/^[\p{Script=Hiragana}\p{Script=Katakana}ー]+$/u;
const HAN=/\p{Script=Han}/u;

export function generateFuriganaSegments(writtenForm,reading){
  if(!writtenForm||!reading)return{segments:[{text:writtenForm}],strategy:'kana-only'};
  const normalizedWritten=toHiragana(writtenForm),normalizedReading=toHiragana(reading);
  if(KANA.test(writtenForm)&&normalizedWritten===normalizedReading)return{segments:[{text:writtenForm}],strategy:'kana-only'};
  if(!HAN.test(writtenForm))return{segments:[{text:writtenForm}],strategy:'kana-only'};
  const tokens=tokenize(writtenForm);
  if(tokens.length===1)return{segments:[{text:writtenForm,reading}],strategy:'group'};
  const aligned=align(tokens,normalizedReading,reading);
  if(aligned)return{segments:aligned,strategy:'partial'};
  return{segments:[{text:writtenForm,reading}],strategy:'fallback'};
}

function tokenize(value){const tokens=[];for(const character of value){const kana=KANA.test(character),previous=tokens.at(-1);if(previous&&previous.kana===kana)previous.text+=character;else tokens.push({text:character,kana})}return tokens}
function align(tokens,normalizedReading,originalReading){
  const solve=(tokenIndex,readingIndex)=>{
    if(tokenIndex===tokens.length)return readingIndex===normalizedReading.length?[[]]:[];
    const token=tokens[tokenIndex];
    if(token.kana){const normalized=toHiragana(token.text);if(!normalizedReading.startsWith(normalized,readingIndex))return[];return solve(tokenIndex+1,readingIndex+normalized.length).map(rest=>[{text:token.text},...rest])}
    const relativeNext=tokens.slice(tokenIndex+1).findIndex(candidate=>candidate.kana);
    if(relativeNext<0){if(readingIndex>=normalizedReading.length)return[];return[[{text:token.text,reading:originalReading.slice(readingIndex)}]]}
    const absoluteNext=tokenIndex+1+relativeNext,anchor=toHiragana(tokens[absoluteNext].text),minimumTail=tokens.slice(absoluteNext+1).filter(candidate=>!candidate.kana).length;
    const solutions=[];
    for(let at=readingIndex+1;at<=normalizedReading.length-anchor.length-minimumTail;at++){
      if(!normalizedReading.startsWith(anchor,at))continue;
      for(const rest of solve(tokenIndex+1,at))solutions.push([{text:token.text,reading:originalReading.slice(readingIndex,at)},...rest]);
      if(solutions.length>1)break;
    }
    return solutions;
  };
  const solutions=solve(0,0);return solutions.length===1?solutions[0]:null;
}
function toHiragana(value){return[...value.normalize('NFKC')].map(character=>{const code=character.charCodeAt(0);return code>=0x30a1&&code<=0x30f6?String.fromCharCode(code-0x60):character}).join('')}

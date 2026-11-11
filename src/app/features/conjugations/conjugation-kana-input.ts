import {AcceptedConjugationAnswers} from '../../core/models/conjugation-practice.model';
// Input convenience only. Accepted answers remain the explicit catalog records.
const syllables:Record<string,string>={};
for(const [keys,kana]of [
 ['a i u e o','あいうえお'],['ka ki ku ke ko','かきくけこ'],['sa shi su se so','さしすせそ'],
 ['ta chi tsu te to','たちつてと'],['na ni nu ne no','なにぬねの'],['ha hi fu he ho','はひふへほ'],
 ['ma mi mu me mo','まみむめも'],['ya yu yo','やゆよ'],['ra ri ru re ro','らりるれろ'],['wa wo','わを'],
 ['ga gi gu ge go','がぎぐげご'],['za ji zu ze zo','ざじずぜぞ'],['da di du de do','だぢづでど'],
 ['ba bi bu be bo','ばびぶべぼ'],['pa pi pu pe po','ぱぴぷぺぽ'],['xa xi xu xe xo','ぁぃぅぇぉ'],
 ['xya xyu xyo','ゃゅょ'],['xtsu','っ'],['vu','ゔ'],
] as const)keys.split(' ').forEach((key,i)=>syllables[key]=kana[i]);
Object.assign(syllables,{si:'し',ti:'ち',tu:'つ',hu:'ふ',zi:'じ',la:'ぁ',li:'ぃ',lu:'ぅ',le:'ぇ',lo:'ぉ',ltsu:'っ',ltu:'っ',xtu:'っ',n:"ん"});
for(const [prefix,base]of Object.entries({ky:'き',gy:'ぎ',sh:'し',sy:'し',j:'じ',jy:'じ',zy:'じ',ch:'ち',cy:'ち',ty:'ち',ny:'に',hy:'ひ',by:'び',py:'ぴ',my:'み',ry:'り',dy:'ぢ'}))
 for(const [vowel,small]of [['a','ゃ'],['u','ゅ'],['o','ょ']])syllables[prefix+vowel]=base+small;
Object.assign(syllables,{she:'しぇ',che:'ちぇ',je:'じぇ',fa:'ふぁ',fi:'ふぃ',fe:'ふぇ',fo:'ふぉ',wi:'うぃ',we:'うぇ'});
const prefixes=new Set(Object.keys(syllables).flatMap(key=>Array.from({length:key.length-1},(_,i)=>key.slice(0,i+1))));
export function conjugationKanaInput(text:string,final=false):{value:string;offsets:readonly number[]}{
 let value='',i=0;const offsets:number[]=[0];
 const add=(replacement:string,length:number)=>{value+=replacement;for(let n=1;n<=length;n++)offsets[i+n]=value.length;i+=length;};
 while(i<text.length){
  const tail=text.slice(i).toLowerCase(),first=tail[0];
  if(!/[a-z]/.test(first)){add(text[i],1);continue;}
  if(first==='n'){
   if(tail[1]==="'"){add('ん',2);continue;}
   if(tail[1]==='n'){add('ん',1);continue;}
   if(tail.length===1){add(final?(text[i-1]?.toLowerCase()==='n'?'':'ん'):text[i],1);continue;}
   if(!/[aiueoy]/.test(tail[1])){add('ん',1);continue;}
  }
  if((first===tail[1]&&/[bcdfghjkmprstz]/.test(first))||(tail.startsWith('tch'))){add('っ',1);continue;}
  let found=false;
  for(let length=Math.min(4,tail.length);length>0;length--){const key=tail.slice(0,length);if(key!=='n'&&syllables[key]){add(syllables[key],length);found=true;break;}}
  if(found)continue;
  if(prefixes.has(tail)){while(i<text.length)add(text[i],1);break;}
  add(text[i],1);
 }
 return {value,offsets};
}

/** Preserve catalog romaji aliases (dewa, spaced suru), without extending validation. */
export function conjugationAnswerInput(text:string,answers:AcceptedConjugationAnswers|undefined,final=false):ReturnType<typeof conjugationKanaInput>{
 const result=conjugationKanaInput(text,final);
 if(!answers?.kana.length||!/[a-z]/i.test(text))return result;
 const index=answers.romaji.findIndex(alias=>conjugationKanaInput(alias,true).value===result.value);
 if(index<0)return result;
 const value=answers.kana[index%answers.kana.length];
 if(value===result.value)return result;
 let prefix=0,suffix=0;
 while(prefix<value.length&&prefix<result.value.length&&value[prefix]===result.value[prefix])prefix++;
 while(suffix<value.length-prefix&&suffix<result.value.length-prefix&&value[value.length-1-suffix]===result.value[result.value.length-1-suffix])suffix++;
 return {value,offsets:result.offsets.map(offset=>offset<=prefix?offset:offset>=result.value.length-suffix?offset+value.length-result.value.length:Math.min(offset,value.length-suffix))};
}

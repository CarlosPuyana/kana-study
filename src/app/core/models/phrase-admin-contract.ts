import type { PhraseContent } from './phrase-island.model';

export const AUTHORING_TOPICS = ['everyday','conversation','work','shopping','travel','hobbies'] as const;
export const AUTHORING_LANGUAGES = ['es','en','ca'] as const;
export const AIVIS_MODEL_SHA = '6dabe29de5ec2c1715e12a430805e1bff6ec64a315cccec2d26fad029df83243';
export const DEFAULT_PHRASE_SYNTHESIS = {engineVersion:'1.2.0',voice:'aida-shigeru-normal',modelSha256:AIVIS_MODEL_SHA,speedScale:1,intonationScale:1,tempoDynamicsScale:1,pitchScale:0} as const;
export interface PhraseSynthesis {
  readonly engineVersion:'1.2.0'; readonly voice:'aida-shigeru-normal'; readonly modelSha256:string;
  readonly speedScale:number; readonly intonationScale:number; readonly tempoDynamicsScale:number; readonly pitchScale:number;
}
export interface PhraseAdminDraft {
  readonly schemaVersion:1;
  readonly draftId:string;
  readonly operation:'create'|'edit';
  readonly base:{readonly catalogVersion:string;readonly catalogFingerprint:string;readonly phraseFingerprint:string|null;readonly contentRevision:string|null;readonly audioSha256:string|null};
  readonly phrase:PhraseContent;
  readonly synthesis:PhraseSynthesis;
}
export interface DraftIssue { readonly code:string; readonly field:string; }
export const MAX_DRAFT_BYTES=131072;
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const HASH=/^[0-9a-f]{64}$/;
export function validPhraseId(id:string):boolean {return /^pi-[a-z0-9-]{3,100}$/.test(id)&&!id.includes('..');}
export function canonicalJson(value:unknown):string {
  if(value===null||typeof value!=='object')return JSON.stringify(value);
  if(Array.isArray(value))return '['+value.map(canonicalJson).join(',')+']';
  const record=value as Record<string,unknown>;
  return '{'+Object.keys(record).sort().filter(k=>record[k]!==undefined).map(k=>JSON.stringify(k)+':'+canonicalJson(record[k])).join(',')+'}';
}
export function synthesisInput(draft:PhraseAdminDraft):unknown {return {japanese:draft.phrase.japanese,reading:draft.phrase.reading,synthesis:draft.synthesis};}
export function normalizeJapanese(value:string):string {return value.normalize('NFC').trim().replace(/\s+/gu,' ');}

/** Same pure contract in browser and Node CLI. No imported state is an approval. */
export function validateDraft(value:unknown,complete=false):DraftIssue[] {
  const issues:DraftIssue[]=[];const issue=(code:string,field:string)=>issues.push({code,field});
  function object(v:unknown,keys:readonly string[],field:string):v is Record<string,unknown>{
    if(!v||typeof v!=='object'||Array.isArray(v)||Object.getPrototypeOf(v)!==Object.prototype){issue('structure',field);return false;}
    const actual=Object.keys(v);if(actual.some(k=>!keys.includes(k)||['__proto__','constructor','prototype'].includes(k)))issue('structure',field);
    return true;
  }
  function text(v:unknown,max:number,field:string,required=complete):v is string {
    if(typeof v!=='string'||[...v].length>max||/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f\uD800-\uDFFF]/u.test(v)){issue('unicode',field);return false;}
    if(required&&!v.trim())issue('required',field);return true;
  }
  if(!object(value,['schemaVersion','draftId','operation','base','phrase','synthesis'],'draft'))return issues;
  if(value['schemaVersion']!==1)issue('schema','schemaVersion');
  if(typeof value['draftId']!=='string'||!UUID.test(value['draftId']))issue('id','draftId');
  if(!['create','edit'].includes(value['operation'] as string))issue('structure','operation');
  const base=value['base'];
  if(object(base,['catalogVersion','catalogFingerprint','phraseFingerprint','contentRevision','audioSha256'],'base')){
    if(typeof base['catalogVersion']!=='string'||!/^\d+\.\d+\.\d+$/.test(base['catalogVersion']))issue('schema','base.catalogVersion');
    if(typeof base['catalogFingerprint']!=='string'||!HASH.test(base['catalogFingerprint']))issue('hash','base.catalogFingerprint');
    for(const k of ['phraseFingerprint','audioSha256'])if(base[k]!==null&&(typeof base[k]!=='string'||!HASH.test(base[k])))issue('hash','base.'+k);
    if(base['contentRevision']!==null&&(typeof base['contentRevision']!=='string'||!/^\d+$/.test(base['contentRevision'])))issue('schema','base.contentRevision');
    if(value['operation']==='create'&&['phraseFingerprint','contentRevision','audioSha256'].some(k=>base[k]!==null))issue('structure','base');
    if(value['operation']==='edit'&&['phraseFingerprint','contentRevision','audioSha256'].some(k=>base[k]===null))issue('structure','base');
  }
  const phrase=value['phrase'];
  if(object(phrase,['id','topicId','japanese','segments','reading','level','register','localizations'],'phrase')){
    if(typeof phrase['id']!=='string'||!validPhraseId(phrase['id'])||(value['operation']==='create'&&!UUID.test(String(phrase['id']).slice(3))))issue('id','phrase.id');
    if(!AUTHORING_TOPICS.includes(phrase['topicId'] as typeof AUTHORING_TOPICS[number]))issue('choice','phrase.topicId');
    if(!['N5','N4'].includes(phrase['level'] as string))issue('choice','phrase.level');
    if(!['polite','informal','neutral'].includes(phrase['register'] as string))issue('choice','phrase.register');
    const japaneseOK=text(phrase['japanese'],300,'phrase.japanese');
    const readingOK=text(phrase['reading'],300,'phrase.reading');
    if(japaneseOK&&complete&&!/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/u.test(phrase['japanese'] as string))issue('japanese','phrase.japanese');
    if(readingOK&&complete&&!/^[\p{Script=Hiragana}\p{Script=Katakana}ー・。、！？?!…「」『』（）()\s]+$/u.test(phrase['reading'] as string))issue('reading','phrase.reading');
    const segments=phrase['segments'];
    if(!Array.isArray(segments)||segments.length>128){issue('structure','phrase.segments');}
    else{
      if(complete&&!segments.length)issue('required','phrase.segments');
      const valid=segments.map((segment,n)=>{
        if(!object(segment,['text','reading'],`phrase.segments.${n}`))return false;
        const ok=text(segment['text'],300,`phrase.segments.${n}.text`);
        if(segment['reading']!==undefined){text(segment['reading'],300,`phrase.segments.${n}.reading`);if(complete&&typeof segment['reading']==='string'&&!/^[\p{Script=Hiragana}\p{Script=Katakana}ー・。、！？?!…「」『』（）()\s]+$/u.test(segment['reading']))issue('reading',`phrase.segments.${n}.reading`);}
        if(complete&&ok&&/\p{Script=Han}/u.test(segment['text'] as string)&&!segment['reading'])issue('required',`phrase.segments.${n}.reading`);
        return ok;
      });
      if(complete&&valid.every(Boolean)){
        if(segments.map(s=>s.text).join('')!==phrase['japanese'])issue('segments','phrase.segments');
        if(segments.map(s=>s.reading??s.text).join('')!==phrase['reading'])issue('segments','phrase.reading');
      }
    }
    const localizations=phrase['localizations'];
    if(object(localizations,AUTHORING_LANGUAGES,'phrase.localizations'))for(const lang of AUTHORING_LANGUAGES){
      const l=localizations[lang];if(object(l,['natural','structural','explanation'],'phrase.localizations.'+lang))for(const [field,max] of [['natural',1000],['structural',2000],['explanation',3000]] as const)text(l[field],max,`phrase.localizations.${lang}.${field}`);
    }
  }
  const syn=value['synthesis'];
  if(object(syn,Object.keys(DEFAULT_PHRASE_SYNTHESIS),'synthesis')){
    for(const k of ['engineVersion','voice','modelSha256'] as const)if(syn[k]!==DEFAULT_PHRASE_SYNTHESIS[k])issue('choice','synthesis.'+k);
    for(const [k,min,max] of [['speedScale',.5,2],['intonationScale',0,2],['tempoDynamicsScale',0,2],['pitchScale',-.1,.1]] as const)if(typeof syn[k]!=='number'||!Number.isFinite(syn[k])||syn[k]<min||syn[k]>max)issue('choice','synthesis.'+k);
  }
  if(new TextEncoder().encode(JSON.stringify(value)).byteLength>MAX_DRAFT_BYTES)issue('size','draft');
  return issues;
}
export function parseDraftJson(text:string):PhraseAdminDraft {
  if(new TextEncoder().encode(text).byteLength>MAX_DRAFT_BYTES)throw new Error('size');
  let value:unknown;try{value=JSON.parse(text);}catch{throw new Error('structure: invalid JSON');}const issues=validateDraft(value);if(issues.length)throw new Error(issues[0].code+': '+issues[0].field);
  return value as PhraseAdminDraft;
}

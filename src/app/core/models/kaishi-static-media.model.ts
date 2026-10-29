export const KAISHI_STATIC_VERSION='esp-v1-3fdaef081150-r2';
export const KAISHI_STATIC_ROOT=`assets/kaishi/${KAISHI_STATIC_VERSION}/`;
export const KAISHI_WITHHELD_SENTENCE='n-jp1500-en-CGA2j9S)g.';
export const KAISHI_MISSING_WORD='n-jp1500-en-k6QFi.%;`Q';
export type KaishiStaticKind='wordAudio'|'sentenceAudio'|'picture';
export interface KaishiStaticResource {readonly path:string;readonly bytes:number;readonly type:string}
export interface KaishiStaticCard {readonly schemaVersion:1;readonly version:string;readonly entryId:string;readonly resources:Partial<Record<KaishiStaticKind,KaishiStaticResource>>}
export interface KaishiStaticCatalog {readonly schemaVersion:1;readonly version:string;readonly publication:'blocked'|'ready';readonly dataset:'kaishi'|'test'}
export function kaishiResourceAllowed(id:string,kind:KaishiStaticKind):boolean{return !(id===KAISHI_WITHHELD_SENTENCE&&kind==='sentenceAudio'||id===KAISHI_MISSING_WORD&&kind==='wordAudio');}

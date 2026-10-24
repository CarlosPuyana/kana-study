import { MangaOcrOccurrence } from '../models/manga-ocr-occurrence.model';
import { MokuroPage } from '../models/manga.model';
import { OCR_SEARCH_LIMITS, ocrDigest } from './manga-ocr-text';

const keys=['schemaVersion','volumeId','pageIndex','blockIndex','lineIndex','start','end','found','pageFingerprint','captureFingerprint','workspace','activationRevision'];
const index=(n:unknown):n is number=>typeof n==='number'&&Number.isSafeInteger(n)&&n>=0;
const hash=(s:unknown):s is string=>typeof s==='string'&&/^[a-f0-9]{64}$/.test(s);
export function parseOcrOccurrence(value:unknown):MangaOcrOccurrence|null{
  if(!value||typeof value!=='object'||Array.isArray(value))return null;
  const r=value as Record<string,unknown>;
  if(Object.keys(r).some(k=>!keys.includes(k))||r['schemaVersion']!==1||typeof r['volumeId']!=='string'||!r['volumeId'].length||r['volumeId'].length>4096||
    !['pageIndex','blockIndex','lineIndex','start','end','activationRevision'].every(k=>index(r[k]))||
    typeof r['found']!=='string'||!r['found'].length||r['found'].length>OCR_SEARCH_LIMITS.queryUnits||
    (r['end'] as number)-(r['start'] as number)!==r['found'].length||(r['end'] as number)>OCR_SEARCH_LIMITS.lineUnits||
    typeof r['workspace']!=='string'||!hash(r['pageFingerprint'])||
    (r['captureFingerprint']!==undefined&&!hash(r['captureFingerprint'])))return null;
  for(const point of r['found'])if(point.length===1&&point.charCodeAt(0)>=0xd800&&point.charCodeAt(0)<=0xdfff)return null;
  return {...r} as unknown as MangaOcrOccurrence;
}
export type OcrLocationResult=
  | {readonly status:'unavailable'|'stale'}
  | {readonly status:'line'|'text';readonly reference:MangaOcrOccurrence;readonly fragment:string};
const boundary=(s:string,n:number)=>!(n>0&&n<s.length&&s.charCodeAt(n)>=0xdc00&&s.charCodeAt(n)<=0xdfff&&s.charCodeAt(n-1)>=0xd800&&s.charCodeAt(n-1)<=0xdbff);
/** Validate textual evidence separately from line-level image geometry. Never modifies OCR or DOM selection. */
export async function locateOcrOccurrence(value:unknown,volumeId:string,pageIndex:number,workspace:string,epoch:number,
  fresh:MokuroPage|null,rendered:MokuroPage|null,guard:()=>void=()=>{}):Promise<OcrLocationResult>{
  const r=parseOcrOccurrence(value);
  if(!r||r.volumeId!==volumeId||r.pageIndex!==pageIndex||r.workspace!==workspace||r.activationRevision!==epoch||!fresh||!rendered)return {status:'unavailable'};
  guard();const raw=JSON.stringify(fresh),shown=JSON.stringify(rendered);
  if(new TextEncoder().encode(raw).byteLength>OCR_SEARCH_LIMITS.pageBytes||new TextEncoder().encode(shown).byteLength>OCR_SEARCH_LIMITS.pageBytes)return {status:'unavailable'};
  const fingerprint=await ocrDigest(raw);guard();if(fingerprint!==r.pageFingerprint)return {status:'stale'};
  if(await ocrDigest(shown)!==r.pageFingerprint){guard();return {status:'stale'};}guard();
  const block=rendered.blocks?.[r.blockIndex],fragment=block?.lines?.[r.lineIndex];
  if(typeof fragment!=='string'||fragment.length>OCR_SEARCH_LIMITS.lineUnits||r.end>fragment.length||
    !boundary(fragment,r.start)||!boundary(fragment,r.end)||fragment.slice(r.start,r.end)!==r.found)return {status:'unavailable'};
  const points=block.lines_coords?.[r.lineIndex];
  const geometry=Number.isFinite(rendered.img_width)&&rendered.img_width>0&&Number.isFinite(rendered.img_height)&&rendered.img_height>0&&
    Number.isFinite(block.font_size)&&block.font_size>0&&typeof block.vertical==='boolean'&&Array.isArray(points)&&points.length>=4&&
    points.every(p=>Array.isArray(p)&&p.length===2&&p.every(Number.isFinite)&&p[0]>=0&&p[0]<=rendered.img_width&&p[1]>=0&&p[1]<=rendered.img_height)&&
    Math.max(...points.map(p=>p[0]))>Math.min(...points.map(p=>p[0]))&&Math.max(...points.map(p=>p[1]))>Math.min(...points.map(p=>p[1]));
  return {status:geometry?'line':'text',reference:r,fragment};
}

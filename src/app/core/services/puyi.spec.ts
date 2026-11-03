import {TestBed} from '@angular/core/testing';
import {signal} from '@angular/core';
import {IDBFactory} from 'fake-indexeddb';
import {PUYI_DECK,PUYI_FIELDS,PUYI_LIMITS,PuyiCard,emptyPuyiDraft,puyiEntry,validatePuyiDraft} from '../models/puyi.model';
import {PuyiService,validatePuyiImage} from './puyi.service';
import {SupabaseClientService} from './supabase-client.service';
import {AuthService} from './auth.service';
import {DeckCatalogService} from './deck-catalog.service';
import {DeckStudyService} from './deck-study.service';
import {DeckDatabaseService} from './deck-database.service';
import {WorkspaceService} from './workspace.service';
import {deckDayDifficulties} from './deck-day-presentation';
import {DeckPersistenceRouter} from './deck-persistence-router';

const draft={word:'猫',kana:'ねこ',meaning:'gato',exampleSentence:'猫です。',exampleTranslation:'Es un gato.'};
const card:PuyiCard={...draft,id:'10000000-0000-0000-0000-000000000001',position:1,version:1,image_path:null,created_at:'2026-11-03T12:00:00Z',updated_at:'2026-11-03T12:00:00Z',author_id:'owner'};
afterEach(()=>{TestBed.resetTestingModule();vi.unstubAllGlobals();localStorage.clear();});
describe('Puyi content validation',()=>{
 it('requires exactly the five text fields; optional image; no invented translations or markup',()=>{
  expect(validatePuyiDraft(emptyPuyiDraft())).toBe(false);expect(validatePuyiDraft(draft)).toBe(true);
  for(const field of PUYI_FIELDS)expect(validatePuyiDraft({...draft,[field]:'   '})).toBe(false);
  expect(validatePuyiDraft({...draft,kana:'neko'})).toBe(false);
  expect(validatePuyiDraft({...draft,word:'\uD800'})).toBe(false);
  const entry=puyiEntry({...card,meaning:`"' <img onerror=alert(1)> \\`});expect(entry.meaning.es).toContain('<img');expect(entry.meaning.en).toBe(entry.meaning.es);expect(entry.publicImageUrl).toBeUndefined();expect(entry.sentenceHtml).toBe('');
 });
 it.each(PUYI_FIELDS)('matches SQL code-point boundaries for %s',field=>{
  const value=(field==='kana'?'あ':'𠮷').repeat(PUYI_LIMITS[field]);expect(validatePuyiDraft({...draft,[field]:value})).toBe(true);expect(validatePuyiDraft({...draft,[field]:value+'あ'})).toBe(false);
  expect(validatePuyiDraft({...draft,[field]:'x\n'})).toBe(false);
 });
 const file=(type:string,bytes:number[],size=bytes.length)=>({type,size,slice:()=>({arrayBuffer:async()=>new Uint8Array(bytes).buffer})}) as File;
 it('accepts JPEG/PNG/WebP signatures and rejects forged MIME, SVG, empty and oversized files',async()=>{
  await expect(validatePuyiImage(file('image/jpeg',[255,216,255]))).resolves.toBe('jpg');
  await expect(validatePuyiImage(file('image/png',[137,80,78,71,13,10,26,10]))).resolves.toBe('png');
  await expect(validatePuyiImage(file('image/webp',[82,73,70,70,0,0,0,0,87,69,66,80]))).resolves.toBe('webp');
  for(const invalid of [file('image/png',[60,115,118,103]),file('image/svg+xml',[60,115,118,103]),file('image/jpeg',[]),file('image/jpeg',[255,216,255],2097153)])await expect(validatePuyiImage(invalid)).rejects.toThrow('puyi.imageError');
 });
});
describe('Puyi authenticated transport',()=>{
 const user=signal<{id:string}|null>(null);let rpc:ReturnType<typeof vi.fn>;let service:PuyiService;
 beforeEach(()=>{user.set(null);rpc=vi.fn(async()=>({data:true,error:null}));TestBed.configureTestingModule({providers:[{provide:AuthService,useValue:{user}},{provide:SupabaseClientService,useValue:{config:{configured:true,url:'https://test.supabase.co'},getClient:async()=>({rpc})}}]});service=TestBed.inject(PuyiService);});
 it('fails closed for Guest and ordinary users before any mutation',async()=>{
  await expect(service.save(card.id,0,draft,null)).rejects.toThrow('puyi.denied');expect(rpc).not.toHaveBeenCalled();
  user.set({id:'reader'});rpc.mockResolvedValue({data:false,error:null});await service.checkAdmin();expect(service.admin()).toBe(false);await expect(service.remove(card)).rejects.toThrow();
 });
 it('uses a backend permission, invalidates identity changes and ignores late permission responses',async()=>{
  user.set({id:'admin'});await service.checkAdmin();expect(service.admin()).toBe(true);
  let resolve!:(v:unknown)=>void;rpc.mockImplementationOnce(()=>new Promise(r=>resolve=r));const check=service.checkAdmin();await Promise.resolve();user.set({id:'reader'});resolve({data:true,error:null});await check;expect(service.admin()).toBe(false);
 });
 it('forwards stable ID, CAS version and trimmed fields without trusting an owner parameter',async()=>{
  user.set({id:'admin'});await service.checkAdmin();rpc.mockResolvedValue({data:card,error:null});await service.save(card.id,1,{...draft,word:' 猫 '},null);
  expect(rpc).toHaveBeenLastCalledWith('puyi_save_card',{p_id:card.id,p_expected_version:1,p_content:draft,p_image_path:null,p_allow_duplicate:false});
  expect(service.imageUrl('../../secret.svg')).toBeUndefined();expect(service.imageUrl(card.id+'.png')).toBe('https://test.supabase.co/storage/v1/object/public/puyi-images/'+card.id+'.png');
 });
 it('never removes a photo when server says it remains referenced after an ambiguous response',async()=>{
  user.set({id:'admin'});await service.checkAdmin();rpc.mockResolvedValue({data:null,error:{code:'23514'}});await service.discard(card.id+'.png');expect(service.cleanupPending()).toBe(true);expect(rpc).toHaveBeenLastCalledWith('puyi_discard_image',{p_path:card.id+'.png'});
 });
});
describe('Puyi uses existing catalog, FSRS, statistics and workspace databases',()=>{
 let rows:readonly PuyiCard[];
 beforeEach(()=>{TestBed.resetTestingModule();localStorage.clear();vi.stubGlobal('indexedDB',new IDBFactory());rows=[card];TestBed.configureTestingModule({providers:[{provide:PuyiService,useValue:{list:async()=>rows,imageUrl:()=>undefined}}]});});
 it('is public even with custom gates disabled, reuses the same study flow and empty state',async()=>{
  const catalog=TestBed.inject(DeckCatalogService);expect(catalog.items().some(d=>d.id===PUYI_DECK.id)).toBe(true);await catalog.refreshPublic();expect((await catalog.load(PUYI_DECK.id)).status).toBe('ready');expect(await catalog.index(PUYI_DECK.id)).toEqual([{id:'puyi-'+card.id,order:1}]);
  rows=[];await catalog.refreshPublic();expect(await catalog.index(PUYI_DECK.id)).toEqual([]);expect(catalog.get(PUYI_DECK.id)?.cardCount).toBe(0);
 });
 it('never delays Japanese 1500 behind a pending public request; remote errors stay separate',async()=>{
  const remote=TestBed.inject(PuyiService);let release!:(value:readonly PuyiCard[])=>void;
  vi.spyOn(remote,'list').mockImplementation(()=>new Promise(r=>release=r));
  const catalog=TestBed.inject(DeckCatalogService);await catalog.refresh();expect(await catalog.index('japanese-1500')).toHaveLength(1500);expect(catalog.loading()).toBe(false);
  const revision=catalog.revision(),pending=catalog.refreshPublic();await vi.waitFor(()=>expect(release).toBeTypeOf('function'));release([card]);await pending;expect(catalog.revision()).toBe(revision);
  vi.spyOn(remote,'list').mockRejectedValue(new Error('offline'));await catalog.refreshPublic();expect(catalog.publicError()).toBe(true);expect((await catalog.load('japanese-1500')).status).toBe('ready');expect(catalog.get(PUYI_DECK.id)?.cardCount).toBe(1);
 });
 it('invalidates a Puyi write lease for A→B→A even without an intervening render',()=>{
  const workspace=TestBed.inject(WorkspaceService);workspace.activateUser('A');const persistence=TestBed.inject(DeckPersistenceRouter).bind(PUYI_DECK.id);workspace.activateUser('B');workspace.activateUser('A');expect(()=>persistence.assertOwner()).toThrow('workspace changed');
 });
 it('keeps existing Japanese history, independent accounts, stable edited IDs, undo and soft-deleted history',async()=>{
  const catalog=TestBed.inject(DeckCatalogService),workspace=TestBed.inject(WorkspaceService),study=TestBed.inject(DeckStudyService),database=TestBed.inject(DeckDatabaseService),now=new Date('2026-11-03T12:00:00Z');
  await catalog.refreshPublic();const deck=catalog.get(PUYI_DECK.id)!,index=await catalog.index(deck.id);
  const japanese=catalog.get('japanese-1500')!,jpIndex=[{id:'historic-jp',order:1}],jpSnapshot=await study.snapshot(japanese,jpIndex,now),jpChoice=study.chooseNext(jpSnapshot,japanese,{debt:0}).choice!;
  await study.rate(japanese,jpChoice,study.preview(japanese,jpChoice,now),'good',850,now);const legacy=await database.getDeckReviewEvents(japanese.id);
  workspace.activateUser('A');const snapshot=await study.snapshot(deck,index,now),choice=study.chooseNext(snapshot,deck,{debt:0}).choice!,preview=study.preview(deck,choice,now);
  const event=await study.rate(deck,choice,preview,'again',750,now);expect((await study.statistics(deck,1,now)).totalReviews).toBe(1);expect(deckDayDifficulties([event],deck.id,now)[0].entryId).toBe(index[0].id);
  workspace.activateUser('B');expect((await study.snapshot(deck,index,now)).newAvailable).toBe(1);expect((await study.statistics(deck,1,now)).totalReviews).toBe(0);
  workspace.activateUser('A');rows=[{...card,meaning:'gato editado',version:2}];await catalog.refreshPublic();expect((await database.getDeckProgress(deck.id))[0].entryId).toBe(index[0].id);expect((await study.snapshot(deck,index,now)).remainingUnseen).toBe(0);
  await study.undo(event);expect(await database.getDeckReviewEvents(deck.id)).toEqual([]);expect((await study.snapshot(deck,index,now)).newAvailable).toBe(1);
  const next=study.chooseNext(await study.snapshot(deck,index,now),deck,{debt:0}).choice!;await study.rate(deck,next,study.preview(deck,next,now),'good',850,now);
  rows=[];await catalog.refreshPublic();expect((await study.snapshot({...deck,cardCount:0},[],now)).learningDue).toBe(0);expect(await database.getDeckReviewEvents(deck.id)).toHaveLength(1);expect(await database.getDeckProgress(deck.id)).toHaveLength(1);
  workspace.activateGuest();expect(await database.getDeckReviewEvents(japanese.id)).toEqual(legacy);expect(await database.getDeckReviewEvents(deck.id)).toEqual([]);
 });
});

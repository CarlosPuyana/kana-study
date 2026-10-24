import {TestBed} from '@angular/core/testing';
import {signal} from '@angular/core';
import {IDBFactory} from 'fake-indexeddb';
import {CustomGuestImportService} from './custom-guest-import.service';
import {CUSTOM_DECK_IDB,CUSTOM_DECKS_ENABLED} from './custom-deck.repository';
import {CUSTOM_DECK_TRANSPORT,CUSTOM_DECK_SYNC_ENABLED} from './custom-deck-sync-transport';
import {MANGA_DECK_ASSISTED_ENABLED} from './manga-deck-gate';
import {Port} from './custom-deck-sync-port.fixture';
import {freezeTransferRecords} from './custom-guest-transfer-builder';
import {CustomGuestManifestV2} from '../models/custom-transfer-v2.model';
import {MangaConfirmedCardOperation} from '../models/manga-deck-confirmation.model';
import {canonical} from './custom-deck-validation';
import {DeckStudyService} from './deck-study.service';
import {MangaVolumeVocabularyService} from './manga-volume-vocabulary.service';
const fs=(globalThis as unknown as {process:{getBuiltinModule:(s:string)=>{readFileSync:(p:string,e:string)=>string}}}).process.getBuiltinModule('fs');
describe('V2 checkpoints and receipt fences',()=>{
 let t:CustomGuestImportService,port:Port;
 beforeEach(()=>{localStorage.clear();port=new Port();TestBed.configureTestingModule({providers:[{provide:CUSTOM_DECK_IDB,useValue:new IDBFactory()},{provide:CUSTOM_DECKS_ENABLED,useValue:signal(true)},{provide:MANGA_DECK_ASSISTED_ENABLED,useValue:signal(true)},{provide:CUSTOM_DECK_SYNC_ENABLED,useValue:signal(true)},{provide:CUSTOM_DECK_TRANSPORT,useValue:port}]});t=TestBed.inject(CustomGuestImportService);});
 afterEach(()=>{vi.restoreAllMocks();TestBed.resetTestingModule();localStorage.clear();});
 async function source(){t.workspace.activateGuest();const p=JSON.parse(fs.readFileSync('supabase/tests/h2ba-fixture.json','utf8')) as MangaConfirmedCardOperation;await t.repo.confirmMangaCard(p);const inventory=await t.inventory();t.workspace.activateUser(port.user!);await t.consent(true);return inventory;}
 it('rejects a foreign receipt row despite a correctly scoped transport response',async()=>{
  const before=await source(),read=port.transferReceipt.bind(port);vi.spyOn(port,'transferReceipt').mockImplementation(async(...args)=>{const r=await read(...args);if(r.value)r.value.user_id='foreign';return r;});
  expect(await t.start(true)).toBe(false);expect(await t.repo.list()).toEqual([]);expect(await t.inventory()).toEqual(before);expect(port.calls).toBe(0);
 });
 it('rejects a corrupt request hash and retains the frozen request for investigation',async()=>{
  const before=await source(),read=port.transferReceipt.bind(port);vi.spyOn(port,'transferReceipt').mockImplementation(async(...args)=>{const r=await read(...args);if(r.value)r.value.request_hash='0'.repeat(64);return r;});
  expect(await t.start(true)).toBe(false);const snapshot=await t.repo.syncSnapshot(t.workspace.active()),p=Object.values(snapshot.state.transfers!)[0];expect(p.requests).toHaveLength(1);expect(p.receipts).toEqual({});expect(await t.inventory()).toEqual(before);
 });
 it('does not rewrite a received body or retry using corrupted local serialization after ACK loss',async()=>{
  const before=await source();port.transferLose='chunk';expect(await t.start(true)).toBe(false);const s=await t.repo.syncSnapshot(t.workspace.active()),p=Object.values(s.state.transfers!)[0],request=structuredClone(p.requests.at(-1));
  await t.repo.changeCoordination(t.workspace.active(),()=>{},state=>{state.transfers![p.id].bodies[0]+=' ';});expect(await t.resume(p.id)).toBe(false);
  expect((await t.repo.syncSnapshot(t.workspace.active())).state.transfers![p.id].requests.at(-1)).toEqual(request);expect(await t.inventory()).toEqual(before);expect(port.calls).toBe(0);
 });
 it('fails explicitly without V2 instead of sending an unsafe V1 Guest operation',async()=>{
  const before=await source();vi.spyOn(port,'transferGet').mockRejectedValue(new Error('V2 migration unavailable'));expect(await t.start(true)).toBe(false);expect(String(t.failure())).toContain('V2 migration unavailable');expect(port.calls).toBe(0);expect(await t.inventory()).toEqual(before);
 });
 it('never splits an existing 65-change request to make it fit a chunk',async()=>{
  const change={kind:'progress' as const,id:'card',baseRevision:'0',payload:null};
  await expect(freezeTransferRecords('id',port.user!,'guest-import',{schemaVersion:2,source:'guest',namespace:'namespace',baseServerRevision:'0',cards:[],entities:[]} as Omit<CustomGuestManifestV2,'chunks'>,[{type:'operation',value:{schemaVersion:1,operationId:'frozen',action:'import-history',changes:Array(65).fill(change)}}])).rejects.toThrow();expect(port.transferCalls).toBe(0);
 });
 it('retains the original permanent receipt across a verified rebase and rejects changed confirmation evidence',async()=>{
  await source();const original=(await t.repo.permanentRegistry('guest')).confirmations[0],rebased={...original,expectedContentVersion:1,card:{...original.card,contentVersion:2,order:7}};
  let s=await t.repo.syncSnapshot('guest');await t.repo.syncCommit('guest',s.state.version,canonical(s.journal),s.state,()=>{},{entities:[],confirmations:[rebased]});expect((await t.repo.permanentRegistry('guest')).confirmations[0]).toEqual(original);
  s=await t.repo.syncSnapshot('guest');await expect(t.repo.syncCommit('guest',s.state.version,canonical(s.journal),s.state,()=>{},{entities:[],confirmations:[{...rebased,confirmation:{...rebased.confirmation,confirmedMeaning:'tampered'}}]})).rejects.toThrow();expect((await t.repo.permanentRegistry('guest')).confirmations[0]).toEqual(original);
 });
 it('cancels a partial transfer despite a lost chunk ACK without resending or erasing the source',async()=>{
  const before=await source();port.transferLose='chunk';expect(await t.start(true)).toBe(false);const p=Object.values((await t.repo.syncSnapshot(t.workspace.active())).state.transfers!)[0];expect((await t.coordinator.cancel(p.id)).state).toBe('cancelled');expect(await t.inventory()).toEqual(before);expect(await t.repo.list()).toEqual([]);expect(port.calls).toBe(0);
 });
 it('validates the producer event-only fingerprint and imports actual FSRS review/undo snapshots unchanged',async()=>{
  await source();t.workspace.activateGuest();const deck=(await t.repo.list())[0],card=(await t.repo.content(deck.id))[0],study=TestBed.inject(DeckStudyService),now=new Date('2026-10-23T12:00:00Z'),choice={entryId:card.id,kind:'new' as const,progress:null};
  const definition={...deck,cardCount:(await t.repo.content(deck.id)).length};const event=await study.rate(definition,choice,study.preview(definition,choice,now),'good',900,now);await study.undo(event);const before=await t.inventory();t.workspace.activateUser(port.user!);expect(await t.start(true),String(t.failure())).toBe(true);expect(await t.inventory()).toEqual(before);expect(await t.repo.getDeckReviewEvents(deck.id)).toEqual([]);
  const stored=port.rows.find(r=>r.kind==='review-event'&&r.id===event.id);expect(stored?.payload).toEqual(event);expect(stored?.voidedBy).toBeTruthy();expect(port.rows.find(r=>r.kind==='progress'&&r.id===card.id)?.payload).toBe(null);
  const view=await TestBed.inject(MangaVolumeVocabularyService).load((await t.repo.mangaConfirmations())[0].source.volumeId);
  expect(view.incomplete).toBe(false);expect(view.entries).toHaveLength(1);expect(view.entries[0].card.id).toBe(card.id);
  expect(view.entries[0].classification.state).toBe('pending');
 });
});

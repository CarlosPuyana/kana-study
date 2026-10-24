import {signal} from '@angular/core';
import {TestBed} from '@angular/core/testing';
import {IDBFactory,IDBKeyRange} from 'fake-indexeddb';
import {CustomGuestImportService,guestFingerprint,classifyCustomConflict} from './custom-guest-import.service';
import {CustomConflictResolutionService} from './custom-conflict-resolution.service';
import {CUSTOM_DECK_IDB,CUSTOM_DECKS_ENABLED,CustomDeckRepository} from './custom-deck.repository';
import {CUSTOM_DECK_SYNC_ENABLED,CUSTOM_DECK_TRANSPORT,CUSTOM_REMOTE_UPLOAD_APPROVED} from './custom-deck-sync-transport';
import {MANGA_DECK_ASSISTED_ENABLED} from './manga-deck-gate';
import {WorkspaceService} from './workspace.service';
import {MangaConfirmedCardOperation} from '../models/manga-deck-confirmation.model';
import {CustomPreparedOperation} from '../models/custom-deck-reconciliation.model';
import {Port} from './custom-deck-sync-port.fixture';
const fs=(globalThis as unknown as {process:{getBuiltinModule:(s:string)=>{readFileSync:(p:string,e:string)=>string}}}).process.getBuiltinModule('fs');
const fixture=()=>JSON.parse(fs.readFileSync('supabase/tests/h2ba-fixture.json','utf8')) as MangaConfirmedCardOperation;
const user='00000000-0000-0000-0000-000000000001';
describe('Explicit Guest import coordination (real IDB, transport fault double; SQL tested separately)',()=>{
 let transfer:CustomGuestImportService,repo:CustomDeckRepository,workspace:WorkspaceService,port:Port;
 beforeEach(()=>{TestBed.resetTestingModule();localStorage.clear();Object.assign(globalThis,{IDBKeyRange});port=new Port();TestBed.configureTestingModule({providers:[{provide:CUSTOM_DECK_IDB,useValue:new IDBFactory()},
  {provide:CUSTOM_DECKS_ENABLED,useValue:signal(true)},{provide:MANGA_DECK_ASSISTED_ENABLED,useValue:signal(true)},{provide:CUSTOM_DECK_SYNC_ENABLED,useValue:signal(true)},{provide:CUSTOM_DECK_TRANSPORT,useValue:port}]});
  transfer=TestBed.inject(CustomGuestImportService);repo=transfer.repo;workspace=transfer.workspace;workspace.activateGuest();});
 afterEach(()=>{vi.restoreAllMocks();TestBed.resetTestingModule();localStorage.clear();});
 const target=()=>workspace.activateUser(user);
 it('does not upload or create a plan without confirmation and versioned affirmative consent',async()=>{await repo.confirmMangaCard(fixture());target();expect(await transfer.start(false)).toBe(false);expect(await transfer.start(true)).toBe(false);expect(port.calls).toBe(0);expect(await transfer.plans()).toEqual({});});
 it('account choice does not import or alter Guest, including journal and permanent receipts',async()=>{await repo.confirmMangaCard(fixture());const before=await transfer.inventory();target();await transfer.chooseAccount();expect(await transfer.plans()).toEqual({});expect(await repo.list()).toEqual([]);expect(await transfer.inventory()).toEqual(before);expect(port.calls).toBe(0);});
 it('preserves original Guest anchors and receipts with a separate destination binding, and repeats without duplicates',async()=>{const p=fixture();await repo.confirmMangaCard(p);const before=await transfer.inventory();target();await transfer.consent(true);expect(await transfer.start(true),String(transfer.failure())).toBe(true);expect(await transfer.start(true)).toBe(true);expect(port.calls).toBe(0);expect(await transfer.inventory()).toEqual(before);expect((await repo.content(p.deck.id))).toHaveLength(1);const registry=await repo.permanentRegistry();expect(registry.confirmations[0]).toEqual(p);expect(registry.bindings).toContainEqual({id:p.confirmation.id,destination:`user:${user}`,source:'guest'});});
 it('recovers original receipt after response loss rather than resubmitting a new operation',async()=>{await repo.confirmMangaCard(fixture());target();await transfer.consent(true);port.transferLose='publish';expect(await transfer.start(true)).toBe(false);const plans=await transfer.plans(),id=Object.keys(plans)[0],op=(await repo.syncSnapshot(workspace.active())).state.transfers![id].requests.at(-1);expect(port.calls).toBe(0);expect(await transfer.resume(id)).toBe(true);expect(port.calls).toBe(0);expect((await repo.syncSnapshot(workspace.active())).state.transfers![id].requests.at(-1)).toEqual(op);});
 it('quota/checkpoint failure before HTTP cannot publish data and is resumable',async()=>{await repo.confirmMangaCard(fixture());target();await transfer.consent(true);const original=repo.changeCoordination.bind(repo);let calls=0;vi.spyOn(repo,'changeCoordination').mockImplementation(async(...args)=>{if(++calls===3)throw new DOMException('quota','QuotaExceededError');return original(...args);});expect(await transfer.start(true)).toBe(false);expect(port.calls).toBe(0);vi.restoreAllMocks();expect(await transfer.start(true)).toBe(true);});
 it('preserves an incompatible V1 checkpoint and its oversized frozen request without uploading or relabelling it',async()=>{
  const p=fixture();await repo.confirmMangaCard(p);const source=await transfer.inventory();target();await transfer.consent(true);
  const operation={schemaVersion:1 as const,operationId:'old-frozen',action:'publish' as const,changes:Array.from({length:65},()=>({kind:'card' as const,id:p.card.id,payload:p.card,baseRevision:'0'}))};
  await repo.changeCoordination(workspace.active(),()=>{},s=>{s.imports={old:{id:'old',source:'guest',destination:user,fingerprint:'old',inventory:source,status:'pending',steps:[{kind:'content',id:p.confirmation.id,operation}],createdCards:[],blocked:[],sourceChanged:false}};});
  expect(await transfer.resume('old')).toBe(false);const old=(await transfer.plans())['old'];expect(old.protocolVersion).toBeUndefined();expect(old.steps[0].operation).toEqual(operation);expect(old.blocked).toEqual(['legacy-v1-checkpoint-preserved']);expect(port.transferCalls).toBe(0);expect(port.calls).toBe(0);expect(await transfer.inventory()).toEqual(source);
 });
 it('quota after remote commit recovers its original receipt without a second publish',async()=>{
  await repo.confirmMangaCard(fixture());target();await transfer.consent(true);const original=repo.changeCoordination.bind(repo);let failed=false;
  vi.spyOn(repo,'changeCoordination').mockImplementation(async(...args)=>{if(port.transferCalls&&!failed){failed=true;throw new DOMException('quota','QuotaExceededError');}return original(...args);});
  expect(await transfer.start(true)).toBe(false);expect(port.calls).toBe(0);vi.restoreAllMocks();expect(await transfer.start(true)).toBe(true);expect(port.calls).toBe(0);
 });
 it('revoking consent during preparation prevents the next upload and keeps the checkpoint',async()=>{await repo.confirmMangaCard(fixture());target();await transfer.consent(true);const original=transfer.adapter.inspectRemote.bind(transfer.adapter);vi.spyOn(transfer.adapter,'inspectRemote').mockImplementationOnce(async()=>{const r=await original();await transfer.consent(false);return r;});expect(await transfer.start(true)).toBe(false);expect(port.calls).toBe(0);expect(Object.values(await transfer.plans())[0].status).toBe('blocked');expect((await repo.syncSnapshot(workspace.active())).state.consentHistory?.map(c=>c.accepted)).toEqual([true,false]);});
 it('withdrawal after remote commit preserves the receipt and Guest, blocks completion and can resume explicitly',async()=>{
  await repo.confirmMangaCard(fixture());const source=await transfer.inventory();target();await transfer.consent(true);const apply=port.transferApply.bind(port);let revoked=false;
  vi.spyOn(port,'transferApply').mockImplementation(async(...args)=>{const result=await apply(...args);if(!revoked){revoked=true;await transfer.consent(false);}return result;});
  expect(await transfer.start(true)).toBe(false);expect(port.calls).toBe(0);expect(await transfer.inventory()).toEqual(source);expect(await transfer.completeForCurrentSource()).toBe(false);
  await transfer.consent(true);expect(await transfer.start(true)).toBe(true);expect(port.calls).toBe(0);
 });
 it.each(['logout','A-B','A-B-A'])('guards a response after %s without committing ACK into another activation',async mode=>{await repo.confirmMangaCard(fixture());const source=await transfer.inventory();target();await transfer.consent(true);const apply=port.transferApply.bind(port);vi.spyOn(port,'transferApply').mockImplementation(async(...args)=>{const r=await apply(...args);if(mode==='logout'){workspace.activateGuest();port.user=null;}else{workspace.activateUser('other');port.user='other';if(mode==='A-B-A'){workspace.activateUser(user);port.user=user;}}return r;});expect(await transfer.start(true)).toBe(false);expect(await transfer.inventory()).toEqual(source);expect(Object.values((await repo.syncSnapshot(`user:${user}`)).state.transfers!)[0].receipts).toEqual({});});
 it('keeps divergent content blocked and retains the full captured Guest journal',async()=>{const p=fixture();await repo.confirmMangaCard(p);target();await transfer.consent(true);port.rows.push({kind:'card',id:p.card.id,payload:{...p.card,word:'different'},revision:'1',deleted:false,archived:false,head:null,voidedBy:null});port.clock=1;vi.spyOn(transfer.adapter,'inspectRemote').mockResolvedValue({entities:port.rows,generation:'1'} as never);expect(await transfer.start(true)).toBe(false);const plan=Object.values(await transfer.plans())[0];expect(plan.status).toBe('blocked');expect(plan.inventory.records['journal']).toHaveLength(1);expect(plan.blocked).toHaveLength(1);expect(port.transferCalls).toBe(0);expect(port.rows[0].payload).toMatchObject({word:'different'});});
 it('requires explicit resolution and consent; absence cannot close evidence',async()=>{target();const resolver=TestBed.inject(CustomConflictResolutionService);expect(await resolver.resolve('missing','keep',false)).toBe(false);expect(port.calls).toBe(0);});
 it('fingerprint detects source changes without modifying or normalizing source rows',async()=>{await repo.confirmMangaCard(fixture());const a=await transfer.inventory(),b=structuredClone(a);b.records['journal'][0].value={changed:true};expect(await guestFingerprint(a)).not.toBe(await guestFingerprint(b));expect(await transfer.inventory()).toEqual(a);});
 it('detects Guest changing during the final pull and never declares migration completed',async()=>{
  const p=fixture();await repo.confirmMangaCard(p);target();await transfer.consent(true);
  const sync=transfer.adapter.inspectRemote.bind(transfer.adapter);let reads=0;
  vi.spyOn(transfer.adapter,'inspectRemote').mockImplementation(async()=>{const result=await sync();if(++reads===2)await repo.saveSettings('changed-during-pull',p.deck.id,{...p.deck.settings,newCardsPerDay:4},'guest');return result;});
  expect(await transfer.start(true)).toBe(false);expect(transfer.status()).toBe('blocked');expect(Object.values(await transfer.plans())[0].sourceChanged).toBe(true);
  expect(await transfer.completeForCurrentSource()).toBe(false);
 });
 it('imports separate daily records including completed days without inventing reviews',async()=>{
  const p=fixture();await repo.confirmMangaCard(p);const daily={deckId:p.deck.id,localDate:'2026-10-20',introducedEntryIds:[],newLimitOverride:null,completedAt:1792497600000};
  await repo.writeDailyState(daily);target();await transfer.consent(true);expect(await transfer.start(true),String(transfer.failure())).toBe(true);
  expect(await repo.getDailyState(p.deck.id,daily.localDate)).toEqual(daily);expect(await repo.getDeckReviewEvents(p.deck.id)).toEqual([]);
 });
 it('cannot silently replace different destination settings',async()=>{
  const p=fixture();await repo.confirmMangaCard(p);target();await transfer.consent(true);expect(await transfer.start(true)).toBe(true);
  await repo.saveSettings('guest-settings',p.deck.id,{...p.deck.settings,newCardsPerDay:4},'guest');
  expect(await transfer.start(true)).toBe(false);expect(transfer.status()).toBe('blocked');expect((port.rows.find(r=>r.kind==='deck')!.payload as typeof p.deck).settings).toEqual(p.deck.settings);
 });
 it('all public gates and the separate real-account upload authorization default to false',()=>{TestBed.resetTestingModule();expect(TestBed.inject(CUSTOM_DECKS_ENABLED)()).toBe(false);expect(TestBed.inject(MANGA_DECK_ASSISTED_ENABLED)()).toBe(false);expect(TestBed.inject(CUSTOM_DECK_SYNC_ENABLED)()).toBe(false);expect(TestBed.inject(CUSTOM_REMOTE_UPLOAD_APPROVED)).toBe(false);});
 it.each([['review','review'],['undo','undo'],['restore','restore'],['import-history','guest-progress']])('classifies %s without changing its event', (action,kind)=>{const p={operation:{action},receipt:{reason:null}} as CustomPreparedOperation;expect(classifyCustomConflict(p)).toBe(kind);});
});


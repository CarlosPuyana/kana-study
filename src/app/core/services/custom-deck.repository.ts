import { DestroyRef, inject, Injectable, InjectionToken, signal } from '@angular/core';
import { LocalWorkspaceId } from '../models/account.model';
import { CustomDeck, CustomDeckCard, CustomCatalogOperation } from '../models/deck-catalog.model';
import { DeckSettings } from '../models/deck.model';
import { DeckCardProgress, DeckDailyState, DeckReviewEvent } from '../models/deck-study.model';
import { WorkspaceService } from './workspace.service';
import { canonical, digest, CustomDeckError, dailyValid, eventValid, id, progressValid, requireValid, settingsValid, validateCard, validateDeck } from './custom-deck-validation';
import { MangaCardConfirmation, MangaConfirmedCardOperation, MangaCuratedEntity } from '../models/manga-deck-confirmation.model';
import { validateMangaConfirmedOperation } from './manga-deck-confirmation';
import { MANGA_DECK_ASSISTED_ENABLED } from './manga-deck-gate';
import { CustomPublication, CustomReconciliationState, emptyCustomReconciliation } from '../models/custom-deck-reconciliation.model';
import { CustomGuestInventory } from '../models/custom-guest-import.model';
import {CUSTOM_DECKS_ENABLED} from './custom-deck-gates';
import {CustomDeckAccess} from './custom-deck-access';
export {CUSTOM_DECKS_ENABLED} from './custom-deck-gates';
export const CUSTOM_DECK_IDB = new InjectionToken<IDBFactory>('custom deck IDB', { providedIn: 'root', factory: () => globalThis.indexedDB });
export const CUSTOM_DECK_DATABASE = 'kana-study-custom-decks-v1';
export const CUSTOM_DECK_DATABASE_VERSION = 3;
const stores = ['decks', 'cards', 'progress', 'events', 'daily', 'journal', 'identities', 'confirmations', 'volume-links', 'registry-meta', 'reconciliation'] as const;
type Store = typeof stores[number];
interface Row<T = unknown> {
    workspace: string;
    key: string;
    value: T;
    head?: string | null;
    voidedBy?: string;
    count?: number;
    binding?:{destination:string;source:'guest'};
    canonical?:boolean;
}
type Values = {
    decks: CustomDeck;
    cards: CustomDeckCard;
    progress: DeckCardProgress | null;
    events: DeckReviewEvent;
    daily: DeckDailyState;
    journal: CustomCatalogOperation;
    identities: MangaCuratedEntity;
    confirmations: MangaConfirmedCardOperation;
    'volume-links': {schemaVersion:1;volumeId:string;deckId:string};
    'registry-meta': {schemaVersion:1;complete:boolean;localNamespace?:string};
    reconciliation: CustomReconciliationState;
};
type Rows = {[S in Store]: Map<string, Row<Values[S]>>};
const key = (...parts: string[]) => JSON.stringify(parts);
const request = <T>(r: IDBRequest<T>) => new Promise<T>((resolve, reject) => { r.onsuccess = () => resolve(r.result); r.onerror = () => reject(r.error); });
/** The journal and all affected records commit together. No cloud acknowledgement is inferred. */
@Injectable({ providedIn: 'root' })
export class CustomDeckRepository {
    private readonly factory = inject(CUSTOM_DECK_IDB);
    private readonly workspace = inject(WorkspaceService);
    private readonly customEnabled = inject(CUSTOM_DECKS_ENABLED);
    private readonly mangaAssistedEnabled = inject(MANGA_DECK_ASSISTED_ENABLED);
    private readonly access=inject(CustomDeckAccess);
    private writeGuard(owner:LocalWorkspaceId):()=>void {
        const epoch=this.workspace.activationRevision();
        const guard=()=>this.access.assertWrite(owner,epoch);guard();return guard;
    }
    readonly catalogRevision = signal(0);
    readonly progressRevision = signal(0);
    readonly journalRevision = signal(0);
    private readonly channel = typeof window!=='undefined'&&typeof window.BroadcastChannel==='function'?new window.BroadcastChannel('kana-study-custom-decks-revision-v1'):null;
    constructor(){
        const invalidate=()=>{this.journalRevision.update(n=>n+1);this.catalogRevision.update(n=>n+1);this.progressRevision.update(n=>n+1);};
        if(this.channel)this.channel.onmessage=event=>{if(event.data?.workspace===this.owner())invalidate();};
        // Fallback for browsers without BroadcastChannel: refresh conservatively on focus.
        if(typeof window!=='undefined')window.addEventListener('focus',invalidate);
        inject(DestroyRef).onDestroy(()=>{this.channel?.close();if(typeof window!=='undefined')window.removeEventListener('focus',invalidate);});
    }
    owner(): LocalWorkspaceId { return this.workspace.active(); }
    private open(): Promise<IDBDatabase> {
        return new Promise((resolve, reject) => {
            const r = this.factory.open(CUSTOM_DECK_DATABASE, CUSTOM_DECK_DATABASE_VERSION);
            let failed = false;
            r.onupgradeneeded = () => { for (const name of stores) {
                if(r.result.objectStoreNames.contains(name))continue;
                const s = r.result.createObjectStore(name, { keyPath: ['workspace', 'key'] });
                s.createIndex('workspace', 'workspace');
                if (name === 'cards') {
                    s.createIndex('deck', ['workspace', 'value.deckId']);
                    s.createIndex('lexical', ['workspace', 'value.deckId', 'value.lexicalIdentity.key', 'value.direction'], { unique: true });
                }
            } };
            r.onblocked = () => { failed = true; reject(new CustomDeckError('Custom deck database is blocked; close the other tab and retry')); };
            r.onerror = () => reject(r.error);
            r.onsuccess = () => { const db = r.result; db.onversionchange = () => db.close(); if (failed)
                db.close();
            else
                resolve(db); };
        });
    }
    private async transaction<T>(owner: LocalWorkspaceId, write: boolean, run: (rows: Rows) => T): Promise<T> {
        requireValid(owner === 'guest' || owner.startsWith('user:'));
        const guard=write?this.writeGuard(owner):()=>{};
        const db = await this.open();
        try {
            guard();
            return await new Promise<T>((resolve, reject) => {
                const tx = db.transaction([...stores], write ? 'readwrite' : 'readonly');
                let result: T;
                const original = new Map<Row, string>();
                const originalKeys = new Map<Store,string[]>();
                let failure: unknown;
                tx.oncomplete = () => resolve(result);
                tx.onabort = () => reject(failure ?? tx.error ?? new CustomDeckError('Custom deck transaction aborted'));
                tx.onerror = () => { };
                void Promise.all(stores.map(async (s) => [s, await request(tx.objectStore(s).index('workspace').getAll(owner))] as const)).then(all => {
                    guard();
                    const rows = Object.fromEntries(all.map(([s, items]) => [s, new Map(items.map((r: Row) => [r.key, r]))])) as Rows;
                    if(write)for (const store of stores) for (const row of rows[store].values()) original.set(row,canonical(row));
                    if(write)for(const store of stores)originalKeys.set(store,[...rows[store].keys()]);
                    result = run(rows);
                    const checkWrite=()=>{try{guard();}catch(e){failure=e;tx.abort();}};
                    if(write)for(const store of stores)for(const k of originalKeys.get(store)??[])if(!rows[store].has(k))tx.objectStore(store).delete([owner,k]).onsuccess=checkWrite;
                    if (write)
                        for (const s of stores)
                            for (const row of rows[s].values())
                                if(original.get(row)!==canonical(row))tx.objectStore(s).put(row).onsuccess=checkWrite;
                }).catch(e => { failure = e; tx.abort(); });
            });
        }
        finally {
            db.close();
        }
    }
    private async mutate<T>(opId: string, kind: CustomCatalogOperation['kind'], entityId: string, payload: unknown, owner: LocalWorkspaceId, run: (r: Rows) => T): Promise<void> {
        requireValid(id(opId) && id(entityId));
        const fingerprint = canonical({ kind, entityId, payload: kind === 'review' || kind === 'undo' ? { event: (payload as {
                    event: DeckReviewEvent;
                }).event } : payload });
        requireValid(new TextEncoder().encode(canonical(payload)).length <= 1048576);
        await this.transaction(owner, true, r => {
            const previous = r.journal.get(opId)?.value as CustomCatalogOperation | undefined;
            if (previous) {
                if (previous.request !== fingerprint)
                    throw new CustomDeckError('Operation ID reused for different data');
                return;
            }
            const value=payload as {event?:DeckReviewEvent;card?:CustomDeckCard;confirmation?:MangaCardConfirmation;daily?:DeckDailyState};
            const cardId=value.event?.entryId??value.card?.id;
            const before=cardId?r.progress.get(key(entityId,cardId)):undefined;
            const beforeHead=before?.head??null,beforeCard=before?.value?.card??null;
            run(r);
            const context={deck:r.decks.get(entityId)?.value,card:cardId?r.cards.get(key(entityId,cardId))?.value:undefined,
                beforeHead,before:beforeCard,daily:(value.daily||kind==='daily')?r.daily.get(key(entityId,value.daily?.localDate??(payload as DeckDailyState).localDate))?.value:undefined};
            // Omit optional undefined values: journal fingerprints are finite JSON.
            const operation: CustomCatalogOperation = { schemaVersion: 1, id: opId, workspace: owner, kind, entityId, createdAt: new Date().toISOString(), localRevision: r.journal.size + 1, state: 'committed', request: fingerprint, payload,context:JSON.parse(JSON.stringify(context)) };
            r.journal.set(opId, { workspace: owner, key: opId, value: operation });
        });
        if (this.owner() === owner)
            (kind === 'create' || kind === 'edit-card' || kind === 'settings' || kind === 'manga-confirmation' ? this.catalogRevision : this.progressRevision).update(n => n + 1);
        if(this.owner()===owner)this.journalRevision.update(n=>n+1);
        this.channel?.postMessage({workspace:owner});
    }
    async create(opId: string, input: CustomDeck, inputs: readonly CustomDeckCard[], owner = this.owner()): Promise<void> {
        const guard=this.writeGuard(owner);
        const deck = validateDeck(input);
        requireValid(Array.isArray(inputs) && inputs.length <= 1000);
        const cards = await Promise.all(inputs.map(validateCard));
        guard();
        requireValid(cards.every(c => c.deckId === deck.id) && new Set(cards.map(c => c.id)).size === cards.length && new Set(cards.map(c => c.lexicalIdentity.key + '|' + c.direction)).size === cards.length);
        return this.mutate(opId, 'create', deck.id, { deck, cards }, owner, r => {
            const previous = r.decks.get(deck.id);
            if (previous) {
                const existing = [...r.cards.values()].map(x => x.value as CustomDeckCard).filter(c => c.deckId === deck.id);
                if (canonical(previous.value) !== canonical(deck) || canonical(existing.sort((a, b) => a.id.localeCompare(b.id))) !== canonical([...cards].sort((a, b) => a.id.localeCompare(b.id))))
                    throw new CustomDeckError('Deck already exists');
                return;
            }
            r.decks.set(deck.id, { workspace: owner, key: deck.id, value: deck, count: cards.length });
            for (const card of cards)
                r.cards.set(key(deck.id, card.id), { workspace: owner, key: key(deck.id, card.id), value: card });
        });
    }
    async editCard(opId: string, input: CustomDeckCard, expectedVersion: number, owner = this.owner()): Promise<void> {
        const guard=this.writeGuard(owner);
        const card = await validateCard(input);
        guard();
        return this.mutate(opId, 'edit-card', card.deckId, { card, expectedVersion }, owner, r => {
            const old = r.cards.get(key(card.deckId, card.id))?.value as CustomDeckCard | undefined;
            requireValid(old && old.contentVersion === expectedVersion && card.contentVersion === expectedVersion + 1);
            if (old.lexicalIdentity.key !== card.lexicalIdentity.key)
                throw new CustomDeckError('A different lexical identity requires a new card ID');
            r.cards.set(key(card.deckId, card.id), { workspace: owner, key: key(card.deckId, card.id), value: card });
        });
    }
    /** Additive workspace backfill. A failed/stale migration never deletes the original journal. */
    async migratePermanentRegistry(owner = this.owner()): Promise<void> {
        const guard=this.writeGuard(owner);
        if(await this.transaction(owner,false,r=>r['registry-meta'].get('v1')?.value.complete===true))return;
        const history=(await this.journal(owner)).filter(o=>o.kind==='manga-confirmation');
        for(const op of history){
            const p=op.payload as MangaConfirmedCardOperation;
            await validateMangaConfirmedOperation(p);
            requireValid(op.schemaVersion===1&&op.workspace===owner&&p.confirmation.workspace===owner&&op.id===p.confirmation.id&&op.entityId===p.deck.id&&
                Number.isSafeInteger(op.localRevision)&&op.localRevision>0&&op.request===canonical({kind:op.kind,entityId:op.entityId,payload:p}));
        }
        const fingerprint=(ops:readonly CustomCatalogOperation[])=>canonical(ops.map(o=>[o.id,o.request]).sort((a,b)=>a[0].localeCompare(b[0])));
        guard();
        await this.transaction(owner,true,r=>{
            requireValid(fingerprint([...r.journal.values()].map(o=>o.value).filter(o=>o.kind==='manga-confirmation'))===fingerprint(history));
            for(const op of history)this.registerConfirmation(r,op.payload as MangaConfirmedCardOperation,owner,op.localRevision);
            r['registry-meta'].set('v1',{workspace:owner,key:'v1',value:{schemaVersion:1,complete:true}});
        });
    }
    private registerConfirmation(r:Rows,p:MangaConfirmedCardOperation,owner:LocalWorkspaceId,revision=r.journal.size+1):void {
        const c=p.confirmation,identity=r.identities.get(c.entity.id),receipt=r.confirmations.get(c.id),link=r['volume-links'].get(p.deck.id);
        requireValid(!identity||canonical(identity.value)===canonical(c.entity));
        // A verified rebase may change only card placement/version metadata. Keep the
        // original immutable confirmation document; its accepted rebase lives in reconciliation.
        requireValid(!receipt||canonical(receipt.value)===canonical(p)||
            canonical(receipt.value.confirmation)===canonical(c)&&canonical(receipt.value.deck)===canonical(p.deck)&&
            canonical({...receipt.value.card,order:p.card.order,contentVersion:p.card.contentVersion,createdAt:p.card.createdAt})===canonical(p.card));
        requireValid(!link||link.value.volumeId===c.source.volumeId);
        r.identities.set(c.entity.id,{workspace:owner,key:c.entity.id,value:c.entity});
        requireValid(c.workspace===owner||c.workspace==='guest');
        r.confirmations.set(c.id,{workspace:owner,key:c.id,value:receipt?.value??p,count:receipt?.count??revision,...(c.workspace==='guest'&&owner!=='guest'?{binding:{destination:owner,source:'guest' as const}}:{})});
        r['volume-links'].set(p.deck.id,{workspace:owner,key:p.deck.id,value:{schemaVersion:1,volumeId:c.source.volumeId,deckId:p.deck.id}});
    }
    async permanentRegistry(owner=this.owner()) {
        await this.migratePermanentRegistry(owner);
        return this.transaction(owner,false,r=>({identities:[...r.identities.values()].map(x=>x.value),
            confirmations:[...r.confirmations.values()].sort((a,b)=>(a.count??0)-(b.count??0)||a.key.localeCompare(b.key)).map(x=>x.value),
            bindings:[...r.confirmations.values()].filter(x=>x.binding).map(x=>({id:x.key,...x.binding!})),links:[...r['volume-links'].values()].map(x=>x.value)}));
    }
    async localRegistryNamespace(owner=this.owner()):Promise<string|null>{return this.transaction(owner,false,r=>r['registry-meta'].get('local-namespace')?.value.localNamespace??null);}
    /** Consistent readonly view: never migrates registry or repairs missing evidence. */
    async confirmedVocabularyInventory(owner=this.owner()) {
        return this.transaction(owner,false,r=>({
            decks:[...r.decks.values()],cards:[...r.cards.values()],progress:[...r.progress.values()],
            events:[...r.events.values()],confirmations:[...r.confirmations.values()],
            identities:[...r.identities.values()],links:[...r['volume-links'].values()],
        }));
    }
    /** Permanent receipts survive future ACK processing; journal pruning is not implemented. */
    async mangaConfirmations(owner = this.owner()): Promise<MangaCardConfirmation[]> {
        const registry=await this.permanentRegistry(owner);
        for (const p of registry.confirmations) {
            await validateMangaConfirmedOperation(p);
            requireValid((p.confirmation.workspace===owner||p.confirmation.workspace==='guest'&&registry.bindings.some(b=>b.id===p.confirmation.id&&b.destination===owner))&&registry.identities.some(e=>canonical(e)===canonical(p.confirmation.entity))&&
                registry.links.some(l=>l.deckId===p.deck.id&&l.volumeId===p.confirmation.source.volumeId));
        }
        return registry.confirmations.map(p=>p.confirmation);
    }
    async confirmMangaCard(input: MangaConfirmedCardOperation, owner = this.owner(), current:()=>void=()=>{}): Promise<void> {
        // Snapshot once: callers cannot mutate the reviewed request during its asynchronous validation.
        const p = structuredClone(input);
        const epoch=this.workspace.activationRevision();
        const allowed = () => {current();this.access.assertWrite(owner,epoch);requireValid(this.customEnabled() && this.mangaAssistedEnabled() && this.owner() === owner && this.workspace.activationRevision()===epoch);};
        allowed(); await this.migratePermanentRegistry(owner); allowed(); await validateMangaConfirmedOperation(p); allowed();
        requireValid(p.confirmation.workspace === owner);
        return this.mutate(p.confirmation.id, 'manga-confirmation', p.deck.id, p, owner, r => {
            allowed();
            const prior=r.confirmations.get(p.confirmation.id);
            if(prior){requireValid(canonical(prior.value)===canonical(p));return;}
            const receipts = [...r.confirmations.values()].map(o=>o.value.confirmation);
            requireValid([...r.confirmations.values()].every(row=>row.value.confirmation.workspace===owner||row.value.confirmation.workspace==='guest'&&row.binding?.destination===owner));
            // Independently installed browsers may contribute different namespaces to this owner.
            // Each entity still validates its namespace-bound hash; existing IDs remain immutable.
            const localNamespace=r['registry-meta'].get('local-namespace')?.value.localNamespace??
                ([...r.journal.values()].find(o=>o.value.kind==='manga-confirmation')?.value.payload as MangaConfirmedCardOperation|undefined)?.confirmation.entity.registryNamespace;
            if(!p.confirmation.reusedEntity){
                requireValid(!localNamespace||localNamespace===p.confirmation.entity.registryNamespace);
                r['registry-meta'].set('local-namespace',{workspace:owner,key:'local-namespace',value:{schemaVersion:1,complete:true,localNamespace:p.confirmation.entity.registryNamespace}});
            }
            const registered = receipts.find(c => c.entity.id === p.confirmation.entity.id)?.entity;
            if (p.confirmation.reusedEntity) requireValid(registered);
            if (registered) requireValid(canonical(registered) === canonical(p.confirmation.entity));
            const existing = r.cards.get(key(p.deck.id, p.card.id));
            if (existing) {
                requireValid(r.decks.get(p.deck.id)?.value.status === 'active' && canonical(existing.value.lexicalIdentity) === canonical(p.card.lexicalIdentity) &&
                    p.expectedContentVersion !== null && existing.value.contentVersion === p.expectedContentVersion);
                r.cards.set(key(p.deck.id, p.card.id), { ...existing, value: { ...p.card, order: existing.value.order, createdAt: existing.value.createdAt } });
            } else {
                requireValid(p.expectedContentVersion === null);
                let deck = r.decks.get(p.deck.id);
                if (deck) requireValid(receipts.some(c => c.source.volumeId === p.confirmation.source.volumeId));
                if (!deck) {
                    requireValid(!receipts.some(c => c.source.volumeId === p.confirmation.source.volumeId));
                    deck = {workspace:owner, key:p.deck.id, value:p.deck, count:0};
                    r.decks.set(p.deck.id, deck);
                }
                requireValid(deck.value.status === 'active');
                const cards = [...r.cards.values()].map(row => row.value).filter(c => c.deckId === p.deck.id);
                requireValid(cards.length < 1000 && deck.count === cards.length &&
                    !cards.some(c => c.lexicalIdentity.key === p.card.lexicalIdentity.key));
                r.cards.set(key(p.deck.id, p.card.id), {workspace:owner, key:key(p.deck.id, p.card.id),
                    value:{...p.card, order:Math.max(0, ...cards.map(c => c.order)) + 1}});
                deck.count = cards.length + 1;
            }
            this.registerConfirmation(r,p,owner);
        });
    }
    async saveSettings(opId: string, deckId: string, settings: DeckSettings, owner = this.owner()): Promise<void> {
        requireValid(settingsValid(settings));
        return this.mutate(opId, 'settings', deckId, { settings }, owner, r => { const row = r.decks.get(deckId); requireValid(row); row.value = validateDeck({ ...row.value, settings, updatedAt: new Date().toISOString() }); });
    }
    /** Internal lifecycle API; no public control or cloud activation is introduced. */
    async lifecycle(opId:string,action:'delete'|'restore'|'archive',kind:'card'|'deck',entityId:string,deckId:string,owner=this.owner()):Promise<void>{
        const guard=this.writeGuard(owner);
        const payload=await this.transaction(owner,false,r=>kind==='card'?r.cards.get(key(deckId,entityId))?.value:r.decks.get(entityId)?.value);
        guard();requireValid(payload);await this.mutate(opId,action,deckId,{kind,id:entityId,payload},owner,()=>{});
    }
    async syncSnapshot(owner:LocalWorkspaceId){return this.transaction(owner,false,r=>({journal:[...r.journal.values()].map(x=>x.value).sort((a,b)=>a.localRevision-b.localRevision),
        state:r.reconciliation.get('v1')?.value??emptyCustomReconciliation()}));}
    /** Read-only source capture. Never runs the registry migration or rewrites Guest provenance. */
    async guestInventory():Promise<CustomGuestInventory>{return this.transaction('guest',false,r=>({source:'guest',records:Object.fromEntries(stores.map(s=>[s,[...r[s].values()].map(row=>JSON.parse(JSON.stringify(row)))]))}));}
    async changeCoordination<T>(owner:LocalWorkspaceId,guard:()=>void,update:(state:CustomReconciliationState)=>T):Promise<T>{
        const result=await this.transaction(owner,true,r=>{guard();const state=r.reconciliation.get('v1')?.value??emptyCustomReconciliation();const value=update(state);state.version++;
            r.reconciliation.set('v1',{workspace:owner,key:'v1',value:state});guard();return value;});
        if(this.owner()===owner)this.journalRevision.update(n=>n+1);this.channel?.postMessage({workspace:owner});return result;
    }
    async setCustomConsent(owner:LocalWorkspaceId,accepted:boolean,guard:()=>void=()=>{}):Promise<void>{
        await this.changeCoordination(owner,guard,state=>{const consent={version:1 as const,revision:(state.consent?.revision??0)+1,accepted,changedAt:new Date().toISOString()};
            state.consent=consent;(state.consentHistory??=[]).push(consent);});
    }
    /** Compatibility with the existing journal. Recover evidence, never invent a review or run FSRS. */
    async syncContext(owner:LocalWorkspaceId,source:CustomCatalogOperation):Promise<NonNullable<CustomCatalogOperation['context']>>{
        if(source.context)return source.context;
        return this.transaction(owner,false,r=>{
            requireValid(canonical(r.journal.get(source.id)?.value)===canonical(source));
            const p=source.payload as {card?:CustomDeckCard;deck?:CustomDeck;event?:DeckReviewEvent;daily?:DeckDailyState;settings?:DeckSettings};
            let card=p.card;if(card){const stored=r.cards.get(key(card.deckId,card.id));requireValid(stored);card={...card,order:stored.value.order,createdAt:stored.value.createdAt};}
            const event=p.event,record=event?r.events.get(event.id):undefined;
            if(event)requireValid(record&&canonical(record.value)===canonical(event));
            const original=event?r.journal.get(event.id)?.value.payload as {progress?:DeckCardProgress}|undefined:undefined;
            if(source.kind==='undo')requireValid(original?.progress);
            const initialDeck=[...r.confirmations.values()].find(x=>x.value.deck.id===source.entityId)?.value.deck;
            const deck=p.deck??(p.settings&&initialDeck?{...initialDeck,settings:p.settings,updatedAt:source.createdAt}:undefined);
            return JSON.parse(JSON.stringify({deck,card,beforeHead:source.kind==='undo'?event!.id:record?.head??null,
                before:source.kind==='undo'?original!.progress!.card:event?.cardBefore??null,daily:p.daily}));
        });
    }
    /** CAS and workspace fence execute inside the same transaction as ACK or complete publication. */
    async syncCommit(owner:LocalWorkspaceId,expectedVersion:number,expectedJournal:string|null,state:CustomReconciliationState,guard:()=>void,publication?:CustomPublication):Promise<void>{
        await this.transaction(owner,true,r=>{
            guard();const old=r.reconciliation.get('v1')?.value??emptyCustomReconciliation();requireValid(old.version===expectedVersion);
            if(expectedJournal!==null)requireValid(canonical([...r.journal.values()].map(x=>x.value).sort((a,b)=>a.localRevision-b.localRevision))===expectedJournal);
            if(publication){
                for(const p of publication.confirmations)this.registerConfirmation(r,p,owner);
                // Feed revision order is unrelated to dependency order (e.g. later settings edits).
                const rank=(kind:string)=>kind==='deck'?0:kind==='card'?1:2;
                const es=[...publication.entities].sort((a,b)=>rank(a.kind)-rank(b.kind)),deckIds=new Set(es.filter(e=>e.kind==='deck').map(e=>e.id));
                for(const [k,c]of r.cards)if(deckIds.has(c.value.deckId))r.cards.delete(k);
                // Rejected branches remain in journal/conflict archives, never counted as canonical events.
                for(const [k]of r.progress)if(deckIds.has(JSON.parse(k)[0]))r.progress.delete(k);
                for(const [k,e]of r.events)if(deckIds.has(e.value.deckId))r.events.delete(k);
                for(const [k,d]of r.daily)if(deckIds.has(d.value.deckId))r.daily.delete(k);
                const canonicalEvents=new Set<string>();
                for(const progress of es.filter(e=>e.kind==='progress'&&e.payload!==null)){
                    let head=progress.head;while(head&&!canonicalEvents.has(head)){canonicalEvents.add(head);head=es.find(e=>e.kind==='review-event'&&e.id===head)?.head??null;}
                }
                for(const e of es){
                    if(e.kind==='deck'){if(e.deleted)r.decks.delete(e.id);else r.decks.set(e.id,{workspace:owner,key:e.id,value:e.payload as CustomDeck,count:es.filter(c=>c.kind==='card'&&!c.deleted&&(c.payload as CustomDeckCard).deckId===e.id).length});}
                    if(e.kind==='card'&&!e.deleted){const c=e.payload as CustomDeckCard;if(r.decks.has(c.deckId))r.cards.set(key(c.deckId,c.id),{workspace:owner,key:key(c.deckId,c.id),value:c});}
                    if(e.kind==='progress'){const p=e.payload as DeckCardProgress|null,parent=es.find(c=>c.kind==='card'&&c.id===e.id)?.payload as CustomDeckCard|undefined;
                        const d=p?.deckId??parent?.deckId;requireValid(d);r.progress.set(key(d,e.id),{workspace:owner,key:key(d,e.id),value:p,head:e.head});}
                    if(e.kind==='review-event'){const event=e.payload as DeckReviewEvent;r.events.set(e.id,{workspace:owner,key:e.id,value:event,head:e.head,voidedBy:e.voidedBy??undefined,canonical:canonicalEvents.has(e.id)});}
                    if(e.kind==='daily'&&!e.deleted){const day=e.payload as DeckDailyState;r.daily.set(key(day.deckId,day.localDate),{workspace:owner,key:key(day.deckId,day.localDate),value:day});}
                }
                r['registry-meta'].set('v1',{workspace:owner,key:'v1',value:{schemaVersion:1,complete:true}});
            }
            r.reconciliation.set('v1',{workspace:owner,key:'v1',value:{...state,version:old.version+1}});guard();
        });
        if(publication&&this.owner()===owner){this.catalogRevision.update(n=>n+1);this.progressRevision.update(n=>n+1);}
        if(publication)this.channel?.postMessage({workspace:owner});
    }
    async list(owner = this.owner()): Promise<CustomDeck[]> { return this.transaction(owner, false, r => [...r.decks.values()].map(x => validateDeck(x.value))); }
    async content(deckId: string, owner = this.owner()): Promise<CustomDeckCard[]> { const raw = await this.transaction(owner, false, r => { const cards = [...r.cards.values()].map(x => x.value as CustomDeckCard).filter(c => c.deckId === deckId); const deck = r.decks.get(deckId); requireValid(deck ? Number.isSafeInteger(deck.count) && deck.count === cards.length : cards.length === 0); return cards; }); return Promise.all(raw.map(validateCard)); }
    async journal(owner = this.owner()): Promise<CustomCatalogOperation[]> { return this.transaction(owner, false, r => [...r.journal.values()].map(x => x.value as CustomCatalogOperation).sort((a, b) => a.localRevision - b.localRevision)); }
    async getDeckProgress(deckId: string, owner = this.owner()): Promise<DeckCardProgress[]> { return this.transaction(owner, false, r => [...r.progress.values()].map(x => x.value as DeckCardProgress).filter(x => x && x.deckId === deckId).map(x => { requireValid(progressValid(x)); return x; })); }
    async getDeckReviewEvents(deckId: string, owner = this.owner()): Promise<DeckReviewEvent[]> { return this.transaction(owner, false, r => [...r.events.values()].filter(x => x.canonical!==false&&!x.voidedBy && x.value.deckId === deckId).map(x => { requireValid(eventValid(x.value)); return x.value; })); }
    async getDailyState(deckId: string, day: string, owner = this.owner()): Promise<DeckDailyState | null> { return this.transaction(owner, false, r => { const d = r.daily.get(key(deckId, day))?.value ?? null; requireValid(d === null || dailyValid(d)); return d; }); }
    async writeDailyState(daily: DeckDailyState, owner = this.owner()): Promise<void> { requireValid(dailyValid(daily)); return this.mutate(crypto.randomUUID(), 'daily', daily.deckId, daily, owner, r => { requireValid(r.decks.has(daily.deckId)); const stored = r.daily.get(key(daily.deckId, daily.localDate))?.value as DeckDailyState | undefined; r.daily.set(key(daily.deckId, daily.localDate), { workspace: owner, key: key(daily.deckId, daily.localDate), value: { ...daily, introducedEntryIds: stored?.introducedEntryIds ?? daily.introducedEntryIds, completedAt: stored?.completedAt ?? daily.completedAt } }); }); }
    async commitReview(progress: DeckCardProgress, event: DeckReviewEvent, daily: DeckDailyState, owner = this.owner()): Promise<void> {
        requireValid(progressValid(progress) && eventValid(event) && dailyValid(daily) && progress.deckId === event.deckId && progress.entryId === event.entryId && daily.deckId === event.deckId && progress.due === event.dueAfter && progress.state === event.stateAfter && progress.card.stability === event.stabilityAfter && progress.card.difficulty === event.difficultyAfter);
        return this.mutate(event.id, 'review', event.deckId, { progress, event, daily }, owner, r => {
            requireValid(r.cards.has(key(event.deckId, event.entryId)));
            const previous = r.progress.get(key(event.deckId, event.entryId));
            if (canonical(previous?.value?.card ?? null) !== canonical(event.cardBefore))
                throw new CustomDeckError('Review is based on stale progress');
            const storedDaily = r.daily.get(key(daily.deckId, daily.localDate))?.value as DeckDailyState | undefined;
            if (storedDaily?.completedAt != null)
                throw new CustomDeckError('Daily session completed');
            const merged = { ...daily, introducedEntryIds: [...new Set([...(storedDaily?.introducedEntryIds ?? []), ...daily.introducedEntryIds])] };
            r.progress.set(key(event.deckId, event.entryId), { workspace: owner, key: key(event.deckId, event.entryId), value: progress, head: event.id });
            r.events.set(event.id, { workspace: owner, key: event.id, value: event, head: previous?.head ?? null });
            r.daily.set(key(daily.deckId, daily.localDate), { workspace: owner, key: key(daily.deckId, daily.localDate), value: merged });
        });
    }
    async undoReview(event: DeckReviewEvent, daily: DeckDailyState, owner = this.owner()): Promise<void> {
        const guard=this.writeGuard(owner);
        requireValid(eventValid(event) && dailyValid(daily));
        const undoId=await digest('undo-',event.id);guard();
        return this.mutate(undoId, 'undo', event.deckId, { event, daily }, owner, r => {
            const row = r.events.get(event.id), p = r.progress.get(key(event.deckId, event.entryId));
            requireValid(row && !row.voidedBy && p?.head === event.id && canonical(row.value) === canonical(event));
            row.voidedBy = undoId;
            // A deleted first introduction remains an explicit null snapshot locally; never a fake New FSRS card.
            p.value = event.cardBefore ? { deckId: event.deckId, entryId: event.entryId, due: event.cardBefore.due, state: event.cardBefore.state, card: event.cardBefore } : null;
            p.head = row.head ?? null;
            const current = r.daily.get(key(daily.deckId, daily.localDate))?.value as DeckDailyState | undefined;
            r.daily.set(key(daily.deckId, daily.localDate), { workspace: owner, key: key(daily.deckId, daily.localDate), value: { ...(current ?? daily), introducedEntryIds: event.cardBefore === null ? (current ?? daily).introducedEntryIds.filter(id => id !== event.entryId) : (current ?? daily).introducedEntryIds } });
        });
    }
}

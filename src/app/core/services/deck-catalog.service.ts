import {CustomDeckAccess} from './custom-deck-access';
import { computed, inject, Injectable, Injector, signal } from '@angular/core';
import { CatalogDeck, CustomDeck, DeckContentProvider, DeckLoadState, LoadedDeck } from '../models/deck-catalog.model';
import { STUDY_DECKS } from '../../data/study-decks';
import { JAPANESE_1500_INDEX } from '../../data/japanese-1500.index.generated';
import { CUSTOM_DECKS_ENABLED, CustomDeckRepository } from './custom-deck.repository';
import { WorkspaceService } from './workspace.service';
import { canonical } from './custom-deck-validation';
import { TranslationService } from './translation.service';
import { CustomDeckSyncAdapter } from './custom-deck-sync-adapter';
import { PUYI_DECK, PUYI_DECK_ID, puyiEntry } from '../models/puyi.model';
export const builtinDecks: readonly CatalogDeck[] = STUDY_DECKS.map(d => ({ ...d, kind: 'builtin', displayName: { kind: 'i18n', key: d.nameKey } }));
@Injectable({ providedIn: 'root' })
export class DeckCatalogService {
    readonly access=inject(CustomDeckAccess);
    readonly enabled = inject(CUSTOM_DECKS_ENABLED);
    readonly repository = inject(CustomDeckRepository);
    /** Internal, disabled by default. Merely constructing the catalog never starts network work. */
    private readonly injector = inject(Injector);
    get customSync() { return this.injector.get(CustomDeckSyncAdapter); }
    private readonly workspace = inject(WorkspaceService);
    private readonly custom = signal<{
        owner: string;
        decks: readonly CatalogDeck[];
    }>({ owner: '', decks: [] });
    readonly error = signal<unknown>(null);
    readonly loading = signal(false);
    private readonly publicDeck=signal<LoadedDeck|null>(null);
    readonly publicRevision=signal(0);
    readonly publicError=signal(false);
    readonly items = computed(() => [...builtinDecks, this.publicDeck()?.deck??PUYI_DECK, ...(this.enabled() && this.access.permitted() && this.custom().owner === this.workspace.active() ? this.custom().decks : [])]);
    readonly revision = this.repository.catalogRevision;
    private publicPending:Promise<void>|null=null;
    async refreshPublic():Promise<void>{
        if(this.publicPending)return this.publicPending;
        this.publicPending=(async()=>{
            try {
                const {PuyiService}=await import('./puyi.service');
                const service=this.injector.get(PuyiService),cards=await service.list();
                const entries=cards.map(c=>puyiEntry(c,service.imageUrl(c.image_path)));
                const byId=new Map(entries.map(e=>[e.id,e]));
                this.publicError.set(false);
                const value:LoadedDeck={deck:{...PUYI_DECK,cardCount:entries.length},content:{kind:'public',deckId:PUYI_DECK_ID,index:entries.map(e=>({id:e.id,order:e.order})),entries:()=>entries,entry:id=>byId.get(id)??null}};
                if(canonical(this.publicDeck()?.content.entries())!==canonical(entries)||!this.publicDeck()){
                    this.publicDeck.set(value);this.publicRevision.update(n=>n+1);
                }
            }catch{this.publicError.set(true);}finally{this.publicPending=null;}
        })();
        return this.publicPending;
    }
    publicEntryIds():ReadonlySet<string>|null{return this.publicDeck()?new Set(this.publicDeck()!.content.index.map(e=>e.id)):null;}
    private generation = 0;
    owner() { return this.workspace.active(); }
    epoch() { return this.workspace.activationRevision(); }
    /** Internal read model, including archived decks. Does not expose or enable custom UI. */
    async knowledgeInventory(owner = this.workspace.active()) {
        return { builtin: builtinDecks, custom: this.access.permitted()?await this.repository.list(owner):[] };
    }
    async refresh(): Promise<void> {
        // Public network availability must never delay the existing local decks.
        void this.refreshPublic();
        const owner = this.owner(), epoch=this.epoch(), generation = ++this.generation;
        const current=()=>this.owner()===owner&&this.epoch()===epoch&&generation===this.generation;
        this.error.set(null);
        if (!this.enabled()||!this.access.permitted()) {
            this.loading.set(false);
            this.custom.set({ owner, decks: [] });
            return;
        }
        this.loading.set(true);
        try {
            const rows = await this.repository.list(owner);
            const decks = await Promise.all(rows.filter(d => d.status === 'active').map(async (d) => this.metadata(d, (await this.repository.content(d.id, owner)).length)));
            if (current() && this.access.permitted() && this.enabled() && canonical(this.custom()) !== canonical({ owner, decks }))
                this.custom.set({ owner, decks });
        }
        catch (e) {
            if (current()) {
                this.custom.set({ owner, decks: [] });
                this.error.set(e);
            }
        }
        finally {
            if (current())
                this.loading.set(false);
        }
    }
    get(id: string | null): CatalogDeck | null { return this.items().find(d => d.id === id) ?? null; }
    async index(deckId: string) {
        if(deckId===PUYI_DECK_ID)return this.publicDeck()?.content.index??[];
        if (builtinDecks.some(d => d.id === deckId)) return JAPANESE_1500_INDEX;
        if (!this.enabled()||!this.access.permitted()) return [];
        return (await this.repository.content(deckId)).map(c => ({id:c.id,order:c.order}));
    }
    async load(deckId: string | null): Promise<DeckLoadState<LoadedDeck>> {
        if (!deckId)
            return { status: 'missing' };
        const owner = this.owner(),epoch=this.epoch();
        try {
            if(deckId===PUYI_DECK_ID){await this.refreshPublic();return this.publicError()?{status:'error',error:new Error('Puyi unavailable')}:{status:'ready',value:this.publicDeck()!};}
            const builtin = builtinDecks.find(d => d.id === deckId);
            if (builtin) {
                const { BUILTIN_DECK_CONTENT } = await import('./builtin-deck-content');
                return { status: 'ready', value: { deck: builtin, content: BUILTIN_DECK_CONTENT } };
            }
            if (!this.enabled()||!this.access.permitted())
                return { status: 'missing' };
            const deck = (await this.repository.list(owner)).find(d => d.id === deckId && d.status === 'active');
            if (!deck)
                return { status: 'missing' };
            const cards = await this.repository.content(deckId, owner);
            if (this.owner() !== owner||this.epoch()!==epoch)
                return { status: 'missing' };
            const entries = cards.sort((a, b) => a.order - b.order).map(c => ({ kind: 'custom' as const, id: c.id, order: c.order, word: c.word, reading: c.reading, glosses: c.glosses, ...(c.context ? { context: c.context } : {}) }));
            const byId = new Map(entries.map(c => [c.id, c]));
            const content: DeckContentProvider = { kind: 'custom', deckId, index: entries.map(c => ({ id: c.id, order: c.order })), entries: () => entries, entry: id => byId.get(id) ?? null };
            return { status: 'ready', value: { deck: this.metadata(deck, cards.length), content } };
        }
        catch (error) {
            return { status: 'error', error };
        }
    }
    private metadata(d: CustomDeck, count: number): CatalogDeck { return { id: d.id, kind: 'custom', displayName: { kind: 'literal', text: d.title }, cardCount: count, contentType: d.contentType, settings: d.settings }; }
}
export function deckTitle(deck: CatalogDeck, i18n: TranslationService): string { return deck.displayName.kind === 'literal' ? deck.displayName.text : i18n.t(deck.displayName.key); }

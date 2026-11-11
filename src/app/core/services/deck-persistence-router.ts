import {CustomDeckAccess} from './custom-deck-access';
import { inject, Injectable } from '@angular/core';
import { DeckPersistence } from '../models/deck-catalog.model';
import { DeckDatabaseService } from './deck-database.service';
import { CUSTOM_DECKS_ENABLED, CustomDeckRepository } from './custom-deck.repository';
import { WorkspaceService } from './workspace.service';
import { DeckCatalogService } from './deck-catalog.service';
@Injectable({ providedIn: 'root' })
export class DeckPersistenceRouter {
    private readonly builtin = inject(DeckDatabaseService);
    private readonly custom = inject(CustomDeckRepository);
    private readonly access=inject(CustomDeckAccess);
    private readonly enabled = inject(CUSTOM_DECKS_ENABLED);
    private readonly workspace = inject(WorkspaceService);
    private readonly catalog=inject(DeckCatalogService);
    bind(deckId: string): DeckPersistence {
        const owner = this.workspace.active(),epoch=this.workspace.activationRevision(), custom = deckId.startsWith('md-');
        if (custom && (!this.enabled()||!this.access.permitted()))
            throw new Error('Custom decks are unavailable');
        const assertOwner = () => { if (owner !== this.workspace.active()||epoch!==this.workspace.activationRevision()||custom&&!this.access.permitted())
            throw new Error('Deck workspace changed'); };
        return { workspace:owner, assertOwner,
            getDeckProgress: async (id) => { assertOwner(); const v = await (custom ? this.custom.getDeckProgress(id, owner) : this.builtin.getDeckProgress(id)); assertOwner(); const active=id==='mazo-puyi'?this.catalog.publicEntryIds():null;return active?v.filter(p=>active.has(p.entryId)):v; },
            getDeckReviewEvents: async (id) => { assertOwner(); const v = await (custom ? this.custom.getDeckReviewEvents(id, owner) : this.builtin.getDeckReviewEvents(id)); assertOwner(); return v; },
            getDailyState: async (id, day) => { assertOwner(); const v = await (custom ? this.custom.getDailyState(id, day, owner) : this.builtin.getDailyState(id, day)); assertOwner(); return v; },
            writeDailyState: async (d,expected) => { assertOwner(); await (custom ? this.custom.writeDailyState(d, owner,expected) : this.builtin.writeDailyState(d,expected)); assertOwner(); },
            commitReview: async (p, e, d, limit) => { assertOwner(); await (custom ? this.custom.commitReview(p, e, d, owner) : this.builtin.commitReview(p, e, d,limit)); assertOwner(); },
            undoReview: async (e, d) => { assertOwner(); await (custom ? this.custom.undoReview(e, d, owner) : this.builtin.undoReview(e, d)); assertOwner(); },
        };
    }
}

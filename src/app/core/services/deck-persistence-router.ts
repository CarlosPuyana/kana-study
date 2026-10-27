import {CustomDeckAccess} from './custom-deck-access';
import { inject, Injectable } from '@angular/core';
import { DeckPersistence } from '../models/deck-catalog.model';
import { DeckDatabaseService } from './deck-database.service';
import { CUSTOM_DECKS_ENABLED, CustomDeckRepository } from './custom-deck.repository';
import { WorkspaceService } from './workspace.service';
@Injectable({ providedIn: 'root' })
export class DeckPersistenceRouter {
    private readonly builtin = inject(DeckDatabaseService);
    private readonly custom = inject(CustomDeckRepository);
    private readonly access=inject(CustomDeckAccess);
    private readonly enabled = inject(CUSTOM_DECKS_ENABLED);
    private readonly workspace = inject(WorkspaceService);
    bind(deckId: string): DeckPersistence {
        const owner = this.workspace.active(),epoch=this.workspace.activationRevision(), custom = deckId.startsWith('md-');
        if (custom && (!this.enabled()||!this.access.permitted()))
            throw new Error('Custom decks are unavailable');
        const assertOwner = () => { if (owner !== this.workspace.active()||custom&&(epoch!==this.workspace.activationRevision()||!this.access.permitted()))
            throw new Error('Deck workspace changed'); };
        return { workspace:owner, assertOwner,
            getDeckProgress: async (id) => { assertOwner(); const v = await (custom ? this.custom.getDeckProgress(id, owner) : this.builtin.getDeckProgress(id)); assertOwner(); return v; },
            getDeckReviewEvents: async (id) => { assertOwner(); const v = await (custom ? this.custom.getDeckReviewEvents(id, owner) : this.builtin.getDeckReviewEvents(id)); assertOwner(); return v; },
            getDailyState: async (id, day) => { assertOwner(); const v = await (custom ? this.custom.getDailyState(id, day, owner) : this.builtin.getDailyState(id, day)); assertOwner(); return v; },
            writeDailyState: async (d) => { assertOwner(); await (custom ? this.custom.writeDailyState(d, owner) : this.builtin.writeDailyState(d)); assertOwner(); },
            commitReview: async (p, e, d) => { assertOwner(); await (custom ? this.custom.commitReview(p, e, d, owner) : this.builtin.commitReview(p, e, d)); assertOwner(); },
            undoReview: async (e, d) => { assertOwner(); await (custom ? this.custom.undoReview(e, d, owner) : this.builtin.undoReview(e, d)); assertOwner(); },
        };
    }
}

import { computed, inject, Injectable } from '@angular/core';
import { DeckDatabaseService } from './deck-database.service';
import { CustomDeckRepository } from './custom-deck.repository';
import { DeckPersistenceRouter } from './deck-persistence-router';

/** Read through the existing account/deck fence; never through public content RPCs. */
@Injectable({ providedIn: 'root' })
export class DeckScheduleReader {
  private readonly builtin = inject(DeckDatabaseService);
  private readonly custom = inject(CustomDeckRepository);
  private readonly persistence = inject(DeckPersistenceRouter);
  readonly revision = computed(() => `${this.builtin.revision()}:${this.custom.progressRevision()}`);
  async read(deckId: string) {
    const bound = this.persistence.bind(deckId);
    const [progress, events] = await Promise.all([bound.getDeckProgress(deckId), bound.getDeckReviewEvents(deckId)]);
    bound.assertOwner();
    return { progress, events };
  }
}

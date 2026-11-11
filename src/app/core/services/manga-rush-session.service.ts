import { computed, DestroyRef, effect, inject, Injectable, signal, untracked } from '@angular/core';
import { MangaRushCard, MangaRushSession } from '../models/manga-rush.model';
import { WorkspaceService } from './workspace.service';

/** Component-scoped memory only. No repository, storage, scheduler, timer or medal dependency. */
@Injectable()
export class MangaRushSessionService {
  private readonly workspace = inject(WorkspaceService);
  private readonly value = signal<MangaRushSession | null>(null);
  readonly session = computed(() => {
    const value = this.value();
    return value?.owner === this.workspace.active() && value.epoch === this.workspace.activationRevision() ? value : null;
  });
  readonly current = computed(() => {const s = this.session(); return s?.cards[s.answers.length] ?? null;});
  readonly summary = computed(() => {
    const s = this.session();
    return s && s.answers.length === s.cards.length ? {total: s.answers.length,
      knew: s.answers.filter(a => a.knew).length, didNotKnow: s.answers.filter(a => !a.knew).length,
      distinct: new Set(s.answers.map(a => a.lexicalKey)).size} : null;
  });
  constructor() {
    inject(DestroyRef).onDestroy(() => this.clear());
    effect(() => {this.workspace.active(); this.workspace.activationRevision(); untracked(() => {if (!this.session()) this.clear();});});
  }
  start(volumeId: string, cards: readonly MangaRushCard[]): boolean {
    this.clear();
    if (!cards.length || cards.some(c => c.volumeId !== volumeId)) return false;
    this.value.set({volumeId, owner: this.workspace.active(), epoch: this.workspace.activationRevision(),
      cards: structuredClone(cards), answers: [], revealed: false});
    return true;
  }
  reveal(volumeId: string): void {
    const s = this.session(); if (!s || s.volumeId !== volumeId || !this.current()) return;
    this.value.set({...s, revealed: true});
  }
  rate(volumeId: string, knew: boolean): void {
    const s = this.session(), card = this.current();
    if (!s || s.volumeId !== volumeId || !s.revealed || !card) return;
    this.value.set({...s, revealed: false, answers: [...s.answers, {lexicalKey: card.lexicalKey, knew}]});
  }
  clear(): void { this.value.set(null); }
}

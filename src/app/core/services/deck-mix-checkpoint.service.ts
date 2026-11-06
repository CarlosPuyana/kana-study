import { inject, Injectable } from '@angular/core';
import { StorageService } from './storage.service';

interface Step { before: string; after: string; debtBefore: number; debtAfter: number; eventId: string }
interface Checkpoint { day: string; steps: Step[] }
export interface MixContext { day: string; ids: readonly string[]; signature: string; debt: number; receiptOrder: readonly string[] }
const key = (deckId: string) => `kana-study.deck-mix.v1.${deckId}`;
const validDebt = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value) && Math.abs(value) < 1_000_000;
const signature = async (ids: readonly string[]) => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',
  new TextEncoder().encode([...ids].sort().join('\0')))), b => b.toString(16).padStart(2, '0')).join('');

/** Local presentation metadata only. Existing FSRS records/backup/cloud contracts stay intact. */
@Injectable({ providedIn: 'root' })
export class DeckMixCheckpointService {
  private readonly storage = inject(StorageService);
  private read(deckId: string, day: string): Checkpoint | null {
    const value = this.storage.get<Checkpoint | null>(key(deckId), null);
    if (!value || value.day !== day || !Array.isArray(value.steps) || value.steps.length > 128
      || value.steps.some(s => !s || !/^[a-f0-9]{64}$/.test(s.before) || !/^[a-f0-9]{64}$/.test(s.after)
        || !validDebt(s.debtBefore) || !validDebt(s.debtAfter) || typeof s.eventId !== 'string' || s.eventId.length > 256)) return null;
    return value;
  }
  async context(deckId: string, day: string, ids: readonly string[]): Promise<MixContext> {
    const stored = this.read(deckId, day), hash = await signature(ids);
    const index = stored ? stored.steps.map(s => s.after === hash || s.before === hash).lastIndexOf(true) : -1;
    const step = index >= 0 ? stored!.steps[index] : undefined;
    const prefix = stored?.steps.slice(0, index + Number(step?.after === hash)) ?? [];
    const effectiveIds = new Set(ids);
    return { day, ids, signature: hash, debt: step ? step.after === hash ? step.debtAfter : step.debtBefore : 0,
      receiptOrder: step ? [...new Set(prefix.map(s => s.eventId).filter(id => effectiveIds.has(id)))] : [] };
  }
  async stage(deckId: string, context: MixContext, eventId: string, before: number, after: number, guard: () => void): Promise<void> {
    const next = await signature([...new Set([...context.ids, eventId])]);
    guard();
    const stored = this.read(deckId, context.day);
    const steps = [...(stored?.steps ?? []), { before: context.signature, after: next, debtBefore: before, debtAfter: after, eventId }].slice(-128);
    // Write intent BEFORE the canonical review. If that transaction fails, history still
    // matches `before`; if it succeeds then the page closes, history matches `after`.
    // Failure here leaves the answer uncommitted and the revealed card available to retry.
    this.storage.set(key(deckId), { day: context.day, steps }, { localOnly: true, strict: true });
  }
}

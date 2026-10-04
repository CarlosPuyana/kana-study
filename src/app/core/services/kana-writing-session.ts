import { Kana } from '../models/kana.model';
import { WritingConfiguration } from '../models/kana-writing.model';

export function writingPool(kana: readonly Kana[], config: WritingConfiguration): Kana[] {
  return kana.filter(k => (config.type === 'both' || k.type === config.type) && config.variants.includes(k.variant));
}

/** In-memory practice only: each kana appears once initially; Repeat goes to the tail. */
export class KanaWritingSession {
  private queue: Kana[];
  readonly total: number;
  resolved = 0;
  constructor(pool: readonly Kana[], random: () => number = Math.random) {
    this.queue = [...new Map(pool.map(k => [k.id, k])).values()];
    for (let i = this.queue.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [this.queue[i], this.queue[j]] = [this.queue[j], this.queue[i]];
    }
    this.total = this.queue.length;
  }
  get current(): Kana | null { return this.queue[0] ?? null; }
  answer(correct: boolean): void {
    const current = this.queue.shift();
    if (!current) return;
    if (correct) this.resolved++; else this.queue.push(current);
  }
}

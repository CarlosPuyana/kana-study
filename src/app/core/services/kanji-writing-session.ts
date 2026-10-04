import {Kanji} from '../models/kanji.model';

/** In-memory handwriting queue; it never updates study progress. */
export class KanjiWritingSession {
  private readonly queue: Kanji[];
  readonly total: number;
  resolved = 0;
  constructor(entries: readonly Kanji[], random: () => number = Math.random) {
    this.queue = [...new Map(entries.map(entry => [entry.id, entry])).values()];
    for (let i = this.queue.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [this.queue[i], this.queue[j]] = [this.queue[j], this.queue[i]];
    }
    this.total = this.queue.length;
  }
  get current(): Kanji | null { return this.queue[0] ?? null; }
  answer(correct: boolean): void {
    const entry = this.queue.shift();
    if (!entry) return;
    if (correct) this.resolved++; else this.queue.push(entry);
  }
}

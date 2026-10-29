/** Temporary circular practice in ranking order. No ratings, timers or persistence. */
export class DeckIntensiveSession {
  readonly ids: readonly string[];
  private index = 0;
  constructor(ids: readonly string[]) { this.ids = [...new Set(ids)]; }
  get current(): string | null { return this.ids[this.index] ?? null; }
  get position(): number { return this.ids.length ? this.index + 1 : 0; }
  get total(): number { return this.ids.length; }
  next(): void { if (this.ids.length) this.index = (this.index + 1) % this.ids.length; }
}

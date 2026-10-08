export const CARD_STUDY_LIMIT_MS = 10_000;

/** One visible appearance at a time. Scheduler ticks only refresh the display. */
export class CardStudyTimer {
  private creditedMs = 0;
  private appearanceMs: number | null = null;
  private anchor: number | null = null;
  private visible = true;
  private running = false;
  constructor(private readonly now: () => number = () => performance.now()) {}

  reset(): void { this.creditedMs = 0; this.appearanceMs = null; this.anchor = null; }
  startAppearance(): void { this.appearanceMs = 0; this.anchor = this.running && this.visible ? this.now() : null; }
  resume(): void { if (this.running) return; this.running = true; if (this.visible && this.appearanceMs !== null) this.anchor = this.now(); }
  pause(): void { this.tick(); this.running = false; this.anchor = null; }
  setVisible(visible: boolean): void {
    if (this.visible === visible) return;
    this.tick(); this.visible = visible;
    this.anchor = visible && this.running && this.appearanceMs !== null ? this.now() : null;
  }
  tick(): number {
    const now = this.now();
    if (this.anchor !== null && this.appearanceMs !== null) {
      this.appearanceMs = Math.min(CARD_STUDY_LIMIT_MS, this.appearanceMs + Math.max(0, now - this.anchor));
      this.anchor = this.appearanceMs < CARD_STUDY_LIMIT_MS ? now : null;
    }
    return this.seconds;
  }
  commitAppearance(): number {
    this.tick();
    // Whole credited seconds keep mm:ss, durationSeconds and event totals identical.
    const ms = Math.floor((this.appearanceMs ?? 0) / 1000) * 1000;
    this.creditedMs += ms; this.appearanceMs = null; this.anchor = null; return ms;
  }
  discardAppearance(): void { this.appearanceMs = null; this.anchor = null; }
  undo(ms: number): void { this.creditedMs = Math.max(0, this.creditedMs - Math.max(0, ms)); }
  get seconds(): number { return this.committedSeconds + Math.floor((this.appearanceMs ?? 0) / 1000); }
  get committedSeconds(): number { return Math.floor(this.creditedMs / 1000); }
  get appearanceMilliseconds(): number { this.tick(); return Math.floor((this.appearanceMs ?? 0) / 1000) * 1000; }
}

export function formatStudyTime(seconds: number): string {
  const value = Math.max(0, Math.floor(seconds));
  return `${String(Math.floor(value / 60)).padStart(2, '0')}:${String(value % 60).padStart(2, '0')}`;
}

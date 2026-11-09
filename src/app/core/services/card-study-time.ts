export const CARD_STUDY_LIMIT_MS = 180_000;
/** A missing foreground heartbeat is not evidence of active study (sleep/freeze/clock jump). */
export const STUDY_MAX_SAMPLE_GAP_MS = 5_000;

/** One visible appearance at a time; observed foreground slices never reset its budget. */
export class CardStudyTimer {
  private creditedMs = 0;
  private appearanceMs: number | null = null;
  private anchor: number | null = null;
  private wallAnchor:number|null=null;
  private visible = true;
  private running = false;
  constructor(private readonly now: () => number = () => performance.now(),private readonly wallNow:()=>number=()=>Date.now()) {}

  reset(): void { this.creditedMs = 0; this.appearanceMs = null; this.anchor = null; this.wallAnchor=null;this.running=false; }
  restoreCommitted(seconds:number):void{this.reset();this.creditedMs=Number.isFinite(seconds)?Math.max(0,Math.floor(seconds))*1000:0;}
  startAppearance(): void { this.appearanceMs = 0; this.reanchor(); }
  resume(): void { if (this.running) return; this.running = true; this.reanchor(); }
  pause(): void { this.tick(); this.running = false; this.anchor = null; }
  setVisible(visible: boolean): void {
    if (this.visible === visible) return;
    this.tick(); this.visible = visible;
    this.reanchor();
  }
  tick(): number {
    const now = this.now(),wall=this.wallNow();
    if (this.anchor !== null && this.appearanceMs !== null) {
      const delta=now-this.anchor,wallDelta=wall-(this.wallAnchor??wall);
      // Rebase after an unobserved interval instead of treating sleep/freeze as study.
      if(Number.isFinite(delta)&&Number.isFinite(wallDelta)&&delta>=0&&delta<=STUDY_MAX_SAMPLE_GAP_MS&&Math.abs(wallDelta-delta)<=STUDY_MAX_SAMPLE_GAP_MS)
        this.appearanceMs = Math.min(CARD_STUDY_LIMIT_MS, this.appearanceMs + delta);
      this.anchor = this.appearanceMs < CARD_STUDY_LIMIT_MS ? now : null;
      this.wallAnchor=wall;
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
  get hasAppearance():boolean{return this.appearanceMs!==null;}
  get appearanceMilliseconds(): number { this.tick(); return Math.floor((this.appearanceMs ?? 0) / 1000) * 1000; }
  private reanchor():void{this.anchor=this.running&&this.visible&&this.appearanceMs!==null&&this.appearanceMs<CARD_STUDY_LIMIT_MS?this.now():null;this.wallAnchor=this.anchor===null?null:this.wallNow();}
}

export function formatStudyTime(seconds: number): string {
  const value = Math.max(0, Math.floor(seconds));
  return `${String(Math.floor(value / 60)).padStart(2, '0')}:${String(value % 60).padStart(2, '0')}`;
}

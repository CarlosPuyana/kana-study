export interface MangaClockOptions { pauseHidden: boolean; idleMinutes: number; pauseDictionary: boolean; dictionaryOpen: boolean }
const DEFAULT_OPTIONS: MangaClockOptions = { pauseHidden: true, idleMinutes: 3, pauseDictionary: true, dictionaryOpen: false };
export class MangaReadingClock {
  private last: number;
  private interaction: number;
  constructor(now = Date.now(), private enabled = true) { this.last = this.interaction = now; }
  start(now = Date.now()): void { this.enabled = true; this.last = this.interaction = now; }
  stop(now = Date.now()): void { this.enabled = false; this.last = now; }
  private allowed(visible: boolean, focused: boolean, options: MangaClockOptions): boolean {
    return this.enabled && (visible || !options.pauseHidden) && (focused || (!visible && !options.pauseHidden)) && !(options.pauseDictionary && options.dictionaryOpen);
  }
  state(visible: boolean, focused: boolean, now = Date.now(), options = DEFAULT_OPTIONS): 'off' | 'running' | 'paused' {
    if (!this.enabled) return 'off';
    return this.allowed(visible, focused, options) && (options.idleMinutes === 0 || now < this.interaction + options.idleMinutes * 60_000) ? 'running' : 'paused';
  }
  interact(now = Date.now()): void { this.interaction = now; }
  tick(visible: boolean, focused: boolean, now = Date.now(), options = DEFAULT_OPTIONS): number {
    const end = options.idleMinutes === 0 ? now : Math.min(now, this.interaction + options.idleMinutes * 60_000);
    const seconds = this.allowed(visible, focused, options) ? Math.max(0, end - this.last) / 1000 : 0;
    this.last = now; return seconds;
  }
}

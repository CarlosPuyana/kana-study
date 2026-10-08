import { computed, DestroyRef, inject, InjectionToken, signal } from '@angular/core';
import { CardStudyTimer, formatStudyTime } from './card-study-time';

export const STUDY_MONOTONIC_NOW = new InjectionToken<() => number>('STUDY_MONOTONIC_NOW', {
  providedIn: 'root', factory: () => () => performance.now(),
});

/** Each flow owns an instance; all use the same engine and visibility rules. */
export class StudyClock {
  private readonly engine: CardStudyTimer;
  private mounted = false;
  readonly seconds = signal(0);
  readonly label = computed(() => formatStudyTime(this.seconds()));
  constructor(now: () => number, destroy: DestroyRef) {
    this.engine = new CardStudyTimer(now);
    this.engine.setVisible(!document.hidden);
    const visible = () => { this.engine.setVisible(!document.hidden); this.refresh(); };
    const hide = () => { this.engine.setVisible(false); this.refresh(); };
    const show = () => visible();
    document.addEventListener('visibilitychange', visible);
    window.addEventListener('pagehide', hide); window.addEventListener('pageshow', show);
    const timer = setInterval(() => this.refresh(), 250);
    destroy.onDestroy(() => {
      clearInterval(timer); document.removeEventListener('visibilitychange', visible);
      window.removeEventListener('pagehide', hide); window.removeEventListener('pageshow', show);
      this.engine.pause();
    });
  }
  attach(): void { if (this.mounted) return; this.mounted = true; this.resume(); }
  detach(): void { this.mounted = false; this.pause(); }
  reset(): void { this.engine.reset(); this.refresh(); }
  startAppearance(): void { this.engine.startAppearance(); if (this.mounted) this.engine.resume(); this.refresh(); }
  pause(): void { this.engine.pause(); this.refresh(); }
  resume(): void { if (this.mounted) this.engine.resume(); this.refresh(); }
  commitAppearance(): number { const ms = this.engine.commitAppearance(); this.refresh(); return ms; }
  discardAppearance(): void { this.engine.discardAppearance(); this.refresh(); }
  undo(ms: number): void { this.engine.undo(ms); this.refresh(); }
  appearanceMilliseconds(): number { return this.engine.appearanceMilliseconds; }
  get committedSeconds(): number { return this.engine.committedSeconds; }
  private refresh(): void { this.seconds.set(this.engine.tick()); }
}

export function createStudyClock(): StudyClock { return new StudyClock(inject(STUDY_MONOTONIC_NOW), inject(DestroyRef)); }

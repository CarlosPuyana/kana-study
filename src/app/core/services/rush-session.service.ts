import { computed, inject, Injectable, signal } from '@angular/core';
import { RushModule, RushSession, RushSessionSummary, RushUnit } from '../models/rush.model';
import { RushEngine } from './rush-engine';
import { RushMedalService } from './rush-medal.service';
import { LocalRushRepository } from './rush-repository.service';
import { rushLocalDay } from './rush-time';
import { createStudyClock } from './study-clock';

@Injectable({ providedIn: 'root' })
export class RushSessionService {
  private readonly repository = inject(LocalRushRepository);
  readonly medals = inject(RushMedalService);
  private engine: RushEngine | null = null;
  readonly clock = createStudyClock();
  private readonly seen = new Set<string>();
  private readonly state = signal<RushSession | null>(null);
  readonly session = this.state.asReadonly();
  readonly currentUnit = computed(() => this.state() && this.engine ? this.engine.current : null);
  readonly revealed = signal(false);
  readonly saving = signal(false);
  readonly loading = signal(false);
  readonly error = signal(false);
  readonly activeSeconds = this.clock.seconds;
  readonly summary = signal<RushSessionSummary | null>(null);

  async start(module: RushModule, units: readonly RushUnit[], now = new Date()): Promise<boolean> {
    if (!units.length || this.loading() || this.saving()) return false;
    this.clock.reset(); this.clock.pause();
    this.loading.set(true); this.error.set(false); this.summary.set(null);
    try {
      await this.repository.markOpenSessionsInterrupted();
      this.engine = new RushEngine(units);
      this.seen.clear();
      const session: RushSession = {
        id: globalThis.crypto?.randomUUID?.() ?? `rush-${Date.now()}`, module,
        startedAt: now.getTime(), endedAt: null, localDay: rushLocalDay(now), activeSeconds: 0,
        cardsCompleted: 0, uniqueContentsSeen: 0, cyclesCompleted: 0,
        initialUnitCount: units.length, interrupted: false,
      };
      await this.repository.createSession(session);
      this.state.set(session); this.revealed.set(false); this.clock.startAppearance();
      return true;
    } catch { this.error.set(true); this.engine = null; return false; }
    finally { this.loading.set(false); }
  }

  reveal(): void {
    if (!this.state() || this.revealed() || this.saving() || this.state()?.endedAt !== null) return;
    this.revealed.set(true);
  }

  async next(): Promise<void> {
    const current = this.state(); const engine = this.engine;
    if (!current || current.endedAt !== null || !engine || !this.revealed() || this.saving()) return;
    this.saving.set(true); this.error.set(false); this.clock.pause();
    const unit = engine.current;
    const nextSeen = new Set(this.seen); nextSeen.add(unit.contentId);
    const candidate: RushSession = {
      ...current, activeSeconds: this.clock.committedSeconds + this.clock.appearanceMilliseconds() / 1000,
      cardsCompleted: current.cardsCompleted + 1, uniqueContentsSeen: nextSeen.size,
      cyclesCompleted: current.cyclesCompleted + Number(engine.willCompleteCycle),
    };
    try {
      await this.repository.saveProgress(candidate, unit.contentId);
      this.clock.commitAppearance();
      engine.completeCurrent(); this.seen.clear(); for (const id of nextSeen) this.seen.add(id);
      this.state.set(candidate);
      this.revealed.set(false);
      await this.medals.refresh().catch(() => this.error.set(true));
      this.clock.startAppearance();
    } catch { this.error.set(true); }
    finally { this.saving.set(false); this.clock.resume(); }
  }

  async finish(now = new Date()): Promise<RushSessionSummary | null> {
    if (this.summary()) return this.summary();
    const current = this.state();
    if (!current || this.saving() || this.loading()) return null;
    this.saving.set(true); this.clock.pause(); this.error.set(false);
    try {
      if (!current.cardsCompleted) {
        await this.repository.discardSession(current.id); this.clear(); return null;
      }
      const finished = { ...current, endedAt: now.getTime(), activeSeconds: this.clock.committedSeconds };
      await this.repository.finishSession(finished);
      this.clock.discardAppearance(); this.state.set(finished);
      const summary = toSummary(finished); this.summary.set(summary);
      await this.medals.refresh(now).catch(() => this.error.set(true)); return summary;
    } catch { this.error.set(true); this.clock.resume(); return null; }
    finally { this.saving.set(false); }
  }

  async checkpoint(): Promise<void> {
    const current = this.state();
    this.clock.detach();
    if (!current || current.endedAt !== null || this.saving()) return;
    this.saving.set(true);
    try { await this.repository.saveProgress({ ...current, activeSeconds: this.clock.committedSeconds }); }
    catch { this.error.set(true); }
    finally { this.saving.set(false); }
  }

  clear(): void {
    this.clock.detach(); this.clock.reset();
    this.engine = null; this.state.set(null); this.revealed.set(false); this.summary.set(null);
  }

}

function toSummary(session: RushSession): RushSessionSummary {
  return { module: session.module, activeSeconds: session.activeSeconds,
    cardsCompleted: session.cardsCompleted, uniqueContentsSeen: session.uniqueContentsSeen,
    cyclesCompleted: session.cyclesCompleted };
}

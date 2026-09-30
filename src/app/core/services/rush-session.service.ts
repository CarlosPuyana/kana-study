import { computed, inject, Injectable, signal } from '@angular/core';
import { RushModule, RushSession, RushSessionSummary, RushUnit } from '../models/rush.model';
import { RushEngine } from './rush-engine';
import { RushMedalService } from './rush-medal.service';
import { LocalRushRepository } from './rush-repository.service';
import { RushActiveTimer, rushLocalDay } from './rush-time';

@Injectable({ providedIn: 'root' })
export class RushSessionService {
  private readonly repository = inject(LocalRushRepository);
  readonly medals = inject(RushMedalService);
  private engine: RushEngine | null = null;
  private timer: RushActiveTimer | null = null;
  private readonly seen = new Set<string>();
  private lastPersistedSeconds = 0;
  private readonly state = signal<RushSession | null>(null);
  readonly session = this.state.asReadonly();
  readonly currentUnit = computed(() => this.state() && this.engine ? this.engine.current : null);
  readonly revealed = signal(false);
  readonly saving = signal(false);
  readonly loading = signal(false);
  readonly error = signal(false);
  readonly activeSeconds = signal(0);
  readonly summary = signal<RushSessionSummary | null>(null);

  constructor() {
    setInterval(() => void this.onTimer(), 1000);
    document.addEventListener('visibilitychange', () => {
      this.timer?.setVisible(!document.hidden);
      this.activeSeconds.set(this.timer?.activeSeconds ?? 0);
    });
  }

  async start(module: RushModule, units: readonly RushUnit[], now = new Date()): Promise<boolean> {
    if (!units.length) return false;
    this.loading.set(true); this.error.set(false); this.summary.set(null);
    try {
      await this.repository.markOpenSessionsInterrupted();
      this.engine = new RushEngine(units);
      this.timer = new RushActiveTimer();
      this.seen.clear(); this.lastPersistedSeconds = 0;
      const session: RushSession = {
        id: globalThis.crypto?.randomUUID?.() ?? `rush-${Date.now()}`, module,
        startedAt: now.getTime(), endedAt: null, localDay: rushLocalDay(now), activeSeconds: 0,
        cardsCompleted: 0, uniqueContentsSeen: 0, cyclesCompleted: 0,
        initialUnitCount: units.length, interrupted: false,
      };
      await this.repository.createSession(session);
      this.state.set(session); this.revealed.set(false); this.activeSeconds.set(0);
      return true;
    } catch { this.error.set(true); this.engine = null; return false; }
    finally { this.loading.set(false); }
  }

  reveal(): void {
    if (!this.state() || this.revealed() || this.saving()) return;
    this.timer?.activity(); this.revealed.set(true);
  }

  async next(): Promise<void> {
    const current = this.state(); const engine = this.engine;
    if (!current || !engine || !this.revealed() || this.saving()) return;
    this.saving.set(true); this.error.set(false); this.timer?.activity();
    const unit = engine.current;
    const nextSeen = new Set(this.seen); nextSeen.add(unit.contentId);
    const candidate: RushSession = {
      ...current, activeSeconds: this.timer?.tick() ?? current.activeSeconds,
      cardsCompleted: current.cardsCompleted + 1, uniqueContentsSeen: nextSeen.size,
      cyclesCompleted: current.cyclesCompleted + Number(engine.willCompleteCycle),
    };
    try {
      await this.repository.saveProgress(candidate, unit.contentId);
      engine.completeCurrent(); this.seen.clear(); for (const id of nextSeen) this.seen.add(id);
      this.state.set(candidate); this.activeSeconds.set(candidate.activeSeconds);
      this.lastPersistedSeconds = candidate.activeSeconds; this.revealed.set(false);
      await this.medals.refresh();
    } catch { this.error.set(true); }
    finally { this.saving.set(false); }
  }

  async finish(now = new Date()): Promise<RushSessionSummary | null> {
    const current = this.state();
    if (!current) return null;
    this.timer?.tick();
    if (!current.cardsCompleted) {
      try { await this.repository.discardSession(current.id); } catch { this.error.set(true); }
      this.clear(); return null;
    }
    const finished = { ...current, endedAt: now.getTime(), activeSeconds: this.timer?.activeSeconds ?? current.activeSeconds };
    try {
      await this.repository.finishSession(finished); this.state.set(finished);
      const summary = toSummary(finished); this.summary.set(summary); await this.medals.refresh(now); return summary;
    } catch { this.error.set(true); return null; }
  }

  async checkpoint(): Promise<void> {
    const current = this.state(); if (!current || current.endedAt !== null) return;
    this.timer?.tick();
    const next = { ...current, activeSeconds: this.timer?.activeSeconds ?? current.activeSeconds };
    try { await this.repository.saveProgress(next); this.state.set(next); this.lastPersistedSeconds = next.activeSeconds; }
    catch { this.error.set(true); }
  }

  clear(): void {
    this.engine = null; this.timer = null; this.state.set(null); this.revealed.set(false); this.summary.set(null);
  }

  private async onTimer(): Promise<void> {
    if (!this.timer || !this.state() || this.state()!.endedAt !== null) return;
    const seconds = this.timer.tick(); this.activeSeconds.set(seconds);
    if (seconds - this.lastPersistedSeconds >= 15 && !this.saving()) {
      await this.checkpoint(); await this.medals.refresh();
    }
  }
}

function toSummary(session: RushSession): RushSessionSummary {
  return { module: session.module, activeSeconds: session.activeSeconds,
    cardsCompleted: session.cardsCompleted, uniqueContentsSeen: session.uniqueContentsSeen,
    cyclesCompleted: session.cyclesCompleted };
}

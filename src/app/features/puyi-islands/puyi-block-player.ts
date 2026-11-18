import { DestroyRef, Injectable, InjectionToken, computed, inject, signal } from '@angular/core';
import { ActiveClock } from './puyi-active-clock';
import { PUYI_CLIP_LEASE, PUYI_CLIP_RESOLVER, type PuyiPhrase } from './puyi-library-source';

export const PUYI_AUDIO = new InjectionToken<() => HTMLAudioElement>('Puyi audio element', {
  providedIn: 'root', factory: () => () => new Audio(),
});
export const PUYI_GAP_MS = 5000;
export const PUYI_IMITATION_SECONDS = [2, 3, 5, 8] as const;
export const PUYI_DEFAULT_IMITATION_SECONDS = 5;
export const PUYI_LISTEN_MINUTES = [5, 10, 15, 30] as const;
export const PUYI_SILENCE_SECONDS = [0, 2, 5, 8] as const;
export const PUYI_FINISH_GRACE_MS = 15000;
const LOAD_TIMEOUT_MS = 15000;
export type PuyiImitationSeconds = typeof PUYI_IMITATION_SECONDS[number];
export type PuyiListenMinutes = typeof PUYI_LISTEN_MINUTES[number];
export type PuyiSilenceSeconds = typeof PUYI_SILENCE_SECONDS[number];
export type PuyiBlockMode = 'block' | 'shadowing' | 'continuous';
type PlaybackMode = PuyiBlockMode | 'single';
type Clip = Pick<PuyiPhrase, 'id' | 'audioUrl' | 'audioKey' | 'audioBytes'>;
type Phase = 'idle' | 'loading' | 'playing' | 'gap' | 'paused' | 'complete' | 'blocked' | 'error';

@Injectable()
export class PuyiBlockPlayer {
  private readonly createAudio = inject(PUYI_AUDIO);
  private readonly resolveClip = inject(PUYI_CLIP_RESOLVER, { optional: true });
  private readonly leaseClip = inject(PUYI_CLIP_LEASE, { optional: true });
  private audio?: HTMLAudioElement;
  private download?: AbortController;
  private objectUrl?: string;
  private signedUntil?: number;
  private preferSigned = false;
  private clips: readonly Clip[] = [];
  private generation = 0;
  private playAttempt = 0;
  private timer?: ReturnType<typeof setTimeout>;
  private tick?: ReturnType<typeof setTimeout>;
  private session?: { clock: ActiveClock; budget: number };
  private loadDeadline = 0;
  private clipStarted = false;
  private gapMs = PUYI_GAP_MS;
  private gapDeadline = 0;
  private remainingGap: number | null = null;
  private readonly phaseState = signal<Phase>('idle');
  private readonly indexState = signal(0);
  private readonly idState = signal<string | null>(null);
  private readonly remainingState = signal(0);
  readonly phase = this.phaseState.asReadonly();
  readonly position = computed(() => this.indexState() + 1);
  readonly playingId = computed(() => this.phase() === 'playing' ? this.idState() : null);
  readonly selectedId = this.idState.asReadonly();
  readonly remainingMs = this.remainingState.asReadonly();
  readonly running = computed(() => ['loading', 'playing', 'gap'].includes(this.phase()));
  private readonly modeState = signal<PlaybackMode>('block');
  readonly mode = this.modeState.asReadonly();
  readonly canRepeat = computed(() => this.mode() === 'shadowing' && this.selectedId() !== null);

  constructor() { inject(DestroyRef).onDestroy(() => this.stop()); }

  start(
    clips: readonly Clip[],
    mode: Exclude<PlaybackMode, 'continuous'> = 'block',
    imitationSeconds: PuyiImitationSeconds = PUYI_DEFAULT_IMITATION_SECONDS,
  ): void {
    this.begin(clips, mode, mode === 'shadowing' ? imitationSeconds * 1000 : PUYI_GAP_MS);
  }

  startContinuous(clips: readonly Clip[], minutes: PuyiListenMinutes, silence: PuyiSilenceSeconds): void {
    this.begin(clips, 'continuous', silence * 1000, minutes * 60000);
  }

  private begin(clips: readonly Clip[], mode: PlaybackMode, silence: number, budget?: number): void {
    this.stop();
    if (!clips.length) return;
    this.clips = clips;
    this.modeState.set(mode);
    this.gapMs = silence;
    if (budget !== undefined) {
      this.session = { clock: new ActiveClock(), budget };
      this.session.clock.start();
    }
    this.loadClip();
  }

  pause(): void {
    if (!this.running() || this.enforceDeadline(this.canFinishClip())) return;
    this.remainingGap = this.phase() === 'gap' ? Math.max(0, this.gapDeadline - this.gapTime()) : null;
    this.clearGap();
    this.freezeClock();
    this.playAttempt++;
    this.download?.abort();
    this.download = undefined;
    this.phaseState.set('paused');
    this.audio?.pause();
  }

  resume(): void {
    if (this.phase() === 'paused') {
      this.session?.clock.start();
      if (this.remainingGap !== null) this.scheduleGap(this.remainingGap);
      else if (this.mediaIsReady()) this.requestPlay();
      else this.loadClip();
    } else if (this.phase() === 'blocked' || this.phase() === 'error') {
      this.session?.clock.start();
      if (this.phase() === 'blocked' && this.mediaIsReady() && (this.objectUrl || this.signedUntil)) this.requestPlay();
      else this.loadClip();
    }
  }

  repeat(): void {
    if (this.canRepeat()) this.loadClip();
  }

  stop(): void {
    this.resetMedia();
    this.session = undefined;
    this.remainingState.set(0);
    this.clips = [];
    this.indexState.set(0);
    this.idState.set(null);
    this.phaseState.set('idle');
    this.modeState.set('block');
  }

  /** Also called on focus and visibility changes after timers were throttled. */
  reconcile(): void {
    this.clearTick();
    const session = this.session;
    if (!session || !this.running()) return;
    const active = session.clock.elapsed();
    if (this.enforceDeadline(this.canFinishClip(), active)) return;
    const left = session.budget - active;
    const loadingLeft = this.phase() === 'loading' ? this.loadDeadline - active : Infinity;
    if (loadingLeft <= 0) {
      this.fail('error');
      return;
    }
    const delay = left > 0 ? left % 1000 || 1000 : PUYI_FINISH_GRACE_MS + left;
    const tick = setTimeout(() => {
      if (this.tick === tick) this.reconcile();
    }, Math.max(1, Math.min(delay, loadingLeft)));
    this.tick = tick;
  }

  private resetMedia(): void {
    this.generation++;
    this.playAttempt++;
    this.clearGap();
    this.clearTick();
    this.remainingGap = null;
    this.clipStarted = false;
    this.download?.abort();
    this.download = undefined;
    this.detach();
    this.signedUntil = undefined;
    if (this.objectUrl) {
      URL.revokeObjectURL(this.objectUrl);
      this.objectUrl = undefined;
    }
  }

  private loadClip(): void {
    if (this.enforceDeadline()) return;
    this.resetMedia();
    const generation = this.generation;
    const clip = this.clips[this.indexState()];
    const audio = this.audio ??= this.createAudio();
    audio.preload = 'auto';
    this.idState.set(clip.id);
    audio.onended = () => {
      if (generation !== this.generation || this.phase() !== 'playing' || !audio.ended) return;
      if (this.enforceDeadline()) return;
      if (this.position() < this.clips.length || this.mode() === 'shadowing' || this.session) {
        this.scheduleGap(this.gapMs);
      } else {
        this.complete();
      }
    };
    audio.onerror = () => {
      const phase = this.phase();
      if (generation === this.generation && audio.error
          && (phase === 'loading' || phase === 'playing' || (phase === 'paused' && this.remainingGap === null))) {
        if (phase === 'loading' && audio.error.code === 4 && this.trySignedClip()) return;
        this.fail('error');
      }
    };
    audio.onpause = () => {
      if (generation === this.generation && this.phase() === 'playing' && audio.paused && !audio.ended) this.pause();
    };
    if (clip.audioKey) this.loadPrivateClip(clip, generation);
    else {
      audio.src = clip.audioUrl;
      this.requestPlay();
    }
  }

  private loadPrivateClip(clip: Clip, generation: number): void {
    if (!this.resolveClip || !clip.audioKey || !clip.audioBytes) { this.fail('error'); return; }
    const controller = new AbortController();
    this.download = controller;
    this.loadDeadline = (this.session?.clock.elapsed() ?? 0) + LOAD_TIMEOUT_MS;
    this.phaseState.set('loading');
    this.reconcile();
    if (controller.signal.aborted) return;
    const source = this.preferSigned && this.leaseClip
      ? this.leaseClip(clip.audioKey, controller.signal).then(lease => ({ ...lease, blob: undefined }))
      : this.resolveClip(clip.audioKey, clip.audioBytes, controller.signal).then(blob => ({ blob, url: '', expiresAt: undefined }));
    void source.then(({ blob, url, expiresAt }) => {
      if (generation !== this.generation || controller.signal.aborted || this.enforceDeadline()) return;
      this.download = undefined;
      this.objectUrl = blob ? URL.createObjectURL(blob) : undefined;
      this.signedUntil = expiresAt;
      this.audio!.src = this.objectUrl ?? url;
      this.requestPlay();
    }).catch(() => {
      if (generation === this.generation && !controller.signal.aborted) this.fail('error');
    });
  }

  private mediaIsReady(): boolean {
    return !!this.audio?.src && (this.signedUntil === undefined || Date.now() < this.signedUntil);
  }

  private trySignedClip(): boolean {
    if (!this.objectUrl || !this.leaseClip || this.preferSigned || this.clipStarted) return false;
    this.preferSigned = true;
    this.loadClip();
    return true;
  }

  private requestPlay(): void {
    if (this.enforceDeadline(this.canFinishClip())) return;
    const audio = this.audio!;
    const attempt = ++this.playAttempt;
    this.loadDeadline = (this.session?.clock.elapsed() ?? 0) + LOAD_TIMEOUT_MS;
    this.phaseState.set('loading');
    this.reconcile();
    if (attempt !== this.playAttempt) return;
    void audio.play().then(() => {
      if (attempt !== this.playAttempt || this.enforceDeadline(this.canFinishClip())) return;
      this.clipStarted = true;
      this.phaseState.set('playing');
    }, (error: { name?: string }) => {
      if (attempt !== this.playAttempt) return;
      if (error?.name === 'NotSupportedError' && this.trySignedClip()) return;
      if (error?.name === 'NotAllowedError' && (this.objectUrl || this.signedUntil) && !this.enforceDeadline()) {
        // A second explicit tap can start the downloaded clip synchronously on browsers that require it.
        this.freezeClock();
        this.phaseState.set('blocked');
        return;
      }
      if (attempt !== this.playAttempt) return;
      this.fail(error?.name === 'NotAllowedError' ? 'blocked' : 'error');
    });
  }

  private scheduleGap(delay: number): void {
    if (this.enforceDeadline()) return;
    this.remainingGap = null;
    this.gapDeadline = this.gapTime() + delay;
    this.phaseState.set('gap');
    const timer = setTimeout(() => {
      if (timer !== this.timer || this.phase() !== 'gap') return;
      this.timer = undefined;
      if (this.enforceDeadline()) return;
      if (this.position() === this.clips.length && !this.session) {
        this.complete();
        return;
      }
      this.indexState.update(index => (index + 1) % this.clips.length);
      this.loadClip();
    }, delay);
    this.timer = timer;
    this.reconcile();
  }

  private complete(): void {
    this.freezeClock();
    this.resetMedia();
    this.idState.set(null);
    this.phaseState.set('complete');
  }

  private fail(phase: 'blocked' | 'error'): void {
    if (this.enforceDeadline()) return;
    this.freezeClock();
    this.resetMedia();
    this.phaseState.set(phase);
  }

  private gapTime(): number {
    return this.session?.clock.elapsed() ?? performance.now();
  }

  private canFinishClip(): boolean {
    return this.clipStarted && this.phase() !== 'gap' && !this.audio?.ended;
  }

  private enforceDeadline(allowFinishingClip = false, active = this.session?.clock.elapsed() ?? 0): boolean {
    const session = this.session;
    if (!session) return false;
    const left = session.budget - active;
    this.remainingState.set(Math.max(0, left));
    if (left > 0 || (allowFinishingClip && left > -PUYI_FINISH_GRACE_MS)) return false;
    this.complete();
    return true;
  }

  private freezeClock(): void {
    const session = this.session;
    if (session) {
      session.clock.pause();
      this.remainingState.set(Math.max(0, session.budget - session.clock.elapsed()));
    }
    this.clearTick();
  }

  private clearGap(): void {
    clearTimeout(this.timer);
    this.timer = undefined;
  }

  private clearTick(): void {
    clearTimeout(this.tick);
    this.tick = undefined;
  }

  private detach(): void {
    const audio = this.audio;
    if (!audio) return;
    audio.onended = null;
    audio.onerror = null;
    audio.onpause = null;
    audio.pause();
    audio.removeAttribute('src');
    audio.load();
  }
}

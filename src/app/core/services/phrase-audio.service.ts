import { DOCUMENT } from '@angular/common';
import { DestroyRef, Injectable, InjectionToken, inject, signal } from '@angular/core';
import { CatalogPhrase } from '../models/phrase-island.model';

export const PHRASE_AUDIO_FACTORY = new InjectionToken<() => HTMLAudioElement>('Phrase audio factory', {
  providedIn: 'root', factory: () => () => new Audio(),
});

/** Page-scoped playback only: no queue, persistence, vocabulary manifest or scheduler. */
@Injectable()
export class PhraseAudioService {
  private readonly document = inject(DOCUMENT);
  private readonly factory = inject(PHRASE_AUDIO_FACTORY);
  private audio: HTMLAudioElement | null = null;
  private generation = 0;
  readonly currentId = signal<string | null>(null);
  readonly state = signal<'idle' | 'loading' | 'playing' | 'paused' | 'ready' | 'blocked' | 'error'>('idle');
  private ended?: () => void;
  private rate = 1;
  constructor() { inject(DestroyRef).onDestroy(() => this.stop()); }
  resolve(phrase: CatalogPhrase): string { return new URL(phrase.audio.path, this.document.baseURI).href; }
  async play(phrase: CatalogPhrase, options: { rate?: number; ended?: () => void } = {}): Promise<void> {
    this.stop(); const generation = this.generation;
    this.ended = options.ended; this.rate = options.rate ?? 1;
    this.currentId.set(phrase.id); this.state.set('loading');
    try {
      const audio = this.factory(); this.audio = audio;
      audio.src = this.resolve(phrase); audio.preload = 'auto';
      audio.playbackRate = this.rate;
      audio.onplay = () => { if (generation === this.generation) this.state.set('loading'); };
      audio.onplaying = () => { if (generation === this.generation) this.state.set('playing'); };
      audio.onpause = () => { if (generation === this.generation && !audio.ended) this.state.set('paused'); };
      audio.onended = () => { if (generation === this.generation) { this.state.set('ready'); this.ended?.(); } };
      audio.onerror = () => { if (generation === this.generation) this.state.set('error'); };
      await audio.play();
      if (generation === this.generation && this.state() === 'loading') this.state.set('playing');
    } catch (error) {
      if (generation !== this.generation) return;
      if (this.state() === 'paused' && error && typeof error === 'object' && 'name' in error && error.name === 'AbortError') return;
      this.state.set(error && typeof error === 'object' && 'name' in error && error.name === 'NotAllowedError' ? 'blocked' : 'error');
    }
  }
  setRate(rate: number): void { this.rate = rate; if (this.audio) this.audio.playbackRate = rate; }
  pause(): void { this.audio?.pause(); this.state.set('paused'); }
  async resume(): Promise<void> {
    const generation = this.generation;
    try { await this.audio?.play(); if (generation === this.generation && this.audio) this.state.set('playing'); }
    catch (error) { if (generation === this.generation) this.state.set(error instanceof DOMException && error.name === 'NotAllowedError' ? 'blocked' : 'error'); }
  }
  stop(): void {
    this.generation++;
    this.ended = undefined;
    if (this.audio) {
      this.audio.onended = null; this.audio.onerror = null; this.audio.onplay = null; this.audio.onplaying = null; this.audio.onpause = null;
      this.audio.pause(); this.audio.removeAttribute('src'); this.audio.load(); this.audio = null;
    }
    this.currentId.set(null); this.state.set('idle');
  }
}

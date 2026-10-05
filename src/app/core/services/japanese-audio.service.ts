import {DOCUMENT} from '@angular/common';
import {inject, Injectable, InjectionToken, signal} from '@angular/core';
import {VOCABULARY_AUDIO_MANIFEST} from '../../data/vocabulary-audio-manifest.generated';

export const JAPANESE_AUDIO_FACTORY = new InjectionToken<() => HTMLAudioElement>('Japanese audio factory', {
  providedIn:'root', factory:() => () => new Audio(),
});
export type AudioPlaybackResult = 'played' | 'blocked' | 'error' | 'stopped';

@Injectable({providedIn:'root'})
export class JapaneseAudioService {
  private readonly document = inject(DOCUMENT);
  private readonly createAudio = inject(JAPANESE_AUDIO_FACTORY);
  private audio: HTMLAudioElement | null = null;
  private generation = 0;
  private lastId: string | null = null;
  readonly state = signal<'idle'|'loading'|'playing'|'ready'|'blocked'|'error'>('idle');
  hasAudio(id: string): boolean { return Object.hasOwn(VOCABULARY_AUDIO_MANIFEST,id); }
  resolve(id: string): string | null {
    const path = this.hasAudio(id) ? VOCABULARY_AUDIO_MANIFEST[id] : null;
    return path ? new URL(path,this.document.baseURI).href : null;
  }
  async play(id: string): Promise<AudioPlaybackResult> {
    this.stop(); this.lastId = id;
    const token = this.generation, url = this.resolve(id);
    if (!url) {this.state.set('error'); return 'error';}
    this.state.set('loading');
    try {
      const audio = this.createAudio(); this.audio = audio;
      audio.preload = 'auto'; audio.src = url;
      audio.onended = () => {if(token === this.generation && this.state() !== 'error') this.state.set('ready');};
      audio.onerror = () => {if(token === this.generation) this.state.set('error');};
      await audio.play();
      if(token !== this.generation) return 'stopped';
      if(this.state() === 'error') return 'error';
      this.state.set('playing'); return 'played';
    } catch(error) {
      if(token !== this.generation) return 'stopped';
      if(error !== null && typeof error === 'object' && 'name' in error && error.name === 'NotAllowedError') {this.state.set('blocked'); return 'blocked';}
      this.state.set('error'); return 'error';
    }
  }
  repeat(): Promise<AudioPlaybackResult> {return this.lastId ? this.play(this.lastId) : Promise.resolve('stopped');}
  stop(): void {
    this.generation++;
    if(this.audio) {this.audio.onended = null; this.audio.onerror = null; this.audio.pause(); this.audio.removeAttribute('src'); this.audio.load(); this.audio = null;}
    this.state.set('idle');
  }
}

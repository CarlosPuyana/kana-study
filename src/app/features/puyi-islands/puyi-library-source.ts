import { InjectionToken, type Signal } from '@angular/core';
import type { AppLanguage } from '../../core/models/settings.model';
import type { FuriganaSegment } from '../../core/models/vocabulary.model';

export type PuyiText = Readonly<Record<AppLanguage, string>>;

export interface PuyiPhrase {
  readonly id: string;
  readonly japanese: string;
  readonly segments: readonly FuriganaSegment[];
  readonly translation: PuyiText;
  readonly audioUrl: string;
  readonly audioKey?: string;
  readonly audioBytes?: number;
  readonly answers?: readonly string[];
}

export interface PuyiBlock {
  readonly id: string;
  readonly name: PuyiText;
  readonly phrases: readonly PuyiPhrase[];
  readonly questions: readonly PuyiPhrase[];
  readonly phraseCount?: number;
  readonly loaded?: boolean;
}

export interface PuyiIsland {
  readonly id: string;
  readonly title: PuyiText;
  readonly japanese: string;
  readonly description: PuyiText;
  readonly blocks: readonly PuyiBlock[];
}

export interface PuyiLibrarySource {
  readonly islands: Signal<readonly PuyiIsland[]>;
  readonly previewOnly?: boolean;
  readonly accessRevision: Signal<number>;
  readonly libraryPath?: string;
  readonly status?: Signal<PuyiLibraryStatus>;
  openLibrary?(): void;
  openIsland?(id: string): void;
  loadBlock?(id: string): Promise<PuyiBlock | undefined>;
  refresh?(): void;
}

export type PuyiLibraryStatus = 'loading' | 'ready' | 'login' | 'denied' | 'unavailable';

// Each entry explicitly supplies its source. The production route has no demo fallback.
export const PUYI_LIBRARY_SOURCE = new InjectionToken<PuyiLibrarySource>('Puyi library source');
export type PuyiClipResolver = (key: string, bytes: number, signal: AbortSignal) => Promise<Blob>;
export const PUYI_CLIP_RESOLVER = new InjectionToken<PuyiClipResolver>('Puyi authenticated clip resolver');
export type PuyiClipLease = (key: string, signal: AbortSignal) => Promise<{ url: string; expiresAt: number }>;
export const PUYI_CLIP_LEASE = new InjectionToken<PuyiClipLease>('Puyi signed clip fallback');

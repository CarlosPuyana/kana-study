import { DOCUMENT, NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, afterRenderEffect, computed, effect, inject, signal, untracked, viewChild } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink, RouterOutlet } from '@angular/router';
import { map } from 'rxjs';
import { PhraseAuthoringPreferences } from '../../core/services/phrase-authoring-preferences.service';
import { TranslationService } from '../../core/services/translation.service';
import { FuriganaText } from '../../shared/components/furigana-text/furigana-text';
import {
  PUYI_DEFAULT_IMITATION_SECONDS, PUYI_IMITATION_SECONDS, PUYI_LISTEN_MINUTES, PUYI_SILENCE_SECONDS, PuyiBlockPlayer,
  type PuyiBlockMode, type PuyiImitationSeconds, type PuyiListenMinutes, type PuyiSilenceSeconds,
} from './puyi-block-player';
import { puyiCopy } from './puyi-copy';
import { PuyiAccessNote } from './puyi-access-note';
import { PUYI_LIBRARY_SOURCE, type PuyiBlock, type PuyiPhrase, type PuyiText } from './puyi-library-source';

@Component({
  selector: 'app-puyi-demo',
  imports: [RouterLink, RouterOutlet],
  template: `
    <header class="topbar">
      <a routerLink="/" class="brand">Islas Puyi</a>
      <div class="preferences">
        <select [attr.aria-label]="copy.t('puyi.language')" [value]="preferences.language()" (change)="language($event)">
          <option value="es">ES</option><option value="en">EN</option><option value="ca">CA</option>
        </select>
        <button type="button" class="theme" [attr.aria-label]="copy.t(preferences.theme() === 'dark' ? 'puyi.light' : 'puyi.dark')"
          (click)="preferences.theme.set(preferences.theme() === 'dark' ? 'light' : 'dark')">
          <span aria-hidden="true">{{ preferences.theme() === 'dark' ? '☀' : '☾' }}</span>
        </button>
      </div>
    </header>
    <router-outlet />
  `,
  styleUrl: './puyi-library.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PuyiDemoShell {
  readonly copy = inject(TranslationService);
  readonly preferences = inject(PhraseAuthoringPreferences);
  private readonly document = inject(DOCUMENT);
  constructor() {
    this.copy.useStudyCopy(puyiCopy);
    effect(() => {
      this.document.documentElement.dataset['theme'] = this.preferences.theme();
      this.document.documentElement.lang = this.preferences.language();
      this.document.title = this.copy.t('puyi.library') + ' · Islas Puyi';
    });
  }

  language(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    if (value === 'es' || value === 'en' || value === 'ca') this.preferences.setLanguage(value);
  }
}

@Component({
  selector: 'app-puyi-library-page',
  imports: [RouterLink, PuyiAccessNote],
  template: `
    <main class="library">
      @if (source.libraryPath) { <a class="brand" routerLink="/anki">← {{ copy.t('anki.title') }}</a> }
      <header class="intro">
        <p class="quiet">{{ copy.t(source.libraryPath ? 'puyiIslands.title' : 'puyi.demo') }}</p>
        <h1>{{ copy.t('puyi.library') }}</h1>
        @if (!source.status || source.status() === 'ready') { <p>{{ copy.t('puyi.libraryHint') }}</p> }
      </header>
      @if (source.status && source.status() !== 'ready') {
        <app-puyi-access-note />
      } @else {
      <div class="island-grid">
        @for (island of source.islands(); track island.id) {
          <a class="island-card" [routerLink]="[(source.libraryPath || '') + '/island', island.id]">
            <div class="island-cover"><span lang="ja">{{ island.japanese }}</span></div>
            <div class="island-card-body">
              <h2>{{ text(island.title) }}</h2>
              <p>{{ text(island.description) }}</p>
              <footer><span>{{ copy.t('puyi.blockCount', {count: island.blocks.length}) }}</span><span aria-hidden="true">↗</span></footer>
            </div>
          </a>
        } @empty {
          <p>{{ copy.t('puyi.empty') }}</p>
        }
      </div>
      <a class="credits" href="audio/phrase-islands/v1/ACML-1.0.md">{{ copy.t('puyi.audioCredits') }}</a>
      }
    </main>
  `,
  styleUrl: './puyi-library.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PuyiLibraryPage {
  readonly copy = inject(TranslationService);
  readonly source = inject(PUYI_LIBRARY_SOURCE);
  constructor() { this.source.openLibrary?.(); }
  text(value: PuyiText): string { return value[this.copy.language()]; }
}

@Component({
  selector: 'app-puyi-island-page',
  imports: [RouterLink, FuriganaText, NgTemplateOutlet, PuyiAccessNote],
  providers: [PuyiBlockPlayer],
  templateUrl: './puyi-island.page.html',
  styleUrl: './puyi-islands.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(window:pagehide)': 'player.stop()',
    '(window:pageshow)': 'player.reconcile()',
    '(window:focus)': 'player.reconcile()',
    '(document:visibilitychange)': 'player.reconcile()',
  },
})
export class PuyiIslandPage {
  readonly copy = inject(TranslationService);
  readonly player = inject(PuyiBlockPlayer);
  readonly practiceMode = signal<PuyiBlockMode>('block');
  readonly pauseOptions = PUYI_IMITATION_SECONDS;
  readonly imitationSeconds = signal<PuyiImitationSeconds>(PUYI_DEFAULT_IMITATION_SECONDS);
  readonly durationOptions = PUYI_LISTEN_MINUTES;
  readonly silenceOptions = PUYI_SILENCE_SECONDS;
  readonly minutes = signal<PuyiListenMinutes>(5);
  readonly silenceSeconds = signal<PuyiSilenceSeconds>(5);
  private readonly phraseList = viewChild<ElementRef<HTMLOListElement>>('phraseList');
  private readonly transport = viewChild<ElementRef<HTMLElement>>('transport');
  readonly source = inject(PUYI_LIBRARY_SOURCE);
  readonly previewOnly = this.source.previewOnly === true;
  private readonly route = inject(ActivatedRoute);
  private readonly id = toSignal(this.route.paramMap.pipe(map(params => params.get('id'))));
  readonly island = computed(() => this.source.islands().find(island => island.id === this.id()));
  private readonly selectedBlock = signal<string | null>(null);
  private action = 0;
  private pendingBlock: string | null = null;
  readonly block = computed(() => {
    const blocks = this.island()?.blocks ?? [];
    return blocks.find(block => block.id === this.selectedBlock()) ?? blocks[0];
  });
  readonly total = computed(() => this.player.mode() === 'single' ? 1 :
    (this.block()?.phraseCount ?? this.block()?.phrases.length ?? 0));
  readonly current = computed(() => this.player.phase() === 'idle' ? 0 : this.player.position());
  readonly activeId = computed(() => this.player.mode() === 'shadowing' || this.player.mode() === 'continuous'
    ? this.player.selectedId() : this.player.playingId());
  readonly timedTransport = computed(() => this.practiceMode() === 'continuous' && this.player.mode() !== 'single');
  readonly durationSeconds = computed(() => this.minutes() * 60);
  readonly remainingSeconds = computed(() => this.player.mode() === 'continuous'
    ? Math.ceil(this.player.remainingMs() / 1000) : this.durationSeconds());
  readonly countdown = computed(() => {
    const seconds = this.remainingSeconds();
    return [Math.floor(seconds / 60), seconds % 60].map(value => String(value).padStart(2, '0')).join(':');
  });
  readonly phaseLabel = computed(() => {
    const phase = this.player.phase();
    if (this.player.mode() === 'shadowing') {
      if (phase === 'playing') return 'puyi.shadowing.listen';
      if (phase === 'gap') return 'puyi.shadowing.imitate';
      if (phase === 'complete') return 'puyi.shadowing.complete';
    }
    if (this.player.mode() === 'continuous') {
      if (phase === 'complete') return 'puyi.continuous.complete';
      if (phase === 'playing' && this.remainingSeconds() === 0) return 'puyi.continuous.finishing';
    }
    return 'puyi.phase.' + phase;
  });
  readonly primaryLabel = computed(() => {
    if (this.player.running()) return 'puyi.pause';
    if (this.player.phase() === 'paused') return 'puyi.resume';
    if (this.player.phase() === 'error' || this.player.phase() === 'blocked') return 'puyi.retry';
    if (this.practiceMode() === 'shadowing') return 'puyi.shadowing.start';
    if (this.practiceMode() === 'continuous') return 'puyi.playShort';
    return 'puyi.play';
  });

  constructor() {
    inject(DestroyRef).onDestroy(() => { this.action++; });
    effect(() => {
      const id = this.id();
      if (id) untracked(() => this.source.openIsland?.(id));
    });
    effect(() => {
      this.id();
      this.source.accessRevision();
      this.action++;
      this.pendingBlock = null;
      this.player.stop();
      this.selectedBlock.set(null);
    });
    afterRenderEffect(() => {
      if (this.practiceMode() === 'block' || !this.activeId()) return;
      const active = this.phraseList()?.nativeElement.querySelector('li.active');
      const transport = this.transport()?.nativeElement;
      if (!active || !transport) return;
      const { top, bottom } = active.getBoundingClientRect();
      if (top < 12 || bottom > transport.getBoundingClientRect().top - 12) {
        active.scrollIntoView({ block: 'center', behavior: 'instant' });
      }
    });
  }

  text(value: PuyiText): string { return value[this.copy.language()]; }

  activateBlock(block: PuyiBlock): void {
    const same = block.id === this.block()?.id;
    if (!same) this.selectedBlock.set(block.id);
    if (block.loaded === false && this.source.loadBlock) {
      if (this.pendingBlock === block.id) return;
      this.player.stop();
      const action = ++this.action;
      this.pendingBlock = block.id;
      void this.source.loadBlock(block.id).then(loaded => {
        if (action !== this.action) return;
        this.pendingBlock = null;
        if (loaded?.phrases.length && this.block()?.id === loaded.id && this.source.status?.() === 'ready') {
          this.playBlock(loaded);
        }
      });
      return;
    }
    this.action++;
    this.pendingBlock = null;
    if (this.previewOnly || !block.phrases.length) {
      if (!same) this.player.stop();
      return;
    }
    if (!same || this.player.mode() === 'single' || this.player.phase() === 'idle' || this.player.phase() === 'complete') {
      this.playBlock(block);
    } else if (!this.player.running()) {
      this.player.resume();
    }
  }

  selectMode(mode: PuyiBlockMode): void {
    if (mode === this.practiceMode()) return;
    this.action++;
    this.pendingBlock = null;
    this.player.stop();
    this.practiceMode.set(mode);
  }

  selectPause(event: Event): void {
    const seconds = Number((event.target as HTMLSelectElement).value);
    const option = this.pauseOptions.find(value => value === seconds);
    if (option !== undefined) this.imitationSeconds.set(option);
  }

  selectDuration(event: Event): void {
    const minutes = Number((event.target as HTMLSelectElement).value);
    const option = this.durationOptions.find(value => value === minutes);
    if (option === undefined) return;
    this.minutes.set(option);
    if (this.player.mode() === 'continuous' && this.player.phase() === 'complete') this.player.stop();
  }

  selectSilence(event: Event): void {
    const seconds = Number((event.target as HTMLSelectElement).value);
    const option = this.silenceOptions.find(value => value === seconds);
    if (option !== undefined) this.silenceSeconds.set(option);
  }

  listen(phrase: PuyiPhrase): void {
    if (this.player.selectedId() === phrase.id && this.player.phase() !== 'gap') {
      if (this.player.running()) this.player.pause();
      else this.player.resume();
      return;
    }
    this.player.start([phrase], 'single');
  }

  toggle(block: PuyiBlock): void {
    const phase = this.player.phase();
    if (this.player.running()) this.player.pause();
    else if (phase === 'idle' || phase === 'complete') this.playBlock(block);
    else this.player.resume();
  }

  private playBlock(block: PuyiBlock): void {
    const mode = this.practiceMode();
    if (mode === 'continuous') this.player.startContinuous(block.phrases, this.minutes(), this.silenceSeconds());
    else this.player.start(block.phrases, mode, this.imitationSeconds());
  }
}

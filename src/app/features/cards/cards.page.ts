import { Location } from '@angular/common';
import { afterRenderEffect, ChangeDetectionStrategy, Component, computed, ElementRef, inject, signal, viewChild } from '@angular/core';
import { Router } from '@angular/router';
import { KanaType, KanaVariant } from '../../core/models/kana.model';
import { TranslationService } from '../../core/services/translation.service';
import { ALL_KANA } from '../../data/kana';
import { KanaCard } from '../../shared/components/kana-card/kana-card';

const TYPES: readonly KanaType[] = ['hiragana', 'katakana'];
const VARIANTS: readonly KanaVariant[] = ['basic', 'dakuten', 'handakuten', 'combination'];

@Component({
  selector: 'app-cards-page',
  imports: [KanaCard],
  templateUrl: './cards.page.html',
  styleUrl: './cards.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(keydown.escape)': 'closeSearch()' },
})
export class CardsPage {
  readonly i18n = inject(TranslationService);
  private readonly location = inject(Location);
  private readonly router = inject(Router);
  private readonly searchInput = viewChild<ElementRef<HTMLInputElement>>('searchInput');
  private readonly searchButton = viewChild<ElementRef<HTMLButtonElement>>('searchButton');
  private restoreSearchFocus = false;

  readonly mode = signal<'all' | 'category'>('all');
  readonly searching = signal(false);
  readonly query = signal('');
  readonly cards = computed(() => {
    const query = this.query().trim().toLowerCase();
    return ALL_KANA.filter(kana => [kana.character, kana.romaji, kana.type,
      this.i18n.t('content.' + kana.type)].some(value => value.toLowerCase().includes(query)));
  });
  readonly groups = computed(() => TYPES.map(type => ({
    type,
    categories: VARIANTS.map(variant => ({
      variant,
      cards: this.cards().filter(kana => kana.type === type && kana.variant === variant),
    })).filter(category => category.cards.length > 0),
  })).filter(group => group.categories.length > 0));

  constructor() {
    afterRenderEffect(() => {
      const input = this.searchInput();
      const button = this.searchButton();
      if (input) input.nativeElement.focus();
      else if (button && this.restoreSearchFocus) {
        button.nativeElement.focus();
        this.restoreSearchFocus = false;
      }
    });
  }

  closeSearch(): void {
    if (!this.searching()) return;
    this.restoreSearchFocus = true;
    this.query.set('');
    this.searching.set(false);
  }

  back(): void {
    // Direct links have no previous Angular route; keep them inside the app.
    const state = this.location.getState() as { navigationId?: number } | null;
    if ((state?.navigationId ?? 0) > 1) this.location.back();
    else void this.router.navigateByUrl('/');
  }
}

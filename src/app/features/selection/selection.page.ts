import { Location } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ALL_KANA } from '../../data/kana';
import { KanaType, KanaVariant } from '../../core/models/kana.model';
import { QUESTION_TYPES, QuestionType } from '../../core/models/progress.model';
import { LearningSelection } from '../../core/models/settings.model';
import {
  countAvailableExercises,
  countSelectedCategories,
  isLearningSelectionValid,
  KANA_TYPES,
  KANA_VARIANTS,
} from '../../core/services/learning-selection';
import { SettingsService } from '../../core/services/settings.service';
import { TranslationService } from '../../core/services/translation.service';

interface QuestionOption {
  readonly type: QuestionType;
  readonly available: boolean;
  readonly from: string;
  readonly audioSource?: boolean;
  readonly to: string;
  readonly descriptionKey: string;
}

@Component({
  selector: 'app-selection-page',
  templateUrl: './selection.page.html',
  styleUrl: './selection.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SelectionPage {
  readonly settings = inject(SettingsService);
  readonly i18n = inject(TranslationService);
  private readonly location = inject(Location);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly types = KANA_TYPES;
  readonly variants = KANA_VARIANTS;
  readonly totalQuestionTypes = QUESTION_TYPES.length;
  readonly draft = signal<LearningSelection>(structuredClone(this.settings.selection()));
  readonly selectedCategoryCount = computed(() => countSelectedCategories(this.draft()));
  readonly selectedQuestionCount = computed(() => this.draft().questionTypes.length);
  readonly availableExercises = computed(() => countAvailableExercises(this.draft(), ALL_KANA));
  readonly valid = computed(() => isLearningSelectionValid(this.draft()));
  readonly allCategoriesSelected = computed(() => this.selectedCategoryCount() === 8);

  readonly questionOptions: readonly QuestionOption[] = [
    { type: 'kana-to-romaji', available: true, from: 'ほ', to: 'ho', descriptionKey: 'selection.recognizeReading' },
    { type: 'romaji-to-kana', available: true, from: 'ho', to: 'ほ', descriptionKey: 'selection.recognizeCharacter' },
    { type: 'audio-to-romaji', available: false, from: '', audioSource: true, to: 'ho', descriptionKey: 'common.comingSoon' },
    { type: 'audio-to-kana', available: false, from: '', audioSource: true, to: 'ほ', descriptionKey: 'common.comingSoon' },
  ];

  constructor() {
    const kana = this.route.snapshot.queryParamMap.get('kana');
    if (this.route.snapshot.queryParamMap.get('from') !== 'grammar' || (kana !== 'hiragana' && kana !== 'katakana')) return;
    this.updateDraft(selection => {
      for (const type of this.types) for (const variant of this.variants) selection.categories[type][variant] = type === kana;
      selection.questionTypes = ['kana-to-romaji', 'romaji-to-kana'];
    });
  }

  categoryCount(type: KanaType, variant: KanaVariant): number {
    return ALL_KANA.filter(kana => kana.type === type && kana.variant === variant).length;
  }

  isCategorySelected(type: KanaType, variant: KanaVariant): boolean {
    return this.draft().categories[type][variant];
  }

  isTypeFullySelected(type: KanaType): boolean {
    return this.variants.every(variant => this.isCategorySelected(type, variant));
  }

  toggleCategory(type: KanaType, variant: KanaVariant): void {
    this.updateDraft(selection => {
      selection.categories[type][variant] = !selection.categories[type][variant];
    });
  }

  toggleType(type: KanaType): void {
    const selected = this.isTypeFullySelected(type);
    this.updateDraft(selection => {
      for (const variant of this.variants) selection.categories[type][variant] = !selected;
    });
  }

  toggleAllCategories(): void {
    const selected = this.allCategoriesSelected();
    this.updateDraft(selection => {
      for (const type of this.types) {
        for (const variant of this.variants) selection.categories[type][variant] = !selected;
      }
    });
  }

  toggleQuestion(type: QuestionType): void {
    if (type !== 'kana-to-romaji' && type !== 'romaji-to-kana') return;
    this.updateDraft(selection => {
      selection.questionTypes = selection.questionTypes.includes(type)
        ? selection.questionTypes.filter(item => item !== type)
        : [...selection.questionTypes, type];
    });
  }

  save(): void {
    if (!this.valid()) return;
    this.settings.saveLearningSelection(this.draft());
    void this.router.navigateByUrl('/');
  }

  back(): void {
    const state = this.location.getState() as { navigationId?: number } | null;
    if ((state?.navigationId ?? 0) > 1) this.location.back();
    else void this.router.navigateByUrl(this.route.snapshot.queryParamMap.get('from') === 'grammar' ? '/grammar/n5/00' : '/');
  }

  private updateDraft(updater: (selection: LearningSelection) => void): void {
    this.draft.update(current => {
      const next = structuredClone(current);
      updater(next);
      return next;
    });
  }
}

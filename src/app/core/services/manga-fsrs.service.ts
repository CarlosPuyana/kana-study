import { computed, inject, Injectable } from '@angular/core';
import { MANGA_FSRS_SETTINGS_KEY } from '../models/manga-fsrs.model';
import { StorageService, workspaceStorageSignal } from './storage.service';
import { MangaReviewHistoryService } from './manga-review-history.service';
import { MangaStudySavedRepository } from './manga-study-saved.repository';
import { TranslationService } from './translation.service';
import { replayMangaFsrs } from './manga-fsrs-scheduler';

@Injectable({providedIn:'root'})
export class MangaFsrsService {
  private readonly storage = inject(StorageService);
  private readonly preference = workspaceStorageSignal(() => this.storage.get<{enabled?:boolean}|null>(MANGA_FSRS_SETTINGS_KEY, {})?.enabled === true);
  private readonly saved = inject(MangaStudySavedRepository);
  private readonly history = inject(MangaReviewHistoryService);
  private readonly i18n = inject(TranslationService);
  readonly enabled = this.preference.asReadonly();
  readonly cards = computed(() => replayMangaFsrs(this.saved.items(), this.history.events(), this.i18n.language()));
  readonly ineligible = computed(() => this.saved.items().length - this.cards().length);
  setEnabled(enabled: boolean): void {
    this.storage.set(MANGA_FSRS_SETTINGS_KEY, {enabled}, {strict:true});
    this.preference.set(enabled);
  }
}

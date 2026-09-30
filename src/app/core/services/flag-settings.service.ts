import { Injectable, inject, signal } from '@angular/core';
import { FlagQuestionType, FlagRegion } from '../models/country.model';
import { FlagSelection } from '../models/flag-study.model';
import { DEFAULT_FLAG_SELECTION } from './flag-selection';
import { StorageService } from './storage.service';

const FLAG_SELECTION_KEY = 'kana-study.flags-selection.v1';

@Injectable({ providedIn: 'root' })
export class FlagSettingsService {
  private readonly storage = inject(StorageService);
  private readonly state = signal<FlagSelection>(
    this.storage.get<FlagSelection>(FLAG_SELECTION_KEY, DEFAULT_FLAG_SELECTION),
  );
  readonly selection = this.state.asReadonly();

  save(selection: FlagSelection): void {
    this.state.set(selection);
    this.storage.set(FLAG_SELECTION_KEY, selection);
  }

  setRegion(region: FlagRegion, enabled: boolean): void {
    this.save({ ...this.state(), regions: { ...this.state().regions, [region]: enabled } });
  }

  setQuestionTypes(questionTypes: readonly FlagQuestionType[]): void {
    this.save({ ...this.state(), questionTypes });
  }
}

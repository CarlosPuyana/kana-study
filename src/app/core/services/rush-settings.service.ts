import { inject, Injectable } from '@angular/core';
import { RushConfiguration, RushModule } from '../models/rush.model';
import { StorageService } from './storage.service';

const keys: Record<RushModule, string> = {
  kana: 'kana-study.rush.kana-settings.v1',
  kanji: 'kana-study.rush.kanji-settings.v1',
  vocabulary: 'kana-study.rush.vocabulary-settings.v1',
};

@Injectable({ providedIn: 'root' })
export class RushSettingsService {
  private readonly storage = inject(StorageService);

  getOrInitialize(module: RushModule, normalSelection: RushConfiguration): RushConfiguration {
    const stored = this.storage.get<unknown>(keys[module], null);
    if (isConfiguration(stored)) return clone(stored);
    this.save(module, normalSelection);
    return clone(normalSelection);
  }

  save(module: RushModule, value: RushConfiguration): void {
    this.storage.set(keys[module], clone(value));
  }
}

function isConfiguration(value: unknown): value is RushConfiguration {
  if (!value || typeof value !== 'object') return false;
  const record = value as Record<string, unknown>;
  return Array.isArray(record['selectedContentIds']) && Array.isArray(record['questionTypes']);
}

function clone(value: RushConfiguration): RushConfiguration {
  return { selectedContentIds: [...value.selectedContentIds], questionTypes: [...value.questionTypes] };
}

import { ChangeDetectionStrategy, Component, effect, inject, input, output, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { RushConfiguration } from '../../../core/models/rush.model';
import { TranslationService } from '../../../core/services/translation.service';

export interface RushConfigOption { readonly id: string; readonly labelKey: string; }

@Component({
  selector: 'app-rush-config-dialog', imports: [RouterLink],
  templateUrl: './rush-config-dialog.html', styleUrl: './rush-config-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(document:keydown.escape)': 'closed.emit()' },
})
export class RushConfigDialog {
  readonly i18n = inject(TranslationService);
  readonly module = input.required<'kana' | 'kanji' | 'vocabulary'>();
  readonly initial = input.required<RushConfiguration>();
  readonly contentOptions = input.required<readonly RushConfigOption[]>();
  readonly questionOptions = input.required<readonly RushConfigOption[]>();
  readonly countUnits = input.required<(value: RushConfiguration) => number>();
  readonly closed = output<void>();
  readonly started = output<RushConfiguration>();
  readonly value = signal<RushConfiguration>({ selectedContentIds: [], questionTypes: [] });

  constructor() { effect(() => this.value.set({ selectedContentIds: [...this.initial().selectedContentIds], questionTypes: [...this.initial().questionTypes] })); }

  toggleContent(id: string): void { this.toggle('selectedContentIds', id); }
  toggleType(id: string): void { this.toggle('questionTypes', id); }
  count(): number { return this.countUnits()(this.value()); }
  valid(): boolean { return this.value().selectedContentIds.length > 0 && this.value().questionTypes.length > 0 && this.count() > 0; }
  start(): void { if (this.valid()) this.started.emit(this.value()); }
  selectAll(): void { this.value.update(value => ({ ...value, selectedContentIds: this.contentOptions().map(item => item.id) })); }
  clear(): void { this.value.update(value => ({ ...value, selectedContentIds: [] })); }

  private toggle(key: keyof RushConfiguration, id: string): void {
    this.value.update(value => {
      const current = value[key];
      return { ...value, [key]: current.includes(id) ? current.filter(item => item !== id) : [...current, id] };
    });
  }
}

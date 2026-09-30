import { Location } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { COUNTRIES } from '../../data/countries.generated';
import { Country, FLAG_QUESTION_TYPES, FlagQuestionType, FlagRegion } from '../../core/models/country.model';
import { FlagProgressService } from '../../core/services/flag-progress.service';
import { isCapitalQuestion } from '../../core/services/flag-selection';
import { TranslationService } from '../../core/services/translation.service';
import { CountryFlag } from '../../shared/components/country-flag/country-flag';

@Component({ selector: 'app-flag-countries-page', imports: [CountryFlag], templateUrl: './flag-countries.page.html', styleUrl: './flag-countries.page.scss', changeDetection: ChangeDetectionStrategy.OnPush, host: { '(document:keydown.escape)': 'closeOverlay()' } })
export class FlagCountriesPage {
  readonly i18n = inject(TranslationService);
  readonly progress = inject(FlagProgressService);
  readonly regions: readonly FlagRegion[] = ['europe','asia','africa','north-america','south-america','oceania'];
  readonly searching = signal(false); readonly query = signal(''); readonly view = signal<'all'|'region'>('all'); readonly selected = signal<Country|null>(null);
  private readonly location = inject(Location);
  readonly filtered = computed(() => {
    const query = this.normalize(this.query()); const language = this.i18n.language();
    return COUNTRIES.filter(country => !query || [country.iso2,country.iso3,...Object.values(country.names),...country.capitals.flatMap(capital => Object.values(capital))].some(value => this.normalize(value).includes(query)))
      .sort((a,b) => a.names[language].localeCompare(b.names[language]));
  });
  back(): void { this.location.back(); }
  setQuery(event: Event): void { this.query.set((event.target as HTMLInputElement).value); }
  closeOverlay(): void { if (this.selected()) this.selected.set(null); else if (this.searching()) { this.searching.set(false); this.query.set(''); } }
  countriesFor(region: FlagRegion) { return this.filtered().filter(country => country.studyRegion === region); }
  capitalText(country: Country): string { return country.capitals.map(capital => capital[this.i18n.language()]).join(' · ') || '—'; }
  validTypes(country: Country) { return FLAG_QUESTION_TYPES.filter(type => !isCapitalQuestion(type) || country.capitalQuizEnabled); }
  statusKey(country: Country, type: FlagQuestionType): string { const item = this.progress.get(`flags:${country.id}:${type}`); if (!item) return 'home.new'; return item.fsrs.state === 'review' ? 'home.memorized' : 'home.pending'; }
  private normalize(value: string): string { return value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim(); }
}

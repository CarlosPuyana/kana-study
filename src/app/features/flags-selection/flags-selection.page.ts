import { backWithinApp } from '../../core/services/return-navigation';
import { Location } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { COUNTRIES } from '../../data/countries.generated';
import { FLAG_QUESTION_TYPES, FLAG_REGIONS, FlagQuestionType, FlagRegion } from '../../core/models/country.model';
import { FlagSelection } from '../../core/models/flag-study.model';
import { flagStudyUnits, isValidFlagSelection } from '../../core/services/flag-selection';
import { FlagSettingsService } from '../../core/services/flag-settings.service';
import { TranslationService } from '../../core/services/translation.service';
import { CountryFlag } from '../../shared/components/country-flag/country-flag';

@Component({ selector: 'app-flags-selection-page', imports: [CountryFlag], templateUrl: './flags-selection.page.html', styleUrl: './flags-selection.page.scss', changeDetection: ChangeDetectionStrategy.OnPush })
export class FlagsSelectionPage {
  readonly i18n = inject(TranslationService);
  readonly regions = FLAG_REGIONS;
  readonly questionTypes = FLAG_QUESTION_TYPES;
  private readonly settings = inject(FlagSettingsService);
  private readonly location = inject(Location);
  private readonly router = inject(Router);
  readonly draft = signal<FlagSelection>(structuredClone(this.settings.selection()));
  readonly valid = computed(() => isValidFlagSelection(this.draft()));
  readonly selectedRegions = computed(() => this.regions.filter(region => this.draft().regions[region]).length);
  readonly available = computed(() => flagStudyUnits(COUNTRIES, this.draft()).length);
  readonly allRegions = computed(() => this.selectedRegions() === this.regions.length);

  countryCount(region: FlagRegion): number { return COUNTRIES.filter(country => country.enabled && country.studyRegion === region).length; }
  toggleRegion(region: FlagRegion): void { this.draft.update(value => ({ ...value, regions: { ...value.regions, [region]: !value.regions[region] } })); }
  toggleAllRegions(): void { const enabled = !this.allRegions(); this.draft.update(value => ({ ...value, regions: Object.fromEntries(this.regions.map(region => [region, enabled])) as Record<FlagRegion, boolean> })); }
  toggleType(type: FlagQuestionType): void { this.draft.update(value => ({ ...value, questionTypes: value.questionTypes.includes(type) ? value.questionTypes.filter(item => item !== type) : [...value.questionTypes, type] })); }
  back(): void { backWithinApp(this.location, this.router, '/flags'); }
  save(): void { if (!this.valid()) return; this.settings.save(this.draft()); void this.router.navigateByUrl('/flags'); }
}

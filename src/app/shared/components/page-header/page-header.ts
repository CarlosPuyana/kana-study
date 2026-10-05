import {ChangeDetectionStrategy, Component, inject, input} from '@angular/core';
import {Params, RouterLink} from '@angular/router';
import {TranslationService} from '../../../core/services/translation.service';
import {AccountControl} from '../account-control/account-control';

@Component({selector:'app-page-header',imports:[RouterLink,AccountControl],templateUrl:'./page-header.html',styleUrl:'./page-header.scss',changeDetection:ChangeDetectionStrategy.OnPush})
export class PageHeader {
  readonly i18n=inject(TranslationService);
  readonly titleKey=input.required<string>();
  readonly backRoute=input('/');
  readonly backQueryParams=input<Params|null>(null);
}

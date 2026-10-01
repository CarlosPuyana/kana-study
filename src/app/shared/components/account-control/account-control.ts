import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { SyncService } from '../../../core/services/sync.service';
import { TranslationService } from '../../../core/services/translation.service';

@Component({selector:'app-account-control',imports:[RouterLink],templateUrl:'./account-control.html',styleUrl:'./account-control.scss',changeDetection:ChangeDetectionStrategy.OnPush})
export class AccountControl{readonly auth=inject(AuthService);readonly sync=inject(SyncService);readonly i18n=inject(TranslationService)}

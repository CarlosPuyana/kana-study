import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { safeReturnUrl } from '../../../core/services/return-navigation';
import { AuthService } from '../../../core/services/auth.service';
import { SyncService } from '../../../core/services/sync.service';
import { TranslationService } from '../../../core/services/translation.service';

@Component({selector:'app-account-control',imports:[RouterLink],templateUrl:'./account-control.html',styleUrl:'./account-control.scss',changeDetection:ChangeDetectionStrategy.OnPush})
export class AccountControl{private readonly router=inject(Router);returnUrl():string{return safeReturnUrl(this.router.url);}readonly auth=inject(AuthService);readonly sync=inject(SyncService);readonly i18n=inject(TranslationService)}

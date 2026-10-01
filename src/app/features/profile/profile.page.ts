import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService, validUsername } from '../../core/services/auth.service';
import { ProfileStats, ProfileStatsService } from '../../core/services/profile-stats.service';
import { SyncService } from '../../core/services/sync.service';
import { TranslationService } from '../../core/services/translation.service';

@Component({ selector:'app-profile-page', imports:[FormsModule,RouterLink], templateUrl:'./profile.page.html', styleUrl:'./profile.page.scss', changeDetection:ChangeDetectionStrategy.OnPush })
export class ProfilePage {
  readonly auth=inject(AuthService);readonly sync=inject(SyncService);readonly i18n=inject(TranslationService);
  private readonly statsService=inject(ProfileStatsService);private readonly router=inject(Router);
  readonly stats=signal<ProfileStats|null>(null);readonly editing=signal(false);readonly saving=signal(false);readonly error=signal<string|null>(null);
  displayName='';username='';bio='';
  constructor(){if(!this.auth.authenticated()){void this.router.navigate(['/auth'],{queryParams:{return:'/profile'}});return;}this.resetForm();void this.load();}
  async load(){this.stats.set(await this.statsService.load());}
  resetForm(){const p=this.auth.profile();this.displayName=p?.displayName??'';this.username=p?.username??'';this.bio=p?.bio??'';}
  async save(){this.error.set(null);if(!validUsername(this.username)){this.error.set(this.i18n.t('auth.usernameInvalid'));return;}this.saving.set(true);try{const result=await this.auth.updateProfile({displayName:this.displayName,username:this.username,bio:this.bio});if(result.error)this.error.set(this.i18n.t('profile.saveError'));else this.editing.set(false);}finally{this.saving.set(false)}}
  async synchronize(){await this.sync.syncNow();await this.load();}
  async signOut(){await this.auth.signOut();window.location.href=`${window.location.pathname}#/`;window.location.reload();}
  formatDate(value:string){return new Intl.DateTimeFormat(this.i18n.language()==='en'?'en-US':this.i18n.language()==='ca'?'ca-ES':'es-ES',{dateStyle:'long'}).format(new Date(value))}
  formatDuration(seconds:number){const hours=Math.floor(seconds/3600),minutes=Math.floor(seconds%3600/60);return hours?`${hours} h ${minutes} min`:`${minutes} min`}
}

import {JsonPipe} from '@angular/common';
import {SyncDiagnosticReport} from '../../core/services/sync-diagnostics.service';
import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { safeReturnUrl } from '../../core/services/return-navigation';
import { AuthService, validUsername } from '../../core/services/auth.service';
import { ProfileStats, ProfileStatsService } from '../../core/services/profile-stats.service';
import { SyncService } from '../../core/services/sync.service';
import { TranslationService } from '../../core/services/translation.service';
import { LeaderboardService } from '../../core/services/leaderboard.service';
import { MedalBadge } from '../../shared/components/medal-badge/medal-badge';

@Component({ selector:'app-profile-page', imports:[FormsModule,RouterLink,MedalBadge,JsonPipe], providers:[LeaderboardService], templateUrl:'./profile.page.html', styleUrl:'./profile.page.scss', changeDetection:ChangeDetectionStrategy.OnPush })
export class ProfilePage {
  readonly auth=inject(AuthService);readonly sync=inject(SyncService);readonly i18n=inject(TranslationService);
  readonly leaderboard=inject(LeaderboardService);
  readonly view=signal<'summary'|'leaderboard'>('summary');readonly refreshing=signal(false);
  private readonly statsService=inject(ProfileStatsService);private readonly router=inject(Router);
  readonly returnUrl=safeReturnUrl(inject(ActivatedRoute).snapshot.queryParamMap.get('return'));
  readonly stats=signal<ProfileStats|null>(null);readonly editing=signal(false);readonly saving=signal(false);readonly error=signal<string|null>(null);
  displayName='';username='';bio='';
  constructor(){effect(()=>{this.auth.user();this.syncDiagnostic.set(null);});effect(()=>{const status=this.sync.status();if(['synced','pending','offline','syncing'].includes(status))this.syncError.set(false);});if(!this.auth.authenticated()){void this.router.navigate(['/auth'],{queryParams:{return:this.returnUrl}});return;}this.resetForm();void this.load();}
  async load(){this.stats.set(await this.statsService.load());}
  resetForm(){const p=this.auth.profile();this.displayName=p?.displayName??'';this.username=p?.username??'';this.bio=p?.bio??'';}
  async save(){this.error.set(null);if(!validUsername(this.username)){this.error.set(this.i18n.t('auth.usernameInvalid'));return;}this.saving.set(true);try{const result=await this.auth.updateProfile({displayName:this.displayName,username:this.username,bio:this.bio});if(result.error)this.error.set(this.i18n.t('profile.saveError'));else this.editing.set(false);}finally{this.saving.set(false)}}
  readonly synchronizing=signal(false);readonly syncError=signal(false);
  async synchronize(){
    if(this.synchronizing())return;
    this.synchronizing.set(true);this.syncError.set(false);
    try{const completed=await this.sync.syncNow();this.syncError.set(!completed&&this.sync.status()==='error');await this.load();}
    catch{this.syncError.set(true);}
    finally{this.synchronizing.set(false);}
  }
  readonly syncDiagnostic=signal<SyncDiagnosticReport|null>(null);
  async inspectSync(){this.syncDiagnostic.set(await this.sync.inspectDiagnostics());}
  formatSyncDate(value:string){return new Intl.DateTimeFormat(this.i18n.language()==='en'?'en-US':this.i18n.language()==='ca'?'ca-ES':'es-ES',{dateStyle:'medium',timeStyle:'short'}).format(new Date(value));}
  selectView(view:'summary'|'leaderboard'){this.view.set(view);if(view==='leaderboard')void this.leaderboard.load();}
  async refreshLeaderboard(){
    if(this.refreshing())return;this.refreshing.set(true);
    try{try{await this.sync.syncNow();}catch{/* Last ranking remains available. */}await this.load();await this.leaderboard.load(true);}
    finally{this.refreshing.set(false);}
  }
  async signOut(){await this.auth.signOut();window.location.href=`${window.location.pathname}#/`;window.location.reload();}
  formatDate(value:string){return new Intl.DateTimeFormat(this.i18n.language()==='en'?'en-US':this.i18n.language()==='ca'?'ca-ES':'es-ES',{dateStyle:'long'}).format(new Date(value))}
  formatDuration(seconds:number){
    const total=Number.isFinite(seconds)?Math.max(0,Math.floor(seconds)):0;
    const hours=Math.floor(total/3600),minutes=Math.floor(total%3600/60),remaining=total%60;
    const base=hours?`${hours} h ${minutes} min`:`${minutes} min`;
    return remaining?`${base} ${remaining} s`:base;
  }
}

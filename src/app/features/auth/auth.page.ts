import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, HostListener, inject, signal, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthMode, AuthService, validUsername } from '../../core/services/auth.service';
import { SyncService } from '../../core/services/sync.service';
import { TranslationService } from '../../core/services/translation.service';

@Component({
  selector: 'app-auth-page', imports: [FormsModule, RouterLink], templateUrl: './auth.page.html', styleUrl: './auth.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthPage implements AfterViewInit {
  readonly auth = inject(AuthService); readonly i18n = inject(TranslationService);
  private readonly route = inject(ActivatedRoute); private readonly router = inject(Router); private readonly sync = inject(SyncService);
  @ViewChild('firstField') firstField?: ElementRef<HTMLInputElement>;
  readonly mode = signal<AuthMode>(normalizeMode(this.route.snapshot.queryParamMap.get('mode')));
  readonly loading = signal(false); readonly message = signal<string | null>(null); readonly error = signal<string | null>(null);
  displayName = ''; username = ''; email = ''; password = ''; confirmation = ''; newPassword = '';

  ngAfterViewInit(): void { queueMicrotask(() => this.firstField?.nativeElement.focus()); }
  @HostListener('document:keydown.escape') close(): void { void this.router.navigateByUrl('/'); }
  switchMode(mode: AuthMode): void { this.mode.set(mode); this.error.set(null); this.message.set(null); void this.router.navigate([], { queryParams: { mode }, replaceUrl: true }); }

  async submit(): Promise<void> {
    this.error.set(null); this.message.set(null);
    if (this.password.length < 8 || (this.mode() === 'signup' && this.password !== this.confirmation)) { this.error.set(this.i18n.t('auth.passwordInvalid')); return; }
    if (this.mode() === 'signup' && !validUsername(this.username)) { this.error.set(this.i18n.t('auth.usernameInvalid')); return; }
    this.loading.set(true);
    try {
      if (this.mode() === 'login') {
        const result = await this.auth.signIn(this.email, this.password);
        if (result.error) this.error.set(this.authError(result.error)); else await this.afterSignIn();
      } else if (this.mode() === 'signup') {
        const result = await this.auth.signUp({ displayName: this.displayName, username: this.username, email: this.email, password: this.password });
        if (result.error) this.error.set(this.authError(result.error));
        else if (result.confirmationRequired) this.message.set(this.i18n.t('auth.checkEmail'));
        else await this.afterSignIn();
      } else if (this.mode() === 'recovery') {
        const result = await this.auth.updatePassword(this.newPassword);
        if (result.error) this.error.set(this.authError(result.error)); else { history.replaceState(null,'',`${window.location.pathname}#/auth?mode=login`);this.message.set(this.i18n.t('auth.passwordUpdated')); this.switchMode('login'); }
      }
    } finally { this.loading.set(false); }
  }

  async forgot(): Promise<void> {
    this.error.set(null); this.loading.set(true);
    try {
      const result = await this.auth.requestPasswordReset(this.email);
      if (result.error) this.error.set(this.authError(result.error)); else this.message.set(this.i18n.t('auth.recoverySent'));
    } finally { this.loading.set(false); }
  }

  async chooseImport(decision: 'merge' | 'account'): Promise<void> {
    this.loading.set(true);
    try { await this.auth.chooseGuestImport(decision); this.sync.schedule(0); this.reload('/profile'); }
    finally { this.loading.set(false); }
  }
  finishConfirmation(): void { if(this.auth.authenticated())this.reload('/profile');else this.switchMode('login'); }

  private async afterSignIn(): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 0));
    if (!this.auth.needsGuestImportDecision()) { this.sync.schedule(0); this.reload('/profile'); }
  }
  private reload(route: string): void { window.location.href = `${window.location.pathname}#${route}`; window.location.reload(); }
  private authError(error: string): string { return error === 'not-configured' ? this.i18n.t('auth.notConfigured') : this.i18n.t('auth.genericError'); }
}
function normalizeMode(value: string | null): AuthMode { return value === 'signup' || value === 'forgot' || value === 'recovery' || value === 'confirm' ? value : 'login'; }

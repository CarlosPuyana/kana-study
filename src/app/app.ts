import { ChangeDetectionStrategy, Component, effect, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { safeReturnUrl } from './core/services/return-navigation';
import { AuthService } from './core/services/auth.service';
import { SyncService } from './core/services/sync.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  private readonly router = inject(Router);
  readonly auth = inject(AuthService);
  readonly sync = inject(SyncService);

  constructor() {
    effect(() => { if (this.auth.authenticated()) this.sync.schedule(0); });
    const mode = new URLSearchParams(window.location.search).get('auth');
    if (mode === 'recovery' || mode === 'confirm') {
      queueMicrotask(() => void this.router.navigate(['/auth'], { queryParams: { mode,...(new URLSearchParams(window.location.search).has('return')?{return:safeReturnUrl(new URLSearchParams(window.location.search).get('return'))}:{}) } }));
    }
  }
}

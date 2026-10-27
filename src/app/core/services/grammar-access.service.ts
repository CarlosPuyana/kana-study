import { computed, DestroyRef, effect, inject, Injectable, untracked } from '@angular/core';
import { signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { filter, firstValueFrom, take, timeout } from 'rxjs';
import { AuthService } from './auth.service';
import { SupabaseClientService } from './supabase-client.service';
import { WorkspaceService } from './workspace.service';

export type GrammarAccessState = 'checking' | 'authorized' | 'denied' | 'error';
/** A UI access lease, not confidentiality for the publicly distributed curriculum. */
@Injectable({providedIn:'root'})
export class GrammarAccessService {
  static readonly leaseMs = 60_000;
  static readonly requestMs = 10_000;
  private readonly auth = inject(AuthService);
  private readonly workspace = inject(WorkspaceService);
  private readonly supabase = inject(SupabaseClientService);
  private readonly authReady = toObservable(this.auth.ready);
  private readonly result = signal<GrammarAccessState>('checking');
  private readonly owner = signal<string|null>(null);
  private readonly identity = computed(() => this.auth.ready() && this.auth.user() &&
    this.workspace.userId() === this.auth.user()!.id ? `${this.auth.user()!.id}:${this.workspace.activationRevision()}` : null);
  readonly scope = computed(() => this.identity());
  readonly state = computed<GrammarAccessState>(() => !this.auth.ready() ? (this.result()==='error'?'error':'checking') :
    this.owner() !== this.identity() || this.scopeUser!==this.auth.user() ? (this.identity() ? 'checking' : 'denied') : this.result());
  readonly allowed = computed(() => this.state() === 'authorized');
  private generation = 0;
  private expires = 0;
  private expiry?: ReturnType<typeof setTimeout>;
  private pending?: {key:string; promise:Promise<boolean>};
  private scopeUser: ReturnType<AuthService['user']> = null;

  constructor() {
    effect(() => {
      this.auth.user(); this.auth.ready(); this.workspace.activationRevision();
      untracked(() => {
        if(this.scopeUser!==this.auth.user() || this.owner()!==this.identity())this.invalidate();
        if(this.auth.ready())void this.check();
      });
    });
    const foreground = () => { if(!document.hidden) void this.check(true); };
    window.addEventListener('focus',foreground);
    document.addEventListener('visibilitychange',foreground);
    inject(DestroyRef).onDestroy(() => {
      this.invalidate(); window.removeEventListener('focus',foreground);
      document.removeEventListener('visibilitychange',foreground);
    });
  }

  private invalidate():void {
    ++this.generation; this.pending=undefined; this.expires=0;
    clearTimeout(this.expiry); this.owner.set(null); this.result.set('checking');
  }

  /** Entry forces a fresh check. Concurrent checks for the same identity share one request. */
  async check(force=false):Promise<boolean> {
    try { if(!this.auth.ready()) await firstValueFrom(this.authReady.pipe(filter(Boolean),take(1),timeout(GrammarAccessService.requestMs))); }
    catch { this.result.set('error'); return false; }
    const key=this.identity(), user=this.auth.user();
    if(!key || !user) { this.owner.set(null); this.result.set('denied'); return false; }
    if(this.pending?.key===key) return this.pending.promise;
    if(!force && this.allowed() && Date.now()<this.expires) return true;
    const generation=++this.generation;
    this.scopeUser=user;
    clearTimeout(this.expiry); this.owner.set(key); this.result.set('checking');
    const current=()=>generation===this.generation && this.identity()===key && this.auth.user()===user;
    const promise=(async()=>{
      let deadline:ReturnType<typeof setTimeout>|undefined;
      try {
        const response=await Promise.race([
          (async()=>{
            const client=await this.supabase.getClient();
            if(!client) throw new Error('Grammar access configuration unavailable');
            return client.from('grammar_beta_access').select('enabled').eq('user_id',user.id).maybeSingle();
          })(),
          new Promise<never>((_,reject)=>{deadline=setTimeout(()=>reject(new Error('Grammar access timeout')),GrammarAccessService.requestMs);}),
        ]);
        if(!current())return false;
        if(response.error)throw response.error;
        const granted=response.data?.enabled===true;
        this.result.set(granted?'authorized':'denied');
        if(granted){
          this.expires=Date.now()+GrammarAccessService.leaseMs;
          this.expiry=setTimeout(()=>{this.invalidate();void this.check(true);},GrammarAccessService.leaseMs);
        }
        return granted;
      } catch {
        if(current())this.result.set('error');
        return false;
      } finally {
        clearTimeout(deadline);
        if(current())this.pending=undefined;
      }
    })();
    this.pending={key,promise};
    return promise;
  }
}

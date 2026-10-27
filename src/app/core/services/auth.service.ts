import { computed, DestroyRef, inject, Injectable, signal } from '@angular/core';
import type { AuthChangeEvent, Session, User } from '@supabase/supabase-js';
import { authReturnUrl } from '../config/supabase.config';
import { UserProfile } from '../models/account.model';
import { SupabaseClientService } from './supabase-client.service';
import { WorkspaceService } from './workspace.service';
import { WorkspaceMigrationService } from './workspace-migration.service';
import { StorageService } from './storage.service';
import { WORKSPACE_LOCAL_KEYS } from './workspace.service';

export type AuthMode = 'login' | 'signup' | 'forgot' | 'recovery' | 'confirm';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly supabase = inject(SupabaseClientService);
  private readonly workspace = inject(WorkspaceService);
  private readonly migration = inject(WorkspaceMigrationService);
  private readonly storage = inject(StorageService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly userState = signal<User | null>(null);
  private readonly profileState = signal<UserProfile | null>(null);
  private readonly readyState = signal(false);
  private readonly importState = signal(false);
  private authGeneration = 0;
  private handling:Promise<void>=Promise.resolve();
  readonly guestDecks=signal<boolean|null>(false);
  readonly legacyGuest=signal(true);

  readonly configured = this.supabase.config.configured;
  readonly user = this.userState.asReadonly();
  readonly profile = this.profileState.asReadonly();
  readonly ready = this.readyState.asReadonly();
  readonly needsGuestImportDecision = this.importState.asReadonly();
  readonly authenticated = computed(() => this.userState() !== null);
  readonly initials = computed(() => profileInitials(this.profileState()?.displayName ?? this.userState()?.email ?? ''));

  constructor() {
    void this.initialize();
  }

  private async initialize(): Promise<void> {
    const client = await this.supabase.getClient();
    if (!client) { this.guestDecks.set(false);this.legacyGuest.set(false);this.workspace.activateGuest(); this.readyState.set(true); return; }
    const { data } = client.auth.onAuthStateChange((event, session) => {
      // Assign synchronously; SDK callbacks return immediately to avoid auth-lock deadlocks.
      this.handling=new Promise<void>(resolve=>queueMicrotask(()=>{void this.handleAuthEvent(event,session).then(resolve,resolve);}));
    });
    this.destroyRef.onDestroy(() => data.subscription.unsubscribe());
  }

  async signIn(email: string, password: string): Promise<{ error: string | null }> {
    const client = await this.supabase.getClient();
    if (!client) return { error: 'not-configured' };
    const { error } = await client.auth.signInWithPassword({ email: email.trim(), password });
    if(!error)await this.handling;
    return { error: safeAuthError(error) };
  }

  async signUp(input: { displayName: string; username: string; email: string; password: string; returnUrl?: string }): Promise<{ error: string | null; confirmationRequired: boolean }> {
    const client = await this.supabase.getClient();
    if (!client) return { error: 'not-configured', confirmationRequired: false };
    const username = normalizeUsername(input.username);
    const { data, error } = await client.auth.signUp({
      email: input.email.trim(), password: input.password,
      options: {
        emailRedirectTo: authReturnUrl('confirm',input.returnUrl),
        data: { display_name: input.displayName.trim(), username, avatar_seed: username },
      },
    });
    if(!error&&data.session)await this.handling;
    return { error: safeAuthError(error), confirmationRequired: Boolean(data.user && !data.session) };
  }

  async requestPasswordReset(email: string,returnUrl?:string): Promise<{ error: string | null }> {
    const client = await this.supabase.getClient();
    if (!client) return { error: 'not-configured' };
    const { error } = await client.auth.resetPasswordForEmail(email.trim(), { redirectTo: authReturnUrl('recovery',returnUrl) });
    return { error: safeAuthError(error) };
  }

  async updatePassword(password: string): Promise<{ error: string | null }> {
    const client = await this.supabase.getClient();
    if (!client) return { error: 'not-configured' };
    const { error } = await client.auth.updateUser({ password });
    return { error: safeAuthError(error) };
  }

  async updateProfile(input: { displayName: string; username: string; bio: string }): Promise<{ error: string | null }> {
    const client = await this.supabase.getClient(); const user = this.userState();
    if (!client || !user) return { error: 'not-authenticated' };
    const row = {
      id: user.id, display_name: input.displayName.trim(), username: normalizeUsername(input.username),
      bio: input.bio.trim() || null,
    };
    const { data, error } = await client.from('profiles').update(row).eq('id', user.id).select().single();
    if (!error && data && this.userState()?.id === user.id) this.profileState.set(profileFromRow(data));
    return { error: safeAuthError(error) };
  }

  async signOut(): Promise<void> {
    ++this.authGeneration;
    await (await this.supabase.getClient())?.auth.signOut();
    this.userState.set(null); this.profileState.set(null); this.importState.set(false);
    this.workspace.activateGuest();
  }

  async chooseGuestImport(decision: 'merge' | 'account'): Promise<boolean> {
    const user = this.userState(), generation=this.authGeneration, epoch=this.workspace.activationRevision();
    const current=()=>this.userState()?.id===user?.id&&this.authGeneration===generation&&this.workspace.activationRevision()===epoch;
    if (!user) return false;
    if (decision === 'merge') await this.migration.copyGuestToUser(user.id);
    if (!current()) return false;
    // Legacy commits remain valid. Custom transfer is a separate, explicitly confirmed workflow.
    if(decision==='merge'&&this.migration.customImportAvailable()&&await this.migration.hasCustomGuestData()){
      if(!current())return false;this.workspace.activateUser(user.id);this.importState.set(true);return true;
    }
    this.workspace.markImportDecision(user.id, decision);
    this.workspace.activateUser(user.id);
    if (decision === 'merge') {
      for (const key of WORKSPACE_LOCAL_KEYS) {
        const value = this.storage.get<unknown>(key, undefined);
        if (value !== undefined) this.storage.set(key, value);
      }
    }
    this.importState.set(false);return true;
  }
  async finishCustomGuestImport():Promise<boolean>{
    const user=this.userState(),generation=this.authGeneration,epoch=this.workspace.activationRevision();if(!user||!await this.migration.customImportComplete(user.id))return false;
    if(this.userState()?.id!==user.id||this.authGeneration!==generation||this.workspace.activationRevision()!==epoch||this.workspace.userId()!==user.id)return false;
    this.workspace.markImportDecision(user.id,'merge');this.importState.set(false);return true;
  }

  private async handleAuthEvent(event: AuthChangeEvent, session: Session | null): Promise<void> {
    const generation = ++this.authGeneration;
    if (event === 'SIGNED_OUT' || !session?.user) {
      this.userState.set(null); this.profileState.set(null); this.importState.set(false);
      this.workspace.activateGuest(); this.readyState.set(true); return;
    }
    if (this.userState()?.id !== session.user.id) this.profileState.set(null);
    this.userState.set(session.user);
    const decision = this.workspace.importDecision(session.user.id);
    const epoch=this.workspace.activationRevision();let needsDecision=false;
    if(decision===null&&this.workspace.active()==='guest'){
      let custom:boolean|null=null,legacy:boolean|null=null;
      try{custom=await this.migration.hasCustomGuestData();}catch{/* An unknown inventory must not bypass the separation notice. */}
      try{legacy=await this.migration.hasLegacyGuestData();}catch{/* Do not offer a legacy copy without confirmed legacy data. */}
      if(generation!==this.authGeneration||epoch!==this.workspace.activationRevision())return;
      this.guestDecks.set(custom);this.legacyGuest.set(legacy===true);needsDecision=custom!==false||legacy!==false;
    }
    if (generation !== this.authGeneration) return;
    this.importState.set(needsDecision);
    if (!needsDecision) this.workspace.activateUser(session.user.id);
    this.readyState.set(true);
    // Local workspace choice must not wait for a remote profile request (offline/slow network).
    void this.loadProfile(session.user.id,generation).catch(()=>undefined);
  }

  private async loadProfile(userId: string,generation:number): Promise<void> {
    const client = await this.supabase.getClient();
    if (!client) return;
    const { data } = await client.from('profiles').select('*').eq('id', userId).maybeSingle();
    if (data && generation===this.authGeneration && this.userState()?.id === userId) this.profileState.set(profileFromRow(data));
  }
}

export function normalizeUsername(value: string): string { return value.trim().toLowerCase(); }
export function validUsername(value: string): boolean { return /^[a-zA-Z0-9_-]{3,24}$/.test(value); }
export function profileInitials(value: string): string {
  return value.trim().split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]?.toUpperCase()).join('') || '?';
}
function safeAuthError(error: { readonly message: string } | null): string | null { return error ? error.message : null; }
function profileFromRow(row: Record<string, unknown>): UserProfile {
  return {
    id: String(row['id']), username: String(row['username'] ?? ''), displayName: String(row['display_name'] ?? ''),
    bio: row['bio'] ? String(row['bio']) : null, avatarSeed: row['avatar_seed'] ? String(row['avatar_seed']) : null,
    createdAt: String(row['created_at'] ?? ''), updatedAt: String(row['updated_at'] ?? ''),
  };
}

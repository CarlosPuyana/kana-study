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
    if (!client) { this.workspace.activateGuest(); this.readyState.set(true); return; }
    const { data } = client.auth.onAuthStateChange((event, session) => queueMicrotask(() => void this.handleAuthEvent(event, session)));
    this.destroyRef.onDestroy(() => data.subscription.unsubscribe());
  }

  async signIn(email: string, password: string): Promise<{ error: string | null }> {
    const client = await this.supabase.getClient();
    if (!client) return { error: 'not-configured' };
    const { error } = await client.auth.signInWithPassword({ email: email.trim(), password });
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
    if (!error && data) this.profileState.set(profileFromRow(data));
    return { error: safeAuthError(error) };
  }

  async signOut(): Promise<void> {
    await (await this.supabase.getClient())?.auth.signOut();
    this.userState.set(null); this.profileState.set(null); this.importState.set(false);
    this.workspace.activateGuest();
  }

  async chooseGuestImport(decision: 'merge' | 'account'): Promise<void> {
    const user = this.userState();
    if (!user) return;
    if (decision === 'merge') await this.migration.copyGuestToUser(user.id);
    this.workspace.markImportDecision(user.id, decision);
    this.workspace.activateUser(user.id);
    if (decision === 'merge') {
      for (const key of WORKSPACE_LOCAL_KEYS) {
        const value = this.storage.get<unknown>(key, undefined);
        if (value !== undefined) this.storage.set(key, value);
      }
    }
    this.importState.set(false);
  }

  private async handleAuthEvent(event: AuthChangeEvent, session: Session | null): Promise<void> {
    if (event === 'SIGNED_OUT' || !session?.user) {
      this.userState.set(null); this.profileState.set(null); this.importState.set(false);
      this.workspace.activateGuest(); this.readyState.set(true); return;
    }
    this.userState.set(session.user);
    const decision = this.workspace.importDecision(session.user.id);
    const needsDecision = decision === null && this.workspace.active() === 'guest' && await this.migration.hasGuestData();
    this.importState.set(needsDecision);
    if (!needsDecision) this.workspace.activateUser(session.user.id);
    await this.loadProfile(session.user.id);
    this.readyState.set(true);
  }

  private async loadProfile(userId: string): Promise<void> {
    const client = await this.supabase.getClient();
    if (!client) return;
    const { data } = await client.from('profiles').select('*').eq('id', userId).maybeSingle();
    if (data) this.profileState.set(profileFromRow(data));
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

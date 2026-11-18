import { computed, DestroyRef, effect, inject, Injectable, signal, untracked } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { SupabaseClientService } from '../../core/services/supabase-client.service';
import { WorkspaceService } from '../../core/services/workspace.service';
import type { PuyiBlock, PuyiIsland, PuyiLibrarySource, PuyiLibraryStatus, PuyiPhrase, PuyiText } from './puyi-library-source';

const UUID = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/;
const OBJECT_KEY = /^[0-9a-f-]{36}\/[0-9a-f-]{36}\/r[1-9]\d*-[0-9a-f]{64}\.mp3$/;
const BUCKET = 'puyi-islands-private';
const SIGNED_TTL_SECONDS = 150;
type Role = 'owner' | 'reader';
type Header = Omit<PuyiIsland, 'blocks' | 'title' | 'description'> & {
  revision: number;
  title: Partial<Record<keyof PuyiText, string | null>>;
  description: Partial<Record<keyof PuyiText, string | null>>;
  blocks?: { id: string; name: Header['title']; phraseCount: number }[];
};
type Entry = PuyiPhrase & { kind: 'phrase' | 'question' };
type Snapshot = { identity: string; role: Role; islands: readonly PuyiIsland[]; revision?: number };
const localize = (text: Header['title']): PuyiText => ({ es: text.es ?? '', en: text.en || text.es || '', ca: text.ca || text.es || '' });

class AccessDenied extends Error {}

/** The route shell owns this instance and its in-memory data. */
@Injectable()
export class PuyiPrivateCatalog implements PuyiLibrarySource {
  private readonly auth = inject(AuthService);
  private readonly workspace = inject(WorkspaceService);
  private readonly supabase = inject(SupabaseClientService);
  private readonly epoch = signal(0);
  private readonly snapshot = signal<Snapshot | null>(null);
  private readonly loadStatus = signal<PuyiLibraryStatus>('loading');
  private readonly identity = computed(() => {
    const user = this.auth.user();
    return this.auth.ready() && user && !user.is_anonymous && this.workspace.userId() === user.id
      ? user.id + ':' + this.workspace.activationRevision() : null;
  });
  private scope = new AbortController();
  private nav = new AbortController();
  private blockRequest?: AbortController;
  private checking = false;
  private islandId: string | null = null;
  private blockId: string | null = null;

  readonly libraryPath = '/anki/puyi-islands';
  readonly accessRevision = this.epoch.asReadonly();
  readonly islands = computed(() => {
    const snapshot = this.snapshot();
    return snapshot && snapshot.identity === this.identity() ? snapshot.islands : [];
  });
  readonly status = computed<PuyiLibraryStatus>(() => {
    if (!this.auth.configured) return 'unavailable';
    if (!this.auth.ready()) return 'loading';
    if (!this.identity()) return 'login';
    if (this.snapshot()?.identity !== this.identity() && this.loadStatus() === 'ready') return 'loading';
    return this.loadStatus();
  });

  constructor() {
    effect(() => {
      const identity = this.identity();
      untracked(() => {
        this.invalidate();
        if (identity) void this.read();
      });
    });
    const interval = setInterval(() => this.refresh(), 20000);
    inject(DestroyRef).onDestroy(() => {
      clearInterval(interval);
      this.invalidate();
    });
  }

  openLibrary(): void { this.navigate(null); }
  openIsland(id: string): void { this.navigate(id); }

  refresh(): void {
    if (this.identity() && !this.checking && this.loadStatus() !== 'loading') void this.read();
  }

  private navigate(id: string | null): void {
    this.scope.abort();
    this.scope = new AbortController();
    this.cancelNavigation();
    this.islandId = id;
    this.blockId = null;
    this.snapshot.set(null);
    this.loadStatus.set('loading');
    if (this.identity()) void this.read();
  }

  private cancelNavigation(): void {
    this.nav.abort();
    this.nav = new AbortController();
    this.blockRequest?.abort();
    this.blockRequest = undefined;
    this.checking = false;
  }

  private invalidate(status: PuyiLibraryStatus = 'loading'): void {
    this.scope.abort();
    this.scope = new AbortController();
    this.cancelNavigation();
    this.snapshot.set(null);
    this.loadStatus.set(status);
    this.epoch.update(epoch => epoch + 1);
  }

  private async rpc<T>(name: string, params: Record<string, unknown>, signal: AbortSignal): Promise<T> {
    const client = await this.supabase.getClient();
    signal.throwIfAborted();
    if (!client) throw new Error();
    const { data, error } = await client.rpc(name, params).abortSignal(signal);
    signal.throwIfAborted();
    if (error?.code === '42501' || error?.code === 'PGRST301') throw new AccessDenied();
    if (error) throw new Error();
    return data as T;
  }

  private async read(): Promise<void> {
    const identity = this.identity();
    const request = this.nav;
    const island = this.islandId;
    if (!identity || this.checking) return;
    this.checking = true;
    const signal = AbortSignal.any([request.signal, AbortSignal.timeout(15000)]);
    try {
      const role = await this.rpc<Role | null>('puyi_island_access', {}, signal);
      if (!role) throw new AccessDenied();
      if (island && !UUID.test(island)) throw new AccessDenied();
      const rows = island
        ? [await this.rpc<Header | null>('puyi_island_detail', { p_island: island }, signal)]
        : await this.rpc<Header[]>('puyi_island_catalog', {}, signal);
      if (!rows.every(Boolean)) throw new AccessDenied();
      if (request.signal.aborted || identity !== this.identity()) return;
      const data = rows as Header[];
      const old = this.snapshot();
      if (island && old?.identity === identity && old.role === role && old.revision === data[0].revision) return;
      if (old && (old.role !== role || island)) {
        this.scope.abort();
        this.scope = new AbortController();
        this.blockRequest?.abort();
        this.blockId = null;
        this.epoch.update(epoch => epoch + 1);
      }
      this.snapshot.set({
        identity, role, revision: island ? data[0].revision : undefined,
        islands: data.map(({ id, japanese, title, description, blocks }) => ({
          id, japanese, title: localize(title), description: localize(description),
          blocks: (blocks ?? []).map(({ id, name, phraseCount }) => ({
            id, name: localize(name), phraseCount, phrases: [], questions: [], loaded: false,
          })),
        })),
      });
      this.loadStatus.set('ready');
      if (island) {
        const blocks = this.islands()[0]?.blocks ?? [];
        const selected = blocks.find(block => block.id === this.blockId) ?? blocks[0];
        if (selected) await this.loadBlock(selected.id);
      }
    } catch (error) {
      if (!request.signal.aborted && identity === this.identity()) this.invalidate(error instanceof AccessDenied ? 'denied' : 'unavailable');
    } finally {
      if (request === this.nav) this.checking = false;
    }
  }

  async loadBlock(id: string): Promise<PuyiBlock | undefined> {
    const snapshot = this.snapshot();
    const island = this.islands()[0];
    const block = island?.blocks.find(block => block.id === id);
    if (!snapshot?.revision || island?.id !== this.islandId || !block) return;
    if (block.loaded) return block;
    this.blockRequest?.abort();
    const request = new AbortController();
    this.blockRequest = request;
    this.blockId = id;
    const signal = AbortSignal.any([this.nav.signal, request.signal, AbortSignal.timeout(15000)]);
    try {
      const entries = await this.rpc<Entry[] | null>('puyi_island_block', {
        p_island: island.id, p_revision: snapshot.revision, p_block: id,
      }, signal);
      if (signal.aborted || snapshot.identity !== this.identity() || this.snapshot()?.revision !== snapshot.revision) return;
      if (!entries) throw new AccessDenied();
      const phrases = entries.map(entry => ({
        ...entry, translation: localize(entry.translation), audioUrl: '',
      }));
      const loaded: PuyiBlock = {
        ...block, loaded: true, phrases: phrases.filter(entry => entry.kind === 'phrase'),
        questions: phrases.filter(entry => entry.kind === 'question'),
      };
      this.snapshot.set({
        ...snapshot,
        islands: [{ ...island, blocks: island.blocks.map(item => item.id === id ? loaded :
          { ...item, phrases: [], questions: [], loaded: false }) }],
      });
      return loaded;
    } catch (error) {
      if (!request.signal.aborted && snapshot.identity === this.identity()) this.invalidate(error instanceof AccessDenied ? 'denied' : 'unavailable');
      return;
    } finally {
      if (this.blockRequest === request) this.blockRequest = undefined;
    }
  }

  private mediaIdentity(key: string): string {
    const identity = this.identity();
    if (!identity || this.status() !== 'ready' || !this.islandId || !key.startsWith(this.islandId + '/') ||
        !OBJECT_KEY.test(key)) throw new AccessDenied();
    return identity;
  }

  async download(key: string, bytes: number, caller: AbortSignal): Promise<Blob> {
    const identity = this.mediaIdentity(key);
    if (!Number.isSafeInteger(bytes) || bytes < 1 || bytes > 2097152) throw new AccessDenied();
    const signal = AbortSignal.any([this.scope.signal, caller, AbortSignal.timeout(15000)]);
    const client = await this.supabase.getClient();
    signal.throwIfAborted();
    if (!client || identity !== this.identity()) throw new AccessDenied();
    const { data, error } = await client.storage.from(BUCKET).download(key, {}, { signal, cache: 'no-store' });
    signal.throwIfAborted();
    if (identity !== this.identity()) throw new AccessDenied();
    if (error) {
      this.refresh();
      throw new Error();
    }
    if (data.size !== bytes || !['audio/mpeg', 'application/octet-stream', ''].includes(data.type)) throw new Error();
    return data.type === 'audio/mpeg' ? data : data.slice(0, bytes, 'audio/mpeg');
  }

  async lease(key: string, caller: AbortSignal): Promise<{ url: string; expiresAt: number }> {
    const identity = this.mediaIdentity(key);
    const signal = AbortSignal.any([this.scope.signal, caller, AbortSignal.timeout(15000)]);
    const client = await this.supabase.getClient();
    const session = (await client?.auth.getSession())?.data.session;
    signal.throwIfAborted();
    if (!session || session.user.id !== this.auth.user()?.id || identity !== this.identity()) throw new AccessDenied();
    const origin = new URL(this.supabase.config.url);
    const endpoint = '/storage/v1/object/sign/' + BUCKET + '/' + key;
    const expiresAt = Date.now() + SIGNED_TTL_SECONDS * 1000;
    const response = await fetch(new URL(endpoint, origin), {
      method: 'POST', signal, cache: 'no-store', redirect: 'error',
      headers: { apikey: this.supabase.config.publishableKey, Authorization: 'Bearer ' + session.access_token, 'Content-Type': 'application/json' },
      body: JSON.stringify({ expiresIn: SIGNED_TTL_SECONDS }),
    });
    if (!response.ok) { this.refresh(); throw new AccessDenied(); }
    const signedURL: unknown = (await response.json()).signedURL;
    signal.throwIfAborted();
    if (identity !== this.identity() || typeof signedURL !== 'string' || !signedURL.startsWith('/object/sign/')) throw new AccessDenied();
    const url = new URL('/storage/v1' + signedURL, origin);
    if (url.pathname !== endpoint || !url.searchParams.get('token') || url.hash) throw new AccessDenied();
    return { url: url.href, expiresAt };
  }
}

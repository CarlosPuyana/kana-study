import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { AuthService } from '../../core/services/auth.service';
import { SupabaseClientService } from '../../core/services/supabase-client.service';
import { WorkspaceService } from '../../core/services/workspace.service';
import { PUYI_AUDIO, PuyiBlockPlayer } from './puyi-block-player';
import { PUYI_CLIP_LEASE, PUYI_CLIP_RESOLVER } from './puyi-library-source';
import { PuyiPrivateCatalog } from './puyi-private-catalog';

const island = '71000000-0000-4000-8000-000000000001';
const key = island + '/74000000-0000-4000-8000-000000000001/r1-' + 'a'.repeat(64) + '.mp3';
const heading = { id: island, revision: 1, japanese: 'テスト', title: { es: 'Prueba ficticia' }, description: {} };
const block = { id: 'b1', name: { es: 'Planes' }, phraseCount: 1 };
const entry = { id: 'p1', kind: 'phrase', japanese: 'きく。', segments: [{ text: 'きく。' }],
  translation: { es: 'Escuchar.' }, audioKey: key, audioBytes: 3 };

const drain = async () => { for (let n = 0; n < 16; n++) await Promise.resolve(); };

describe('Puyi private source', () => {
  const user = signal<{ id: string; is_anonymous?: boolean } | null>(null);
  const workspaceId = signal<string | null>(null);
  const activation = signal(0);
  let catalog: PuyiPrivateCatalog;
  let calls: { name: string; params: Record<string, unknown>; signal: AbortSignal }[];
  let response: (name: string, params: Record<string, unknown>) => unknown;
  let download: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    user.set(null);
    workspaceId.set(null);
    activation.set(0);
    calls = [];
    response = name => ({
      puyi_island_access: 'reader', puyi_island_catalog: [heading],
      puyi_island_detail: { ...heading, blocks: [block, { ...block, id: 'b2' }] }, puyi_island_block: [entry],
    })[name];
    download = vi.fn(async () => ({ data: new Blob(['abc'], { type: 'audio/mpeg' }), error: null }));
    TestBed.configureTestingModule({ providers: [
      PuyiPrivateCatalog,
      { provide: AuthService, useValue: { user, ready: () => true, configured: true } },
      { provide: WorkspaceService, useValue: { userId: workspaceId, activationRevision: activation } },
      { provide: SupabaseClientService, useValue: { getClient: async () => ({
        rpc: (name: string, params: Record<string, unknown>) => ({
          abortSignal: async (signal: AbortSignal) => {
            calls.push({ name, params, signal });
            return { data: await response(name, params), error: null };
          },
        }),
        storage: { from: () => ({ download }) },
      }) } },
    ] });
    catalog = TestBed.inject(PuyiPrivateCatalog);
  });
  afterEach(() => TestBed.resetTestingModule());

  async function signIn(id = 'fixture') {
    user.set({ id });
    workspaceId.set(id);
    TestBed.tick();
    await drain();
  }

  it('reads no content for guests and fetches metadata, selected blocks and clips separately', async () => {
    TestBed.tick();
    expect(catalog.status()).toBe('login');
    expect(calls).toHaveLength(0);
    await signIn();
    expect(calls.map(call => call.name)).toEqual(['puyi_island_access', 'puyi_island_catalog']);
    expect(catalog.islands()[0].blocks).toEqual([]);
    catalog.openIsland(island);
    await drain();
    expect(catalog.islands()[0].blocks.map(item => item.loaded)).toEqual([true, false]);
    await catalog.loadBlock('b2');
    expect(catalog.islands()[0].blocks.map(item => item.loaded)).toEqual([false, true]);
    expect(calls.filter(call => call.name === 'puyi_island_block').map(call => call.params['p_block'])).toEqual(['b1', 'b2']);
    expect(download).not.toHaveBeenCalled();
    await expect(catalog.download(key, 3, new AbortController().signal)).resolves.toMatchObject({ size: 3 });
    expect(download).toHaveBeenCalledWith(key, {}, { signal: expect.any(AbortSignal), cache: 'no-store' });
  });

  it('aborts and hides late responses after logout or workspace activation', async () => {
    let answer!: (value: unknown) => void;
    response = name => name === 'puyi_island_access' ? 'reader' : new Promise(resolve => { answer = resolve; });
    await signIn();
    expect(calls.at(-1)?.name).toBe('puyi_island_catalog');
    user.set(null);
    TestBed.tick();
    expect(calls.at(-1)?.signal.aborted).toBe(true);
    answer([heading]);
    await drain();
    expect(catalog.islands()).toEqual([]);
    expect(catalog.status()).toBe('login');
    await signIn('next');
    activation.update(value => value + 1);
    const previousRequest = calls.at(-1);
    TestBed.tick();
    expect(previousRequest?.signal.aborted).toBe(true);
  });

  it('clears a loaded island on revocation and rejects a late download', async () => {
    await signIn();
    catalog.openIsland(island);
    await drain();
    let deliver!: (value: { data: Blob; error: null }) => void;
    download.mockReturnValueOnce(new Promise(resolve => { deliver = resolve; }));
    const clip = catalog.download(key, 3, new AbortController().signal);
    const rejected = expect(clip).rejects.toThrow();
    await drain();
    const epoch = catalog.accessRevision();
    response = () => null;
    catalog.refresh();
    await drain();
    expect(catalog.accessRevision()).toBeGreaterThan(epoch);
    expect(catalog.islands()).toEqual([]);
    expect(catalog.status()).toBe('denied');
    deliver({ data: new Blob(['abc']), error: null });
    await rejected;
  });
});

describe('private clip transport', () => {
  it('retains a blocked clip for the next tap, revokes it and ignores a later download after stop', async () => {
    const create = vi.fn(() => 'blob:test');
    const revoke = vi.fn();
    const Url = URL;
    vi.stubGlobal('URL', class extends Url { static override createObjectURL = create; static override revokeObjectURL = revoke; });
    let finish!: (file: Blob) => void;
    const resolve = vi.fn(() => new Promise<Blob>(done => { finish = done; }));
    const audio = {
      src: '', ended: false, paused: true, play: vi.fn().mockRejectedValueOnce({ name: 'NotAllowedError' }).mockResolvedValue(undefined),
      pause: vi.fn(), load: vi.fn(), removeAttribute: vi.fn(() => { audio.src = ''; }),
    };
    try {
      TestBed.configureTestingModule({ providers: [
        PuyiBlockPlayer, { provide: PUYI_AUDIO, useValue: () => audio }, { provide: PUYI_CLIP_RESOLVER, useValue: resolve },
      ] });
      const player = TestBed.inject(PuyiBlockPlayer);
      player.start([{ ...entry, audioUrl: '' }]);
      finish(new Blob(['abc']));
      await drain();
      expect(player.phase()).toBe('blocked');
      player.resume();
      await drain();
      expect(player.phase()).toBe('playing');
      expect(resolve).toHaveBeenCalledTimes(1);
      player.stop();
      expect(revoke).toHaveBeenCalledWith('blob:test');
      player.start([{ ...entry, audioUrl: '' }]);
      player.stop();
      finish(new Blob(['abc']));
      await drain();
      expect(player.phase()).toBe('idle');
      expect(create).toHaveBeenCalledTimes(1);
      expect(resolve.mock.calls).toHaveLength(2);
    } finally {
      TestBed.resetTestingModule();
      vi.unstubAllGlobals();
    }
  });

  it('renews an expired fallback instead of using its old URL after pause', async () => {
    const NativeURL = URL;
    vi.stubGlobal('URL', class extends NativeURL {
      static override createObjectURL = () => 'blob:fixture';
      static override revokeObjectURL = vi.fn();
    });
    vi.useFakeTimers();
    const lease = vi.fn(async () => ({ url: 'https://fixture.test/clip', expiresAt: Date.now() + 150000 }));
    const audio = {
      src: '', ended: false, error: null, paused: true,
      play: vi.fn().mockRejectedValueOnce({ name: 'NotSupportedError' }).mockResolvedValue(undefined),
      pause: vi.fn(), load: vi.fn(), removeAttribute: vi.fn(() => { audio.src = ''; }),
    };
    try {
      TestBed.configureTestingModule({ providers: [
        PuyiBlockPlayer, { provide: PUYI_AUDIO, useValue: () => audio },
        { provide: PUYI_CLIP_RESOLVER, useValue: async () => new Blob(['abc']) },
        { provide: PUYI_CLIP_LEASE, useValue: lease },
      ] });
      const player = TestBed.inject(PuyiBlockPlayer);
      player.start([{ ...entry, audioUrl: '' }]);
      await drain();
      expect(player.playingId()).toBe(entry.id);
      expect(lease).toHaveBeenCalledTimes(1);
      player.pause();
      vi.setSystemTime(Date.now() + 151000);
      player.resume();
      await drain();
      expect(player.playingId()).toBe(entry.id);
      expect(lease).toHaveBeenCalledTimes(2);
      player.stop();
      expect(audio.src).toBe('');
    } finally {
      TestBed.resetTestingModule();
      vi.unstubAllGlobals();
      vi.useRealTimers();
    }
  });
});

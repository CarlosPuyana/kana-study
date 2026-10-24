import { TestBed } from '@angular/core/testing';
import { ApplicationInitStatus } from '@angular/core';
import { assertManualMangaHost, manualMangaProviders } from './manga-manual.providers';
import { CUSTOM_DECKS_ENABLED, CUSTOM_DECK_SYNC_ENABLED, CUSTOM_REMOTE_UPLOAD_APPROVED } from '../core/services/custom-deck-gates';
import { MANGA_DECK_ASSISTED_ENABLED } from '../core/services/manga-deck-gate';
import { WorkspaceService } from '../core/services/workspace.service';
import { SupabaseClientService } from '../core/services/supabase-client.service';
import { MANGA_ASSISTANT_ENDPOINT, MangaContextService } from '../core/services/manga-context.service';

describe('explicit local Manga manual bootstrap', () => {
  afterEach(() => { TestBed.resetTestingModule(); localStorage.clear(); vi.unstubAllGlobals(); });
  it.each(['localhost', '127.0.0.1'])('accepts development on %s only', host => {
    expect(() => assertManualMangaHost(host, true)).not.toThrow();
    expect(() => assertManualMangaHost(host, false)).toThrow();
  });
  it.each(['example.com', 'localhost.example.com', '192.168.1.10', '0.0.0.0', '[::1]', ''])('rejects %s', host => {
    expect(() => assertManualMangaHost(host, true)).toThrow();
  });
  it('enables only local UI, initializes Guest and cannot instantiate a real Supabase client', async () => {
    localStorage.setItem('kana-study.workspace.active.v1', 'user:previous');
    vi.stubGlobal('window', { location: { hostname: 'localhost' }, __KANA_STUDY_CONFIG__: {
      supabaseUrl: 'https://manual-test.supabase.co', supabasePublishableKey: 'synthetic-key-never-used',
    } });
    TestBed.configureTestingModule({ providers: manualMangaProviders() });
    const init = TestBed.inject(ApplicationInitStatus); await init.donePromise;
    expect(TestBed.inject(WorkspaceService).active()).toBe('guest');
    expect(TestBed.inject(CUSTOM_DECKS_ENABLED)()).toBe(true);
    expect(TestBed.inject(MANGA_DECK_ASSISTED_ENABLED)()).toBe(true);
    expect(TestBed.inject(CUSTOM_DECK_SYNC_ENABLED)()).toBe(false);
    expect(TestBed.inject(CUSTOM_REMOTE_UPLOAD_APPROVED)).toBe(false);
    expect((TestBed.inject(CUSTOM_DECK_SYNC_ENABLED) as any).set).toBeUndefined();
    const client = TestBed.inject(SupabaseClientService);
    expect(client.config.configured).toBe(false); expect(await client.getClient()).toBeNull();
    expect(TestBed.inject(MANGA_ASSISTANT_ENDPOINT)).toBeNull();
    expect(TestBed.inject(MangaContextService).available).toBe(false);
  });
  it('keeps the ordinary bootstrap gates closed', () => {
    TestBed.configureTestingModule({});
    expect(TestBed.inject(CUSTOM_DECKS_ENABLED)()).toBe(false);
    expect(TestBed.inject(MANGA_DECK_ASSISTED_ENABLED)()).toBe(false);
    expect(TestBed.inject(CUSTOM_DECK_SYNC_ENABLED)()).toBe(false);
    expect(TestBed.inject(CUSTOM_REMOTE_UPLOAD_APPROVED)).toBe(false);
  });
});

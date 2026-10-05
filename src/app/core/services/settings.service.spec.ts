import { TestBed } from '@angular/core/testing';
import { SettingsService } from './settings.service';
import { StorageService } from './storage.service';
import { NORA_THEME_TOKENS } from '../models/theme.model';

describe('SettingsService themes', () => {
  beforeEach(() => {
    localStorage.clear();
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: vi.fn(() => ({
        matches: false,
        media: '(prefers-color-scheme: dark)',
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
    TestBed.configureTestingModule({ providers: [SettingsService, StorageService] });
  });

  afterEach(() => {
    TestBed.resetTestingModule();
    document.documentElement.removeAttribute('data-theme');
  });

  it('selects and persists the Nora theme', () => {
    const settings = TestBed.inject(SettingsService);
    settings.setTheme('nora');
    TestBed.tick();

    expect(settings.theme()).toBe('nora');
    expect(document.documentElement.dataset['theme']).toBe('nora');
    expect(JSON.parse(localStorage.getItem('kana-study.settings.v1')!).theme).toBe('nora');
  });
  it.each(['nora-dark','anime'] as const)('selects and persists the new %s theme',theme=>{
    const settings=TestBed.inject(SettingsService);settings.setTheme(theme);TestBed.tick();
    expect(settings.theme()).toBe(theme);
    expect(document.documentElement.dataset['theme']).toBe(theme);
    expect(JSON.parse(localStorage.getItem('kana-study.settings.v1')!).theme).toBe(theme);
  });

  it.each(['dark', 'light', 'nora', 'nora-dark', 'anime'] as const)('keeps an existing %s preference', theme => {
    localStorage.setItem('kana-study.settings.v1', JSON.stringify({ theme }));
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [SettingsService, StorageService] });
    const settings = TestBed.inject(SettingsService);
    TestBed.tick();
    expect(settings.theme()).toBe(theme);
    expect(document.documentElement.dataset['theme']).toBe(theme);
  });

  it('provides the principal Nora CSS tokens', () => {
    for (const token of ['--background', '--surface', '--primary', '--accent', '--border', '--text-primary']) {
      expect(NORA_THEME_TOKENS[token as keyof typeof NORA_THEME_TOKENS]).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });

  it('keeps initialization failures quiet but reports a failed user preference change',()=>{
    const settings=TestBed.inject(SettingsService),storage=TestBed.inject(StorageService);
    const write=vi.spyOn(Storage.prototype,'setItem').mockImplementation(()=>{throw new Error('blocked');});
    try {
      TestBed.tick();expect(storage.persistenceFailed()).toBe(false);
      settings.setLanguage('en');TestBed.tick();expect(storage.persistenceFailed()).toBe(true);
      expect(settings.language()).toBe('en');
    } finally {write.mockRestore();}
  });
});

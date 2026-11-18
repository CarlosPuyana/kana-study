import { PHRASE_ISLANDS_CATALOG } from '../../data/phrase-islands/phrase-islands-catalog';
import { provideRouter } from '@angular/router';
import { Component, input, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TranslationService } from '../../core/services/translation.service';
import { PageHeader } from '../../shared/components/page-header/page-header';
import * as copy from '../../../assets/i18n/phrase-islands.generated';
import { PhraseIslandsPage } from './phrase-islands.page';

@Component({ selector: 'app-page-header', template: '' })
class HeaderStub { readonly titleKey = input(''); readonly backRoute = input(''); readonly backQueryParams = input<unknown>(null); }

describe('Phrase islands I0 presentation', () => {
  const language = signal<'es' | 'en' | 'ca'>('es');
  beforeEach(() => {
    language.set('es');
    TestBed.configureTestingModule({ imports: [PhraseIslandsPage], providers: [provideRouter([]),
      { provide: TranslationService, useValue: {
        useStudyCopy: vi.fn(), language,
        t: (key: string, values?: Record<string, number>) => (copy[language()][key] ?? key).replace('{{count}}', String(values?.['count'] ?? '')),
      } },
    ] }).overrideComponent(PhraseIslandsPage, { remove: { imports: [PageHeader] }, add: { imports: [HeaderStub] } });
  });
  afterEach(() => { TestBed.resetTestingModule(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });
  function create() {
    const fixture = TestBed.createComponent(PhraseIslandsPage); fixture.detectChanges(); return fixture;
  }

  it('supports independent multi-selection with accessible pressed state and a live total', () => {
    const fixture = create(), host: HTMLElement = fixture.nativeElement;
    const buttons = host.querySelectorAll<HTMLButtonElement>('.topic-card');
    expect(buttons).toHaveLength(6);
    expect([...buttons].every(b => b.getAttribute('aria-pressed') === 'false')).toBe(true);
    buttons[0].click(); buttons[4].click(); fixture.detectChanges();
    expect(buttons[0].getAttribute('aria-pressed')).toBe('true'); expect(buttons[4].getAttribute('aria-pressed')).toBe('true');
    expect(host.querySelector('[role=status]')?.textContent).toContain('2');
    buttons[0].click(); fixture.detectChanges();
    expect(buttons[0].getAttribute('aria-pressed')).toBe('false'); expect(buttons[4].getAttribute('aria-pressed')).toBe('true');
    expect(host.querySelector('[role=status]')?.textContent).toContain('1');
    for (const b of buttons) {
      expect(host.querySelector('#' + b.getAttribute('aria-labelledby'))).not.toBeNull();
      for (const id of b.getAttribute('aria-describedby')!.split(' ')) expect(host.querySelector('#' + id)).not.toBeNull();
    }
  });

  it('keeps every future mode disabled even when themes are selected', () => {
    const fixture = create(), host: HTMLElement = fixture.nativeElement;
    host.querySelector<HTMLButtonElement>('.topic-card')!.click(); fixture.detectChanges();
    const modes = host.querySelectorAll<HTMLButtonElement>('.mode-card');
    expect(modes).toHaveLength(3);
    for (const mode of modes) {
      expect(mode.disabled).toBe(false); expect(mode.textContent).toContain('Iniciar');
    }
    expect(host.querySelector('audio, video, .session, input')).toBeNull();
    expect(fixture.componentInstance.selected().size).toBe(1);
  });

  it('shows actual approved phrase counts per topic and explores exactly the selected topics', () => {
    const fixture=create(),host:HTMLElement=fixture.nativeElement;
    expect([...host.querySelectorAll('.phrase-count')].map(e=>e.textContent)).toEqual(fixture.componentInstance.topics.map(t=>PHRASE_ISLANDS_CATALOG.filter(p=>p.topicId===t.id).length+' frases'));
    const buttons=host.querySelectorAll<HTMLButtonElement>('.topic-card');buttons[0].click();buttons[1].click();fixture.detectChanges();
    expect(host.querySelectorAll('.phrase-entry')).toHaveLength(0);
    expect(host.querySelector('.explore-link')?.getAttribute('href')).toContain('topics=everyday,conversation');
  });

  it('does not write storage or open a database, and a fresh visit starts without selections', () => {
    const write = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw Error('unexpected write'); });
    const open = vi.fn(() => { throw Error('unexpected database'); }); vi.stubGlobal('indexedDB', { open });
    const first = create(); first.nativeElement.querySelector('.topic-card').click(); first.detectChanges(); first.destroy();
    const second = create();
    expect(second.componentInstance.selected().size).toBe(0);
    expect(write).not.toHaveBeenCalled(); expect(open).not.toHaveBeenCalled();
  });

  it.each(['es', 'en', 'ca'] as const)('renders all content in %s with the same translation keys', lang => {
    language.set(lang); const fixture = create(), host: HTMLElement = fixture.nativeElement;
    expect(Object.keys(copy[lang]).sort()).toEqual(Object.keys(copy.es).sort());
    expect(host.textContent).not.toContain('phraseIslands.');
    expect(host.querySelector('.coming-soon')?.textContent).toBe(copy[lang]['phraseIslands.session.select']);
    expect(host.querySelector('.topic-title')?.textContent).toBe(copy[lang]['phraseIslands.topic.everyday.title']);
  });
});

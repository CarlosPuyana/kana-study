import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { TranslationService } from '../../core/services/translation.service';
import { JAPANESE_1500_ENTRIES } from '../../data/japanese-1500.generated';
import { AnkiCardsPage } from './anki-cards.page';

describe('AnkiCardsPage detail', () => {
  const language = signal<'es' | 'en' | 'ca'>('es');
  let fixture: ComponentFixture<AnkiCardsPage>;

  beforeEach(async () => {
    language.set('es');
    await TestBed.configureTestingModule({
      imports: [AnkiCardsPage],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ deckId: 'japanese-1500' }) } } },
        {
          provide: TranslationService,
          useValue: {
            language,
            t: (key: string, values?: Record<string, string | number>) =>
              values ? `${key} ${Object.values(values).join(' ')}` : key,
          },
        },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(AnkiCardsPage);
  });

  afterEach(() => TestBed.resetTestingModule());

  it('renders Spanish meaning, sentence, frequency and no empty notes section', () => {
    fixture.componentInstance.query.set('#124');
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('.entry-card') as HTMLButtonElement).click();
    fixture.detectChanges();
    const detail = fixture.nativeElement.querySelector('.detail') as HTMLElement;
    expect(detail.textContent).toContain('たべる');
    expect(detail.textContent).toContain('comer');
    expect(detail.textContent).toContain('Ayer comí curry tailandés.');
    expect(detail.textContent).toContain('anki.cards.frequency');
    expect(detail.querySelector('.notes')).toBeNull();
    expect(detail.querySelector('[innerhtml]')).toBeNull();
  });

  it('uses Spanish content and displays notes for Catalan UI', () => {
    language.set('ca');
    fixture.componentInstance.query.set('#32');
    fixture.componentInstance.selected.set(JAPANESE_1500_ENTRIES.find(entry => entry.word === '何')!);
    fixture.detectChanges();
    const detail = fixture.nativeElement.querySelector('.detail') as HTMLElement;
    expect(detail.textContent).toContain('qué');
    expect(detail.textContent).toContain('¿Qué es esto?');
    expect(detail.querySelector('.notes')?.textContent).toContain('Puede leerse なに o なん.');
  });

  it('switches detail content to English', () => {
    language.set('en');
    fixture.componentInstance.query.set('#33');
    fixture.componentInstance.selected.set(JAPANESE_1500_ENTRIES.find(entry => entry.word === '先生')!);
    fixture.detectChanges();
    const detail = fixture.nativeElement.querySelector('.detail') as HTMLElement;
    expect(detail.textContent).toContain('teacher');
    expect(detail.textContent).toContain('I want to become a Japanese teacher.');
  });
});

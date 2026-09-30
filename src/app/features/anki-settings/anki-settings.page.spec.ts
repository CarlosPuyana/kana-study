import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { DeckSettingsService } from '../../core/services/deck-settings.service';
import { StorageService } from '../../core/services/storage.service';
import { TranslationService } from '../../core/services/translation.service';
import { AnkiSettingsPage } from './anki-settings.page';

describe('AnkiSettingsPage', () => {
  let fixture: ComponentFixture<AnkiSettingsPage>;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [AnkiSettingsPage],
      providers: [
        provideRouter([]),
        DeckSettingsService,
        StorageService,
        { provide: TranslationService, useValue: { t: (key: string) => key } },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({ deckId: 'japanese-1500' }) } },
        },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(AnkiSettingsPage);
    fixture.detectChanges();
  });

  afterEach(() => TestBed.resetTestingModule());

  it('renders exactly the five supported retention choices', () => {
    expect(fixture.nativeElement.querySelectorAll('input[name="retention"]')).toHaveLength(5);
  });

  it('updates the visual draft when a retention choice changes', () => {
    const radios = fixture.nativeElement.querySelectorAll('input[name="retention"]') as NodeListOf<HTMLInputElement>;
    radios[3].dispatchEvent(new Event('change'));
    fixture.detectChanges();
    expect(fixture.componentInstance.draft().desiredRetention).toBe(0.95);
    expect(radios[3].closest('label')?.classList.contains('selected')).toBe(true);
  });

  it('accepts zero and positive daily values', () => {
    const input = fixture.nativeElement.querySelector('input[type="number"]') as HTMLInputElement;
    input.value = '0';
    input.dispatchEvent(new Event('input'));
    expect(fixture.componentInstance.newCardsValid()).toBe(true);
    expect(fixture.componentInstance.draft().newCardsPerDay).toBe(0);
    input.value = '25';
    input.dispatchEvent(new Event('input'));
    expect(fixture.componentInstance.draft().newCardsPerDay).toBe(25);
  });

  it('rejects a negative daily value and disables saving', () => {
    const input = fixture.nativeElement.querySelector('input[type="number"]') as HTMLInputElement;
    input.value = '-1';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(fixture.componentInstance.newCardsValid()).toBe(false);
    expect((fixture.nativeElement.querySelector('button[type="submit"]') as HTMLButtonElement).disabled).toBe(true);
  });

  it('saves the form without touching study progress storage', () => {
    fixture.componentInstance.setRetention(0.97);
    fixture.componentInstance.setOrder('before-reviews');
    fixture.componentInstance.save();
    expect(fixture.componentInstance.saved()).toBe(true);
    expect(localStorage.getItem('kana-study.deck-settings.v1')).toContain('before-reviews');
    expect(localStorage.getItem('kana-study.study-progress.v2')).toBeNull();
    expect(localStorage.getItem('kana-study.flags-progress.v1')).toBeNull();
    expect(localStorage.getItem('kana-study.kanji-progress.v1')).toBeNull();
    expect(localStorage.getItem('kana-study.vocabulary-progress.v1')).toBeNull();
  });
});

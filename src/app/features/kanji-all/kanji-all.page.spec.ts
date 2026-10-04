import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { KANJI_N5 } from '../../data/kanji-n5.generated';
import { KANJI_N5_CATEGORIES, KANJI_THEME_BY_CHARACTER } from '../../data/kanji-n5-categories';
import { KanjiProgressService } from '../../core/services/kanji-progress.service';
import { KanjiAllPage } from './kanji-all.page';
import { beforeEach, vi } from 'vitest';

describe('Kanji exploration categories', () => {
  beforeEach(() => { vi.stubGlobal('matchMedia', vi.fn(() => ({matches:false, addEventListener:vi.fn(), removeEventListener:vi.fn()}))); });
  function page(selected?: string) {
    TestBed.configureTestingModule({providers: [provideRouter([]),
      {provide: ActivatedRoute, useValue: {snapshot: {queryParamMap: convertToParamMap(selected ? {selected} : {})}}},
      {provide: KanjiProgressService, useValue: {get: () => undefined}},
    ]});
    return TestBed.createComponent(KanjiAllPage);
  }
  it('classifies all 80 dataset characters and IDs exactly once, without unknown entries', () => {
    const characters = KANJI_N5_CATEGORIES.flatMap(category => category.characters);
    expect(KANJI_N5).toHaveLength(80);
    expect(new Set(characters).size).toBe(characters.length);
    expect([...characters].sort()).toEqual(KANJI_N5.map(k => k.character).sort());
    expect(Object.keys(KANJI_THEME_BY_CHARACTER).sort()).toEqual(KANJI_N5.map(k => k.id).sort());
  });
  it('has the eight requested theme counts', () => {
    const component = page().componentInstance;
    expect(component.groupedByTheme().map(group => group.items.length)).toEqual([14,12,9,11,10,9,7,8]);
  });
  it('groups exact stroke counts in ascending order with stable dataset order', () => {
    const component = page().componentInstance, groups = component.groupedByStroke();
    expect(groups.map(g => Number(g.id))).toEqual([...new Set(KANJI_N5.map(k => k.strokeCount))].sort((a,b) => a-b));
    for(const group of groups) expect(group.items).toEqual(KANJI_N5.filter(k => k.strokeCount === Number(group.id)));
  });
  it('omits empty stroke and theme groups after filtering', () => {
    const component = page().componentInstance; component.query.set('不存在の検索');
    expect(component.groupedByStroke()).toEqual([]); expect(component.groupedByTheme()).toEqual([]);
  });
  it('applies the same search results to all three views', () => {
    const component = page().componentInstance; component.query.set('persona');
    expect(component.filtered().length).toBeGreaterThan(0);
    for(const mode of component.viewModes) {
      component.viewMode.set(mode);
      expect(component.groups().flatMap(g => g.items).map(k => k.id).sort()).toEqual(component.filtered().map(k => k.id).sort());
      expect(component.groups().every(g => g.items.length > 0)).toBe(true);
    }
  });
  it('keeps search across characters, readings, examples and strokes', () => {
    const component = page().componentInstance, kanji = KANJI_N5[0];
    for(const query of [kanji.character, kanji.onyomi[0], kanji.examples[0].word, String(kanji.strokeCount)]) {
      component.query.set(query); expect(component.filtered()).toContain(kanji);
    }
  });
  it('opens query selected and preserves its detail while changing views', () => {
    const fixture = page('人'), component = fixture.componentInstance;
    expect(component.selected()?.character).toBe('人');
    for(const mode of component.viewModes) {component.viewMode.set(mode); fixture.detectChanges(); expect(fixture.nativeElement.querySelector('[role=dialog]')).not.toBeNull(); expect(component.selected()?.character).toBe('人');}
  });
  it('links the selected Kanji detail to individual handwriting practice', () => {
    const fixture=page('水');fixture.detectChanges();
    const link=fixture.nativeElement.querySelector('a.writing-action');
    expect(decodeURIComponent(link.getAttribute('href'))).toContain('/kanji/writing?entry='+fixture.componentInstance.selected()!.id);
  });
  it('defaults to All and uses pressed buttons and the same card detail in grouped views', () => {
    const fixture = page(); fixture.detectChanges();
    expect(fixture.componentInstance.viewMode()).toBe('all');
    const buttons = fixture.nativeElement.querySelectorAll('.view-selector button');
    expect(buttons[0].getAttribute('aria-pressed')).toBe('true');
    buttons[2].click();fixture.detectChanges();expect(buttons[2].getAttribute('aria-pressed')).toBe('true');
    expect(fixture.nativeElement.querySelectorAll('.card')).toHaveLength(80);
    fixture.nativeElement.querySelector('.card').click();fixture.detectChanges();expect(fixture.nativeElement.querySelector('[role=dialog]')).not.toBeNull();
  });
});

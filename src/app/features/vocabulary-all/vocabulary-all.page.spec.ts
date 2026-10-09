import {TestBed} from '@angular/core/testing';
import {provideRouter} from '@angular/router';
import {VocabularyAllPage} from './vocabulary-all.page';
import { VOCABULARY_N5 } from '../../data/vocabulary-n5.generated';import { romanizeVocabularyReading,vocabularyEntryMatchesQuery } from './vocabulary-all.page';
describe('Vocabulary catalogue search helpers',()=>{it('romanizes readings for Latin search',()=>{expect(romanizeVocabularyReading('たべる')).toBe('taberu');expect(romanizeVocabularyReading('きって')).toBe('kitte')});it('finds the same entry by each normalized written variant',()=>{for(const [id,forms] of [['n5-q8157h',['丸い','円い']],['n5-1y5ytqf',['見る','観る']],['n5-1g1nyzi',['初め','始め']],['n5-z2p7r5',['伯母さん','叔母さん']]] as const){const entry=VOCABULARY_N5.find(item=>item.id===id)!;expect(forms.every(form=>vocabularyEntryMatchesQuery(entry,form))).toBe(true);expect(VOCABULARY_N5.filter(item=>vocabularyEntryMatchesQuery(item,forms[1])).some(item=>item.id===id)).toBe(true)}})});


describe('Vocabulary detail romaji',()=>{
  beforeEach(()=>{localStorage.clear();vi.stubGlobal('matchMedia',()=>({matches:false,addEventListener:vi.fn(),removeEventListener:vi.fn()}));TestBed.configureTestingModule({providers:[provideRouter([])]});});
  afterEach(()=>{TestBed.resetTestingModule();vi.unstubAllGlobals();});
  it('shows reading then secondary romaji in N5 detail',()=>{
    const f=TestBed.createComponent(VocabularyAllPage);
    // This is a detail assertion: use the public filter instead of rendering the
    // entire catalogue before inspecting one word (slow under full-suite load).
    f.componentInstance.query.set('食べる');
    f.componentInstance.selected.set(VOCABULARY_N5.find(e=>e.primaryWrittenForm==='食べる')!);
    f.detectChanges();
    expect(f.nativeElement.querySelector('.reading strong').textContent).toBe('たべる');
    expect(f.nativeElement.querySelector('.reading .romaji').textContent).toBe('taberu');
  });
  it('does not display romaji for a level with the capability disabled',()=>{
    const f=TestBed.createComponent(VocabularyAllPage);
    f.componentInstance.query.set(VOCABULARY_N5[0].primaryWrittenForm);
    f.componentInstance.selected.set({...VOCABULARY_N5[0],jlptApproxLevel:'N4'});
    f.detectChanges();
    expect(f.nativeElement.querySelector('.reading .romaji')).toBeNull();
  });
});

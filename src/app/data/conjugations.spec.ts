import {CONJUGATION_CATEGORIES as categories} from './conjugations';
import {CONJUGATION_CATEGORY_IDS} from '../core/models/conjugations.model';
import * as copy from '../../assets/i18n/conjugations.generated';
describe('Conjugations Phase 1 catalog',()=>{
  it('contains exactly 20 stable identities in the agreed order',()=>{
    expect(categories).toHaveLength(20);expect(new Set(categories.map(c=>c.id)).size).toBe(20);
    expect(categories.map(c=>c.id)).toEqual([...CONJUGATION_CATEGORY_IDS]);
    expect(categories.map(c=>c.order)).toEqual(Array.from({length:20},(_,i)=>i+1));
  });
  it('enables only the two adjective families with real counts and no fabricated streaks or rules',()=>{
    for(const category of categories){const ready=category.id==='adjective-i'||category.id==='adjective-na';expect(category.availability).toBe(ready?'available':'planned');expect(category.wordCount).toBe(category.id==='adjective-i'?15:category.id==='adjective-na'?10:undefined);expect(category.japanese).not.toBe('');expect(category.ruleFamily).not.toBe('');expect(['basic','intermediate','advanced']).toContain(category.difficulty);expect(category).not.toHaveProperty('bestStreak');expect(Object.values(category).some(v=>typeof v==='function')).toBe(false);}
  });
  it('classifies verbs, adjectives and copulas without merging polite or adjective families',()=>{
    expect(categories.filter(c=>c.group==='verb')).toHaveLength(16);expect(categories.filter(c=>c.group==='adjective')).toHaveLength(2);expect(categories.filter(c=>c.group==='copula')).toHaveLength(2);
    expect(categories.find(c=>c.id==='verb-prohibitive')?.group).toBe('verb');
    expect(new Set(['verb-polite','adjective-i','adjective-na','copula-plain','copula-polite'].map(id=>categories.find(c=>c.id===id)?.ruleFamily)).size).toBe(5);
    expect(categories.find(c=>c.id==='verb-causative-passive')?.example).toEqual({base:'書く',result:'書かされる'});
  });
  for(const language of ['es','en','ca'] as const)it(`has localized names/descriptions and identical keys for ${language}`,()=>{
    expect(Object.keys(copy[language]).sort()).toEqual(Object.keys(copy.es).sort());
    for(const category of categories){expect(copy[language][category.titleKey]?.trim()).toBeTruthy();expect(copy[language][category.descriptionKey]?.trim()).toBeTruthy();}
  });
});

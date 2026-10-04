import { profileMedals } from './profile-stats.service';
import { MEDAL_DEFINITIONS } from '../../data/medals';
import { FLAG_MEDAL_DEFINITIONS } from '../../data/flag-medals';
import { KANJI_MEDAL_DEFINITIONS } from '../../data/kanji-medals';
import { VOCABULARY_MEDAL_DEFINITIONS } from '../../data/vocabulary-medals';
import { RUSH_MEDAL_DEFINITIONS } from '../../data/rush-medals';
describe('Profile medal collection',()=>{
  const definitions=[MEDAL_DEFINITIONS[0],FLAG_MEDAL_DEFINITIONS[0],KANJI_MEDAL_DEFINITIONS[0],VOCABULARY_MEDAL_DEFINITIONS[0],RUSH_MEDAL_DEFINITIONS[0]];
  it('includes only owned medals across all five modules without a three-medal cap',()=>{
    const medals=profileMedals(definitions.map(d=>({medalId:d.id,unlockedAt:'2026-10-01T00:00:00Z'})),[]);
    expect(medals).toHaveLength(5);expect(new Set(medals.map(m=>m.module)).size).toBe(5);
    for(const medal of medals)expect(medal.icon).toBeTruthy();
  });
  it('deduplicates legacy rush contamination with the earliest valid instant, newest first',()=>{
    const id=RUSH_MEDAL_DEFINITIONS[0].id;
    const medals=profileMedals([{medalId:id,unlockedAt:'bad'},{medalId:id,unlockedAt:'2026-10-02T00:00:00Z'}],
      [{medalId:id,unlockedAt:'2026-10-01T00:00:00Z'},{medalId:definitions[0].id,unlockedAt:'2026-10-03T00:00:00Z'}]);
    expect(medals).toHaveLength(2);expect(medals[1].unlockedAt).toBe('2026-10-01T00:00:00Z');
  });
  it('ignores unknown medals and supports an empty collection',()=>{
    expect(profileMedals([{medalId:'unknown',unlockedAt:'2026-10-01T00:00:00Z'}],[])).toEqual([]);
  });
});

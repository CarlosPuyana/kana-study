import { describe, expect, it } from 'vitest';
import { deinflect, inflectedReading, matchesInflectionRules } from './japanese-deinflection.service';
describe('Japanese deinflection',()=>{
  it.each([
    ['食べました','食べる'],['食べません','食べる'],['食べなかった','食べる'],['食べて','食べる'],
    ['読みました','読む'],['読んだ','読む'],['読んで','読む'],['書いた','書く'],['泳いだ','泳ぐ'],['話した','話す'],['待った','待つ'],['行った','行く'],
    ['読んでいる','読む'],['読んでる','読む'],['高かった','高い'],['高くない','高い'],['高くなかった','高い'],['できなかった','できる'],['来なかった','来る'],
    ['食べたい','食べる'],['読みたい','読む'],['高すぎる','高い'],['読める','読む'],['読まれる','読む'],['読ませる','読む'],['読もう','読む'],['読め','読む'],['食べさせられました','食べる'],
  ])('%s can resolve to %s',(surface,base)=>expect(deinflect(surface).some(candidate=>candidate.base===base)).toBe(true));
  it('rejects non-Japanese input and excessive length',()=>{for(const value of ['hello','','食べた!','あ'.repeat(33)])expect(deinflect(value)).toEqual([]);});
  it('rejects incompatible dictionary POS and accepts godan subclasses',()=>{
    const candidate=deinflect('読んだ').find(row=>row.base==='読む')!;
    expect(matchesInflectionRules('n',candidate)).toBe(false);expect(matchesInflectionRules('v1',candidate)).toBe(false);expect(matchesInflectionRules('v5m',candidate)).toBe(true);
  });
  it('never treats nouns as validated inflected verbs',()=>{expect(deinflect('学校')).toEqual([]);expect(deinflect('さくら').filter(row=>matchesInflectionRules('n',row))).toEqual([]);});
  it('bounds branching, depth and repeated candidates',()=>{for(const value of ['食べさせられませんでした','読んでいなかった','あられるるる']){const rows=deinflect(value);expect(rows.length).toBeLessThanOrEqual(95);expect(rows.every(row=>row.depth<=4&&row.base!==value)).toBe(true);expect(new Set(rows.map(row=>row.base+'|'+row.classes.join(','))).size).toBe(rows.length);}});
  it('reconstructs a reading only when suffixes are guaranteed',()=>{const candidate=deinflect('食べなかった').find(row=>row.base==='食べる')!;expect(inflectedReading('たべる',candidate)).toBe('たべなかった');expect(inflectedReading('unknown',candidate)).toBeUndefined();});
});

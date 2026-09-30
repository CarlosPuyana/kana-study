import { fisherYatesShuffle, repairAdjacentContent } from './random-order';

describe('random study order', () => {
  it('uses Fisher-Yates with an injectable random source', () => {
    expect(fisherYatesShuffle(['a', 'b', 'c', 'd'], () => 0)).toEqual(['b', 'c', 'd', 'a']);
  });

  it('repairs adjacent equal content without losing units', () => {
    const source = [
      { key: 'a:one', contentId: 'a' },
      { key: 'a:two', contentId: 'a' },
      { key: 'b:one', contentId: 'b' },
      { key: 'c:one', contentId: 'c' },
    ];
    const result = repairAdjacentContent(source, item => item.contentId);
    expect(new Set(result.map(item => item.key))).toEqual(new Set(source.map(item => item.key)));
    for (let index = 1; index < result.length; index++) {
      expect(result[index].contentId).not.toBe(result[index - 1].contentId);
    }
  });

  it('terminates when only one content id exists', () => {
    const source = [{ key: 'a:one', contentId: 'a' }, { key: 'a:two', contentId: 'a' }];
    expect(repairAdjacentContent(source, item => item.contentId)).toEqual(source);
  });
});

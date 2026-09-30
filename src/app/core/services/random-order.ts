export type RandomSource = () => number;

export function fisherYatesShuffle<T>(
  items: readonly T[],
  random: RandomSource = Math.random,
): T[] {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index--) {
    const swapIndex = Math.floor(random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

export function repairAdjacentContent<T>(
  items: readonly T[],
  contentId: (item: T) => string,
): T[] {
  const result = [...items];
  for (let index = 1; index < result.length; index++) {
    if (contentId(result[index]) !== contentId(result[index - 1])) continue;
    const alternative = result.findIndex((item, candidate) =>
      candidate > index
      && contentId(item) !== contentId(result[index - 1])
      && (candidate === result.length - 1
        || contentId(result[index]) !== contentId(result[candidate + 1])),
    );
    if (alternative >= 0) {
      [result[index], result[alternative]] = [result[alternative], result[index]];
    }
  }
  return result;
}

export function shuffledWithoutAdjacentContent<T>(
  items: readonly T[],
  contentId: (item: T) => string,
  random: RandomSource = Math.random,
): T[] {
  return repairAdjacentContent(fisherYatesShuffle(items, random), contentId);
}

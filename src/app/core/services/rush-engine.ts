import { RushUnit } from '../models/rush.model';

export type RushRandom = () => number;

export function fisherYates<T>(items: readonly T[], random: RushRandom = Math.random): T[] {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index--) {
    const swap = Math.floor(random() * (index + 1));
    [result[index], result[swap]] = [result[swap], result[index]];
  }
  return result;
}

export function createRushBag(
  units: readonly RushUnit[],
  previousContentId: string | null,
  random: RushRandom = Math.random,
): RushUnit[] {
  const bag = fisherYates(units, random);
  if (previousContentId && bag.length > 1 && bag[0].contentId === previousContentId) {
    const alternative = bag.findIndex((unit, index) => index > 0 && unit.contentId !== previousContentId);
    if (alternative >= 0) [bag[0], bag[alternative]] = [bag[alternative], bag[0]];
  }
  for (let index = 1; index < bag.length; index++) {
    if (bag[index].contentId !== bag[index - 1].contentId) continue;
    const alternative = bag.findIndex((unit, candidate) =>
      candidate > index && unit.contentId !== bag[index - 1].contentId);
    if (alternative >= 0) [bag[index], bag[alternative]] = [bag[alternative], bag[index]];
  }
  return bag;
}

export class RushEngine {
  private bag: RushUnit[];
  private index = 0;
  private lastCompletedContentId: string | null = null;
  cyclesCompleted = 0;

  constructor(
    readonly units: readonly RushUnit[],
    private readonly random: RushRandom = Math.random,
  ) {
    if (!units.length) throw new Error('Rush requires at least one unit');
    this.bag = createRushBag(units, null, random);
  }

  get current(): RushUnit { return this.bag[this.index]; }
  get willCompleteCycle(): boolean { return this.index === this.bag.length - 1; }

  completeCurrent(): { readonly unit: RushUnit; readonly cycleCompleted: boolean } {
    const unit = this.current;
    this.lastCompletedContentId = unit.contentId;
    this.index++;
    let cycleCompleted = false;
    if (this.index >= this.bag.length) {
      this.cyclesCompleted++;
      cycleCompleted = true;
      this.bag = createRushBag(this.units, this.lastCompletedContentId, this.random);
      this.index = 0;
    }
    return { unit, cycleCompleted };
  }
}

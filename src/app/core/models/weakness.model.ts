export type WeaknessModule = 'kana' | 'vocabulary' | 'kanji';
/** More activities can extend this union when their detection rules are defined. */
export type WeaknessActivity = 'writing';

export interface WeaknessRecord {
  readonly module: WeaknessModule;
  readonly activity: WeaknessActivity;
  readonly itemId: string;
  readonly attempts: number;
  readonly failures: number;
  readonly consecutiveCorrect: number;
  readonly score: number;
  readonly lastAttemptAt: string;
}

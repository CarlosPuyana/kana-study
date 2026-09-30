export type RushModule = 'kana' | 'kanji' | 'vocabulary';

export interface RushUnit {
  readonly key: string;
  readonly module: RushModule;
  readonly contentId: string;
  readonly questionType: string;
}

export interface RushConfiguration {
  readonly selectedContentIds: readonly string[];
  readonly questionTypes: readonly string[];
}

export interface RushSession {
  readonly id: string;
  readonly module: RushModule;
  readonly startedAt: number;
  readonly endedAt: number | null;
  readonly localDay: string;
  readonly activeSeconds: number;
  readonly cardsCompleted: number;
  readonly uniqueContentsSeen: number;
  readonly cyclesCompleted: number;
  readonly initialUnitCount: number;
  readonly interrupted: boolean;
}

export interface RushCoverage {
  readonly module: RushModule;
  readonly contentId: string;
  readonly firstSeenAt: number;
}

export interface RushSessionSummary {
  readonly module: RushModule;
  readonly activeSeconds: number;
  readonly cardsCompleted: number;
  readonly uniqueContentsSeen: number;
  readonly cyclesCompleted: number;
}

export interface RushAggregateStats {
  readonly sessions: readonly RushSession[];
  readonly coverage: readonly RushCoverage[];
}

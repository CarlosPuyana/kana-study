import { MedalProgress, MedalState, MedalUnlock } from '../models/medal.model';
import { RushAggregateStats, RushModule } from '../models/rush.model';
import { RUSH_MEDAL_DEFINITIONS } from '../../data/rush-medals';

export function evaluateRushMedals(stats: RushAggregateStats, unlocks: readonly MedalUnlock[]): readonly MedalState[] {
  const valid = stats.sessions.filter(session => session.cardsCompleted > 0);
  const cards = valid.reduce((sum, session) => sum + session.cardsCompleted, 0);
  const seconds = valid.reduce((sum, session) => sum + session.activeSeconds, 0);
  const modules = new Set(valid.map(session => session.module));
  const coverage = (module: RushModule) => stats.coverage.filter(item => item.module === module).length;
  const moduleDays = new Map<string, Set<RushModule>>();
  for (const session of valid) {
    const day = moduleDays.get(session.localDay) ?? new Set<RushModule>();
    day.add(session.module); moduleDays.set(session.localDay, day);
  }
  const counter = (current: number, target: number): MedalProgress => ({ type: 'counter', current, target });
  const bool = (completed: boolean): MedalProgress => ({ type: 'boolean', completed });
  const calculated: Record<string, MedalProgress> = {
    'rush-first': counter(valid.length, 1), 'rush-10-sessions': counter(valid.length, 10),
    'rush-100-cards': counter(cards, 100), 'rush-1000-cards': counter(cards, 1000),
    'rush-5000-cards': counter(cards, 5000), 'rush-30-minutes': counter(seconds, 1800),
    'rush-5-hours': counter(seconds, 18000), 'rush-25-hours': counter(seconds, 90000),
    'rush-all-modules': counter(modules.size, 3), 'rush-kana-all': counter(coverage('kana'), 210),
    'rush-kanji-all': counter(coverage('kanji'), 80), 'rush-vocabulary-all': counter(coverage('vocabulary'), 662),
    'rush-secret-triple-day': bool([...moduleDays.values()].some(day => day.size === 3)),
    'rush-secret-marathon': bool(valid.some(session => session.activeSeconds >= 3600)),
    'rush-secret-double-cycle': bool(valid.some(session => session.initialUnitCount >= 20 && session.cyclesCompleted >= 2)),
  };
  const unlockMap = new Map(unlocks.map(unlock => [unlock.medalId, unlock]));
  return RUSH_MEDAL_DEFINITIONS.map(definition => ({
    definition, progress: calculated[definition.id], unlock: unlockMap.get(definition.id) ?? null,
    unlocked: unlockMap.has(definition.id),
  }));
}

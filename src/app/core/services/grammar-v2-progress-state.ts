import type { ProgressV2 } from './grammar-v2-progress.service';
import { GrammarV2Answer } from '../models/grammar-v2.model';

const object = (value: unknown): Record<string, any> => value !== null && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, any> : {};
const time = (value: unknown): number => typeof value === 'string' ? Date.parse(value) || 0 : 0;
const latest = (a: any, b: any, field = 'updatedAt'): any => time(a?.[field]) > time(b?.[field]) ? a : b ?? a;
const first = (a: string | undefined, b: string | undefined): string | undefined => !a ? b : !b ? a : time(a) < time(b) ? a : b;

function answers(local: unknown, remote: unknown): Record<string, GrammarV2Answer> {
  const a = object(local), b = object(remote), result: Record<string, GrammarV2Answer> = {};
  for (const id of new Set([...Object.keys(a), ...Object.keys(b)])) {
    const left = a[id], right = b[id], chosen = latest(left, right, 'answeredAt');
    if (!chosen) continue;
    // Without per-attempt IDs, adding snapshot counters would count retries twice.
    const correctCount = Math.max(left?.correctCount ?? 0, right?.correctCount ?? 0);
    result[id] = {...chosen, solved: correctCount > 0 || !!left?.solved || !!right?.solved,
      attempts: Math.max(left?.attempts ?? 0, right?.attempts ?? 0), correctCount};
  }
  return result;
}

/** V2-only union; completion is derived from the union of solved exercise IDs. */
export function mergeGrammarV2Progress(local: unknown, remote: unknown, catalog?: ReadonlyMap<string, readonly string[]>): ProgressV2 {
  const a = object(local)['version'] === 2 ? object(local) : {}, b = object(remote)['version'] === 2 ? object(remote) : {};
  const result: ProgressV2 = {version: 2, concepts: {}, practices: {}, review: {}};
  for (const id of new Set([...Object.keys(object(a['concepts'])), ...Object.keys(object(b['concepts']))])) {
    const concept = {id};
    if (catalog && !catalog.has(id)) continue;
    const left = object(a['concepts'])[concept.id], right = object(b['concepts'])[concept.id];
    if (!left && !right) continue;
    const mergedAnswers = answers(left?.answers, right?.answers), openedAt = first(left?.openedAt, right?.openedAt);
    const completed = !!openedAt && (catalog ? catalog.get(id)!.every(id => mergedAnswers[id]?.solved)
      : left?.status === 'completed' || right?.status === 'completed');
    const row = {...latest(left, right), answers: mergedAnswers, startedAt: first(left?.startedAt, right?.startedAt),
      ...(openedAt ? {openedAt} : {}), status: completed ? 'completed' : 'in-progress',
      attempts: Object.values(mergedAnswers).reduce((n, answer) => n + answer.attempts, 0),
      correct: Object.values(mergedAnswers).reduce((n, answer) => n + answer.correctCount, 0)};
    delete row.completedAt;
    if (completed) row.completedAt = first(left?.completedAt, right?.completedAt) ?? row.updatedAt;
    result.concepts[concept.id] = row;
  }
  for (const field of ['practices', 'review'] as const) {
    for (const id of new Set([...Object.keys(object(a[field])), ...Object.keys(object(b[field]))]))
      (result[field] as Record<string, any>)[id] = latest(object(a[field])[id], object(b[field])[id]);
  }
  if (a['resume'] || b['resume']) result.resume = latest(a['resume'], b['resume']);
  const left = object(a['integration']), right = object(b['integration']);
  if (Object.keys(left).length || Object.keys(right).length) {
    result.integration = {activities: {}};
    const openedAt = first(left['openedAt'], right['openedAt']);
    if (openedAt) result.integration.openedAt = openedAt;
    for (const id of new Set([...Object.keys(object(left['activities'])), ...Object.keys(object(right['activities']))])) {
      const section = {id};
      const x = object(left['activities'])[section.id], y = object(right['activities'])[section.id];
      if (x || y) result.integration.activities[section.id] = {...latest(x,y), openedAt: first(x?.openedAt,y?.openedAt)!, answers: answers(x?.answers,y?.answers)};
    }
    const resume = right['resumeActivityId'] ?? left['resumeActivityId'];
    if (resume) result.integration.resumeActivityId = resume;
  }
  return result;
}

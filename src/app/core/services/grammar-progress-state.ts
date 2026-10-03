import { emptyGrammarProgress, GrammarAnswer, GrammarConceptProgress, GrammarDifficulty, GrammarPracticeProgress, GrammarProgressStateV1, GrammarResume } from '../models/grammar-progress.model';

const object = (value: unknown): Record<string, unknown> => value !== null && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
const date = (value: unknown): string | undefined => typeof value === 'string' && Number.isFinite(Date.parse(value)) ? new Date(value).toISOString() : undefined;
const index = (value: unknown): number => typeof value === 'number' && Number.isInteger(value) && value >= 0 ? value : 0;
const id = (value: unknown): value is string => typeof value === 'string' && /^[0-9]{2}\.[0-9]+$/.test(value);
const topic = (value: unknown): value is string => typeof value === 'string' && /^[0-9]{2}$/.test(value);

/** Structural validation also used by sync, without eagerly loading the Grammar curriculum. */
export function readGrammarProgress(value: unknown): GrammarProgressStateV1 {
  const input = object(value), state = emptyGrammarProgress();
  if (input['version'] !== 1) return state;
  for (const [key, raw] of Object.entries(object(input['concepts']))) {
    const row = object(raw), startedAt = date(row['startedAt']), updatedAt = date(row['updatedAt']);
    if (!id(key) || row['conceptId'] !== key || !topic(row['topicId']) || key.split('.')[0] !== row['topicId'] || !startedAt || !updatedAt) continue;
    const answers: Record<string, GrammarAnswer> = {};
    for (const [exerciseId, answer] of Object.entries(object(row['answers']))) {
      const entry = object(answer), answeredAt = date(entry['answeredAt']);
      if (/^[\w.-]+$/.test(exerciseId) && typeof entry['correct'] === 'boolean' && answeredAt) answers[exerciseId] = {correct: entry['correct'], answeredAt};
    }
    state.concepts[key] = {conceptId: key, topicId: row['topicId'], startedAt, updatedAt,
      status: row['status'] === 'completed' ? 'completed' : Object.keys(answers).length ? 'in-progress' : 'not-started',
      answers, lastExerciseIndex: index(row['lastExerciseIndex']), ...(date(row['completedAt']) ? {completedAt: date(row['completedAt'])} : {})};
  }
  for (const [key, raw] of Object.entries(object(input['practices']))) {
    const row = object(raw), attemptedAt = date(row['attemptedAt']), updatedAt = date(row['updatedAt']);
    if (!topic(key) || row['topicId'] !== key || !attemptedAt || !updatedAt || typeof row['total'] !== 'number' || !Number.isInteger(row['total']) || row['total'] <= 0 || typeof row['score'] !== 'number' || !Number.isInteger(row['score']) || row['score'] < 0 || row['score'] > row['total']) continue;
    state.practices[key] = {topicId: key, attemptedAt, updatedAt, score: row['score'], total: row['total'], errorConceptIds: Array.isArray(row['errorConceptIds']) ? [...new Set(row['errorConceptIds'].filter((value): value is string => id(value) && value.startsWith(key + '.')))] : []};
  }
  for (const [key, raw] of Object.entries(object(input['review']))) {
    const row = object(raw), updatedAt = date(row['updatedAt']);
    if (!id(key) || row['conceptId'] !== key || !topic(row['topicId']) || !key.startsWith(row['topicId'] + '.') || typeof row['active'] !== 'boolean' || !updatedAt) continue;
    state.review[key] = {conceptId: key, topicId: row['topicId'], active: row['active'], updatedAt,
      ...(date(row['flaggedAt']) ? {flaggedAt: date(row['flaggedAt'])} : {}),
      ...(date(row['clearedAt']) ? {clearedAt: date(row['clearedAt'])} : {}),
      ...(typeof row['lastFailedExerciseId'] === 'string' ? {lastFailedExerciseId: row['lastFailedExerciseId']} : {})};
  }
  const resume = object(input['resume']), updatedAt = date(resume['updatedAt']);
  if (id(resume['conceptId']) && typeof resume['path'] === 'string' && updatedAt) state.resume = {conceptId: resume['conceptId'], path: resume['path'], exerciseIndex: index(resume['exerciseIndex']), updatedAt};
  return state;
}

function latest<T extends {updatedAt: string}>(a: T, b: T): T {
  return a.updatedAt > b.updatedAt ? a : a.updatedAt < b.updatedAt ? b : JSON.stringify(a) >= JSON.stringify(b) ? a : b;
}
function mergeRows<T>(a: Record<string, T>, b: Record<string, T>, merge: (a: T, b: T) => T): Record<string, T> {
  return Object.fromEntries([...new Set([...Object.keys(a), ...Object.keys(b)])].sort().map(key => [key, a[key] && b[key] ? merge(a[key], b[key]) : a[key] ?? b[key]]));
}

/** Per-record merge; completed records and independent answers survive an older payload. */
export function mergeGrammarProgress(local: unknown, remote: unknown): GrammarProgressStateV1 {
  const a = readGrammarProgress(local), b = readGrammarProgress(remote);
  const concepts = mergeRows<GrammarConceptProgress>(a.concepts, b.concepts, (x, y) => {
    const completed = x.status === 'completed' || y.status === 'completed';
    const completedAt = [x.completedAt, y.completedAt].filter((v): v is string => !!v).sort()[0];
    return {...latest(x, y), startedAt: [x.startedAt, y.startedAt].sort()[0], status: completed ? 'completed' : 'in-progress',
      ...(completedAt ? {completedAt} : {}), answers: mergeRows(x.answers, y.answers, (x, y) => x.answeredAt > y.answeredAt ? x : x.answeredAt < y.answeredAt ? y : x.correct ? x : y)};
  });
  const review = mergeRows<GrammarDifficulty>(a.review, b.review, (x, y) => x.updatedAt === y.updatedAt && x.active !== y.active ? x.active ? y : x : latest(x, y));
  const practices = mergeRows<GrammarPracticeProgress>(a.practices, b.practices, latest);
  const resume: GrammarResume | undefined = a.resume && b.resume ? latest(a.resume, b.resume) : a.resume ?? b.resume;
  return {version: 1, concepts, practices, review, ...(resume ? {resume} : {})};
}

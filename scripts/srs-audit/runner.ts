import '@angular/compiler';
import { createEnvironmentInjector, runInInjectionContext } from '@angular/core';
import { strict as assert } from 'node:assert';
import { writeFileSync, readFileSync } from 'node:fs';
import { createEmptyCard, fsrs, generatorParameters, Rating, State, FSRSAlgorithm, forgetting_curve, dateDiffInDays, FSRSVersion } from 'ts-fsrs';
import { SpacedRepetitionService } from '../../src/app/core/services/spaced-repetition.service';
import { DeckSchedulerService, DECK_SCHEDULER_ENABLE_FUZZ } from '../../src/app/core/services/deck-scheduler.service';
import { serializeDeckCard, deserializeDeckCard, serializeDeckReviewLog } from '../../src/app/core/services/deck-study-serialization';
import { formatStudyInterval, nextLocalStudyDayStart, deckCardEligible } from '../../src/app/core/services/deck-study-time';
import type { SerializedFsrsCard, DeckCardProgress } from '../../src/app/core/models/deck-study.model';
import type { FsrsProgress, StudyRating } from '../../src/app/core/models/progress.model';

const day = 86_400_000, start = new Date('2026-11-04T11:00:00Z');
const params = generatorParameters();
assert.equal(JSON.parse(readFileSync('node_modules/ts-fsrs/package.json', 'utf8')).version, '5.4.2');
const vocab = new SpacedRepetitionService();
function deck(fuzz: boolean) {
  const injector = createEnvironmentInjector([{ provide: DECK_SCHEDULER_ENABLE_FUZZ, useValue: fuzz }], null!);
  return { injector, scheduler: runInInjectionContext(injector, () => new DeckSchedulerService()) };
}
const unfuzzed = deck(false), production = deck(true);
function progress(card: SerializedFsrsCard): DeckCardProgress {
  return { deckId: 'audit-only', entryId: 'synthetic-ashita', card, due: card.due, state: card.state };
}
function toVocab(card: SerializedFsrsCard): FsrsProgress {
  return { ...card, due: new Date(card.due).toISOString(), lastReview: card.lastReview === null ? null : new Date(card.lastReview).toISOString(),
    state: (['new', 'learning', 'review', 'relearning'] as const)[card.state] };
}
function fromVocab(card: FsrsProgress): SerializedFsrsCard {
  return { ...card, due: Date.parse(card.due), lastReview: card.lastReview === null ? null : Date.parse(card.lastReview),
    state: ({ new: 0, learning: 1, review: 2, relearning: 3 } as const)[card.state] };
}
const rows: any[] = [];
function step(module: 'vocab' | 'deck' | 'deck-fuzz', scenario: string, card: SerializedFsrsCard | null, at: Date, rating: StudyRating, retention = .9) {
  const before = card ?? serializeDeckCard(createEmptyCard(at));
  let after: SerializedFsrsCard;
  if (module === 'vocab') after = fromVocab(vocab.review(card ? toVocab(card) : null, rating, at));
  else {
    assert.notEqual(rating, 'hard');
    const scheduler = module === 'deck-fuzz' ? production.scheduler : unfuzzed.scheduler;
    after = scheduler.branch(scheduler.preview(card ? progress(card) : null, retention, at), rating as 'again' | 'good', at).card;
  }
  const elapsed = before.lastReview === null ? 0 : dateDiffInDays(new Date(before.lastReview), at);
  const row = { scenario, module, at: at.toISOString(), retention, rating, before, elapsed,
    retrievability: before.lastReview === null ? null : forgetting_curve(params.w, elapsed, before.stability), after,
    intervalDays: (after.due - at.getTime()) / day, due: new Date(after.due).toISOString(),
    label: formatStudyInterval(after.state === 2 && after.scheduledDays > 0 ? after.scheduledDays * day : after.due - at.getTime()) };
  rows.push(row);
  return after;
}
for (const module of ['vocab', 'deck', 'deck-fuzz'] as const) {
  for (const rating of (module === 'vocab' ? ['again', 'hard', 'good'] : ['again', 'good']) as StudyRating[]) step(module, 'A: nueva', null, start, rating);
  let card: SerializedFsrsCard | null = null;
  let at = start;
  for (let i = 1; i <= 10; i++) {
    card = step(module, `${i <= 3 ? 'B' : i <= 6 ? 'C' : 'D'}: bien #${i}`, card, at, 'good');
    at = new Date(card.due);
    if (i === 6) {
      const failed = step(module, 'E: olvido tras intervalo largo', card, at, 'again');
      step(module, 'E: recuperación', failed, new Date(failed.due), 'good');
    }
  }
}
let hard: SerializedFsrsCard | null = null;
let hardAt = start;
for (let i = 1; i <= 5; i++) {
  hard = step('vocab', `F: CASI #${i}`, hard, hardAt, 'hard');
  hardAt = new Date(hard.due);
}
const common = serializeDeckCard({ ...createEmptyCard(start), state: State.Review, reps: 8, stability: 30, difficulty: 5,
  scheduled_days: 30, last_review: new Date(start.getTime() - 30 * day) });
for (const rating of ['again', 'good'] as const) {
  const a = step('vocab', 'G: historia equivalente', common, start, rating);
  const b = step('deck', 'G: historia equivalente', common, start, rating);
  assert.deepEqual(a, b);
  step('deck-fuzz', 'G: historia equivalente', common, start, rating);
}
for (const retention of [.8, .85, .9, .95, .97]) step('deck', 'Retención: misma historia', common, start, 'good', retention);
// Normal Vocabulary has at most one round per Madrid day, unlike direct engine calls.
let dailyCard: SerializedFsrsCard | null = null;
let dailyAt = start;
for (let i = 1; i <= 5; i++) {
  dailyCard = step('vocab', `Vocabulario diario: bien #${i}`, dailyCard, dailyAt, 'good');
  dailyAt = new Date(Math.max(dailyCard.due, dailyAt.getTime() + day));
}
// Hard on an already consolidated card, not just a card stuck in learning.
let hardReview = common;
for (let i = 1; i <= 3; i++) {
  hardReview = step('vocab', `F: CASI consolidada #${i}`, hardReview, i === 1 ? start : new Date(hardReview.due), 'hard');
}

// Independent equations from FSRS-6, compared with the installed implementation.
const w = params.w, algorithm = new FSRSAlgorithm(params);
const r = (1 + (Math.pow(.9, -1 / w[20]) - 1) * 30 / 30) ** -w[20];
assert.ok(Math.abs(r - .9) < 1e-10);
assert.equal(forgetting_curve(w, 30, 30), .9);
const expectedS = 30 * (1 + Math.exp(w[8]) * (11 - 5) * 30 ** -w[9] * (Math.exp((1 - r) * w[10]) - 1));
assert.ok(Math.abs(algorithm.next_state({ stability: 30, difficulty: 5 }, 30, Rating.Good).stability - expectedS) < 1e-6);
assert.equal(algorithm.next_interval(30, 30), 30);
assert.deepEqual(unfuzzed.scheduler.preview(progress(common), .9, start).good.card,
  serializeDeckCard(fsrs(params).next(deserializeDeckCard(common), start, Rating.Good).card));
assert.deepEqual(production.scheduler.preview(progress(common), .9, start), production.scheduler.preview(progress(common), .9, start));
assert.deepEqual(serializeDeckCard(deserializeDeckCard(common) as any), common);

const learning = fromVocab(vocab.review(null, 'good', start));
const graduationAt = new Date(learning.due);
const graduation = unfuzzed.scheduler.preview(progress(learning), .9, graduationAt);
const official = fsrs(params).next(deserializeDeckCard(learning), graduationAt, Rating.Good);
// FSRS log describes the PREVIOUS card; it must not be rewritten to match the next interval.
assert.deepEqual(graduation.good.log, serializeDeckReviewLog(official.log));
assert.deepEqual(graduation.good.card, serializeDeckCard(official.card));
assert.equal(graduation.good.card.stability, official.card.stability);
const anchored = unfuzzed.scheduler.branch(graduation, 'again', new Date(graduationAt.getTime() + 13_000));
assert.equal(anchored.card.due - (graduationAt.getTime() + 13_000), graduation.again.card.due - graduation.generatedAt);
const delayedAt = new Date(start.getTime() + 2 * day);
assert.throws(() => unfuzzed.scheduler.branch(unfuzzed.scheduler.preview(progress(common), .9, start), 'good', delayedAt), /preview expired/);
const recalculated = unfuzzed.scheduler.preview(progress(common), .9, delayedAt).good.card;
assert.notEqual(unfuzzed.scheduler.preview(progress(common), .9, start).good.card.stability, recalculated.stability);
const midnightA = new Date('2026-11-04T23:59:00Z'), midnightB = new Date('2026-11-05T00:01:00Z');
assert.equal(dateDiffInDays(midnightA, midnightB), 1);
const midnightCard = { ...common, lastReview: midnightA.getTime() };
const reportedR = unfuzzed.scheduler.preview(progress(midnightCard), .9, midnightB).retrievabilityBefore;
const usedR = forgetting_curve(params.w, dateDiffInDays(midnightA, midnightB), midnightCard.stability);
assert.equal(reportedR, 1);
assert.equal(usedR, .99505387);
assert.notEqual(reportedR, usedR);
assert.equal(dateDiffInDays(new Date('2026-11-04T00:01:00Z'), new Date('2026-11-04T23:59:00Z')), 0);
assert.equal(nextLocalStudyDayStart(new Date('2026-03-28T23:00:00Z')) - Date.parse('2026-03-28T23:00:00Z'), 23 * 3_600_000);
assert.equal(nextLocalStudyDayStart(new Date('2026-10-24T22:00:00Z')) - Date.parse('2026-10-24T22:00:00Z'), 25 * 3_600_000);
assert.equal(deckCardEligible({ ...common, due: Date.parse('2026-11-04T20:00:00Z') }, start), true);
assert.deepEqual(formatStudyInterval(74 * day), { value: 2, unit: 'months' });
assert.deepEqual(formatStudyInterval(75 * day), { value: 3, unit: 'months' });
const maximumCard = { ...deserializeDeckCard(common), stability: 36500, difficulty: 1, last_review: new Date(start.getTime() - 365 * day) };
const maximumGood = fsrs(params).next(maximumCard, start, Rating.Good).card.scheduled_days;
assert.equal(maximumGood, 36501); // Upstream Hard+1 ordering exceeds maximum_interval at saturation.

// Synthetic これ examples requested for the rebuild. These are engine simulations,
// not Nora's history and not an independent reference implementation of Anki.
const koreStart=rows.length, koreDay=new Date('2026-11-08T12:00:00Z');
let kore:SerializedFsrsCard|null=null,koreAt=koreDay;
for(const rating of ['again','again','good'] as const){kore=step('deck','Kore A: nueva',kore,koreAt,rating);koreAt=new Date(kore.due);}
step('deck','Kore B: graduación',kore,koreAt,'good');
for(const [name,stability]of [['C',30],['E',90]]as const){
 const mature={...common,stability,scheduledDays:stability,lastReview:koreDay.getTime()-stability*day,due:koreDay.getTime(),reps:50};
 const lapse=step('deck',`Kore ${name}: olvido`,mature,koreDay,'again');
 step('deck',`Kore ${name}: recuperación`,lapse,new Date(lapse.due),'good');
 if(name==='E')step('deck','Kore E: Good sin olvido registrado',mature,koreDay,'good');
}
kore=null;koreAt=koreDay;
for(let i=0;i<3;i++){kore=step('deck','Kore D: fallos ayer',kore,koreAt,'again');koreAt=new Date(kore.due);}
step('deck','Kore D: Good hoy',kore,new Date(koreDay.getTime()+day),'good');
writeFileSync('.cache/anki-parity/kore-scenarios.json',JSON.stringify(rows.slice(koreStart),null,2)+'\n');

const evidence = { version: FSRSVersion, start: start.toISOString(), weights: params.w, parameters: params,
  checks: 'All assertions passed', rows, delayedPreview: { at: delayedAt.toISOString(), expiredPreviewRejected: true, recalculated },
  edgeCases: { midnight: { before: midnightA.toISOString(), after: midnightB.toISOString(), reportedR, usedR }, maximumGood },
  rounding: [29, 30, 44, 45, 60, 74, 75, 90, 104, 105, 364, 365].map(days => ({ days, label: formatStudyInterval(days * day) })) };
writeFileSync('.cache/srs-audit/results.json', JSON.stringify(evidence, null, 2) + '\n');
const n = (v: number | null) => v === null ? '—' : Number(v.toFixed(4));
const table = ['| Escenario / módulo | Respuesta / fecha UTC / retención | Antes: estado, reps, S, D | t UTC / R del cálculo | Después: estado, reps, S, D | Intervalo días / nominal | Due UTC |',
  '| --- | --- | --- | --- | --- | --- | --- |', ...rows.map(x => `| ${x.scenario} / ${x.module} | ${x.rating} / ${x.at} / ${x.retention} | ${x.before.state}, ${x.before.reps}, ${n(x.before.stability)}, ${n(x.before.difficulty)} | ${x.elapsed} / ${n(x.retrievability)} | ${x.after.state}, ${x.after.reps}, ${n(x.after.stability)}, ${n(x.after.difficulty)} | ${n(x.intervalDays)} / ${x.after.scheduledDays} | ${x.due} |`)];
writeFileSync('.cache/srs-audit/tables.md', table.join('\n') + '\n');
unfuzzed.injector.destroy(); production.injector.destroy();
console.log(`${FSRSVersion}: ${rows.length} transitions; math, equivalence, logs, preview, serialization, UTC and Madrid DST checks PASS. Evidence: .cache/srs-audit/results.json and tables.md`);

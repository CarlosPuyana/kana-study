import { createEmptyCard, fsrs, generatorParameters, State } from 'ts-fsrs';
import { MangaReviewEvent } from '../models/manga-review.model';
import { MangaStudySavedItem } from '../models/manga-study-saved.model';
import { AppLanguage } from '../models/settings.model';
import { isMangaFsrsEvent, MangaFsrsCard } from '../models/manga-fsrs.model';
import { serializeDeckCard } from './deck-study-serialization';
import { mangaContext, mangaRecallEvidence } from './manga-review-generator';

/** V1 replay contract: ts-fsrs 5.4.2 / FSRS-6.0, frozen weights, no fuzz. */
export const MANGA_FSRS_PARAMETERS = generatorParameters({request_retention: 0.9, enable_fuzz: false,
  enable_short_term: true, maximum_interval: 36500, learning_steps: ['1m', '10m'], relearning_steps: ['10m'],
  w: [0.212,1.2931,2.3065,8.2956,6.4133,0.8334,3.0194,0.001,1.8722,0.1666,0.796,1.4835,0.0614,0.2629,1.6483,0.6014,1.8729,0.5425,0.0912,0.0658,0.1542]});
const compare = (a: string, b: string) => a < b ? -1 : a > b ? 1 : 0;

/** Pure projection: never persists, queues, syncs or changes saved words. */
export function replayMangaFsrs(items: readonly MangaStudySavedItem[], history: readonly MangaReviewEvent[], language: AppLanguage): MangaFsrsCard[] {
  const scheduler = fsrs(MANGA_FSRS_PARAMETERS);
  const events = [...new Map(history.filter(isMangaFsrsEvent).map(event => [event.id, event])).values()]
    .sort((a, b) => Date.parse(a.reviewedAt) - Date.parse(b.reviewedAt) || compare(a.id, b.id));
  return [...new Map(items.map(item => [item.id, item])).values()].sort((a,b) => compare(a.id,b.id)).flatMap(item => {
    const evidence = mangaRecallEvidence(item, language);
    if (!evidence.meaning && !evidence.reading) return [];
    // For New, epoch is a stable sentinel: due immediately, independent of reload.
    let card = createEmptyCard(new Date(0));
    for (const event of events) if (event.savedItemId === item.id) {
      card = scheduler.next(card, new Date(event.reviewedAt), event.fsrsGrade).card;
    }
    return [{item, card: serializeDeckCard(card), ...evidence, context: mangaContext(item)}];
  });
}
export function mangaFsrsQueue(cards: readonly MangaFsrsCard[], now: number): MangaFsrsCard[] {
  const due = cards.filter(row => row.card.state !== State.New && row.card.due <= now)
    .sort((a,b) => a.card.due - b.card.due || compare(a.item.id,b.item.id)).slice(0,10);
  const fresh = cards.filter(row => row.card.state === State.New).slice(0,5);
  return [...due, ...fresh];
}

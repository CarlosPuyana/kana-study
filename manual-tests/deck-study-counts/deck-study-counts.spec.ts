import { expect, Page, test } from '@playwright/test';
import { JAPANESE_1500_ENTRIES } from '../../src/app/data/japanese-1500.generated';

const NOW = new Date('2026-11-10T18:00:00Z');
const ids = JAPANESE_1500_ENTRIES.slice(0, 8).map(e => e.id);
test.beforeEach(async ({ page }) => {
  await page.route('**/supabase-config.js', r => r.fulfill({ contentType: 'text/javascript', body: 'window.__KANA_STUDY_CONFIG__={};' }));
  await page.route('**/*.supabase.co/**', r => r.abort());
  await page.clock.install({ time: NOW });
  await page.addInitScript(() => {
    if (!localStorage.getItem('kana-study.settings.v1')) localStorage.setItem('kana-study.settings.v1', JSON.stringify({ language: 'es', theme: matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark' }));
    if (!localStorage.getItem('kana-study.deck-settings.v1')) localStorage.setItem('kana-study.deck-settings.v1', JSON.stringify({ 'japanese-1500': { desiredRetention: .9, newCardsPerDay: 1, newCardOrder: 'before-reviews' } }));
  });
});
async function counts(page: Page, expected: number[]) {
  await expect(page.locator('.header-counts > span')).toHaveCount(3);
  await expect(page.locator('.header-counts b')).toHaveText(expected.map(String));
  await expect(page.locator('.learning-pending')).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
}
async function stored(page: Page) {
  return page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const req = indexedDB.open('kana-study-decks'); req.onsuccess = () => resolve(req.result); req.onerror = () => reject(req.error);
    });
    const read = (store: string) => new Promise<unknown[]>(r => { const req = db.transaction(store).objectStore(store).getAll(); req.onsuccess = () => r(req.result); });
    const result = await Promise.all([read('card-progress'), read('review-events')]); db.close(); return result;
  });
}
async function seed(page: Page, rows: { state: number; minutes: number }[], limit: number) {
  await page.goto('./#/anki/japanese-1500/cards');
  await expect(page.locator('.entry-card').first()).toBeVisible();
  await page.evaluate(async ({ rows, ids, now, limit }) => {
    localStorage.setItem('kana-study.deck-settings.v1', JSON.stringify({ 'japanese-1500': { desiredRetention: .9, newCardsPerDay: limit, newCardOrder: 'before-reviews' } }));
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const req = indexedDB.open('kana-study-decks', 1);
      req.onerror = () => reject(req.error);
      req.onupgradeneeded = () => {
        const db = req.result, p = db.createObjectStore('card-progress', { keyPath: ['deckId', 'entryId'] });
        p.createIndex('deckId', 'deckId'); p.createIndex('due', 'due'); p.createIndex('state', 'state');
        const e = db.createObjectStore('review-events', { keyPath: 'id' });
        e.createIndex('deckId', 'deckId'); e.createIndex('entryId', 'entryId'); e.createIndex('reviewedAt', 'reviewedAt'); e.createIndex('deckId-reviewedAt', ['deckId', 'reviewedAt']);
        db.createObjectStore('daily-state', { keyPath: ['deckId', 'localDate'] });
      };
      req.onsuccess = () => resolve(req.result);
    });
    const tx = db.transaction('card-progress', 'readwrite');
    rows.forEach(({ state, minutes }, i) => {
      const due = now + minutes * 60000;
      tx.objectStore('card-progress').put({ deckId: 'japanese-1500', entryId: ids[i], due, state,
        card: { due, state, stability: 30, difficulty: 5, elapsedDays: 30, scheduledDays: 30, learningSteps: 0, reps: 20, lapses: 1, lastReview: now - 30 * 86400000 } });
    });
    await new Promise<void>((r, reject) => { tx.oncomplete = () => r(); tx.onerror = () => reject(tx.error); }); db.close();
  }, { rows, ids, now: NOW.getTime(), limit });
  await page.goto('./#/anki/japanese-1500/study');
}
async function answer(page: Page, rating: 'again' | 'good') {
  await page.locator('.reveal').click(); await page.locator('.ratings .' + rating).click();
}

test('mixed steps count once through clock, focus, reload, translations and voluntary close', async ({ page }, info) => {
  await seed(page, [{ state: 1, minutes: -1 }, { state: 3, minutes: 10 }, { state: 1, minutes: 40 }, { state: 3, minutes: 60 }, { state: 2, minutes: -1 }, { state: 2, minutes: 1440 }], 9);
  await counts(page, [9, 4, 1]);
  const before = await stored(page);
  await page.clock.fastForward(61 * 60000); await counts(page, [9, 4, 1]);
  await page.evaluate(() => window.dispatchEvent(new Event('focus'))); await counts(page, [9, 4, 1]);
  await page.reload(); await counts(page, [9, 4, 1]);
  expect(await stored(page)).toEqual(before);
  for (const [language, labels] of [['es', ['Nuevas', 'Aprendiendo', 'Repasos']], ['en', ['New', 'Learning', 'Reviews']], ['ca', ['Noves', 'Aprenent', 'Repassos']]] as const) {
    await page.evaluate(language => {
      const key = 'kana-study.settings.v1'; localStorage.setItem(key, JSON.stringify({ ...JSON.parse(localStorage.getItem(key)!), language }));
    }, language);
    await page.reload(); await counts(page, [9, 4, 1]);
    for (const label of labels) await expect(page.locator('.header-counts')).toContainText(label);
  }
  await page.screenshot({ path: `.cache/deck-study-counts/header-${info.project.name}.png`, fullPage: true });
  await page.locator('.finish-today').click(); await expect(page.locator('.result-hero')).toBeVisible();
  await counts(page, [9, 4, 1]); await page.reload(); await counts(page, [9, 4, 1]);
  expect(await stored(page)).toEqual(before);
  await page.clock.fastForward(24 * 60 * 60000); await counts(page, [9, 4, 2]);
});

for (const rating of ['again', 'good'] as const) test(`new ${rating} stays in Learning until real graduation`, async ({ page }) => {
  await page.goto('./#/anki/japanese-1500/study'); await counts(page, [1, 0, 0]);
  await answer(page, rating); await counts(page, [0, 1, 0]);
  await page.reload(); await counts(page, [0, 1, 0]);
  if (rating === 'again') { await answer(page, 'good'); await counts(page, [0, 1, 0]); }
  await answer(page, 'good'); await counts(page, [0, 0, 0]);
  await expect(page.locator('.result-hero')).toBeVisible();
  await expect(page.locator('.study-header .undo')).toHaveCount(0);
});

for (const rating of ['again', 'good'] as const) test(`Review ${rating} updates persisted counters`, async ({ page }) => {
  await seed(page, [{ state: 2, minutes: -1 }], 0); await counts(page, [0, 0, 1]);
  await answer(page, rating); await counts(page, [0, rating === 'again' ? 1 : 0, 0]);
  const [progress] = await stored(page) as [{ card: { state: number } }[], unknown[]];
  expect(progress[0].card.state).toBe(rating === 'again' ? 3 : 2);
  await page.reload(); await counts(page, [0, rating === 'again' ? 1 : 0, 0]);
});

test('future steps remain visible in a closed session with the existing next availability explanation', async ({ page }) => {
  await seed(page, [{ state: 1, minutes: 40 }, { state: 3, minutes: 60 }], 0);
  await counts(page, [0, 2, 0]); await expect(page.locator('.result-hero')).toBeVisible();
  await expect(page.locator('.result-hero')).toContainText('Próxima sesión');
  const before = await stored(page); await page.reload(); await counts(page, [0, 2, 0]);
  expect(await stored(page)).toEqual(before);
});

import { test, expect, Page } from '@playwright/test';
import { JAPANESE_1500_ENTRIES } from '../../src/app/data/japanese-1500.generated';

const NOW = new Date('2026-11-06T11:46:00Z');
const entries = JAPANESE_1500_ENTRIES.slice(0, 4);
const answers = new WeakMap<Page, number>();
test.beforeEach(async ({ page }) => {
  await page.route('**/supabase-config.js', r => r.fulfill({ contentType: 'text/javascript', body: 'window.__KANA_STUDY_CONFIG__={};' }));
  await page.route('**/*.supabase.co/**', r => r.abort());
  await page.addInitScript(() => {
    localStorage.setItem('kana-study.settings.v1', JSON.stringify({ language: 'es', theme: matchMedia('(prefers-color-scheme:light)').matches ? 'light' : 'dark' }));
    localStorage.setItem('kana-study.deck-settings.v1', JSON.stringify({ 'japanese-1500': { desiredRetention: .9, newCardsPerDay: 0, newCardOrder: 'after-reviews' } }));
  });
  await page.clock.setFixedTime(NOW);
  await page.goto('./#/anki/japanese-1500/study');
  await expect(page.locator('.end-state')).toBeVisible(); // Angular has opened/initialized its real database.
  await page.evaluate(async ({ ids, now }) => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const r = indexedDB.open('kana-study-decks');
      r.onerror = () => reject(r.error); r.onsuccess = () => resolve(r.result);
    });
    const tx = db.transaction('card-progress', 'readwrite');
    const dues = ['11:30:00', '11:45:00', '17:00:00', '19:30:00'];
    for (const [i, entryId] of ids.entries()) {
      const due = Date.parse(`2026-11-06T${dues[i]}Z`);
      tx.objectStore('card-progress').put({ deckId: 'japanese-1500', entryId, due, state: 2,
        card: { due, state: 2, stability: 30, difficulty: 5, elapsedDays: 30, scheduledDays: 30,
          learningSteps: 0, reps: 10, lapses: 1, lastReview: now - 30 * 86_400_000 } });
    }
    await new Promise<void>((resolve, reject) => { tx.oncomplete = () => resolve(); tx.onerror = () => reject(tx.error); });
    db.close();
  }, { ids: entries.map(e => e.id), now: NOW.getTime() });
  await page.reload();
});

async function word(page: Page, i: number) { await expect(page.locator('.front h1')).toHaveText(entries[i].word); }
async function answer(page: Page, rating: 'again' | 'good') {
  const count = (answers.get(page) ?? 0) + 1; answers.set(page, count);
  await page.clock.setFixedTime(new Date(NOW.getTime() + count * 1_000));
  await page.locator('.reveal').click();
  await expect(page.locator('.ratings button')).toHaveCount(2);
  await page.locator('.ratings .' + rating).click();
}

test('daily future hours are eligible; each response persists and the mandatory sequence completes', async ({ page }, info) => {
  await word(page, 0);
  await expect(page.locator('.advance-note')).toContainText('antes de su hora');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  await page.screenshot({ path: `.cache/deck-daily-queue/study-${info.project.name}.png`, fullPage: true });
  await answer(page, 'good');
  await word(page, 1); await answer(page, 'good');
  await word(page, 2); await answer(page, 'again');
  await word(page, 3); await answer(page, 'good');
  await word(page, 2); await answer(page, 'good');
  await expect(page.locator('.result-hero')).toBeVisible();
  await expect(page.locator('.metrics strong')).toHaveText(['4', '80%', '1']);
  await expect(page.locator('.metric-help')).toContainText('5 valoraciones guardadas');
  await expect(page.locator('.difficulties li')).toHaveCount(1);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  await page.screenshot({ path: `.cache/deck-daily-queue/completed-${info.project.name}.png`, fullPage: true });
  await page.reload();
  await expect(page.locator('.metrics strong')).toHaveText(['4', '80%', '1']);
});

test('separation survives reload; Undo restores the exact prior card and does not duplicate history', async ({ page }, info) => {
  await word(page, 0); await answer(page, 'again');
  await word(page, 1); await answer(page, 'good');
  await word(page, 2); // A still owes a second distinct alternative
  await page.reload(); await word(page, 2);
  await answer(page, 'good'); await word(page, 0);
  await page.locator('.undo').click(); await word(page, 2);
  await answer(page, 'good'); await word(page, 0);
  await answer(page, 'good'); await word(page, 3);
  await answer(page, 'good');
  await expect(page.locator('.metrics strong')).toHaveText(['4', '80%', '1']);
  await expect(page.locator('.metric-help')).toContainText('5 valoraciones guardadas');
  await page.goto('./#/anki/japanese-1500/cards');
  await page.getByRole('button', { name: 'Por Tiempo', exact: true }).click();
  await expect(page.locator('.time-heading').filter({ hasText: 'Hoy, más tarde' })).toHaveCount(0);
  await page.locator('.time-heading').filter({ hasText: /^Mañana/ }).click();
  await page.locator('.entry-card').first().click();
  await page.locator('.history>summary').click();
  await expect(page.locator('.timeline>li')).toHaveCount(2);
  await page.screenshot({ path: `.cache/deck-daily-queue/history-${info.project.name}.png`, fullPage: true });
});

test('two distinct intermediates precede a repeated earlier-due card; leaving does not create an answer', async ({ page }) => {
  await word(page, 0); await answer(page, 'again');
  await word(page, 1); await answer(page, 'again');
  await word(page, 2); await answer(page, 'good');
  await word(page, 0); // both B and C counted, regardless of B remaining today
  await page.goto('./#/anki');
  await page.goto('./#/anki/japanese-1500/study'); await word(page, 0);
  await answer(page, 'good');
  await word(page, 1); await answer(page, 'good');
  await word(page, 3); await answer(page, 'good');
  await expect(page.locator('.metrics strong')).toHaveText(['4', '67%', '2']);
  await expect(page.locator('.metric-help')).toContainText('6 valoraciones guardadas');
});

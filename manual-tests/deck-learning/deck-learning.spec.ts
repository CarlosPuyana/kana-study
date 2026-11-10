import {resumeScheduledStep} from './scheduled-step';
import { test, expect, Page } from '@playwright/test';
import { JAPANESE_1500_ENTRIES } from '../../src/app/data/japanese-1500.generated';
const NOW = new Date('2026-11-05T11:00:00Z'), DAY = 86_400_000;
const ids = JAPANESE_1500_ENTRIES.slice(0, 20).map(e => e.id);
test.beforeEach(async ({ page }) => {
  await page.route('**/supabase-config.js', r => r.fulfill({ contentType: 'text/javascript', body: 'window.__KANA_STUDY_CONFIG__={};' }));
  // No requests to production accounts or data are permitted by this fixture.
  await page.route('**/*.supabase.co/**', r => r.abort());
  await page.addInitScript(() => {
    if (!localStorage.getItem('kana-study.settings.v1')) localStorage.setItem('kana-study.settings.v1', JSON.stringify({ language: 'es', theme: matchMedia('(prefers-color-scheme:light)').matches ? 'light' : 'dark' }));
    if (!localStorage.getItem('kana-study.deck-settings.v1')) localStorage.setItem('kana-study.deck-settings.v1', JSON.stringify({ 'japanese-1500': { desiredRetention: .9, newCardsPerDay: 1, newCardOrder: 'mixed' } }));
  });
  await page.clock.setFixedTime(NOW);
});
async function noOverflow(page: Page) { expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true); }
async function seed(page: Page) {
  await page.evaluate(async ({ ids, now, day }) => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const r = indexedDB.open('kana-study-decks', 1);
      r.onerror = () => reject(r.error);
      r.onupgradeneeded = () => {
        const d = r.result, p = d.createObjectStore('card-progress', { keyPath: ['deckId', 'entryId'] });
        p.createIndex('deckId', 'deckId'); p.createIndex('due', 'due'); p.createIndex('state', 'state');
        const e = d.createObjectStore('review-events', { keyPath: 'id' });
        e.createIndex('deckId', 'deckId'); e.createIndex('entryId', 'entryId'); e.createIndex('reviewedAt', 'reviewedAt'); e.createIndex('deckId-reviewedAt', ['deckId', 'reviewedAt']);
        d.createObjectStore('daily-state', { keyPath: ['deckId', 'localDate'] });
      }; r.onsuccess = () => resolve(r.result);
    });
    const tx = db.transaction('card-progress', 'readwrite');
    for (const [i, offset] of [-1, .1, 1, 5, 10, 45, 90, 120].entries()) {
      const due = now + offset * day, state = 2;
      tx.objectStore('card-progress').put({ deckId: 'japanese-1500', entryId: ids[i], due, state,
        card: { due, state, stability: 30, difficulty: 5, elapsedDays: 25, scheduledDays: 30, learningSteps: 0, reps: 5, lapses: 1, lastReview: now - 25 * day } });
    }
    await new Promise<void>((resolve, reject) => { tx.oncomplete = () => resolve(); tx.onerror = () => reject(tx.error); }); db.close();
  }, { ids, now: NOW.getTime(), day: DAY });
}
test('All stays intact; By time lazily groups persisted remaining dates and shows exact details', async ({ page }, info) => {
  await page.goto('./#/anki/japanese-1500/cards');
  await expect(page.locator('.entry-card')).toHaveCount(120); await seed(page);
  await page.getByRole('button', { name: 'Por Tiempo', exact: true }).click();
  await expect(page.locator('.time-group')).toHaveCount(9);
  await expect(page.locator('.entry-card')).toHaveCount(0);
  await page.locator('.time-heading').filter({ hasText: 'En 5 días' }).click();
  await expect(page.locator('.entry-card')).toHaveCount(1);
  await noOverflow(page); await page.screenshot({ path: `.cache/deck-time-summary/time-${info.project.name}.png`, fullPage: true });
  await page.locator('.entry-card').click();
  await expect(page.locator('.detail .close')).toBeFocused();
  await expect(page.locator('.history>summary')).toBeVisible();
  await page.keyboard.press('Shift+Tab'); await expect(page.locator('.history>summary')).toBeFocused();
  await page.keyboard.press('Tab'); await expect(page.locator('.detail .close')).toBeFocused();
  await expect(page.locator('.schedule-detail time')).toHaveAttribute('datetime', '2026-11-10T11:00:00.000Z');
  await expect(page.locator('.schedule-detail dl div').filter({ hasText: 'Tiempo restante desde ahora' }).locator('dd')).toHaveText('5 días');
  await expect(page.locator('.schedule-detail')).toContainText('30 días');
  await noOverflow(page); await page.screenshot({ path: `.cache/deck-time-summary/detail-${info.project.name}.png`, fullPage: true });
  await page.getByRole('button', { name: 'Cerrar' }).click();
  await expect(page.locator('.entry-card')).toBeFocused();
  await page.getByRole('button', { name: 'Todos', exact: true }).click();
  await expect(page.locator('.entry-card')).toHaveCount(120);
  await page.getByRole('searchbox').fill('#124'); await expect(page.locator('.entry-card')).toHaveCount(1);
  const written = await page.locator('.entry-card .word').evaluate(node => {
    const copy = node.cloneNode(true) as Element; copy.querySelectorAll('rt,rp').forEach(n => n.remove()); return copy.textContent;
  });
  expect(written).toBe('食べる');
});
test('completed study derives unique cards, attempts, forecast and reinforcement; reload and undo preserve canonical events', async ({ page }, info) => {
  await page.goto('./#/anki/japanese-1500/study');
  await expect(page.locator('.front h1')).toBeVisible();
  for (const [i,rating] of ['again', 'good', 'good'].entries()) { if(i)await resumeScheduledStep(page);await page.locator('.reveal').click(); await page.locator('.ratings .' + rating).click(); }
  await expect(page.locator('.result-hero')).toBeVisible();
  await expect(page.locator('.metrics strong')).toHaveText(['1', '67%', '1']);
  await expect(page.locator('.metric-help')).toContainText('3 valoraciones guardadas');
  await expect(page.locator('.forecast table tbody tr')).toHaveCount(7);
  await expect(page.locator('.bars .column').first()).toContainText('1');
  await expect(page.locator('.difficulties li')).toHaveCount(1);
  await expect(page.locator('.difficulties app-kaishi-card-media')).toHaveCount(0);
  await expect(page.locator('.difficulties button')).toHaveCount(1);
  await noOverflow(page); await page.screenshot({ path: `.cache/deck-time-summary/summary-${info.project.name}.png`, fullPage: true });
  await expect(page.locator('.undo')).toBeDisabled();
  await expect(page.locator('.metrics strong')).toHaveText(['1', '67%', '1']);
  await page.reload(); await expect(page.locator('.metrics strong')).toHaveText(['1', '67%', '1']);
  await page.getByRole('link', { name: 'Volver a Mazos', exact: true }).click();
  await page.goto('./#/anki/japanese-1500/study'); await expect(page.locator('.metrics strong')).toHaveText(['1', '67%', '1']);
});
test('calendar midnight moves tomorrow into later today without changing stored timestamps', async ({ page }) => {
  await page.goto('./#/anki/japanese-1500/cards'); await seed(page);
  await page.clock.install({ time: new Date('2026-11-05T22:59:58Z') });
  await page.getByRole('button', { name: 'Por Tiempo', exact: true }).click();
  await expect(page.locator('.time-heading').filter({ hasText: /^Mañana/ })).toHaveCount(1);
  await page.clock.fastForward(3000);
  await expect(page.locator('.time-heading').filter({ hasText: 'Hoy, más tarde' })).toHaveCount(1);
  await expect(page.locator('.time-heading').filter({ hasText: /^Mañana/ })).toHaveCount(0);
});
test('English and Catalan labels load in both new views without translation keys', async ({ page }, info) => {
  for (const language of ['en', 'ca']) {
    await page.goto('./#/anki/japanese-1500/cards');
    await page.evaluate(lang => {
      const key = 'kana-study.settings.v1', settings = JSON.parse(localStorage.getItem(key)!);
      localStorage.setItem(key, JSON.stringify({ ...settings, language: lang }));
    }, language);
    await page.reload();
    await page.getByRole('button', { name: language === 'en' ? 'By time' : 'Per temps', exact: true }).click();
    await expect(page.locator('.time-heading')).toHaveCount(language === 'en' ? 1 : 2);
    await expect(page.locator('main')).not.toContainText('anki.results.');
    await page.goto('./#/anki/japanese-1500/study');
    if (language === 'en') {
      for (let i = 0; i < 2; i++) { if(i)await resumeScheduledStep(page);await page.locator('.reveal').click(); await page.locator('.good').click(); }
    }
    await expect(page.locator('.metrics strong')).toHaveText(['1', '100%', '0']);
    await expect(page.locator('.results-layout')).not.toContainText('anki.results.');
    await noOverflow(page);
    await page.screenshot({ path: `.cache/deck-time-summary/summary-${language}-${info.project.name}.png`, fullPage: true });
  }
});
test('public Puyi uses its own private schedule and summary, separate from Japanese 1500', async ({ page }, info) => {
  await page.unroute('**/supabase-config.js');
  await page.route('**/supabase-config.js', r => r.fulfill({ contentType: 'text/javascript', body: 'window.__KANA_STUDY_CONFIG__={supabaseUrl:"https://puyi-fixture.supabase.co",supabasePublishableKey:"puyi-fixture-public-key-not-a-secret"};' }));
  await page.route('https://puyi-fixture.supabase.co/**', async r => {
    if (new URL(r.request().url()).pathname === '/rest/v1/puyi_cards') await r.fulfill({ json: [{
      id: '00000000-0000-0000-0000-000000000001', position: 1, version: 1, word: '試験', kana: 'しけん', meaning: 'prueba local',
      exampleSentence: '試験です。', exampleTranslation: 'Es una prueba.', image_path: null,
      created_at: NOW.toISOString(), updated_at: NOW.toISOString(), author_id: 'fixture-only',
    }] });
    else await r.abort();
  });
  await page.goto('./#/anki/mazo-puyi/cards'); await expect(page.locator('.entry-card')).toHaveCount(1);
  await page.getByRole('button', { name: 'Por Tiempo', exact: true }).click(); await expect(page.locator('.time-heading')).toContainText('Nuevas, sin programar');
  await page.goto('./#/anki/mazo-puyi/study');
  for (let i = 0; i < 2; i++) { if(i)await resumeScheduledStep(page);await page.locator('.reveal').click(); await page.locator('.good').click(); }
  await expect(page.locator('.metrics strong')).toHaveText(['1', '100%', '0']);
  await expect(page.locator('.result-deck')).toHaveText('Mazo Puyi');
  await page.reload(); await expect(page.locator('.metrics strong')).toHaveText(['1', '100%', '0']);
  await page.screenshot({ path: `.cache/deck-time-summary/puyi-${info.project.name}.png`, fullPage: true });
  await page.goto('./#/anki/mazo-puyi/cards'); await page.locator('.entry-card').click(); await page.locator('.history>summary').click();
  await expect(page.locator('.timeline>li')).toHaveCount(2);
  await page.goto('./#/anki/japanese-1500/cards'); await page.getByRole('button', { name: 'Por Tiempo', exact: true }).click();
  await expect(page.locator('.time-heading')).toHaveCount(1); await expect(page.locator('.time-heading b')).toHaveText('1500');
});

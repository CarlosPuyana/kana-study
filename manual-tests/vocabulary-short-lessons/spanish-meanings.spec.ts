import {test, expect} from '@playwright/test';
import {VOCABULARY_N5} from '../../src/app/data/vocabulary-n5.generated';

test('reviewed Spanish labels render in a real lesson and details without changing saved progress', async ({page}, info) => {
  const target = VOCABULARY_N5.find(entry => entry.primaryWrittenForm === '着る')!;
  await page.route('**/supabase-config.js', route => route.fulfill({contentType: 'text/javascript', body: 'window.__KANA_STUDY_CONFIG__={};'}));
  await page.route('**/*.supabase.co/**', route => route.abort());
  await page.clock.setFixedTime(new Date('2026-11-08T11:00:00Z'));
  await page.addInitScript(({ids, targetId, theme}) => {
    if (localStorage.getItem('qa-spanish-meanings')) return;
    localStorage.setItem('qa-spanish-meanings', '1');
    localStorage.setItem('kana-study.settings.v1', JSON.stringify({language: 'es', theme}));
    const progress: Record<string, unknown> = {};
    for (const id of ids) {
      const key = `vocab:${id}:japanese-to-meaning`;
      progress[key] = {key, entryId: id, questionType: 'japanese-to-meaning',
        fsrs: {due: id === targetId ? '2026-11-08T10:00:00Z' : '2026-11-20T11:00:00Z', lastReview: '2026-11-01T11:00:00Z',
          stability: 30, difficulty: 5, elapsedDays: 7, scheduledDays: 7, learningSteps: 0, reps: 10, lapses: 0, state: 'review'},
        firstSeenAt: '2026-11-01T11:00:00Z', lastSeenAt: '2026-11-01T11:00:00Z', totalAttempts: 10,
        totalFirstTrySuccesses: 10, totalFailures: 0, lastRating: 'good'};
    }
    localStorage.setItem('kana-study.vocabulary-progress.v1', JSON.stringify(progress));
  }, {ids: VOCABULARY_N5.map(entry => entry.id), targetId: target.id, theme: info.project.use.colorScheme === 'light' ? 'light' : 'dark'});
  await page.goto('./#/vocabulary');
  const before = await page.evaluate(() => localStorage.getItem('kana-study.vocabulary-progress.v1'));
  await page.locator('.play-button').click();
  await page.locator('.secondary-start').click();
  await expect(page.locator('.exercise')).toBeVisible();
  await page.locator('.reveal').click();
  await expect(page.locator('.answer h2')).toHaveText(target.quizMeaning.es);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  await page.screenshot({path: `.cache/vocabulary-spanish-audit/reveal-${info.project.name}.png`, fullPage: true});
  await page.goto('./#/vocabulary/all');
  for (const written of ['お皿', 'どなた', '着る', '半分']) {
    const entry = VOCABULARY_N5.find(row => row.primaryWrittenForm === written)!;
    await page.locator('.card').filter({has: page.getByText(entry.quizMeaning.es, {exact: true})}).click();
    await expect(page.locator('.detail h2')).toHaveText(entry.meanings.es.join(' · '));
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    await page.screenshot({path: `.cache/vocabulary-spanish-audit/detail-${entry.id}-${info.project.name}.png`, fullPage: true});
    await page.locator('.detail .close').click();
  }
  expect(await page.evaluate(() => localStorage.getItem('kana-study.vocabulary-progress.v1'))).toBe(before);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('kana-study.vocabulary-review-events.v1') ?? '[]'))).toEqual([]);
});

test('normalized Japanese forms and restricted readings remain legible in card details', async ({page}, info) => {
  const language = info.project.name.includes('-en-') ? 'en' : info.project.name.includes('-ca-') ? 'ca' : 'es';
  await page.route('**/supabase-config.js', route => route.fulfill({contentType: 'text/javascript', body: 'window.__KANA_STUDY_CONFIG__={};'}));
  await page.route('**/*.supabase.co/**', route => route.abort());
  await page.addInitScript(({language, theme}) => {
    localStorage.setItem('kana-study.settings.v1', JSON.stringify({language, theme}));
  }, {language, theme: info.project.use.colorScheme === 'light' ? 'light' : 'dark'});
  await page.goto('./#/vocabulary/all');
  await expect(page.locator('.grid > .card')).toHaveCount(662);
  for (const [form, reading] of [['いい', 'いい'], ['とり肉', 'とりにく'], ['散歩する', 'さんぽする'],
    ['勉強する', 'べんきょうする'], ['毎月', 'まいげつ'], ['川', 'かわ']]) {
    const index = VOCABULARY_N5.findIndex(entry => entry.primaryWrittenForm === form);
    expect(index).toBeGreaterThanOrEqual(0);
    await page.locator('.grid > .card').nth(index).click();
    await expect(page.locator('.detail .reading strong')).toHaveText(reading);
    expect(await page.locator('.detail-character').evaluate(element => {
      const copy = element.cloneNode(true) as HTMLElement;
      copy.querySelectorAll('rt').forEach(reading => reading.remove());
      return copy.textContent;
    })).toBe(form);
    if (form === 'とり肉') {
      await expect(page.locator('.detail')).toContainText('鶏肉（けいにく）');
      await expect(page.locator('.detail')).toContainText('鳥肉（ちょうにく）');
      await expect(page.locator('.detail')).not.toContainText('とり肉（けいにく）');
      await page.screenshot({path: `.cache/vocabulary-final-review/restricted-readings-${info.project.name}.png`, fullPage: false});
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    await page.locator('.detail .close').click();
  }
  expect(await page.evaluate(() => localStorage.getItem('kana-study.vocabulary-progress.v1'))).toBeNull();
});

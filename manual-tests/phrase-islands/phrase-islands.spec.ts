import { expect, Page, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.route('**/supabase-config.js', r => r.fulfill({ contentType: 'text/javascript', body: 'window.__KANA_STUDY_CONFIG__={};' }));
  await page.route('**/*.supabase.co/**', r => r.abort());
  await page.clock.setFixedTime(new Date('2026-11-17T12:00:00Z'));
  await page.addInitScript(() => {
    if (!localStorage.getItem('kana-study.settings.v1')) localStorage.setItem('kana-study.settings.v1', JSON.stringify({ language: 'es', theme: matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark' }));
  });
});
async function noOverflow(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
}
async function existingDecks(page: Page) {
  await expect(page.locator('.deck-list .deck-card').first()).toBeVisible();
  return page.locator('.deck-list .deck-card').evaluateAll(cards => cards.map(c => ({
    title: c.querySelector('h3')?.textContent, stats: c.querySelector('.stats')?.textContent,
    links: [...c.querySelectorAll('a')].map(a => a.getAttribute('href')),
  })));
}

test('Mazos → Islas → Mazos preserves decks; keyboard selection is accessible and ephemeral', async ({ page }, info) => {
  await page.goto('./#/anki');
  const decks = await existingDecks(page); expect(decks.length).toBeGreaterThanOrEqual(1);
  const explore = page.getByRole('link', { name: 'Explorar islas' });
  await expect(explore).toHaveAttribute('href', '#/anki/islands');
  await explore.scrollIntoViewIfNeeded(); await noOverflow(page);
  await page.screenshot({ path: `.cache/phrase-islands/decks-${info.project.name}.png`, fullPage: true });
  await explore.click(); await expect(page).toHaveURL(/#\/anki\/islands$/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Islas de frases');
  await expect(page).toHaveTitle('Islas de frases · Kana Study');
  const topics = page.locator('.topic-card'); await expect(topics).toHaveCount(6);
  await expect(topics.locator('.coming-soon')).toHaveText(Array(6).fill('Próximamente'));
  await topics.first().focus(); await page.keyboard.press('Space'); await expect(topics.first()).toHaveAttribute('aria-pressed', 'true');
  await page.keyboard.press('Tab'); await expect(topics.nth(1)).toBeFocused();
  await page.keyboard.press('Enter'); await expect(topics.nth(1)).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.selection-summary')).toHaveText('Temáticas seleccionadas: 2');
  const focus = await topics.nth(1).evaluate(b => ({ outline: getComputedStyle(b).outlineStyle, width: getComputedStyle(b).outlineWidth }));
  expect(focus.outline).toBe('solid'); expect(parseFloat(focus.width)).toBeGreaterThanOrEqual(2);
  await page.keyboard.press('Enter'); await expect(topics.nth(1)).toHaveAttribute('aria-pressed', 'false');
  await topics.nth(4).click(); await expect(page.locator('.selection-summary')).toHaveText('Temáticas seleccionadas: 2');
  for (const mode of await page.locator('.mode-card').all()) await expect(mode).toBeDisabled();
  await noOverflow(page); await page.evaluate(() => scrollTo(0, 0));
  await page.screenshot({ path: `.cache/phrase-islands/islands-${info.project.name}.png`, fullPage: true });
  await page.locator('app-page-header .back-button').click(); await expect(page).toHaveURL(/#\/anki$/);
  expect(await existingDecks(page)).toEqual(decks);
  await explore.click(); await expect(page.locator('.topic-card[aria-pressed=true]')).toHaveCount(0);
  await page.locator('.topic-card').first().click(); await page.reload();
  await expect(page.locator('.topic-card[aria-pressed=true]')).toHaveCount(0);
  await page.goto('./#/anki/japanese-1500/study'); await expect(page.locator('.reveal')).toBeVisible();
  await expect(page.locator('.header-counts > span')).toHaveCount(3);
});

test('all languages, native disabled modes, contrast and no persistence/media on selection', async ({ page }) => {
  await page.goto('./#/anki/islands'); await expect(page.locator('.topic-card')).toHaveCount(6);
  for (const [language, title, first, comingSoon] of [
    ['es', 'Islas de frases', 'Vida cotidiana', 'Próximamente'],
    ['en', 'Phrase islands', 'Everyday life', 'Coming soon'],
    ['ca', 'Illes de frases', 'Vida quotidiana', 'Properament'],
  ]) {
    await page.evaluate(language => {
      const key = 'kana-study.settings.v1'; localStorage.setItem(key, JSON.stringify({ ...JSON.parse(localStorage.getItem(key)!), language }));
    }, language);
    await page.reload(); await expect(page.getByRole('heading', { level: 1 })).toHaveText(title);
    await expect(page).toHaveTitle(title + ' · Kana Study');
    await expect(page.locator('.topic-card').first()).toHaveAccessibleName(first);
    await expect(page.locator('.mode-card .coming-soon')).toHaveText(Array(3).fill(comingSoon));
    await expect(page.locator('main')).not.toContainText('phraseIslands.'); await noOverflow(page);
  }
  await page.evaluate(() => {
    const state = window as typeof window & { islandWrites: string[]; islandOpens: number };
    state.islandWrites = []; state.islandOpens = 0;
    const set = Storage.prototype.setItem;
    Storage.prototype.setItem = function(key, value) { state.islandWrites.push(key); return set.call(this, key, value); };
    const open = indexedDB.open.bind(indexedDB);
    indexedDB.open = (...args: Parameters<IDBFactory['open']>) => { state.islandOpens++; return open(...args); };
  });
  await page.locator('.topic-card').first().click(); await page.locator('.topic-card').nth(3).click();
  for (const mode of await page.locator('.mode-card').all()) {
    await expect(mode).toBeDisabled(); await mode.evaluate((b: HTMLButtonElement) => b.click());
  }
  await expect(page.locator('audio, video, .session')).toHaveCount(0);
  expect(await page.evaluate(() => {
    const state = window as typeof window & { islandWrites: string[]; islandOpens: number };
    return { writes: state.islandWrites, opens: state.islandOpens };
  })).toEqual({ writes: [], opens: 0 });
  const contrasts = await page.evaluate(() => {
    function channels(css: string) { return css.match(/[\d.]+/g)!.slice(0, 3).map(Number); }
    function luminance(color: number[]) { const c = color.map(v => { const n = v / 255; return n <= .04045 ? n / 12.92 : ((n + .055) / 1.055) ** 2.4; }); return c[0] * .2126 + c[1] * .7152 + c[2] * .0722; }
    const ratio = (a: number[], b: number[]) => { const values = [luminance(a), luminance(b)].sort((a, b) => b - a); return (values[0] + .05) / (values[1] + .05); };
    return [...document.querySelectorAll('.mode-title, .mode-description, .coming-soon')].map(element => {
      let parent: Element | null = element, background = 'rgba(0, 0, 0, 0)';
      while (parent && background === 'rgba(0, 0, 0, 0)') { background = getComputedStyle(parent).backgroundColor; parent = parent.parentElement; }
      return ratio(channels(getComputedStyle(element).color), channels(background));
    });
  });
  expect(Math.min(...contrasts)).toBeGreaterThanOrEqual(4.5);
});

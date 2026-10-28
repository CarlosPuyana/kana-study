import { test, expect, Page } from '@playwright/test';
test.beforeEach(async ({ page }) => {
    await page.route('**/supabase-config.js', r => r.fulfill({ contentType: 'text/javascript', body: 'window.__KANA_STUDY_CONFIG__ = {};' }));
    await page.addInitScript(() => { if (!localStorage.getItem('kana-study.settings.v1'))
        localStorage.setItem('kana-study.settings.v1', JSON.stringify({ language: 'es', theme: matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark' })); });
});
async function fixture(page: Page) {
    await page.goto('/#/anki');
    await expect(page.locator('app-anki-page')).toBeVisible();
    await page.evaluate(async () => {
        const component = (window as any).ng.getComponent(document.querySelector('app-anki-page'));
        const catalog = component.catalog;
        // Development-only fixture: DI gate is never enabled by a URL, storage flag or application UI.
        catalog.enabled.set(true);
        const now = '2026-10-21T12:00:00.000Z';
        const anchor = { authority: 'jmdict', entryId: '1467640', canonicalReading: 'ねこ', homographGroup: 'noun' };
        const encoded = JSON.stringify({ authority: anchor.authority, canonicalReading: anchor.canonicalReading, entryId: anchor.entryId, homographGroup: anchor.homographGroup });
        const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(encoded));
        const lexicalKey = 'lex1-' + Array.from(new Uint8Array(hash), n => n.toString(16).padStart(2, '0')).join('');
        const deck = { schemaVersion: 1, id: 'md-e2e', title: 'anki.title <猫> "\\', contentType: 'japanese-word', settings: { desiredRetention: .9, newCardsPerDay: 10, newCardOrder: 'mixed' }, status: 'active', createdAt: now, updatedAt: now };
        const card = { schemaVersion: 1, id: 'e2e-cat', deckId: deck.id, lexicalIdentity: { schemaVersion: 1, key: lexicalKey, anchor, spellings: ['猫'], evidenceVersion: 'fixture' }, direction: 'japanese-to-meaning', word: '猫', reading: 'ねこ', glosses: [{ text: 'gato <script>', language: 'es', source: { kind: 'curated', sourceId: 'fixture', revision: '1' } }], context: { text: '猫がいる。', sourceTitle: '原文' }, order: 1, contentVersion: 1, createdAt: now, updatedAt: now };
        await catalog.repository.create('e2e-create', deck, [card]);
        await catalog.refresh();
    });
    await expect(page.locator('app-deck-card').filter({ hasText: 'anki.title <猫>' })).toBeVisible();
}
async function hash(page: Page, path: string) { await page.evaluate(p => { location.hash = p; }, path); }
async function noOverflow(page: Page) { expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true); }
test('builtin stays available and custom routes are hidden by default', async ({ page }) => {
    await page.goto('/#/anki/japanese-1500/cards');
    await expect(page.locator('.entry-card').first()).toBeVisible();
    await expect(page.locator('.deck-summary')).toContainText('1500');
    await page.goto('/#/anki/md-e2e/study');
    await expect(page.getByRole('heading', { name: 'No se ha encontrado el mazo.' })).toBeVisible();
    await expect(page.locator('.ratings button')).toHaveCount(0);
    await noOverflow(page);
});
test('fixture catalog, plain content, Again/Good, reload gate and local history', async ({ page },testInfo) => {
    await fixture(page);
    await hash(page, '/anki/md-e2e/cards');
    await expect(page.locator('.entry-card')).toHaveCount(1);
    await expect(page.locator('.deck-summary h2')).toHaveText('anki.title <猫> "\\');
    await page.locator('.entry-card').click();
    await expect(page.getByRole('dialog')).toContainText('ねこ');
    await expect(page.getByRole('dialog')).toContainText('gato <script>');
    await expect(page.getByRole('dialog')).toContainText('猫がいる。');
    await expect(page.getByRole('dialog').locator('script')).toHaveCount(0);
    await page.keyboard.press('Escape');
    await noOverflow(page);
    await hash(page, '/anki/md-e2e/study');
    await expect(page.locator('.front h1')).toHaveText('猫');
    await expect(page.locator('.front')).not.toContainText('ねこ');
    await page.getByRole('button', { name: /mostrar respuesta/i }).click();
    await expect(page.locator('.ratings button')).toHaveCount(2);
    await expect(page.locator('.back-content')).toContainText('ねこ');
    await noOverflow(page);
    await page.screenshot({path:`test-results/h1-study-${testInfo.project.name}.png`,fullPage:true});
    await page.locator('.good').click();
    await expect(page.locator('.front h1')).toHaveText('猫');
    await expect(page.locator('.advance-note')).toBeVisible();
    await page.getByRole('button', { name: /mostrar respuesta/i }).click();
    await expect(page.locator('.good')).toContainText('Mañana');
    await page.locator('.good').click();
    await expect(page.locator('.end-state')).toBeVisible();
    await hash(page, '/anki/md-e2e/stats');
    await expect(page.locator('app-anki-stats-page')).toContainText('1');
    await hash(page,'/daily');
    await expect(page.getByRole('region',{name:'Actividad registrada hoy'})).toContainText('anki.title <猫>');
    await hash(page,'/anki/md-e2e/stats');
    await page.reload();
    await expect(page.locator('app-anki-stats-page')).toContainText('No se ha encontrado el mazo.');
    await hash(page, '/anki');
    await expect(page.locator('app-anki-page')).toBeVisible();
    await page.evaluate(async () => { const c = (window as any).ng.getComponent(document.querySelector('app-anki-page')).catalog; c.enabled.set(true); await c.refresh(); });
    await hash(page, '/anki/md-e2e/stats');
    await expect(page.locator('app-anki-stats-page')).not.toContainText('No se ha encontrado el mazo.');
    await noOverflow(page);
});

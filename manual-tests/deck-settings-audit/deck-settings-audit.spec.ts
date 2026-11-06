import { test, expect, Page } from '@playwright/test';
import { writeFile, mkdir } from 'node:fs/promises';
import { JAPANESE_1500_ENTRIES } from '../../src/app/data/japanese-1500.generated';

const NOW = new Date('2026-11-06T11:00:00Z');
const ids = JAPANESE_1500_ENTRIES.map(e => e.id);
test.beforeEach(async ({ page }) => {
  await page.route('**/supabase-config.js', r => r.fulfill({ contentType: 'text/javascript', body: 'window.__KANA_STUDY_CONFIG__={};' }));
  await page.route('**/*.supabase.co/**', r => r.abort());
  await page.addInitScript(() => {
    if (!localStorage.getItem('kana-study.settings.v1')) localStorage.setItem('kana-study.settings.v1', JSON.stringify({ language: 'es', theme: matchMedia('(prefers-color-scheme:light)').matches ? 'light' : 'dark' }));
  });
  await page.clock.setFixedTime(NOW);
});
async function open(page: Page, id = 'japanese-1500') {
  await page.goto(`./#/anki/${id}/settings`); await expect(page.locator('form .save-button')).toBeVisible();
  await expect(page.locator('.today-info dd')).toHaveCount(3);
}
async function save(page: Page, count: string, order: string, retention: string) {
  await page.locator('input[type=number]').fill(count);
  await page.locator(`input[name=order][value="${order}"]`).locator('..').click();
  await page.locator(`input[name=retention][value="${retention}"]`).locator('..').click();
  await page.locator('.save-button').click(); await expect(page.locator('.save-row [role=status]')).toHaveText('Ajustes guardados.');
  await expect(page.locator('.save-button')).toBeFocused();
}
async function records(page: Page) {
  return page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const r = indexedDB.open('kana-study-decks'); r.onsuccess = () => resolve(r.result); r.onerror = () => reject(r.error);
    });
    try {
      const all = (store: string) => new Promise<unknown[]>((resolve, reject) => {
        const r = db.transaction(store).objectStore(store).getAll(); r.onsuccess = () => resolve(r.result); r.onerror = () => reject(r.error);
      });
      return { progress: await all('card-progress'), events: await all('review-events'), daily: await all('daily-state') };
    } finally { db.close(); }
  });
}
async function seed(page: Page, count = 40) {
  // Study opens the application's real schema; no sleep or private browser state.
  await page.goto('./#/anki/japanese-1500/study'); await expect(page.locator('.front h1')).toBeVisible();
  await page.evaluate(async ({ ids, now, count }) => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const r = indexedDB.open('kana-study-decks'); r.onsuccess = () => resolve(r.result); r.onerror = () => reject(r.error);
    });
    const tx = db.transaction('card-progress', 'readwrite');
    for (let i = 0; i < count; i++) {
      const due = now + (i - 20) * 60_000;
      tx.objectStore('card-progress').put({ deckId: 'japanese-1500', entryId: ids[i], due, state: 2,
        card: { due, state: 2, stability: 30, difficulty: 5, elapsedDays: 30, scheduledDays: 30,
          learningSteps: 0, reps: 8, lapses: 0, lastReview: now - 30 * 86_400_000 } });
    }
    await new Promise<void>((resolve, reject) => { tx.oncomplete = () => resolve(); tx.onerror = () => reject(tx.error); }); db.close();
  }, { ids, now: NOW.getTime(), count });
}

test('records current responsive design, keyboard operation and measured focus/contrast evidence', async ({ page }, info) => {
  await open(page);
  await expect(page.locator('input[name=retention][value="0.9"]')).toBeChecked();
  await expect(page.locator('input[name=order][value="mixed"]')).toBeChecked();
  await expect(page.locator('input[type=number]')).toHaveValue('10');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  await mkdir('.cache/deck-settings-improvements', { recursive: true });
  await page.screenshot({ path: `.cache/deck-settings-improvements/settings-${info.project.name}.png`, fullPage: true });
  const metrics = await page.evaluate(() => {
    const box = (selector: string) => { const r = document.querySelector(selector)!.getBoundingClientRect(); return { top: r.top, width: r.width, height: r.height }; };
    const style = (selector: string) => {
      const s = getComputedStyle(document.querySelector(selector)!);
      return { color: s.color, background: s.backgroundColor, fontSize: s.fontSize, weight: s.fontWeight };
    };
    return { viewport: { width: innerWidth, height: innerHeight }, pageHeight: document.documentElement.scrollHeight,
      retention: box('fieldset:has(input[name=retention])'), save: box('.save-button'), radio: box('.radio-card'),
      saveStyle: style('.save-button'), labelStyle: style('.radio-card small'), radioStyle: style('.retention-options .radio-card'),
      warningStyle: style('.warning'), warningBackground: style('.help'),
      policyText: document.querySelector('.help')!.textContent };
  });
  expect(metrics.policyText).not.toMatch(/20\s*(min|minutes|minuts)/);
  const rgb=(s:string)=>s.match(/[\d.]+/g)!.slice(0,3).map(Number);
  const lum=(s:string)=>rgb(s).map(c=>c/255).map(c=>c<=.04045?c/12.92:((c+.055)/1.055)**2.4).reduce((n,c,i)=>n+c*[.2126,.7152,.0722][i],0);
  const contrast=(a:string,b:string)=>(Math.max(lum(a),lum(b))+.05)/(Math.min(lum(a),lum(b))+.05);
  expect(contrast(metrics.saveStyle.color,metrics.saveStyle.background)).toBeGreaterThanOrEqual(4.5);
  expect(contrast(metrics.warningStyle.color,metrics.warningBackground.background)).toBeGreaterThanOrEqual(4.5);
  await page.locator('input[name=retention][value="0.9"]').focus(); await page.keyboard.press('ArrowRight');
  await expect(page.locator('input[name=retention][value="0.95"]')).toBeChecked();
  const focus = await page.evaluate(() => {
    const input = document.activeElement!, parent = input.closest('label')!;
    const a = getComputedStyle(input), b = getComputedStyle(parent);
    return { tag: input.tagName, opacity: a.opacity, inputShadow: a.boxShadow,
      parentShadow: b.boxShadow, parentOutline: b.outlineWidth, parentOutlineStyle:b.outlineStyle, parentOutlineColor:b.outlineColor, focusWithin: parent.matches(':focus-within') };
  });
  expect(focus.parentOutlineStyle).toBe('solid');
  expect(Number.parseFloat(focus.parentOutline)).toBeGreaterThanOrEqual(2);
  await page.screenshot({ path: `.cache/deck-settings-improvements/focus-${info.project.name}.png`, fullPage: true });
  await writeFile(`.cache/deck-settings-improvements/metrics-${info.project.name}.json`, JSON.stringify({ ...metrics, focus }, null, 2));
});

test('actual UI saves order/quota/retention, survives reload and drives study + canonical history', async ({ page }) => {
  await seed(page); await open(page);
  const before = await records(page);
  await save(page, '2', 'before-reviews', '0.95');
  expect(await records(page)).toEqual(before);
  await page.reload(); await expect(page.locator('input[type=number]')).toHaveValue('2');
  await expect(page.locator('input[name=order][value="before-reviews"]')).toBeChecked();
  await expect(page.locator('input[name=retention][value="0.95"]')).toBeChecked();
  await page.goto('./#/anki/japanese-1500/study');
  await expect(page.locator('.front h1')).toHaveText(JAPANESE_1500_ENTRIES[40].word);
  await expect(page.locator('.count-new b')).toHaveText('2'); await expect(page.locator('.count-review b')).toHaveText('40');
  await page.locator('.reveal').click(); await page.locator('.ratings .good').click();
  await expect(page.locator('.front h1')).toHaveText(JAPANESE_1500_ENTRIES[41].word);
  const after = await records(page), events = after.events as { desiredRetention: number; rating: string }[];
  expect(events).toHaveLength(1); expect(events[0].desiredRetention).toBe(.95);
  await page.reload(); await expect(page.locator('.count-new b')).toHaveText('1');
  await expect(page.locator('.front h1')).toHaveText(JAPANESE_1500_ENTRIES[41].word);
  await open(page); await save(page, '0', 'after-reviews', '0.85');
  const stable = await records(page); expect(stable).toEqual(after);
  await page.goto('./#/anki/japanese-1500/study'); await expect(page.locator('.front h1')).toHaveText(JAPANESE_1500_ENTRIES[0].word);
  await page.locator('.reveal').click(); await page.locator('.ratings .good').click();
  const final = await records(page), last = (final.events as { entryId: string; desiredRetention: number; dueAfter: number }[]).find(e => e.entryId === ids[0])!;
  expect(last.desiredRetention).toBe(.85); expect(last.dueAfter - NOW.getTime()).toBeGreaterThan(120 * 86_400_000); // production fuzz remains enabled
});

test('Puyi settings use the same UI and independent preferences, with controlled public read only', async ({ page }) => {
  await page.unroute('**/supabase-config.js');
  await page.route('**/supabase-config.js', r => r.fulfill({ contentType: 'text/javascript', body: 'window.__KANA_STUDY_CONFIG__={supabaseUrl:"https://settings-fixture.supabase.co",supabasePublishableKey:"test-public-key-not-a-secret"};' }));
  await page.route('https://settings-fixture.supabase.co/**', r => new URL(r.request().url()).pathname === '/rest/v1/puyi_cards'
    ? r.fulfill({ json: [{ id: '00000000-0000-0000-0000-000000000001', position: 1, version: 1, word: '試験', kana: 'しけん', meaning: 'prueba', exampleSentence: '', exampleTranslation: '', image_path: null, created_at: NOW.toISOString(), updated_at: NOW.toISOString(), author_id: 'fixture' }] }) : r.abort());
  await open(page, 'mazo-puyi'); await save(page, '1', 'before-reviews', '0.95');
  await page.reload(); await expect(page.locator('input[name=retention][value="0.95"]')).toBeChecked();
  await page.goto('./#/anki/mazo-puyi/study'); await expect(page.locator('.front h1')).toHaveText('試験');
  await page.locator('.reveal').click(); await page.locator('.ratings .good').click();
  const event = ((await records(page)).events as { deckId: string; desiredRetention: number }[])[0];
  expect(event.deckId).toBe('mazo-puyi'); expect(event.desiredRetention).toBe(.95);
  await open(page); await expect(page.locator('input[name=retention][value="0.9"]')).toBeChecked();
});

test('mixed reload and undo keep the same next introduction and exactly the canonical reviews', async ({page})=>{
  await seed(page);await open(page);await save(page,'10','mixed','0.9');
  await page.goto('./#/anki/japanese-1500/study');
  for(let i=0;i<4;i++){
    await expect(page.locator('.front h1')).toHaveText(JAPANESE_1500_ENTRIES[i].word);
    await page.locator('.reveal').click();await page.locator('.ratings .good').click();
  }
  await expect(page.locator('.front h1')).toHaveText(JAPANESE_1500_ENTRIES[40].word);
  const before=await records(page);await page.reload();
  await expect(page.locator('.front h1')).toHaveText(JAPANESE_1500_ENTRIES[40].word);
  expect(await records(page)).toEqual(before);
  await page.locator('.reveal').click();await page.locator('.ratings .good').click();
  await expect(page.locator('.front h1')).toHaveText(JAPANESE_1500_ENTRIES[4].word);
  await page.locator('.undo').click();await expect(page.locator('.front h1')).toHaveText(JAPANESE_1500_ENTRIES[40].word);
  expect((await records(page)).events).toHaveLength(4);
  expect((await records(page)).progress).toEqual(before.progress);
  await page.locator('.reveal').click();await page.locator('.ratings .good').click();
  await expect(page.locator('.front h1')).toHaveText(JAPANESE_1500_ENTRIES[4].word);
  const redo = (await records(page)).events as {id:string;entryId:string}[];
  expect(redo).toHaveLength(5);
  const phase = await page.evaluate(()=>JSON.parse(localStorage.getItem('kana-study.deck-mix.v1.japanese-1500')!).steps.at(-1));
  expect(phase.eventId).toBe(redo.find(e=>e.entryId===ids[40])!.id);
  await page.reload();await expect(page.locator('.front h1')).toHaveText(JAPANESE_1500_ENTRIES[4].word);
});

test('a failed settings write preserves the draft, reports failure and supports a clean retry',async({page})=>{
  await open(page);
  await page.evaluate(()=>{
    const set=Storage.prototype.setItem;let fail=true;
    Storage.prototype.setItem=function(k,v){if(k==='kana-study.deck-settings.v1'&&fail){fail=false;throw new DOMException('controlled quota failure','QuotaExceededError');}return set.call(this,k,v);};
  });
  await page.locator('input[type=number]').fill('7');
  await page.locator('input[name=retention][value="0.95"]').locator('..').click();
  await page.locator('.save-button').click();
  await expect(page.locator('.save-row [role=alert]')).toContainText('No se pudieron guardar');
  await expect(page.locator('.save-row [role=status]')).toHaveCount(0);
  await expect(page.locator('input[type=number]')).toHaveValue('7');
  expect(await page.evaluate(()=>localStorage.getItem('kana-study.deck-settings.v1'))).toBeNull();
  await page.locator('.save-button').click();await expect(page.locator('.save-row [role=status]')).toHaveText('Ajustes guardados.');
  await expect(page.locator('.save-row [role=alert]')).toHaveCount(0);
  await page.reload();await expect(page.locator('input[type=number]')).toHaveValue('7');
  await expect(page.locator('input[name=retention][value="0.95"]')).toBeChecked();
});

test('shows an effective today override without resetting it when the usual limit changes',async({page})=>{
  await page.goto('./#/anki');
  const card=page.locator('app-deck-card').first();
  await card.getByRole('button',{name:'Más nuevas hoy',exact:true}).click();
  await expect(card.locator('.daily-summary')).toContainText('15');
  await open(page);await save(page,'0','mixed','0.9');
  await expect(page.locator('.today-info dd')).toHaveText(['15','0','15']);
  await expect(page.locator('.today-info')).toContainText('excepción de 15');
  await page.reload();await expect(page.locator('.today-info dd')).toHaveText(['15','0','15']);
});

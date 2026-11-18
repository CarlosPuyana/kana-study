import { expect, test, type Page } from '@playwright/test';
import path from 'node:path';

const screenshots = '.cache/phrase-islands-puyi-p6/captures';
type MediaFault = 'autoplay' | 'missing' | 'pending';

async function openEveryday(page: Page) {
  await page.goto('/');
  await page.getByRole('link', { name: /Vida cotidiana/ }).click();
  await expect(page.locator('.phrase-list li')).toHaveCount(5);
}

async function instrumentAudio(page: Page) {
  await page.addInitScript(() => {
    const starts: string[] = [];
    const elements = new Set<HTMLMediaElement>();
    const ended: { src: string; time: number }[] = [];
    const started: { src: string; time: number }[] = [];
    const persistence: string[] = [];
    const controls: { fault: MediaFault | null; maxActive: number } = { fault: null, maxActive: 0 };
    const now = Date.now.bind(Date);
    let wallOffset = 0;
    Date.now = () => now() + wallOffset;
    const src = Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, 'src')!;
    Object.defineProperty(HTMLMediaElement.prototype, 'src', {
      ...src,
      set(value: string) {
        // WebKit may load native media outside Playwright's request interception.
        src.set!.call(this, controls.fault === 'missing' ? 'audio/phrase-islands/v1/missing-p4-sample.mp3' : value);
      },
    });
    const play = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function () {
      starts.push(this.src);
      if (!elements.has(this)) {
        let playingSource = '';
        this.addEventListener('ended', () => ended.push({ src: playingSource, time: performance.now() }));
        this.addEventListener('playing', () => {
          playingSource = this.currentSrc || this.src;
          started.push({ src: playingSource, time: performance.now() });
          controls.maxActive = Math.max(controls.maxActive, [...elements].filter(audio => !audio.paused).length);
        });
      }
      elements.add(this);
      if (controls.fault === 'autoplay') return Promise.reject(new DOMException('Blocked by test', 'NotAllowedError'));
      if (controls.fault === 'pending') return new Promise<void>(() => {});
      return play.call(this);
    };
    const setItem = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      persistence.push(key);
      setItem.call(this, key, value);
    };
    const open = IDBFactory.prototype.open;
    IDBFactory.prototype.open = function (name, version) {
      persistence.push(name);
      return open.call(this, name, version);
    };
    Object.assign(window, {
      puyiProbe: { starts, elements, ended, started, persistence, controls },
      advancePuyiWall: (ms: number) => { wallOffset += ms; },
    });
  });
}

function setMediaFault(page: Page, fault: MediaFault | null) {
  return page.evaluate(value => {
    (window as unknown as { puyiProbe: { controls: { fault: MediaFault | null } } }).puyiProbe.controls.fault = value;
  }, fault);
}

function audioState(page: Page) {
  return page.evaluate(() => {
    const { puyiProbe: state } = window as unknown as {
      puyiProbe: {
        starts: string[];
        elements: Set<HTMLMediaElement>;
        ended: { src: string; time: number }[];
        started: { src: string; time: number }[];
        persistence: string[];
        controls: { maxActive: number };
      };
    };
    return { starts: state.starts, active: [...state.elements].filter(audio => !audio.paused).length,
      elements: state.elements.size, sources: [...state.elements].map(audio => audio.getAttribute('src')),
      ended: state.ended, started: state.started, maxActive: state.controls.maxActive, persistence: state.persistence };
  });
}

test('library, localized blocks, furigana, mobile and tablet layouts', async ({ browser }, testInfo) => {
  const page = await browser.newPage({ baseURL: 'http://127.0.0.1:4446', viewport: { width: 402, height: 874 },
    isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  await instrumentAudio(page);
  const requests: string[] = [];
  page.on('request', request => requests.push(request.url()));
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Mis islas' })).toBeVisible();
  await expect(page.locator('.island-card')).toHaveCount(3);
  expect(requests.filter(url => url.endsWith('.mp3'))).toEqual([]);
  await page.getByRole('button', { name: 'Cambiar a tema claro' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  if (testInfo.project.name === 'edge') {
    await page.screenshot({ path: path.join(screenshots, 'biblioteca-movil.png'), fullPage: true });
  }
  await page.getByRole('link', { name: /Vida cotidiana/ }).click();
  await expect(page.locator('ruby rt').first()).toBeVisible();
  await expect(page.locator('.question')).toBeHidden();
  await page.getByText('Preguntas relacionadas').click();
  await expect(page.locator('.question')).toBeVisible();
  await page.getByText('Preguntas relacionadas').click();
  await expect(page.locator('.transport')).toBeInViewport();
  if (testInfo.project.name === 'edge') {
    await page.evaluate(() => window.scrollTo(0, 0));
    await expect(page.locator('h1')).toBeInViewport();
    await page.screenshot({ path: path.join(screenshots, 'bloque-movil.png') });
  }

  await page.getByRole('button', { name: /Tiempo libre/ }).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { name: 'Tiempo libre' })).toBeVisible();
  await expect(page.locator('.phrase-list li')).toHaveCount(3);
  await page.getByRole('combobox', { name: 'Idioma' }).selectOption('en');
  await expect(page.getByRole('heading', { name: 'Free time' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Play block: Free time' })).toBeVisible();
  await page.getByRole('combobox', { name: 'Language' }).selectOption('ca');
  await expect(page.getByRole('heading', { name: 'Temps lliure' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Reprodueix el bloc: Temps lliure' })).toBeVisible();
  await page.getByRole('combobox', { name: 'Idioma' }).selectOption('es');
  await page.getByRole('button', { name: /En casa/ }).click();
  for (const [width, height] of [[320, 750], [402, 874], [800, 1280], [1280, 800]]) {
    await page.setViewportSize({ width, height });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await expect(page.locator('.transport')).toBeInViewport();
    expect(await page.locator('.transport .play').evaluate(node => node.getBoundingClientRect().height)).toBeGreaterThanOrEqual(44);
  }
  await page.getByRole('button', { name: 'Cambiar a tema oscuro' }).click();
  if (testInfo.project.name === 'edge') await page.screenshot({ path: path.join(screenshots, 'bloque-tablet.png') });
  await page.getByRole('link', { name: 'Volver a Mis islas' }).click();
  expect((await audioState(page)).starts.length).toBeGreaterThanOrEqual(2);
  await page.goto('/#/island/inexistente');
  await expect(page.getByRole('heading', { name: 'Isla no disponible' })).toBeVisible();
  await page.close();
});

test('individual audio and one full block use real MP3s and a single element', async ({ page }) => {
  await instrumentAudio(page);
  await openEveryday(page);
  const queue = page.locator('.phrase-list li');
  const ids = await queue.evaluateAll(nodes => nodes.map(node => node.getAttribute('data-phrase-id')));
  expect((await audioState(page)).starts).toEqual([]);
  await queue.first().getByRole('button').click();
  await expect(queue.first()).toHaveClass('active');
  expect((await audioState(page)).active).toBe(1);
  await expect(page.getByRole('status')).toContainText('Terminado', { timeout: 8000 });
  expect((await audioState(page)).starts).toHaveLength(1);

  await page.getByRole('button', { name: 'Reproducir bloque', exact: true }).click();
  await expect(queue.first()).toHaveClass('active');
  const transport = page.locator('.transport');
  await transport.getByRole('button', { name: 'Pausar' }).click();
  await expect(page.getByRole('status')).toContainText('En pausa');
  expect((await audioState(page)).active).toBe(0);
  await transport.getByRole('button', { name: 'Continuar' }).click();
  await expect(page.getByRole('status')).toContainText('Pausa entre frases', { timeout: 8000 });
  await expect(queue.nth(1)).toHaveClass('active', { timeout: 8000 });
  await expect(page.getByRole('status')).toContainText('Terminado · 5 de 5', { timeout: 35_000 });
  const state = await audioState(page);
  expect(state.starts.slice(2)).toHaveLength(5);
  for (const [i, id] of ids.entries()) expect(state.starts[i + 2]).toContain(id);
  expect(state.elements).toBe(1);
  expect(state.active).toBe(0);
  expect(state.sources).toEqual([null]);
});

test('changing block, stop and leaving cancel the current sequence', async ({ page }) => {
  await instrumentAudio(page);
  await openEveryday(page);
  await page.getByRole('button', { name: 'Reproducir bloque', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('Pausa entre frases', { timeout: 8000 });
  await page.getByRole('button', { name: /Tiempo libre/ }).click();
  await expect(page.locator('.phrase-list li').first()).toHaveClass('active');
  await page.getByRole('button', { name: 'Detener' }).click();
  expect((await audioState(page)).sources).toEqual([null]);
  await page.getByRole('button', { name: /En casa/ }).click();
  await page.getByText('Preguntas relacionadas').click();
  await page.locator('.question').getByRole('button').click();
  await expect(page.locator('.question')).toHaveClass('question active');
  await page.getByRole('link', { name: 'Volver a Mis islas' }).click();
  expect((await audioState(page)).active).toBe(0);
  expect((await audioState(page)).sources).toEqual([null]);
  await page.waitForTimeout(5200); // Long enough for an orphaned timer to advance a clip.
  expect((await audioState(page)).starts).toHaveLength(4);
});

test('shadowing previews the question separately and gives five real clips an imitation turn', async ({ page }) => {
  const external: string[] = [];
  const media: string[] = [];
  page.on('request', request => {
    const url = new URL(request.url());
    if (url.origin !== 'http://127.0.0.1:4446') external.push(url.href);
    if (request.resourceType() === 'media' || url.pathname.endsWith('.mp3')) media.push(url.pathname);
  });
  await instrumentAudio(page);
  await openEveryday(page);
  await page.getByRole('button', { name: 'Shadowing', exact: true }).click();
  const pause = page.getByRole('combobox', { name: 'Pausa para imitar' });
  await expect(pause).toHaveValue('5');
  await expect(pause.locator('option')).toHaveText(['2 s', '3 s', '5 s', '8 s']);
  expect((await audioState(page)).starts).toEqual([]);
  await pause.selectOption('2');
  await page.getByText('Preguntas relacionadas').click();
  await page.locator('.question').getByRole('button').click();
  await expect(page.getByRole('status')).toContainText('Terminado · 1 de 1', { timeout: 8000 });
  const question = (await audioState(page)).starts[0];
  const rows = page.locator('.phrase-list li');
  const phraseIds = await rows.evaluateAll(items => items.map(item => item.getAttribute('data-phrase-id')));
  await page.getByRole('button', { name: 'Empezar shadowing' }).click();
  await expect(pause).toBeDisabled();
  const status = page.getByRole('status');
  for (let i = 0; i < phraseIds.length; i++) {
    await expect(status).toContainText(`Escucha · ${i + 1} de 5`, { timeout: 8000 });
    await expect(status).toContainText(`Tu turno: imita la frase · ${i + 1} de 5`, { timeout: 8000 });
    await expect(rows.nth(i)).toHaveAttribute('aria-current', 'step');
    expect((await audioState(page)).active).toBe(0);
  }
  await expect(status).toContainText('Bloque terminado · 5 de 5');
  await expect(pause).toBeEnabled();
  const state = await audioState(page);
  expect(state.starts).toHaveLength(6);
  expect(state.ended).toHaveLength(6);
  expect(state.ended[0].src).toBe(question);
  expect(state.started.slice(1).map(event => event.src)).toEqual(state.ended.slice(1).map(event => event.src));
  for (let i = 0; i < phraseIds.length; i++) {
    expect(state.ended[i + 1].src).toContain(phraseIds[i]);
    if (i < phraseIds.length - 1) {
      expect(state.started[i + 2].time - state.ended[i + 1].time).toBeGreaterThanOrEqual(1970);
    }
  }
  expect(state.elements).toBe(1);
  expect(state.maxActive).toBe(1);
  expect(state.sources).toEqual([null]);
  expect(state.persistence).toEqual([]);
  expect(external).toEqual([]);
  const seenMedia = media.concat(state.started.map(event => new URL(event.src).pathname));
  expect(seenMedia.every(url => /^\/audio\/phrase-islands\/v1\/.+\.mp3$/.test(url))).toBe(true);
  await page.goto('/#/island/grappling');
  await expect(page.getByRole('heading', { name: 'Isla no disponible' })).toBeVisible();
});

test('pauses audio and imitation, repeats the current phrase and cancels when changing modes or blocks', async ({ page }) => {
  await instrumentAudio(page);
  await openEveryday(page);
  await page.getByRole('button', { name: 'Shadowing', exact: true }).click();
  await page.getByRole('combobox', { name: 'Pausa para imitar' }).selectOption('2');
  const transport = page.locator('.transport');
  const status = page.getByRole('status');
  await transport.getByRole('button', { name: 'Empezar shadowing' }).click();
  await expect(status).toContainText('Escucha · 1 de 5');
  await transport.getByRole('button', { name: 'Pausar' }).click();
  await expect(status).toContainText('En pausa · 1 de 5');
  expect((await audioState(page)).active).toBe(0);
  await transport.getByRole('button', { name: 'Continuar' }).click();
  await expect(status).toContainText('Tu turno');
  await transport.getByRole('button', { name: 'Pausar' }).click();
  await page.waitForTimeout(2150); // Exceeds the configured gap to detect an advance while paused.
  await expect(status).toContainText('En pausa · 1 de 5');
  expect((await audioState(page)).starts).toHaveLength(2);
  await transport.getByRole('button', { name: 'Continuar' }).click();
  await expect(status).toContainText('Tu turno');
  await transport.getByRole('button', { name: 'Repetir frase actual' }).click();
  await expect(status).toContainText('Escucha · 1 de 5');
  await expect(status).toContainText('Tu turno');
  await page.getByRole('button', { name: /Tiempo libre/ }).click();
  await expect(status).toContainText('Escucha · 1 de 3');
  const state = await audioState(page);
  expect(state.starts).toHaveLength(4);
  expect(new Set(state.starts.slice(0, 3)).size).toBe(1);
  expect(state.maxActive).toBe(1);
  await page.getByRole('button', { name: 'Una vez', exact: true }).click();
  await expect(status).toContainText('Listo · 0 de 3');
  expect((await audioState(page)).sources).toEqual([null]);
  await page.getByRole('button', { name: 'Shadowing', exact: true }).click();
  await transport.getByRole('button', { name: 'Empezar shadowing' }).click();
  await expect(status).toContainText('Escucha · 1 de 3');
  await page.getByRole('link', { name: 'Volver a Mis islas' }).click();
  await page.waitForTimeout(2150); // A stale gap would start a different MP3.
  const afterLeaving = await audioState(page);
  expect(afterLeaving.starts).toHaveLength(5);
  expect(afterLeaving.active).toBe(0);
  expect(afterLeaving.sources).toEqual([null]);
});

test('reports autoplay and a missing MP3 and retries the same shadowing phrase', async ({ page }) => {
  await instrumentAudio(page);
  await openEveryday(page);
  await page.getByRole('button', { name: 'Shadowing', exact: true }).click();
  await setMediaFault(page, 'autoplay');
  await page.getByRole('button', { name: 'Empezar shadowing' }).click();
  await expect(page.getByRole('status')).toContainText('El navegador pide otro toque para seguir · 1 de 5');
  await setMediaFault(page, 'missing');
  await page.getByRole('button', { name: 'Reintentar' }).click();
  await expect(page.getByRole('status')).toContainText('No se pudo cargar el audio · 1 de 5');
  expect((await audioState(page)).sources).toEqual([null]);
  await setMediaFault(page, null);
  await page.getByRole('button', { name: 'Reintentar' }).click();
  await expect(page.getByRole('status')).toContainText('Escucha · 1 de 5');
  await page.getByRole('button', { name: 'Detener' }).click();
  await expect(page.getByRole('status')).toContainText('Listo · 0 de 5');
  const state = await audioState(page);
  expect(state.starts).toHaveLength(3);
  expect(state.starts[1]).toContain('missing-p4-sample.mp3');
  expect(state.starts[2]).toBe(state.starts[0]);
  expect(state.sources).toEqual([null]);
});

test('shadowing controls, translations, focus and the active phrase fit mobile and tablet', async ({ browser }, testInfo) => {
  const page = await browser.newPage({ baseURL: 'http://127.0.0.1:4446', viewport: { width: 402, height: 874 },
    isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  await openEveryday(page);
  const mode = page.getByRole('button', { name: 'Shadowing', exact: true });
  await page.getByRole('button', { name: 'Una vez', exact: true }).focus();
  await page.keyboard.press('Tab');
  await expect(mode).toBeFocused();
  expect(await mode.evaluate(button => button.matches(':focus-visible'))).toBe(true);
  await page.keyboard.press('Enter');
  await expect(mode).toHaveAttribute('aria-pressed', 'true');
  const pause = page.getByRole('combobox', { name: 'Pausa para imitar' });
  await pause.selectOption('8');
  await page.getByRole('combobox', { name: 'Idioma', exact: true }).selectOption('en');
  await expect(page.getByRole('combobox', { name: 'Imitation pause' })).toHaveValue('8');
  await expect(page.getByRole('button', { name: 'Start shadowing' })).toBeVisible();
  await page.getByRole('combobox', { name: 'Language', exact: true }).selectOption('ca');
  await expect(page.getByRole('combobox', { name: 'Pausa per imitar' })).toHaveValue('8');
  await expect(page.getByRole('button', { name: 'Comença el shadowing' })).toBeVisible();
  await page.getByRole('combobox', { name: 'Idioma', exact: true }).selectOption('es');
  const transport = page.locator('.transport');
  for (const [width, height] of [[320, 750], [800, 1280], [1280, 800], [402, 874]]) {
    await page.setViewportSize({ width, height });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await expect(transport).toBeInViewport();
    for (const control of await transport.getByRole('button').all()) {
      expect(await control.evaluate(node => node.getBoundingClientRect().height)).toBeGreaterThanOrEqual(44);
    }
  }
  await page.getByRole('button', { name: 'Cambiar a tema claro' }).tap();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await transport.getByRole('button', { name: 'Empezar shadowing' }).tap();
  await expect(page.getByRole('status')).toContainText('Tu turno');
  const active = page.locator('.phrase-list li[aria-current=step]');
  await expect(active.locator('ruby rt').first()).toBeVisible();
  await expect(active.locator('.phrase-translation')).toBeVisible();
  const fitsAboveTransport = async () => {
    const row = await active.boundingBox();
    const player = await transport.boundingBox();
    expect(row && player && row.y >= 0 && row.y + row.height <= player.y).toBe(true);
  };
  await fitsAboveTransport();
  if (testInfo.project.name === 'edge') {
    await page.screenshot({ path: path.join(screenshots, 'shadowing-movil.png') });
  }
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.getByRole('button', { name: 'Cambiar a tema oscuro' }).tap();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await fitsAboveTransport();
  if (testInfo.project.name === 'edge') {
    await page.screenshot({ path: path.join(screenshots, 'shadowing-tablet.png') });
  }
  await page.close();
});

async function selectContinuous(page: Page) {
  await page.getByRole('button', { name: 'Escucha continua', exact: true }).click();
}

function advanceWallAndRegainVisibility(page: Page, ms: number) {
  return page.evaluate(amount => {
    (window as unknown as { advancePuyiWall: (ms: number) => void }).advancePuyiWall(amount);
    document.dispatchEvent(new Event('visibilitychange'));
  }, ms);
}

test('continuous listening cycles through the five real MP3s with silence at the wrap', async ({ page }) => {
  await instrumentAudio(page);
  await openEveryday(page);
  await selectContinuous(page);
  const duration = page.getByRole('combobox', { name: 'Duración' });
  const silence = page.getByRole('combobox', { name: 'Silencio' });
  await expect(duration).toHaveValue('5');
  await expect(duration.locator('option')).toHaveText(['5 min', '10 min', '15 min', '30 min']);
  await expect(silence).toHaveValue('5');
  await expect(silence.locator('option')).toHaveText(['0 s', '2 s', '5 s', '8 s']);
  await silence.selectOption('2');
  const timer = page.getByRole('timer');
  await expect(timer).toHaveText('05:00');
  expect((await audioState(page)).starts).toEqual([]);
  const ids = await page.locator('.phrase-list li').evaluateAll(rows => rows.map(row => row.getAttribute('data-phrase-id')));
  const transport = page.locator('.transport');
  await transport.getByRole('button', { name: 'Reproducir', exact: true }).click();
  await expect(duration).toBeDisabled();
  await expect(timer).not.toHaveText('05:00');
  await expect.poll(async () => (await audioState(page)).started.length, { timeout: 35_000 }).toBeGreaterThanOrEqual(6);
  const state = await audioState(page);
  const order = [...ids, ids[0]];
  for (let i = 0; i < order.length; i++) {
    expect(state.started[i].src).toContain(order[i]);
    if (i > 0) expect(state.started[i].time - state.ended[i - 1].time).toBeGreaterThanOrEqual(1970);
  }
  expect(state.elements).toBe(1);
  expect(state.maxActive).toBe(1);
  expect(state.persistence).toEqual([]);
  expect(state.started.every(event => new URL(event.src).pathname.startsWith('/audio/phrase-islands/v1/'))).toBe(true);
  expect(await transport.locator('progress').evaluate(progress => progress.value)).toBeGreaterThan(0);
  await transport.getByRole('button', { name: 'Detener' }).click();
  await expect(timer).toHaveText('05:00');
  await expect(duration).toBeEnabled();
  expect((await audioState(page)).sources).toEqual([null]);
});

test('continuous listening pauses audio and silence, clears the session on navigation and changes mode safely', async ({ page }) => {
  await instrumentAudio(page);
  await openEveryday(page);
  await selectContinuous(page);
  await page.getByRole('combobox', { name: 'Silencio' }).selectOption('2');
  const transport = page.locator('.transport');
  const timer = page.getByRole('timer');
  const status = page.getByRole('status');
  const play = transport.getByRole('button', { name: 'Reproducir', exact: true });
  await play.click();
  await expect(status).toContainText('Sonando · 1 de 5');
  await transport.getByRole('button', { name: 'Pausar' }).click();
  await expect(status).toContainText('En pausa · 1 de 5');
  expect((await audioState(page)).active).toBe(0);
  const audioPausedAt = await timer.textContent();
  await advanceWallAndRegainVisibility(page, 20000);
  await expect(timer).toHaveText(audioPausedAt!);
  await transport.getByRole('button', { name: 'Continuar' }).click();
  await expect(status).toContainText('Pausa entre frases · 1 de 5');
  await transport.getByRole('button', { name: 'Pausar' }).click();
  const silencePausedAt = await timer.textContent();
  await page.waitForTimeout(2150);
  await expect(timer).toHaveText(silencePausedAt!);
  expect((await audioState(page)).starts).toHaveLength(2);
  await transport.getByRole('button', { name: 'Continuar' }).click();
  await expect(status).toContainText('Sonando · 2 de 5');

  await page.getByRole('button', { name: 'Shadowing', exact: true }).click();
  await expect(page.getByRole('timer')).toHaveCount(0);
  expect((await audioState(page)).sources).toEqual([null]);
  await transport.getByRole('button', { name: 'Empezar shadowing' }).click();
  await expect(status).toContainText('Escucha · 1 de 5');
  await page.getByRole('button', { name: 'Una vez', exact: true }).click();
  await transport.getByRole('button', { name: 'Reproducir bloque', exact: true }).click();
  await expect(status).toContainText('Sonando · 1 de 5');
  await selectContinuous(page);
  await expect(timer).toHaveText('05:00');
  await play.click();
  await expect(status).toContainText('Pausa entre frases · 1 de 5');
  await page.getByRole('button', { name: /Tiempo libre/ }).click();
  await expect(status).toContainText('Sonando · 1 de 3');
  await page.getByRole('link', { name: 'Volver a Mis islas' }).click();
  await page.waitForTimeout(2150);
  const state = await audioState(page);
  expect(state.starts).toHaveLength(7);
  expect(state.maxActive).toBe(1);
  expect(state.active).toBe(0);
  expect(state.sources).toEqual([null]);
});

test('continuous listening reconciles a suspended clock in silence and lets an in-flight MP3 finish', async ({ page }) => {
  await instrumentAudio(page);
  await openEveryday(page);
  await selectContinuous(page);
  const play = page.locator('.transport').getByRole('button', { name: 'Reproducir', exact: true });
  const status = page.getByRole('status');
  await play.click();
  await expect(status).toContainText('Pausa entre frases');
  await advanceWallAndRegainVisibility(page, 330000);
  await expect(status).toHaveText('Sesión terminada');
  await expect(page.getByRole('timer')).toHaveText('00:00');
  expect((await audioState(page)).starts).toHaveLength(1);

  await play.click();
  await expect(status).toContainText('Sonando');
  await advanceWallAndRegainVisibility(page, 300000);
  await expect(status).toContainText('Terminando la frase');
  await expect(page.getByRole('timer')).toHaveText('00:00');
  await expect(status).toHaveText('Sesión terminada');
  const state = await audioState(page);
  expect(state.ended).toHaveLength(2);
  expect(state.starts).toHaveLength(2);
  expect(state.sources).toEqual([null]);
});

test('continuous listening cancels loading and freezes on autoplay and missing-media errors', async ({ page }) => {
  await instrumentAudio(page);
  await openEveryday(page);
  await selectContinuous(page);
  const transport = page.locator('.transport');
  const status = page.getByRole('status');
  const play = transport.getByRole('button', { name: 'Reproducir', exact: true });
  const retry = transport.getByRole('button', { name: 'Reintentar' });
  await setMediaFault(page, 'pending');
  await play.click();
  await expect(status).toContainText('Cargando audio');
  await transport.getByRole('button', { name: 'Detener' }).click();
  expect((await audioState(page)).sources).toEqual([null]);
  await setMediaFault(page, 'autoplay');
  await play.click();
  await expect(status).toContainText('El navegador pide otro toque para seguir');
  const timer = page.getByRole('timer');
  const blockedAt = await timer.textContent();
  await advanceWallAndRegainVisibility(page, 300000);
  await expect(timer).toHaveText(blockedAt!);
  await setMediaFault(page, 'missing');
  await retry.click();
  await expect(status).toContainText('No se pudo cargar el audio · 1 de 5');
  const failedAt = await timer.textContent();
  await advanceWallAndRegainVisibility(page, 300000);
  await expect(timer).toHaveText(failedAt!);
  await setMediaFault(page, null);
  await retry.click();
  await expect(status).toContainText('Sonando · 1 de 5');
  const state = await audioState(page);
  expect(state.starts).toHaveLength(4);
  expect(state.starts[3]).toBe(state.starts[1]);
  expect(state.elements).toBe(1);
});

test('continuous listening is localized and accessible at phone and tablet widths', async ({ browser }, testInfo) => {
  const page = await browser.newPage({ baseURL: 'http://127.0.0.1:4446', viewport: { width: 402, height: 874 },
    isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  await openEveryday(page);
  await page.getByRole('button', { name: 'Shadowing', exact: true }).focus();
  await page.keyboard.press('Tab');
  const mode = page.getByRole('button', { name: 'Escucha continua', exact: true });
  await expect(mode).toBeFocused();
  expect(await mode.evaluate(button => button.matches(':focus-visible'))).toBe(true);
  await page.keyboard.press('Enter');
  await expect(mode).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('combobox', { name: 'Duración', exact: true }).selectOption('15');
  await expect(page.getByRole('timer', { name: 'Tiempo restante' })).toHaveText('15:00');
  await page.getByRole('combobox', { name: 'Idioma', exact: true }).selectOption('en');
  await expect(page.getByRole('timer', { name: 'Time left' })).toHaveText('15:00');
  await expect(page.getByRole('combobox', { name: 'Duration' })).toHaveValue('15');
  await page.setViewportSize({ width: 320, height: 750 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole('combobox', { name: 'Language', exact: true }).selectOption('ca');
  await expect(page.getByRole('timer', { name: 'Temps restant' })).toHaveText('15:00');
  await expect(page.getByRole('combobox', { name: 'Silenci' })).toHaveValue('5');
  await page.getByRole('combobox', { name: 'Idioma', exact: true }).selectOption('es');
  const transport = page.locator('.transport');
  for (const [width, height] of [[320, 750], [800, 1280], [1280, 800], [402, 874]]) {
    await page.setViewportSize({ width, height });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await expect(transport).toBeInViewport();
    for (const target of await page.locator('.practice-options button, .practice-options select, .transport button').all()) {
      expect(await target.evaluate(node => node.getBoundingClientRect().height)).toBeGreaterThanOrEqual(44);
    }
  }
  await page.getByRole('button', { name: 'Cambiar a tema claro' }).tap();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await transport.getByRole('button', { name: 'Reproducir', exact: true }).tap();
  await expect(page.getByRole('status')).toContainText('Pausa entre frases');
  const active = page.locator('.phrase-list li[aria-current=step]');
  await expect(active.locator('ruby rt').first()).toBeVisible();
  await expect(active.locator('.phrase-translation')).toBeVisible();
  const fitsAboveTransport = async () => {
    const row = await active.boundingBox();
    const player = await transport.boundingBox();
    expect(row && player && row.y >= 0 && row.y + row.height <= player.y).toBe(true);
  };
  await fitsAboveTransport();
  if (testInfo.project.name === 'edge') {
    await page.screenshot({ path: path.join(screenshots, 'escucha-continua-movil.png') });
  }
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.getByRole('button', { name: 'Cambiar a tema oscuro' }).tap();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await fitsAboveTransport();
  if (testInfo.project.name === 'edge') {
    await page.screenshot({ path: path.join(screenshots, 'escucha-continua-tablet.png') });
  }
  await page.close();
});

test('block card surface, title, icon and keyboard use the same player', async ({ page }) => {
  await instrumentAudio(page);
  await openEveryday(page);
  const home = page.getByRole('button', { name: 'Reproducir bloque: En casa' });
  const free = page.getByRole('button', { name: 'Reproducir bloque: Tiempo libre' });
  await page.getByText('Preguntas relacionadas').click();
  expect((await audioState(page)).starts).toHaveLength(0);
  await home.dblclick();
  await expect(page.getByRole('status')).toContainText('Sonando · 1 de 5');
  expect((await audioState(page)).starts).toHaveLength(1);
  await free.getByText('Tiempo libre', { exact: true }).click();
  await expect(page.getByRole('status')).toContainText('Sonando · 1 de 3');
  await home.locator('.block-play').click();
  await expect(page.getByRole('status')).toContainText('Sonando · 1 de 5');
  await home.focus();
  await page.keyboard.press('Tab');
  await expect(free).toBeFocused();
  expect(await free.evaluate(button => button.matches(':focus-visible'))).toBe(true);
  await page.keyboard.press('Enter');
  await expect(page.getByRole('status')).toContainText('Sonando · 1 de 3');
  const state = await audioState(page);
  expect(state.starts).toHaveLength(4);
  expect(state.starts[0]).toBe(state.starts[2]);
  expect(state.starts[1]).toBe(state.starts[3]);
  expect(state.elements).toBe(1);
  expect(state.maxActive).toBe(1);
});

test('touching a card keeps the timed mode and does not start audio from settings', async ({ browser }, testInfo) => {
  const page = await browser.newPage({ baseURL: 'http://127.0.0.1:4446', viewport: { width: 402, height: 874 },
    isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  await instrumentAudio(page);
  await openEveryday(page);
  await selectContinuous(page);
  await page.getByRole('combobox', { name: 'Duración' }).selectOption('15');
  await page.getByRole('combobox', { name: 'Silencio' }).selectOption('8');
  expect((await audioState(page)).starts).toHaveLength(0);
  await page.getByRole('button', { name: 'Reproducir bloque: Tiempo libre' }).tap();
  await expect(page.getByRole('status')).toContainText('Sonando · 1 de 3');
  await expect(page.getByRole('timer')).toHaveText('15:00');
  await expect(page.getByRole('combobox', { name: 'Silencio' })).toHaveValue('8');
  await expect(page.getByRole('button', { name: 'Escucha continua', exact: true })).toHaveAttribute('aria-pressed', 'true');
  if (testInfo.project.name === 'edge') {
    await page.screenshot({ path: path.join(screenshots, 'bloque-clicable-movil.png') });
  }
  await page.close();
});

test('the open block header and phrase text play from their full surfaces', async ({ page }) => {
  await instrumentAudio(page);
  await openEveryday(page);
  const status = page.getByRole('status');
  const row = page.locator('.phrase-list li').first();
  await row.getByText('Hoy voy a descansar en casa.', { exact: true }).click();
  await expect(status).toContainText('Sonando · 1 de 1');
  await expect.poll(async () => (await audioState(page)).started.length).toBe(1);
  await page.getByRole('button', { name: 'Detener', exact: true }).click();
  await selectContinuous(page);
  await page.getByRole('combobox', { name: 'Duración' }).selectOption('15');
  await expect(status).toHaveText('Listo');
  const header = page.getByRole('button', { name: 'Reproducir bloque · En casa', exact: true });
  await header.getByText('En casa', { exact: true }).click();
  await expect(status).toContainText('Sonando · 1 de 5');
  await expect.poll(async () => (await audioState(page)).started.length).toBe(2);
  await header.locator('.block-meta').click();
  expect((await audioState(page)).starts).toHaveLength(2);
  await expect(page.getByRole('combobox', { name: 'Duración' })).toHaveValue('15');
  await expect(row).toHaveAttribute('aria-current', 'step');
  expect((await audioState(page)).maxActive).toBe(1);
});

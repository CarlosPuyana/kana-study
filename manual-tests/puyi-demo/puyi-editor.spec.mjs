import { expect, test } from '@playwright/test';
import { once } from 'node:events';
import { mkdirSync, mkdtempSync } from 'node:fs';
import path from 'node:path';
import { DraftStore } from '../../experiments/phrase-islands-puyi-editor/store.mjs';
import { editorServer } from '../../experiments/phrase-islands-puyi-editor/server.mjs';

const output = '.cache/phrase-islands-puyi-p6/captures';
let server;
let address;
let storage;

test.beforeEach(async () => {
  const parent = '.cache/phrase-islands-puyi-p6';
  mkdirSync(parent, { recursive: true });
  storage = new DraftStore(path.resolve(mkdtempSync(path.join(parent, 'fixture-'))));
  server = editorServer({ store: storage });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  address = 'http://127.0.0.1:' + server.address().port;
});

test.afterEach(async () => {
  const closed = once(server, 'close');
  server.close();
  await closed;
});

test('import validates errors and previews a fictional island before writing, on phone and tablet', async ({ browser }, testInfo) => {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  const outside = [];
  page.on('request', request => {
    if (new URL(request.url()).origin !== address || request.url().endsWith('.mp3')) outside.push(request.url());
  });
  await page.goto(address);
  await expect(page.getByRole('heading', { name: 'Borradores privados' })).toBeVisible();
  const importButton = page.getByRole('button', { name: 'Importar', exact: true });
  await page.getByRole('button', { name: 'Nueva isla' }).focus();
  await page.keyboard.press('Tab');
  await expect(importButton).toBeFocused();
  expect(await importButton.evaluate(button => button.matches(':focus-visible'))).toBe(true);
  await page.keyboard.press('Enter');
  const json = page.getByRole('textbox', { name: 'JSON de la isla' });
  await json.fill('{');
  await page.getByRole('button', { name: 'Validar' }).tap();
  await expect(page.getByRole('alert')).toContainText('El JSON no es válido');
  await page.getByRole('button', { name: 'Cargar ejemplo ficticio' }).tap();
  await expect(json).toHaveValue(/Paseo por el parque/);
  await page.getByRole('button', { name: 'Validar' }).tap();
  await expect(page.getByRole('button', { name: 'Confirmar importación' })).toBeVisible();
  expect(storage.list()).toEqual([]);
  if (testInfo.project.name === 'edge') await page.screenshot({ path: path.join(output, 'importacion-movil.png') });
  await page.getByRole('button', { name: 'Previsualizar' }).tap();
  await expect(page.getByRole('heading', { name: '公園の散歩' })).toBeVisible();
  await expect(page.locator('ruby rt').first()).toHaveText('こうえん');
  await expect(page.getByText('Voy a dar un paseo por el parque.')).toBeVisible();
  await expect(page.locator('.transport')).toHaveCount(0);
  for (const width of [320, 390, 1280]) {
    await page.setViewportSize({ width, height: 840 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  await page.getByText('Preguntas relacionadas').tap();
  await expect(page.getByText('¿Qué vas a hacer hoy?')).toBeVisible();
  if (testInfo.project.name === 'edge') await page.screenshot({ path: path.join(output, 'previsualizacion-tablet.png') });
  await page.getByRole('link', { name: 'Volver al editor' }).tap();
  await page.getByRole('button', { name: 'Confirmar importación' }).tap();
  await expect(page.getByRole('heading', { name: 'Paseo por el parque' })).toBeVisible();
  expect(storage.list()).toEqual([]);
  await page.getByRole('button', { name: 'Guardar borrador' }).tap();
  await expect(page.getByRole('status')).toHaveText('Borrador guardado');
  expect(storage.list()).toHaveLength(1);
  expect(outside).toEqual([]);
  await page.close();
});

test('file import, edit, reorder, export, duplicate protection and local restoration', async ({ page }) => {
  await page.goto(address);
  await page.getByRole('button', { name: 'Importar', exact: true }).click();
  await page.getByLabel('Elegir archivo JSON').setInputFiles('experiments/phrase-islands-puyi-editor/example.json');
  await expect(page.getByRole('textbox', { name: 'JSON de la isla' })).toHaveValue(/Paseo por el parque/);
  await page.getByRole('button', { name: 'Validar' }).click();
  await page.getByRole('button', { name: 'Confirmar importación' }).click();
  await page.getByRole('button', { name: 'Guardar borrador' }).click();
  await expect(page.getByRole('status')).toHaveText('Borrador guardado');
  const id = storage.list()[0].id;
  const first = storage.get(id).document.blocks[0].phrases[0].id;
  await page.getByRole('button', { name: 'Editar Frase 1', exact: true }).click();
  await page.getByRole('textbox', { name: 'Traducción natural ES', exact: true }).fill('Voy a pasear un rato.');
  await page.getByRole('button', { name: 'Bajar', exact: true }).first().click();
  await page.getByRole('button', { name: 'Guardar borrador' }).click();
  await expect.poll(() => storage.get(id).revision).toBe(2);
  expect(storage.get(id).document.blocks[0].phrases[1].id).toBe(first);
  expect(storage.get(id).document.blocks[0].phrases[1].natural.es).toBe('Voy a pasear un rato.');
  await page.getByText('Revisión y versiones', { exact: true }).click();
  page.once('dialog', dialog => dialog.accept());
  await page.getByRole('button', { name: 'Restaurar Revisión 1' }).click();
  await expect.poll(() => storage.get(id).revision).toBe(3);
  expect(storage.get(id).document.blocks[0].phrases[0].id).toBe(first);
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Exportar JSON' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('isla-' + id + '.json');
  await page.getByRole('button', { name: /Borradores$/, exact: false }).click();
  await page.getByRole('button', { name: 'Importar', exact: true }).click();
  await page.getByLabel('Elegir archivo JSON').setInputFiles(await download.path());
  await page.getByRole('button', { name: 'Validar' }).click();
  await expect(page.getByRole('alert')).toContainText('Ya hay un borrador para esta isla');
  expect(storage.history(id)).toEqual([3, 2, 1]);
});

test('creates an incomplete island and keeps question links consistent when a block is removed', async ({ page }) => {
  await page.goto(address);
  await page.getByRole('button', { name: 'Nueva isla' }).click();
  await page.getByText('Títulos y descripción', { exact: true }).click();
  await page.getByRole('textbox', { name: 'Título ES', exact: true }).fill('Otra escena ficticia');
  const addBlock = page.getByRole('button', { name: /Añadir bloque/ });
  await addBlock.click();
  await addBlock.click();
  await page.getByRole('button', { name: /Añadir frase/ }).last().click();
  await page.getByRole('textbox', { name: 'Japonés', exact: true }).fill('聞きます。');
  await page.getByRole('button', { name: /Añadir pregunta/ }).first().click();
  await page.getByRole('textbox', { name: 'Japonés', exact: true }).fill('何をしますか？');
  await page.getByRole('checkbox', { name: '聞きます。' }).check();
  await page.getByRole('button', { name: 'Guardar borrador' }).click();
  await expect(page.getByRole('status')).toHaveText('Borrador guardado');
  const id = storage.list()[0].id;
  const original = storage.get(id).document;
  expect(original.blocks[0].prompts[0].answerPhraseIds).toEqual([original.blocks[1].phrases[0].id]);
  await page.getByRole('button', { name: 'Quitar bloque', exact: true }).last().click();
  await page.getByText('Revisión y versiones', { exact: true }).click();
  await page.getByRole('button', { name: 'Comprobar para audio' }).click();
  await expect(page.getByRole('alert')).toContainText('Campo pendiente');
  await page.getByRole('button', { name: 'Guardar borrador' }).click();
  await expect(page.getByRole('status')).toHaveText('Borrador guardado');
  const latest = storage.get(id).document;
  expect(latest.blocks).toHaveLength(1);
  expect(latest.blocks[0].prompts[0].answerPhraseIds).toEqual([]);
  expect(latest.blocks[0].prompts[0].status).toBe('pending');
});

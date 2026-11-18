import { expect, test } from '@playwright/test';
import { readFileSync, readdirSync } from 'node:fs';
import { serveCandidate } from '../../scripts/serve-manga-candidate.mjs';

const island = '71000000-0000-4000-8000-000000000001';
const member = '70000000-0000-4000-8000-000000000004';
const name = 'puyi-private-fixture';
const remote = 'https://' + name + '.supabase.co';
const library = '#/anki/puyi-islands';
const detail = library + '/island/' + island;
const mediaDir = 'public/audio/phrase-islands/v1/';
const filename = readdirSync(mediaDir).find(name => name.startsWith('pi-everyday-001') && name.endsWith('.mp3'));
const media = readFileSync(mediaDir + filename);
const key = island + '/74000000-0000-4000-8000-000000000001/r1-' + 'a'.repeat(64) + '.mp3';
const header = { id: island, revision: 1, japanese: '架空の島', title: { es: 'Isla ficticia' }, description: { es: 'Una muestra.' } };
let preview;

test.beforeAll(async () => { preview = await serveCandidate(0); });
test.afterAll(async () => { await preview.close(); });

async function fixture(page, memberRole, mediaDelay) {
  let role = memberRole;
  const requests = [];
  const expires = Math.floor(Date.now() / 1000) + 3600;
  const base64 = payload => Buffer.from(JSON.stringify(payload)).toString('base64url');
  const user = { id: member, aud: 'authenticated', email: 'fixture@example.test', role: 'authenticated',
    app_metadata: {}, user_metadata: {}, created_at: '2026-01-01T00:00:00Z', is_anonymous: false };
  const token = base64({ alg: 'HS256', typ: 'JWT' }) + '.' +
    base64({ sub: member, exp: expires, role: 'authenticated', aud: 'authenticated' }) + '.fixture';
  await page.route('**/supabase-config.js', route => route.fulfill({ contentType: 'text/javascript', body:
    `window.__KANA_STUDY_CONFIG__={supabaseUrl:${JSON.stringify(remote)},supabasePublishableKey:"synthetic-public-test-key-only"};` }));
  await page.addInitScript(({ name, user, token, expires, signed, sample }) => {
    localStorage.setItem('kana-study.workspace.import-decision.v1.' + user.id, 'account');
    localStorage.setItem('sb-' + name + '-auth-token', JSON.stringify({
      user, access_token: token, expires_at: expires, expires_in: 3600, refresh_token: 'fixture', token_type: 'bearer',
    }));
    const play = HTMLMediaElement.prototype.play;
    const probe = { elements: new Set(), revoked: [], signedSources: [] };
    Object.assign(window, { privateAudioProbe: probe });
    HTMLMediaElement.prototype.play = function () { probe.elements.add(this); return play.call(this); };
    // The native Windows media backend does not use Playwright's route interception.
    const src = Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, 'src');
    Object.defineProperty(HTMLMediaElement.prototype, 'src', { ...src, set(value) {
      if (value === signed) probe.signedSources.push(value);
      src.set.call(this, value === signed ? sample : value);
    } });
    const revoke = URL.revokeObjectURL.bind(URL);
    URL.revokeObjectURL = url => { probe.revoked.push(url); revoke(url); };
  }, { name, user, token, expires,
    signed: remote + '/storage/v1/object/sign/puyi-islands-private/' + key + '?token=fixture',
    sample: preview.url + 'audio/phrase-islands/v1/' + filename });
  await page.route(remote + '/**', async route => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    requests.push(path);
    const headers = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*' };
    if (request.method() === 'OPTIONS') return route.fulfill({ status: 204, headers });
    if (path === '/auth/v1/user') return route.fulfill({ json: user, headers });
    if (path === '/rest/v1/rpc/puyi_island_access') return route.fulfill({
      json: request.headers().authorization === 'Bearer ' + token ? role : null, headers,
    });
    if (path === '/rest/v1/rpc/puyi_island_catalog') return route.fulfill({ json: role ? [header] : [], headers });
    if (path === '/rest/v1/rpc/puyi_island_detail') return route.fulfill({ json: role ?
      { ...header, blocks: [
        { id: 'b1', name: { es: 'En prueba' }, phraseCount: 1 },
        { id: 'b2', name: { es: 'Otro bloque' }, phraseCount: 1 },
      ] } : null, headers });
    if (path === '/rest/v1/rpc/puyi_island_block') return route.fulfill({ json: role ? [{
      id: 'p1', kind: 'phrase', japanese: '試験です。', segments: [{ text: '試験', reading: 'しけん' }, { text: 'です。' }],
      translation: { es: 'Es una prueba.' }, audioKey: key, audioBytes: media.length, answers: [],
    }] : null, headers });
    if (path === '/storage/v1/object/sign/puyi-islands-private/' + key) {
      expect(request.headers().authorization).toBe('Bearer ' + token);
      expect(request.postDataJSON()).toEqual({ expiresIn: 150 });
      return route.fulfill({ status: role ? 200 : 403, json: { signedURL: '/object/sign/puyi-islands-private/' + key + '?token=fixture' }, headers });
    }
    if (path === '/storage/v1/object/puyi-islands-private/' + key) {
      expect(request.headers().authorization).toBe('Bearer ' + token);
      if (mediaDelay) await mediaDelay;
      return route.fulfill({ status: role ? 200 : 403, contentType: 'audio/mpeg', body: role ? media : '', headers });
    }
    return route.fulfill({ json: [], headers });
  });
  return { requests, revoke: () => { role = null; } };
}

test('Pages has a separate entry and does not fall back to demo data', async ({ page }) => {
  await page.goto(preview.url + '#/anki');
  await page.getByRole('link', { name: /Abrir Islas Puyi/ }).click();
  await expect(page).toHaveURL(/#\/anki\/puyi-islands$/);
  await expect(page.getByRole('status')).toHaveText('Islas Puyi no está disponible ahora.');
  await expect(page.locator('.island-card')).toHaveCount(0);
});

test('an authenticated non-member cannot see a known island route', async ({ page }) => {
  const stub = await fixture(page, null);
  await page.goto(preview.url + detail);
  await expect(page.getByRole('status')).toHaveText('Esta cuenta no tiene acceso a esta biblioteca o isla.');
  expect(stub.requests).toContain('/rest/v1/rpc/puyi_island_access');
  expect(stub.requests).not.toContain('/rest/v1/rpc/puyi_island_detail');
  await expect(page.locator('.transport')).toHaveCount(0);
});

test('the reader opens one block, plays an authenticated MP3, and revocation releases the audio', async ({ page }, info) => {
  const stub = await fixture(page, 'reader');
  await page.goto(preview.url + library);
  await page.getByRole('link', { name: /Isla ficticia/ }).click();
  await expect(page).toHaveURL(new RegExp(island + '$'));
  await expect(page.getByText('Es una prueba.', { exact: true })).toBeVisible();
  expect(stub.requests.filter(path => path.endsWith('/puyi_island_block'))).toHaveLength(1);
  expect(stub.requests.some(path => path.startsWith('/storage/v1/'))).toBe(false);
  await page.getByRole('button', { name: 'Reproducir bloque: En prueba' }).click();
  const status = page.locator('.transport [role=status]');
  await expect(status).toContainText(/Sonando|El navegador pide otro toque/);
  if ((await status.innerText()).includes('otro toque')) {
    await page.getByRole('button', { name: 'Reintentar' }).click();
    await expect(status).toContainText('Sonando');
  }
  expect(stub.requests.filter(path => path.startsWith('/storage/v1/object/puyi-islands-private/'))).toHaveLength(1);
  const usesLease = await page.evaluate(() => window.privateAudioProbe.signedSources.length > 0);
  if (info.project.name === 'edge') expect(usesLease).toBe(false);
  if (usesLease) expect(stub.requests.filter(path => path.startsWith('/storage/v1/object/sign/'))).toHaveLength(1);
  stub.revoke();
  await page.evaluate(() => window.dispatchEvent(new Event('focus')));
  await expect(page.getByRole('status')).toHaveText('Esta cuenta no tiene acceso a esta biblioteca o isla.');
  await expect(page.locator('.phrase-list')).toHaveCount(0);
  expect(await page.evaluate(() => ({
    stopped: [...window.privateAudioProbe.elements].every(element => element.paused && !element.src),
    revoked: window.privateAudioProbe.revoked.some(url => url.startsWith('blob:')),
  }))).toEqual({ stopped: true, revoked: true });
});

test('switching accounts during a private download discards the late MP3', async ({ page }) => {
  const delayed = Promise.withResolvers();
  const stub = await fixture(page, 'reader', delayed.promise);
  try {
    await page.goto(preview.url + detail);
    await expect(page.getByText('Es una prueba.', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Reproducir bloque: En prueba' }).click();
    await expect.poll(() => stub.requests.some(path => path.endsWith('/' + key))).toBe(true);

    await page.evaluate(storageKey => {
      // Simulate a second tab committing a different Auth session while the first tab is open.
      const session = JSON.parse(localStorage.getItem(storageKey));
      const otherId = '70000000-0000-4000-8000-000000000005';
      const [header, payload, signature] = session.access_token.split('.');
      const claims = JSON.parse(atob(payload));
      session.access_token = [header, btoa(JSON.stringify({ ...claims, sub: otherId })).replace(/=+$/, ''), signature].join('.');
      session.user = { ...session.user, id: otherId, email: 'other@example.test' };
      localStorage.setItem('kana-study.workspace.import-decision.v1.' + otherId, 'account');
      localStorage.setItem(storageKey, JSON.stringify(session));
      const channel = new BroadcastChannel(storageKey);
      channel.postMessage({ event: 'SIGNED_IN', session });
      channel.close();
    }, 'sb-' + name + '-auth-token');

    await expect(page.getByRole('status')).toHaveText('Esta cuenta no tiene acceso a esta biblioteca o isla.');
    delayed.resolve();
    await expect(page.locator('.phrase-list')).toHaveCount(0);
    expect(await page.evaluate(() => window.privateAudioProbe.elements.size)).toBe(0);
    expect(stub.requests.filter(path => path.startsWith('/storage/v1/'))).toHaveLength(1);
  } finally {
    delayed.resolve();
  }
});

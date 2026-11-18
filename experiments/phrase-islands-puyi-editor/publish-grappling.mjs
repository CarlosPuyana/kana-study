import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { createInterface } from 'node:readline/promises';
import { Writable } from 'node:stream';
import { fileURLToPath } from 'node:url';
import { isDeepStrictEqual } from 'node:util';
import { createClient } from '@supabase/supabase-js';
import { readJson, safePath, sha } from '../../scripts/phrase-islands-admin-lib.mjs';
import { getAudio, getDecision, recordDecision } from '../phrase-islands-puyi-review/audio.mjs';
import { loadReview } from '../phrase-islands-puyi-review/review.mjs';
import { prepareReviewPublication, verifyPublication } from './publication.mjs';

const appUrl = 'https://carlospuyana.github.io/kana-study/';
const finalReviewHash = '559be6e523eb2256ff3a2b28383c1325c5f39f133b139990012659ff0db3136f';

function requireResult(result, action) {
  if (!result.error) return result.data;
  const code = result.error.code ?? result.error.statusCode ?? result.error.status;
  const suffix = /^[A-Za-z0-9_-]{1,40}$/.test(code ?? '') ? ` (${code})` : '';
  throw new Error(`No se pudo ${action}${suffix}.`);
}

function keyFor(island, asset) {
  return `${island}/${asset.id}/r${asset.revision}-${asset.sha256}.mp3`;
}

async function readSavedRevision(client, island, revision, document) {
  const scoped = table => client.from(`puyi_island_${table}`).select()
    .eq('island_id', island).eq('revision', revision);
  const result = await Promise.all([
    scoped('revisions').maybeSingle(), scoped('blocks'), scoped('entries'), scoped('answers'),
    client.from('puyi_island_audio').select().eq('island_id', island).in('id', document.assets.map(asset => asset.id)),
  ]);
  return result.map(value => requireResult(value, 'leer la revisión guardada'));
}

function assertSameRevision([header, blocks, entries, answers, assets], document) {
  function project(row, expected) {
    return Object.fromEntries(Object.keys(expected).map(field => [field, row?.[field]]));
  }
  function sameRows(rows, expected, key) {
    if (rows.length !== expected.length) return false;
    const byKey = new Map(rows.map(row => [key(row), row]));
    return expected.every(value => isDeepStrictEqual(project(byKey.get(key(value)), value), value));
  }
  const title = { title_ja: document.title_ja, title: document.title, description: document.description };
  const publishedEntries = document.entries.map(({ original_context, editorial_note, ...entry }) => entry);
  const id = row => row.id;
  assert(isDeepStrictEqual(project(header, title), title) && sameRows(blocks, document.blocks, id) &&
    sameRows(entries, publishedEntries, id) && sameRows(answers, document.answers, row => `${row.question_id}/${row.phrase_id}`) &&
    sameRows(assets, document.assets, id), 'Ya existe una revisión distinta de Grappling. Revisa su contenido antes de publicar.');
}

async function checkAudio(blob, asset) {
  assert(blob?.size === asset.bytes, 'El tamaño del MP3 en Storage no coincide con el paquete.');
  assert.equal(sha(Buffer.from(await blob.arrayBuffer())), asset.sha256, 'El SHA-256 del MP3 en Storage no coincide con el paquete.');
}

function download(storage, key) {
  return storage.download(key, {}, { cache: 'no-store' });
}

export async function publishIsland(client, manifest, document, readMedia) {
  const { island, bucket, audio } = manifest;
  const role = requireResult(await client.rpc('puyi_island_access'), 'comprobar el permiso de Islas Puyi');
  assert(role === 'owner', 'Inicia sesión con la cuenta propietaria actual de Islas Puyi.');
  const state = requireResult(await client.rpc('puyi_island_editor_state', { p_island: island }), 'consultar el estado editorial');
  let revision = state?.current;
  if (revision === undefined) {
    revision = requireResult(await client.rpc('puyi_island_save', { p_island: island, p_expected: 0, p_document: document }),
      'guardar la isla. Si la operación se interrumpió, ejecuta de nuevo el comando');
    assert.equal(revision, 1, 'La primera revisión no coincide con el estado esperado.');
  } else {
    assertSameRevision(await readSavedRevision(client, island, revision, document), document);
  }

  const storage = client.storage.from(bucket);
  for (const asset of audio) {
    let received = await download(storage, asset.key);
    if (received.error && state?.published !== revision) {
      const data = readMedia(asset.key);
      assert(data.length === asset.bytes && sha(data) === asset.sha256, 'El MP3 local cambió tras preparar el paquete.');
      const upload = await storage.upload(asset.key, data, { upsert: false, contentType: 'audio/mpeg', cacheControl: '0' });
      // A simultaneous attempt or a lost upload response can leave the exact immutable object already stored.
      received = await download(storage, asset.key);
      if (received.error && upload.error) requireResult(upload, 'subir el MP3 al bucket privado');
    }
    await checkAudio(requireResult(received, 'descargar el MP3 del bucket privado'), asset);
  }
  if (state?.published !== revision) {
    requireResult(await client.rpc('puyi_island_publish', {
      p_island: island, p_expected: revision, p_expected_published: state?.published ?? null, p_revision: revision,
    }), 'publicar la revisión. Si hubo un conflicto, ejecuta de nuevo el comando');
  }
  return revision;
}

export async function verifyIsland(client, manifest, document, revision) {
  const { island, bucket, audio } = manifest;
  const catalog = requireResult(await client.rpc('puyi_island_catalog'), 'abrir el catálogo privado');
  const listing = catalog.find(item => item.id === island);
  assert(listing && (revision === undefined || listing.revision === revision), 'Grappling no aparece en el catálogo de esta cuenta.');
  const detail = requireResult(await client.rpc('puyi_island_detail', { p_island: island }), 'abrir la isla publicada');
  assert(detail?.revision === listing.revision && detail?.blocks.length === document.blocks.length,
    'La isla publicada no contiene los bloques esperados.');
  const assets = new Map(document.assets.map(asset => [asset.id, asset]));
  for (const block of document.blocks) {
    const entries = requireResult(await client.rpc('puyi_island_block', {
      p_island: island, p_revision: listing.revision, p_block: block.id,
    }), 'abrir un bloque publicado');
    const expected = document.entries.filter(entry => entry.block_id === block.id);
    assert(Array.isArray(entries) && entries.length === expected.length, 'Un bloque publicado tiene entradas distintas del paquete.');
    for (const entry of expected) {
      const remote = entries.find(row => row.id === entry.id);
      const asset = assets.get(entry.audio_id);
      const answers = document.answers.filter(answer => answer.question_id === entry.id).map(answer => answer.phrase_id);
      assert(remote?.audioKey === keyFor(island, asset) && remote.audioBytes === asset.bytes &&
        remote.japanese === entry.japanese && remote.kind === entry.kind &&
        remote.answers?.length === answers.length && answers.every((id, i) => remote.answers[i] === id),
      'Un bloque publicado no coincide con el paquete de Grappling.');
    }
  }
  for (const asset of audio) {
    const received = await download(client.storage.from(bucket), asset.key);
    await checkAudio(requireResult(received, 'descargar el MP3 publicado desde el bucket privado'), asset);
  }
  return listing.revision;
}

async function pagesClient() {
  const response = await fetch(new URL('supabase-config.js', appUrl), { redirect: 'error', signal: AbortSignal.timeout(15000) });
  assert(response.ok, 'No se pudo leer la configuración pública de Kana Study.');
  const match = (await response.text()).match(/^\s*window\.__KANA_STUDY_CONFIG__\s*=\s*(\{[^]*\})\s*;?\s*$/);
  assert(match, 'El formato de configuración pública de Kana Study ha cambiado.');
  const { supabaseUrl, supabasePublishableKey } = JSON.parse(match[1]);
  assert(/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/i.test(supabaseUrl) && /^sb_publishable_[A-Za-z0-9_-]+$/.test(supabasePublishableKey),
    'La web desplegada debe indicar su URL de Supabase y su clave publicable.');
  const origin = new URL(supabaseUrl).origin;
  const publicProbe = await fetch(new URL('/storage/v1/object/public/puyi-islands-private/local-preflight-nonexistent.mp3', origin), {
    headers: { apikey: supabasePublishableKey }, cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(15000),
  });
  const probe = await publicProbe.json().catch(() => null);
  assert(!publicProbe.ok && probe?.message === 'Bucket not found',
    'El endpoint público de Storage no confirma el aislamiento del bucket. Comprueba en Supabase que el bucket ya configurado es privado.');
  return createClient(origin, supabasePublishableKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch(input, init) {
      const request = new Request(input, init);
      assert(new URL(request.url).origin === origin, 'Destino de Supabase inesperado.');
      return fetch(request, { redirect: 'error', signal: AbortSignal.any([request.signal, AbortSignal.timeout(30000)]) });
    } },
  });
}

async function main(args) {
  const verifyOnly = args.length === 1 && args[0] === '--comprobar';
  assert(verifyOnly || args.length === 0, 'Ejecuta el comando sin opciones para publicar o usa --comprobar para solo lectura.');
  assert(process.stdin.isTTY && process.stdout.isTTY, 'Ejecuta el comando en una ventana interactiva de PowerShell.');
  const review = loadReview('grappling-p21-confirmacion.json', 'grappling-draft.json');
  assert(review.sha256 === finalReviewHash, 'La revisión de texto ha cambiado.');
  const { approved, clips } = getAudio(review);
  assert(approved && clips.size === 12, 'Primero verifica los doce MP3 de la revisión aprobada.');

  let hidden = false;
  const output = new Writable({ write(chunk, encoding, callback) {
    if (!hidden) process.stdout.write(chunk, encoding);
    callback();
  } });
  const prompt = createInterface({ input: process.stdin, output, terminal: true });
  try {
    const decisions = [...clips].map(([id, clip]) => ({ id, clip, status: getDecision(review, id, clip)?.decision }));
    assert(!decisions.some(item => item.status === 'needs-correction'), 'Hay audios marcados para corregir. Escucha y resuelve esos clips primero.');
    const pending = decisions.filter(item => item.status !== 'accepted');
    if (pending.length) {
      assert(!verifyOnly, 'Para comparar con la publicación, registra primero la aprobación auditiva.');
      const confirmation = await prompt.question('Tras escuchar los 12 clips, escribe ACEPTO para aprobar este lote de audio: ');
      assert(confirmation.trim() === 'ACEPTO', 'Publicación cancelada. La aprobación auditiva sigue pendiente.');
      for (const { id, clip } of pending) {
        assert(recordDecision(review, id, clip.revision, clip.hash, 'accepted', '', 'explicit-local-cli-action'),
          'Algún audio cambió durante la aprobación. Vuelve a escuchar el lote.');
      }
    }

    const folder = prepareReviewPublication(review, { includeNotes: false });
    const manifest = verifyPublication(path.basename(folder));
    const document = readJson(safePath(folder, 'payload.json'));
    const client = await pagesClient();
    const email = (await prompt.question('Correo de la cuenta de Kana Study: ')).trim();
    process.stdout.write('Contraseña (oculta): ');
    hidden = true;
    let password = await prompt.question('');
    hidden = false;
    process.stdout.write('\n');
    const login = await client.auth.signInWithPassword({ email, password });
    password = '';
    requireResult(login, 'iniciar sesión con esa cuenta');

    const revision = verifyOnly ? undefined : await publishIsland(client, manifest, document,
      key => readFileSync(safePath(folder, 'media/' + key)));
    const confirmed = await verifyIsland(client, manifest, document, revision);
    console.log(`Grappling · revisión ${confirmed} · 2 bloques y 12 MP3 verificados en Supabase.`);
    console.log(new URL('#/anki/puyi-islands/island/' + manifest.island, appUrl).href);
  } finally {
    prompt.close();
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    await main(process.argv.slice(2));
  } catch (error) {
    console.error(error instanceof assert.AssertionError ? error.message : error instanceof Error && error.message.startsWith('No se pudo ')
      ? error.message : 'La operación se interrumpió. Comprueba la conexión y vuelve a ejecutar el comando.');
    process.exitCode = 1;
  }
}

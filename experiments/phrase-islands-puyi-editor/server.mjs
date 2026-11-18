import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { REPO, safePath } from '../../scripts/phrase-islands-admin-lib.mjs';
import { DRAFT_BYTES, readPuyiDraft, validDraftId } from '../../src/app/features/puyi-editor/puyi-draft-contract.ts';
import { DraftError, DraftStore } from './store.mjs';

const staticTypes = { '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html' };
const headers = {
  'Cache-Control': 'no-store',
  'Content-Security-Policy': "default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self'; img-src 'self' data:; font-src 'self'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'",
  'Cross-Origin-Resource-Policy': 'same-origin',
  'Referrer-Policy': 'no-referrer',
  'X-Content-Type-Options': 'nosniff',
};

function send(response, status, body, type = 'application/json') {
  response.writeHead(status, { ...headers, 'Content-Type': type + '; charset=utf-8' });
  response.end(type === 'application/json' ? JSON.stringify(body) : body);
}

async function body(request) {
  if (request.headers['content-type']?.split(';')[0] !== 'application/json') throw new DraftError('json', 415);
  const buffers = [];
  let bytes = 0;
  for await (const chunk of request.iterator({ destroyOnReturn: false })) {
    bytes += chunk.length;
    if (bytes > DRAFT_BYTES) {
      request.resume();
      throw new DraftError('size', 413);
    }
    buffers.push(chunk);
  }
  try {
    const value = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(Buffer.concat(buffers)));
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error();
    return value;
  } catch {
    throw new DraftError('json');
  }
}

export function editorServer({ store = new DraftStore(), browser = path.join(REPO, 'dist/puyi-editor/browser') } = {}) {
  const server = createServer(async (request, response) => {
    try {
      const host = '127.0.0.1:' + server.address().port;
      if (request.headers.host !== host || request.headers['sec-fetch-site'] === 'cross-site') throw new DraftError('origin', 403);
      const origin = 'http://' + host;
      const url = new URL(request.url, origin);
      if (url.origin !== origin) throw new DraftError('origin', 403);
      const route = url.pathname;
      if (request.method === 'POST') {
        if (request.headers.origin !== origin) throw new DraftError('origin', 403);
        const data = await body(request);
        if (route === '/api/check') {
          const result = readPuyiDraft(data.document);
          if (!result.document) throw new DraftError('invalid', 400, result.issues);
          store.checkCollisions(result.document);
          if (store.history(result.document.island.id).length) throw new DraftError('duplicateIsland', 409);
          return send(response, 200, result.document);
        }
        if (route === '/api/save') return send(response, 200, store.save(data.document, data.expected, data.review ?? null));
        if (route === '/api/restore') return send(response, 200, store.restore(data.id, data.revision, data.expected));
        if (route === '/api/audio-job') return send(response, 200, store.prepareAudio(data.id, data.itemId, data.expected));
        throw new DraftError('missing', 404);
      }
      if (request.method !== 'GET') throw new DraftError('missing', 405);
      if (route === '/example.json') return send(response, 200, JSON.parse(readFileSync(new URL('./example.json', import.meta.url), 'utf8')));
      if (route === '/api/drafts') return send(response, 200, store.list());
      if (route === '/api/draft') {
        const id = url.searchParams.get('id');
        if (!validDraftId(id)) throw new DraftError('id');
        return send(response, 200, { ...store.get(id), history: store.history(id) });
      }
      const file = route === '/' ? 'index.puyi-demo.html' : route.slice(1);
      if (route === '/' || /^(?:main|chunk|styles|polyfills)-[A-Z0-9]+\.(?:js|css)$/.test(file)) {
        const bytes = readFileSync(safePath(browser, file));
        return send(response, 200, bytes, staticTypes[path.extname(file)]);
      }
      throw new DraftError('missing', 404);
    } catch (error) {
      if (error instanceof DraftError) return send(response, error.status, { code: error.message, issues: error.issues });
      if (error.code === 'ENOENT') return send(response, 404, { code: 'missing' });
      return send(response, 500, { code: 'internal' });
    }
  });
  return server;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const server = editorServer();
  server.listen(4447, '127.0.0.1', () => console.log('Editor local: http://127.0.0.1:4447/'));
}

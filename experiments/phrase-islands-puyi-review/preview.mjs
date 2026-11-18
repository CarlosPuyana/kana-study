import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import * as sass from 'sass';
import { loadReview } from './review.mjs';
import { getAudio, getDecision, recordDecision } from './audio.mjs';

const [name = 'grappling-p21.json', sourceName = 'grappling-draft.json'] = process.argv.slice(2);
const host = '127.0.0.1';
const port = Number(process.env.PUYI_REVIEW_PORT ?? 4444);
if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error('Invalid local port');
const origin = `http://${host}:${port}`;
const css = sass.compile(fileURLToPath(new URL('./preview.scss', import.meta.url))).css;

function escape(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[char]);
}

function furigana(segments) {
  return segments.map(part => part.reading
    ? `<ruby>${escape(part.text)}<rp>（</rp><rt>${escape(part.reading)}</rt><rp>）</rp></ruby>`
    : escape(part.text)).join('');
}

function viewUrl(theme, section, fragment = '') {
  const params = new URLSearchParams();
  if (theme === 'light') params.set('theme', theme);
  if (section) params.set('section', section);
  return '/' + (params.size ? '?' + params.toString() : '') + (fragment ? '#' + fragment : '');
}

function audioReview(item, clip, review, theme, section) {
  const state = getDecision(review, item.id, clip);
  const label = state?.decision === 'accepted' ? 'Aceptado'
    : state?.decision === 'needs-correction' ? 'Pendiente de corrección' : 'Pendiente de escucha';
  return `<details class="audio-review"><summary>${label}</summary>
    <form method="post" action="/audio-review">
      <input type="hidden" name="id" value="${escape(item.id)}">
      <input type="hidden" name="revision" value="${escape(clip.revision)}">
      <input type="hidden" name="hash" value="${escape(clip.hash)}">
      <input type="hidden" name="theme" value="${theme}">
      <input type="hidden" name="section" value="${escape(section)}">
      <label>Nota de escucha <textarea name="note" maxlength="500" rows="2">${escape(state?.note ?? '')}</textarea></label>
      <div class="decision-actions">
        <button type="submit" name="decision" value="accepted">Aceptar audio</button>
        <button type="submit" name="decision" value="needs-correction">Marcar para corregir</button>
      </div>
      <p class="audio-version">Revisión de audio ${escape(clip.revision)}</p>
    </form></details>`;
}

function card(item, block, theme, section, review, clip) {
  const prompt = item.kind === 'prompt';
  const translation = prompt ? item.translation : item.natural;
  const changed = item.editorialDecision === 'propose-change';
  const answers = prompt ? item.answerPhraseIds.map(id => {
    const answer = block.phrases.find(phrase => phrase.id === id);
    return `<a href="${escape(viewUrl(theme, block.id, answer.id))}">${escape(answer.sourceLabel)}</a>`;
  }).join(' ') : '';
  return `<article id="${escape(item.id)}" class="card">
    <div class="phrase">
      <p class="phrase-id">${escape(item.sourceLabel)}</p>
      <h3 lang="ja">${furigana(item.segments)}</h3>
      <p lang="ja" class="reading">${escape(item.reading)}</p>
      <p class="natural">${escape(translation.es)}</p>
      ${clip ? `<audio class="clip" controls preload="none" aria-label="Audio ${escape(item.sourceLabel)}"
        src="/clip/${escape(item.id)}/${escape(clip.hash)}"></audio>
        ${audioReview(item, clip, review, theme, section)}` : ''}
    </div>
    <div class="card-footer">
      ${clip ? '' : '<p class="audio-state"><span class="audio-icon" aria-hidden="true"></span>Audio pendiente</p>'}
      <details class="editorial">
        <summary><span class="show-label">Ver detalles</span><span class="hide-label">Ocultar detalles</span></summary>
        <div class="detail-body">
          <dl>
            <dt>Estructura</dt><dd>${escape(item.structural.es)}</dd>
            <dt>Gramática</dt><dd>${escape(item.explanation.es)}</dd>
          </dl>
          ${prompt ? `<h4>Respuestas relacionadas</h4><p class="answer-links">${answers}</p>` : ''}
          <h4>Vocabulario</h4>
          <ul>${item.vocabulary.map(word => `<li><span lang="ja">${escape(word.japanese)}（${escape(word.reading)}）</span> · ${escape(word.meaning.es)}</li>`).join('')}</ul>
          <h4>Traducciones en borrador</h4>
          <dl>
            <dt>English</dt><dd lang="en">${escape(translation.en)}</dd>
            <dt>Català</dt><dd lang="ca">${escape(translation.ca)}</dd>
          </dl>
          <h4>Original y motivo de la decisión</h4>
          <p><strong>${changed ? 'Cambio propuesto' : 'Japonés conservado'}</strong></p>
          <p lang="ja">${escape(item.original.japanese)}</p>
          <p>${escape(item.original.context)}</p>
          <p>${escape(item.editorialNote)}</p>
          <h4>Lectura para AivisSpeech</h4><p>${escape(item.audio.note)}</p>
        </div>
      </details>
    </div>
  </article>`;
}

function render(review, { approved, clips }, theme, section) {
  const { island, blocks, pending } = review.proposal;
  const sections = blocks.map(block => ({
    id: block.id, name: block.name.es, entries: block.phrases.map(item => ({ item, block })),
  }));
  const questions = blocks.flatMap(block => block.prompts.map(item => ({ item, block })));
  sections.push({ id: 'questions', name: 'Preguntas', entries: questions });
  const total = sections.reduce((count, tab) => count + tab.entries.length, 0);
  if (approved) sections.push({ id: 'all', name: 'Todos los audios',
    entries: blocks.flatMap(block => [...block.phrases, ...block.prompts].map(item => ({ item, block }))),
  });
  const selected = sections.find(tab => tab.id === section) ?? sections[0];
  const navigation = sections.map(tab => {
    const current = tab.id === selected.id ? ' aria-current="page"' : '';
    return `<a href="${escape(viewUrl(theme, tab.id))}"${current}>${escape(tab.name)}</a>`;
  }).join('');
  const oppositeTheme = theme === 'light' ? 'dark' : 'light';
  const themeLabel = theme === 'light' ? 'Tema oscuro' : 'Tema claro';
  const reviewNotes = pending.map(note => `<li><strong>${escape(note.items.length > 4 ? 'Revisión general' : note.items.join(' · '))}</strong>
    <p>${escape(note.question)}</p>${note.alternative ? `<p>${escape(note.alternative)}</p>` : ''}</li>`).join('');
  return `<!doctype html>
<html lang="es" data-theme="${theme}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Islas Puyi · ${escape(island.title.es)}</title><link rel="stylesheet" href="/preview.css"></head>
<body><main class="island">
  <header class="island-header">
    <div class="header-meta">
      <p class="draft-status"><span>${approved ? 'Escucha privada · P2.2' : 'Borrador privado · P2.1'}</span><span>${total} elementos</span></p>
      <a class="theme-link" href="${escape(viewUrl(oppositeTheme, selected.id))}" aria-label="${themeLabel}" title="${themeLabel}"><span aria-hidden="true">${theme === 'light' ? '☾' : '☀'}</span></a>
    </div>
    <h1 lang="ja">${escape(island.titleJa)}</h1>
    <p class="subtitle">${escape(island.title.es)}</p>
    <p class="description">${escape(island.description.es)}</p>
  </header>
  <nav class="segments" aria-label="Bloques de la isla">${navigation}</nav>
  <section class="block" aria-labelledby="block-title">
    <h2 id="block-title" class="visually-hidden">${escape(selected.name)}</h2>
    <div class="cards">${selected.entries.map(({ item, block }) =>
      card(item, block, theme, selected.id, review, clips.get(item.id))).join('')}</div>
  </section>
  <details class="review-notes" id="pendientes">
    <summary>Cuestiones pendientes de revisión</summary>
    <div class="detail-body"><ul>${reviewNotes}</ul>
      <p>ES es la referencia editorial. EN y CA incluyen traducciones naturales en borrador. Las notas de estructura, gramática y vocabulario están en español.</p>
    </div>
  </details>
</main></body></html>`;
}

const headers = {
  'Cache-Control': 'no-store',
  'Content-Security-Policy': "default-src 'none'; style-src 'self'; media-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'",
  'Referrer-Policy': 'same-origin',
  'X-Content-Type-Options': 'nosniff',
  'X-Robots-Tag': 'noindex, nofollow, noarchive',
};

function sendClip(req, res, bytes) {
  const mediaHeaders = { ...headers, 'Content-Type': 'audio/mpeg', 'Accept-Ranges': 'bytes' };
  const range = req.headers.range;
  if (!range) return res.writeHead(200, { ...mediaHeaders, 'Content-Length': bytes.length })
    .end(req.method === 'HEAD' ? undefined : bytes);
  const match = /^bytes=(\d*)-(\d*)$/.exec(range);
  if (match && (match[1] || match[2])) {
    const last = bytes.length - 1;
    const start = match[1] ? Number(match[1]) : Math.max(0, bytes.length - Number(match[2]));
    const end = match[1] && match[2] ? Math.min(last, Number(match[2])) : last;
    if (start <= end && start <= last) {
      return res.writeHead(206, { ...mediaHeaders, 'Content-Length': end - start + 1,
        'Content-Range': `bytes ${start}-${end}/${bytes.length}` })
        .end(req.method === 'HEAD' ? undefined : bytes.subarray(start, end + 1));
    }
  }
  return res.writeHead(416, { ...mediaHeaders, 'Content-Range': `bytes */${bytes.length}` }).end();
}

async function submitDecision(req, res) {
  if (req.headers.origin !== origin ||
      !/^application\/x-www-form-urlencoded(?:;|$)/i.test(req.headers['content-type'] ?? '')) {
    return res.writeHead(403, headers).end();
  }
  const parts = [];
  let count = 0;
  for await (const chunk of req) {
    count += chunk.length;
    if (count > 8192) return res.writeHead(413, headers).end();
    parts.push(chunk);
  }
  const params = new URLSearchParams(Buffer.concat(parts).toString('utf8'));
  const id = params.get('id');
  const review = loadReview(name, sourceName);
  if (!recordDecision(review, id, params.get('revision'), params.get('hash'),
      params.get('decision'), params.get('note') ?? '')) return res.writeHead(409, headers).end();
  const theme = params.get('theme') === 'light' ? 'light' : 'dark';
  return res.writeHead(303, { ...headers, Location: viewUrl(theme, params.get('section'), id) }).end();
}

loadReview(name, sourceName);
const server = createServer(async (req, res) => {
  if (req.headers.host !== `${host}:${port}` ||
      (req.headers.origin && req.headers.origin !== origin) ||
      (req.headers['sec-fetch-site'] === 'cross-site' && req.headers['sec-fetch-mode'] !== 'navigate')) {
    return res.writeHead(403, headers).end();
  }
  try {
    const url = new URL(req.url, origin);
    if (url.origin !== origin) return res.writeHead(404, headers).end();
    if (req.method === 'POST' && url.pathname === '/audio-review') return await submitDecision(req, res);
    if (req.method !== 'GET' && req.method !== 'HEAD') return res.writeHead(405, headers).end();
    if (url.pathname === '/') {
      const theme = url.searchParams.get('theme') === 'light' ? 'light' : 'dark';
      const review = loadReview(name, sourceName);
      const html = render(review, getAudio(review), theme, url.searchParams.get('section'));
      return res.writeHead(200, { ...headers, 'Content-Type': 'text/html; charset=utf-8' })
        .end(req.method === 'HEAD' ? undefined : html);
    }
    const clipPath = /^\/clip\/([0-9a-f-]{36})\/([0-9a-f]{64})$/.exec(url.pathname);
    if (clipPath) {
      const clip = getAudio(loadReview(name, sourceName)).clips.get(clipPath[1]);
      if (!clip || clip.hash !== clipPath[2]) return res.writeHead(404, headers).end();
      return sendClip(req, res, readFileSync(clip.file));
    }
    if (req.url === '/preview.css') {
      return res.writeHead(200, { ...headers, 'Content-Type': 'text/css; charset=utf-8' })
        .end(req.method === 'HEAD' ? undefined : css);
    }
    return res.writeHead(404, headers).end();
  } catch {
    return res.writeHead(500, headers).end('No se ha podido validar la propuesta privada.');
  }
});

server.listen(port, host, () => console.log(origin + '/'));

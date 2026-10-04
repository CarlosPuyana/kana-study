// Optional, explicit local action. One request, no loop/retry; NOT imported by tests.
const [endpoint, mode = 'translate', language = 'es', selectedText = '食べなかった', contextText, previousText, nextText] = process.argv.slice(2);
if (!endpoint || !['translate', 'study'].includes(mode) || !['es', 'en', 'ca'].includes(language)) {
  console.error('Usage: npm run benchmark -- http://localhost:8787/assist translate es "食べなかった"');
  process.exit(1);
}
const url = new URL(endpoint);
if (!['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) || url.pathname !== '/assist' || url.protocol !== 'http:') {
  throw new Error('Benchmark V1 only accepts a local wrangler dev /assist endpoint.');
}
const started = performance.now();
const request = { selectedText, targetLanguage: language, ...(contextText ? { contextText } : {}), ...(previousText ? { previousText } : {}), ...(nextText ? { nextText } : {}) };
try {
const response = await fetch(url, {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ schemaVersion: 1, mode, request }),
  signal: AbortSignal.timeout(60_000),
});
const usage = response.headers.get('X-Manga-Benchmark-Usage');
console.log(JSON.stringify({ status: response.status, elapsedMs: Math.round(performance.now() - started), request, result: await response.json(), usage: usage ? JSON.parse(usage) : null }, null, 2));
} catch {
  console.log(JSON.stringify({ status: null, elapsedMs: Math.round(performance.now() - started), request, result: { error: 'benchmark_transport_error' } }, null, 2));
  process.exitCode = 1;
}

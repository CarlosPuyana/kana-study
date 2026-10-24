import fs from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import { createHash } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import { gunzipSync } from 'node:zlib';

export async function fileDigest(file) {
  const hash = createHash('sha256');
  for await (const bytes of createReadStream(file)) hash.update(bytes);
  return hash.digest('hex');
}

/** Bounded on-demand lookup: full lexicon never becomes an in-memory JS array. */
export class EnrichedLexicon {
  #database;
  #query;
  #owned = new WeakSet();
  #cache = new Map();
  #cacheLimit;
  hits = 0;
  misses = 0;

  static async open({ cacheLimit = 128 } = {}) {
    const root = new URL('./', import.meta.url);
    const manifest = JSON.parse(await fs.readFile(new URL('reports/enriched-source.json', root), 'utf8'));
    const pin = JSON.parse(await fs.readFile(new URL('enriched-source.json', root), 'utf8'));
    const database = new URL('resources/enriched/lexicon-v2.sqlite', root);
    if (manifest.source.xmlSha256 !== pin.xmlSha256 || manifest.source.sha256 !== pin.sha256 ||
        manifest.adapterSha256 !== await fileDigest(new URL('build-enriched.py', root)) ||
        manifest.databaseSha256 !== await fileDigest(database)) throw Error('Untrusted enriched resource');
    return new EnrichedLexicon(database, manifest, cacheLimit);
  }

  constructor(database, manifest, cacheLimit) {
    if (!Number.isSafeInteger(cacheLimit) || cacheLimit < 0 || cacheLimit > 4096) throw Error('Invalid cache limit');
    this.manifest = manifest;
    this.#cacheLimit = cacheLimit;
    this.#database = new DatabaseSync(database, { readOnly: true });
    this.#query = this.#database.prepare('SELECT DISTINCT e.body FROM forms f JOIN entries e ON e.id=f.id WHERE f.form=? ORDER BY e.id');
  }

  findAll(expression) {
    if (typeof expression !== 'string' || !expression || expression.length > 256) return [];
    if (this.#cache.has(expression)) {
      this.hits++;
      const value = this.#cache.get(expression);
      this.#cache.delete(expression); this.#cache.set(expression, value);
      return value;
    }
    this.misses++;
    const rows = this.#query.all(expression);
    // Never silently certify a truncated set. Pathological readings require abstention.
    if (rows.length > 1024) throw Error('Candidate bound exceeded; no certification');
    const entries = rows.map(row => deepFreeze(JSON.parse(gunzipSync(row.body, { maxOutputLength: 1048576 }).toString('utf8'))));
    entries.forEach(entry => this.#owned.add(entry));
    Object.freeze(entries);
    if (this.#cacheLimit) {
      this.#cache.set(expression, entries);
      if (this.#cache.size > this.#cacheLimit) this.#cache.delete(this.#cache.keys().next().value);
    }
    return entries;
  }

  owns(entry) { return this.#owned.has(entry); }
  close() { this.#cache.clear(); this.#database.close(); }
}

function deepFreeze(value) {
  if (value && typeof value === 'object') {
    for (const child of Object.values(value)) deepFreeze(child);
    Object.freeze(value);
  }
  return value;
}

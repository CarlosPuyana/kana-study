import { inject, Injectable } from '@angular/core';
import { MangaLexeme, MangaVocabularyIndex, MangaPosEvidence } from '../models/manga-vocabulary-index.model';
import { mangaDictionaryPosEvidence } from './manga-dictionary-pos-evidence';
import { MANGA_POS_PROVENANCE } from '../../data/manga-pos-alternatives.generated';
import { DictionaryRepository } from './dictionary.repository';
import { MangaRepository } from './manga.repository';
import { MangaOcrSourceService } from './manga-ocr-source.service';
import { WorkspaceService } from './workspace.service';
import { analyzeMangaLine, MANGA_ANALYZER_VERSION, mergeMangaLexemes } from './manga-vocabulary-analysis';
import { DictionaryTerm } from '../models/dictionary.model';

@Injectable({providedIn: 'root'})
export class MangaVocabularyIndexService {
  private readonly repository = inject(MangaRepository);
  private readonly source = inject(MangaOcrSourceService);
  private readonly dictionary = inject(DictionaryRepository);
  private readonly workspace = inject(WorkspaceService);

  private stamps(revision: number, volume: import('../models/manga.model').MangaVolume,
    dictionary: Awaited<ReturnType<DictionaryRepository['ready']>>) {
    return {sourceStamp: JSON.stringify([revision, volume.pageCount, volume.updatedAt, volume.mokuro]),
      analyzerStamp: JSON.stringify([MANGA_ANALYZER_VERSION, MANGA_POS_PROVENANCE, dictionary ?? null,
        typeof Intl.Segmenter === 'function', typeof Intl.Segmenter === 'function' ? new Intl.Segmenter('ja').resolvedOptions() : null])};
  }

  /** RUSH is a cache-only consumer. A miss never opens OCR or writes an index. */
  async cached(volumeId: string, signal: AbortSignal): Promise<MangaVocabularyIndex | null> {
    const owner = this.workspace.active(), epoch = this.workspace.activationRevision();
    const [volume, revision, dictionary, index] = await Promise.all([
      this.repository.volume(volumeId, owner), this.repository.ocrRevision(volumeId, owner),
      this.dictionary.ready(), this.repository.vocabularyIndex(volumeId, owner)]);
    if (signal.aborted || owner !== this.workspace.active() || epoch !== this.workspace.activationRevision()) throw Error('stale');
    if (!volume?.complete || index?.schemaVersion !== 1) return null;
    const stamps = this.stamps(revision, volume, dictionary);
    return index.sourceStamp === stamps.sourceStamp && index.analyzerStamp === stamps.analyzerStamp ? index : null;
  }

  async load(volumeId: string, signal: AbortSignal): Promise<MangaVocabularyIndex> {
    const owner = this.workspace.active(), epoch = this.workspace.activationRevision();
    const guard = () => {
      if (signal.aborted || owner !== this.workspace.active() || epoch !== this.workspace.activationRevision()) throw Error('stale');
    };
    const [volume, revision, dictionary] = await Promise.all([
      this.repository.volume(volumeId, owner), this.repository.ocrRevision(volumeId, owner), this.dictionary.ready()]);
    guard();
    if (!volume) throw Error('missing-volume');
    const {sourceStamp, analyzerStamp} = this.stamps(revision, volume, dictionary);
    const empty: MangaVocabularyIndex = {schemaVersion: 1, volumeId, volumeTitle: volume.title, sourceStamp, analyzerStamp,
      pageCount: volume.pageCount, entries: [], issues: [], occurrences: 0, status: 'incomplete-import'};
    if (!volume.complete) return empty;
    const cached = await this.repository.vocabularyIndex(volumeId, owner); guard();
    if (cached?.schemaVersion === 1 && cached.sourceStamp === sourceStamp && cached.analyzerStamp === analyzerStamp &&
      !cached.issues.some(issue => issue.reason === 'read-error')) return cached;
    const source = await this.source.open(volumeId, owner, signal); guard();
    if (!source) throw Error('missing-volume');
    const result = {...empty, status: 'complete' as MangaVocabularyIndex['status']};
    const lexemes = new Map<string, MangaLexeme>();
    const cache = new Map<string, Promise<DictionaryTerm[]>>();
    const posCache = new Map<string, Promise<MangaPosEvidence>>();
    const evidence = (term: DictionaryTerm) => {
      guard();
      let pending = posCache.get(term.id);
      if (!pending) { pending = mangaDictionaryPosEvidence(term); posCache.set(term.id, pending); }
      return pending;
    };
    const find = (text: string): Promise<DictionaryTerm[]> => {
      guard();
      if (!dictionary) return Promise.resolve([]);
      let pending = cache.get(text);
      if (!pending) {
        // Bound memory without treating an exhausted query budget as lexical evidence.
        if (cache.size >= 10000) cache.clear();
        pending = this.dictionary.find(dictionary.dictionaryId, text, 'expression').then(rows =>
          rows.length ? rows : this.dictionary.find(dictionary.dictionaryId, text, 'reading')); cache.set(text, pending);
      }
      return pending;
    };
    let textPages = 0, units = 0;
    for (let pageIndex = 0; pageIndex < source.pageCount; pageIndex++) {
      guard();
      if (pageIndex >= 2000 || units > 8_000_000) { result.issues.push({pageIndex, reason: 'limit'}); break; }
      let page;
      try { page = await source.read(pageIndex); } catch { result.issues.push({pageIndex, reason: 'read-error'}); continue; }
      guard();
      const ocr = page?.ocr;
      if (!ocr?.blocks?.length) { result.issues.push({pageIndex, reason: 'missing-ocr'}); continue; }
      if (!Array.isArray(ocr.blocks) || !ocr.blocks.every(b => b && Array.isArray(b.lines) && b.lines.every(l => typeof l === 'string'))) {
        result.issues.push({pageIndex, reason: 'invalid-ocr'}); continue;
      }
      let hasText = false;
      for (const [blockIndex, block] of ocr.blocks.entries()) for (const [lineIndex, context] of block.lines.entries()) {
        units += context.length; hasText ||= !!context.trim();
        if (units > 8_000_000) { result.issues.push({pageIndex, reason: 'limit'}); break; }
        const analyzed = await analyzeMangaLine(context, {pageIndex, blockIndex, lineIndex}, find, evidence); guard();
        mergeMangaLexemes(lexemes, analyzed.entries); result.issues.push(...analyzed.issues);
      }
      if (hasText) textPages++;
      // Yield between pages so navigation and workspace cancellation remain responsive.
      await new Promise<void>(resolve => setTimeout(resolve, 0));
    }
    result.entries = [...lexemes.values()];
    result.occurrences = result.entries.reduce((n, e) => n + e.occurrences.length, 0);
    result.status = !textPages && result.issues.every(issue => issue.reason === 'missing-ocr') ? 'no-ocr' :
      result.issues.length ? 'partial' : 'complete';
    guard();
    const currentDictionary = await this.dictionary.ready(); guard();
    if (JSON.stringify(currentDictionary ?? null) !== JSON.stringify(dictionary ?? null)) throw Error('dictionary-changed');
    await this.repository.saveVocabularyIndex(result, revision, owner); guard();
    return result;
  }
}

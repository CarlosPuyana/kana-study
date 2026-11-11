import { DictionaryTerm } from '../models/dictionary.model';
import { MangaPosEvidence } from '../models/manga-vocabulary-index.model';
import { MANGA_POS_GROUPS, MANGA_POS_ROWS, MANGA_POS_PROVENANCE } from '../../data/manga-pos-alternatives.generated';
import { ocrDigest } from './manga-ocr-text';

/** Manga-only supplement. Never changes installed terms, senses, keys or knowledge.
 * Sequence or spelling alone is insufficient: the complete parsed row must match. */
export async function mangaDictionaryPosEvidence(term: DictionaryTerm): Promise<MangaPosEvidence> {
  const evidence: MangaPosEvidence = {definitionTags: term.definitionTags, rules: term.rules};
  const signature = await ocrDigest(JSON.stringify([term.expression, term.reading, term.sequence,
    term.definitionTags, term.rules, term.glossaries]));
  const group = MANGA_POS_ROWS[signature];
  if (group !== undefined) {
    evidence.alternatives = MANGA_POS_GROUPS[group].map(([entryId, definitionTags]) => ({entryId, definitionTags}));
    evidence.provenance = MANGA_POS_PROVENANCE.sourceArchiveSha256;
  }
  return evidence;
}

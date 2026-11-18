import { CatalogPhrase, PhraseAudioReference, PhraseContent, PhraseEditorialRecord } from '../../core/models/phrase-island.model';
import content from './phrases.v1.json';
import editorial from './editorial.v1.json';
import media from './audio.v1.json';

export const PHRASE_CATALOG_VERSION = content.version;
const records = editorial.records as Readonly<Record<string, PhraseEditorialRecord>>;
const audio = media as Readonly<Record<string, PhraseAudioReference>>;
/** Read-only public content. Merely importing it never opens a progress database. */
export const PHRASE_ISLANDS_CATALOG: readonly CatalogPhrase[] = (content.phrases as readonly PhraseContent[])
  .filter(phrase => records[phrase.id]?.status === 'approved' && !!audio[phrase.id])
  .map(phrase => ({ ...phrase, audio: audio[phrase.id], editorial: records[phrase.id] }));

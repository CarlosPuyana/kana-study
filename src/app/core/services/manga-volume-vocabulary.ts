import { CustomDeck, CustomDeckCard } from '../models/deck-catalog.model';
import { MangaCardConfirmation } from '../models/manga-deck-confirmation.model';
import { LexicalCardClassification } from '../models/lexical-knowledge.model';

export interface VolumeVocabularyEntry {
  readonly card: CustomDeckCard;
  readonly deck: CustomDeck;
  readonly confirmations: readonly MangaCardConfirmation[];
  readonly classification: LexicalCardClassification;
}
export type VolumeVocabularyState = LexicalCardClassification['state'];
export type VolumeVocabularySort = 'page' | 'confirmed';
export interface VolumeVocabulary {
  readonly entries: readonly VolumeVocabularyEntry[];
  readonly incomplete: boolean;
}
export function filterVolumeVocabulary(entries:readonly VolumeVocabularyEntry[], search:string,
  state:VolumeVocabularyState|'all', sort:VolumeVocabularySort):VolumeVocabularyEntry[] {
  const query=search.normalize('NFC').trim().toLocaleLowerCase();
  const page=(e:VolumeVocabularyEntry)=>Math.min(...e.confirmations.map(c=>c.source.pageNumber));
  const date=(e:VolumeVocabularyEntry)=>Math.max(...e.confirmations.map(c=>Date.parse(c.confirmedAt)));
  return entries.filter(e=>(state==='all'||e.classification.state===state)&&
    [e.card.word,e.card.reading,...e.card.glosses.map(g=>g.text),...e.confirmations.map(c=>c.source.fragment)]
      .some(s=>s.normalize('NFC').toLocaleLowerCase().includes(query)))
    .sort((a,b)=>(sort==='page'?page(a)-page(b):date(b)-date(a))||
      a.card.deckId.localeCompare(b.card.deckId)||a.card.id.localeCompare(b.card.id));
}

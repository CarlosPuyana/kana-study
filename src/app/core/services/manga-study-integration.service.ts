import {inject, Injectable} from '@angular/core';
import {DictionaryLookup} from '../models/dictionary.model';
import {MangaStudyMatch} from '../models/manga-study.model';
import {VocabularyEntry} from '../models/vocabulary.model';
import {KANJI_N5} from '../../data/kanji-n5.generated';
import {VOCABULARY_N5} from '../../data/vocabulary-n5.generated';
import {JapaneseAudioService} from './japanese-audio.service';

const normalized=(value:string|undefined)=>value?.normalize('NFC').trim()??'';
const han=/\p{Script=Han}/u;
const readingMatches=(entry:VocabularyEntry,reading:string)=>[entry.primaryReading,...entry.readings].some(r=>normalized(r)===reading);

/** Uses only the existing dictionary's evidence and documented catalog spellings. */
export function matchMangaVocabulary(lookup:DictionaryLookup,catalog:readonly VocabularyEntry[]):VocabularyEntry|undefined {
  const principal=lookup.principal??lookup.terms[0];
  if(!lookup.installed||!principal)return undefined;
  const reading=normalized(lookup.reading||principal.reading);
  const forms=[lookup.baseForm,principal.expression,lookup.matchedQuery,lookup.surface,lookup.query].map(normalized).filter(Boolean);
  const entries=catalog.filter(e=>e.enabled);
  let writtenEvidence=false;
  for(const form of [...new Set(forms)]){
    const primary=entries.filter(e=>normalized(e.primaryWrittenForm)===form);
    const exact=primary.length?primary:entries.filter(e=>e.writtenForms.some(w=>normalized(w)===form));
    if(!exact.length)continue;
    writtenEvidence=true;
    if(exact.length===1)return exact[0];
    const candidates=reading?exact.filter(e=>readingMatches(e,reading)):exact;
    if(candidates.length===1)return candidates[0];
  }
  // A distinct written Kanji expression is not an alias just because it is a homophone.
  if(writtenEvidence||!reading||!forms.includes(reading)||forms.some(form=>han.test(form)))return undefined;
  const candidates=entries.filter(e=>readingMatches(e,reading));
  return candidates.length===1?candidates[0]:undefined;
}

/** Compound alternatives/separators are not a single word to write. */
export function mangaWordCanBeWritten(entry:VocabularyEntry):boolean {
  return /^[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}ー々]+$/u.test(entry.primaryWrittenForm);
}

@Injectable({providedIn:'root'})
export class MangaStudyIntegrationService {
  private readonly audio=inject(JapaneseAudioService);
  match(lookup:DictionaryLookup):MangaStudyMatch {
    const principal=lookup.principal??lookup.terms[0];
    if(!lookup.installed||!principal)return {kanji:[],audioAvailable:false,writingAvailable:false};
    const vocabulary=matchMangaVocabulary(lookup,VOCABULARY_N5);
    const base=normalized(lookup.baseForm);
    const expression=base&&han.test(base)?base:normalized(principal.expression)||base||normalized(lookup.surface||lookup.query);
    const seen=new Set<string>();
    const kanji=[...expression].flatMap(character=>{
      if(seen.has(character))return [];
      seen.add(character);
      const entry=KANJI_N5.find(k=>k.enabled&&k.character===character);
      return entry?[entry]:[];
    });
    return {vocabulary,kanji,audioAvailable:!!vocabulary&&this.audio.hasAudio(vocabulary.id),writingAvailable:!!vocabulary&&mangaWordCanBeWritten(vocabulary)};
  }
}

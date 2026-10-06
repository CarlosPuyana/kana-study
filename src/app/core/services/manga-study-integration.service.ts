import {inject, Injectable} from '@angular/core';
import {MangaStudySavedItem} from '../models/manga-study-saved.model';
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
  snapshot(lookup:DictionaryLookup, source:MangaStudySavedItem['source'], context?:string):MangaStudySavedItem|undefined {
    const principal=lookup.principal??lookup.terms[0];
    if(!lookup.installed||!principal||!source.volumeId)return undefined;
    const match=this.match(lookup);
    const expression=normalized(match.vocabulary?.primaryWrittenForm||principal.expression||lookup.baseForm);
    const reading=normalized(match.vocabulary?.primaryReading||lookup.reading||principal.reading);
    if(!expression)return undefined;
    return {schemaVersion:1,id:match.vocabulary?'vocabulary:'+match.vocabulary.id:'dictionary:'+JSON.stringify([expression,reading]),
      expression,reading:reading||undefined,baseForm:normalized(lookup.baseForm)||undefined,vocabularyId:match.vocabulary?.id,
      kanji:match.kanji.map(k=>k.id),meaning:principal.glossaries[0]?.slice(0,300),surface:(lookup.surface||lookup.query).slice(0,160),
      context:context?.slice(0,1200),source:{...source,volumeTitle:source.volumeTitle?.slice(0,160)},createdAt:Date.now()};
  }
  matchSaved(item:MangaStudySavedItem):MangaStudyMatch {
    const term={id:item.id,dictionaryId:'saved',expression:item.expression,reading:item.reading??'',glossaries:[],definitionTags:'',rules:'',score:0,sequence:0,termTags:''};
    return this.match({query:item.expression,installed:true,terms:[term],principal:term,baseForm:item.baseForm,reading:item.reading},item.vocabularyId);
  }
  match(lookup:DictionaryLookup,preferredVocabularyId?:string):MangaStudyMatch {
    const principal=lookup.principal??lookup.terms[0];
    if(!lookup.installed||!principal)return {kanji:[],audioAvailable:false,writingAvailable:false};
    const vocabulary=preferredVocabularyId?VOCABULARY_N5.find(entry=>entry.enabled && entry.id===preferredVocabularyId):matchMangaVocabulary(lookup,VOCABULARY_N5);
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

import { computed, inject, Injectable, PendingTasks, signal } from '@angular/core';
import {ca,en,es} from '../../../assets/i18n/core.generated';
import { AppLanguage } from '../models/settings.model';
import { SettingsService } from './settings.service';

type Dictionary = Record<string, string>;

const DICTIONARIES: Record<AppLanguage, Dictionary> = { es, en, ca };

@Injectable({ providedIn: 'root' })
export class TranslationService {
  private readonly pending=inject(PendingTasks);
  private readonly studyCopy=signal<Record<AppLanguage,Dictionary>|null>(null);
  useStudyCopy(dictionary:Record<AppLanguage,Dictionary>):void{
    const current=this.studyCopy();
    if(current===dictionary)return;
    this.studyCopy.set(current?{es:{...current.es,...dictionary.es},en:{...current.en,...dictionary.en},ca:{...current.ca,...dictionary.ca}}:dictionary);
  }
  private readonly grammar=signal<Record<AppLanguage,Dictionary>|null>(null);
  private grammarLoading:Promise<void>|null=null;
  private mangaLoading:Promise<void>|null=null;
  /** Reader-only copy loads before /manga or /upload activates, in all three languages. */
  loadManga():Promise<void>{
    if(this.mangaLoading)return this.mangaLoading;
    const done=this.pending.add();
    return this.mangaLoading=(async()=>{
      try{this.useStudyCopy(await import('../../../assets/i18n/manga-reader.generated'));}
      catch(error){this.mangaLoading=null;throw error;}finally{done();}
    })();
  }
  /** Reader bundles these existing course translations for first-use offline reference. */
  useBundledGrammar(dictionary:Record<AppLanguage,Dictionary>):void {
    if(!this.grammar())this.grammar.set(dictionary);
  }
  /** All three languages share one feature chunk; later switches need no network. */
  loadGrammar():Promise<void>{
    if(this.grammar())return Promise.resolve();
    if(this.grammarLoading)return this.grammarLoading;
    const done=this.pending.add();
    return this.grammarLoading=(async()=>{
      try{this.grammar.set(await import('../../../assets/i18n/grammar.generated'));}
      catch(error){this.grammarLoading=null;throw error;}finally{done();}
    })();
  }

  private readonly settingsService = inject(SettingsService);
  readonly language = this.settingsService.language;
  private readonly dictionary = computed(
    () => DICTIONARIES[this.settingsService.language()] ?? DICTIONARIES.es,
  );

  t(key: string, replacements?: Record<string, string | number>): string {
    const grammar=this.grammar();
    let value = this.dictionary()[key] ?? this.studyCopy()?.[this.language()][key] ?? grammar?.[this.language()][key] ?? grammar?.es[key] ?? DICTIONARIES.es[key] ?? key;

    if (replacements) {
      for (const [name, replacement] of Object.entries(replacements)) {
        value = value.replaceAll(`{{${name}}}`, String(replacement));
      }
    }

    return value;
  }
}

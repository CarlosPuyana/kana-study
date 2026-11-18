import { Injectable, signal } from '@angular/core';
import type { AppLanguage } from '../models/settings.model';

/** Local-authoring adapter: TranslationService only needs language(). No study Storage/Auth is instantiated. */
@Injectable()
export class PhraseAuthoringPreferences {
 readonly language=signal<AppLanguage>('es');
 readonly theme=signal<'dark'|'light'>('dark');
 setLanguage(value:AppLanguage):void { this.language.set(value); }
}

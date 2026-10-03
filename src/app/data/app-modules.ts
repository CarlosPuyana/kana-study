import { AppModuleDefinition } from '../core/models/app-module.model';

export const APP_MODULES: readonly AppModuleDefinition[] = [
  { id: 'kana', titleKey: 'more.kana.title', descriptionKey: 'more.kana.description', icon: 'kana', route: '/', available: true, order: 1 },
  { id: 'kanji', titleKey: 'more.kanji.title', descriptionKey: 'more.kanji.description', icon: 'kanji', route: '/kanji', available: true, order: 2 },
  { id: 'vocabulary', titleKey: 'more.vocabulary.title', descriptionKey: 'more.vocabulary.description', icon: 'vocabulary', route: '/vocabulary', available: true, order: 3 },
  { id: 'flags', titleKey: 'more.flags.title', descriptionKey: 'more.flags.description', icon: 'flags', route: '/flags', available: true, order: 4 },
  { id: 'anki', titleKey: 'more.anki.title', descriptionKey: 'more.anki.description', icon: 'anki', route: '/anki', available: true, order: 5 },
  { id: 'grammar', titleKey: 'more.grammar.title', descriptionKey: 'more.grammar.description', icon: 'grammar', route: '/grammar', available: true, order: 6 },
  { id: 'manga', titleKey: 'more.manga.title', descriptionKey: 'more.manga.description', icon: 'manga', route: '/manga', available: true, order: 7 },
  { id: 'extras', titleKey: 'more.extras.title', descriptionKey: 'more.extras.description', icon: 'extras', route: '/extras', available: false, order: 8 },
];

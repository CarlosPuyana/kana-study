import { Routes } from '@angular/router';
import { routes } from './app.routes';
import { APP_MODULES } from './data/app-modules';

describe('lazy feature routes', () => {
  it('keeps Grammar N5 behind lazy routes and enables its module card', async () => {
    const feature=routes.find(route=>route.path==='grammar');
    expect(feature?.component).toBeUndefined();
    const children=await (feature!.loadChildren as ()=>Promise<Routes>)();
    expect(children.map(route=>route.path)).toEqual(['','review','n5/:topicId/practice','n5/:topicId/:lessonId','n5/:topicId','**']);
    expect(children.filter(route=>route.path!=='**').every(route=>route.loadComponent&&!route.component)).toBe(true);
    expect(APP_MODULES.find(module=>module.id==='grammar')).toEqual(expect.objectContaining({route:'/grammar',available:true}));
  });
  it('keeps Flags behind one lazy route with every public child URL', async () => {
    const feature = routes.find(route => route.path === 'flags');
    expect(feature?.component).toBeUndefined();
    expect(feature?.loadChildren).toBeTypeOf('function');
    const children = await (feature!.loadChildren as () => Promise<Routes>)();
    expect(children.map(route => route.path)).toEqual(['', 'selection', 'play', 'countries', 'medals']);
    expect(children.every(route => route.loadComponent && !route.component)).toBe(true);
  });

  it('keeps Kanji behind one lazy route with every public child URL', async () => {
    const feature = routes.find(route => route.path === 'kanji');
    expect(feature?.component).toBeUndefined();
    expect(feature?.loadChildren).toBeTypeOf('function');
    const children = await (feature!.loadChildren as () => Promise<Routes>)();
    expect(children.map(route => route.path)).toEqual(['', 'selection', 'play', 'all', 'medals', 'rush']);
    expect(children.every(route => route.loadComponent && !route.component)).toBe(true);
  });

  it('keeps Vocabulary and its dataset behind lazy child routes', async () => {
    const feature = routes.find(route => route.path === 'vocabulary');
    expect(feature?.component).toBeUndefined();
    const children = await (feature!.loadChildren as () => Promise<Routes>)();
    expect(children.map(route => route.path)).toEqual(['', 'selection', 'play', 'all', 'medals', 'rush', 'writing']);
    expect(children.every(route => route.loadComponent && !route.component)).toBe(true);
  });

  it('keeps Decks behind a lazy route with every visual child page', async () => {
    const feature = routes.find(route => route.path === 'anki');
    expect(feature?.component).toBeUndefined();
    expect(feature?.loadChildren).toBeTypeOf('function');
    const children = await (feature!.loadChildren as () => Promise<Routes>)();
    expect(children.map(route => route.path)).toEqual([
      '', ':deckId/cards', ':deckId/stats', ':deckId/settings', ':deckId/study',
    ]);
    expect(children.every(route => route.loadComponent && !route.component)).toBe(true);
  });

  it('preserves module routes and availability metadata', () => {
    expect(APP_MODULES.find(module => module.id === 'flags')).toEqual(
      expect.objectContaining({ route: '/flags', available: true }),
    );
    expect(APP_MODULES.find(module => module.id === 'kanji')).toEqual(
      expect.objectContaining({ route: '/kanji', available: true }),
    );
    expect(APP_MODULES.find(module => module.id === 'vocabulary')).toEqual(
      expect.objectContaining({ route: '/vocabulary', available: true }),
    );
    expect(APP_MODULES.find(module => module.id === 'anki')).toEqual(
      expect.objectContaining({ route: '/anki', available: true }),
    );
  });
});

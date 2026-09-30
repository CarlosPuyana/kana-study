import { describe,expect,it } from 'vitest';
import { routes } from './app.routes';
import { KANJI_ROUTES } from './features/kanji/kanji.routes';
import { VOCABULARY_ROUTES } from './features/vocabulary/vocabulary.routes';
describe('RUSH routes',()=>{it('exposes direct lazy routes for all modules and medals',()=>{expect(routes.some(route=>route.path==='rush'&&route.loadComponent)).toBe(true);expect(routes.some(route=>route.path==='rush/medals'&&route.loadComponent)).toBe(true);expect(KANJI_ROUTES.some(route=>route.path==='rush'&&route.loadComponent)).toBe(true);expect(VOCABULARY_ROUTES.some(route=>route.path==='rush'&&route.loadComponent)).toBe(true)})});

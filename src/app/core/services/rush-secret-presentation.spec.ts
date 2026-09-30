import { describe,expect,it } from 'vitest';
import { presentMedal } from './medal-rules';
import { evaluateRushMedals } from './rush-medal-rules';
describe('RUSH secret presentation',()=>{it('hides name, condition, and progress while locked',()=>{const state=evaluateRushMedals({sessions:[],coverage:[]},[]).find(item=>item.definition.id==='rush-secret-marathon')!;const display=presentMedal(state);expect(display.titleKey).toBe('medals.secretTitle');expect(display.descriptionKey).toBe('medals.secretDescription');expect(display.progress).toBeNull()})});

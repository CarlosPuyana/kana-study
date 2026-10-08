import { rushLocalDay } from './rush-time';
describe('RUSH local calendar',()=>{it('uses the local calendar date',()=>{expect(rushLocalDay(new Date(2026,8,30,23,30))).toBe('2026-09-30');});});

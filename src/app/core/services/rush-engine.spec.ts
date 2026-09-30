import { describe,expect,it } from 'vitest';
import { RushUnit } from '../models/rush.model';
import { createRushBag,RushEngine } from './rush-engine';
const unit=(key:string,contentId=key):RushUnit=>({key,module:'kana',contentId,questionType:key});
describe('RushEngine',()=>{
  it('returns every unit exactly once before the next cycle',()=>{const units=[unit('a'),unit('b'),unit('c')];const engine=new RushEngine(units,()=>.4);const seen=[];for(let i=0;i<3;i++)seen.push(engine.completeCurrent().unit.key);expect(new Set(seen)).toEqual(new Set(['a','b','c']));expect(engine.cyclesCompleted).toBe(1);expect(units.map(item=>item.key)).toContain(engine.current.key)});
  it('avoids adjacent equal content when an alternative exists',()=>{const bag=createRushBag([unit('a1','a'),unit('a2','a'),unit('b','b'),unit('c','c')],null,()=>0);for(let i=1;i<bag.length;i++)expect(bag[i].contentId).not.toBe(bag[i-1].contentId)});
  it('repairs several adjacent duplicates without losing units',()=>{const source=[unit('a1','a'),unit('a2','a'),unit('a3','a'),unit('b','b'),unit('c','c')];const bag=createRushBag(source,null,()=>.99);expect(new Set(bag.map(item=>item.key))).toEqual(new Set(source.map(item=>item.key)));for(let i=1;i<bag.length;i++)expect(bag[i].contentId).not.toBe(bag[i-1].contentId)});
  it('avoids repeating content across bags',()=>{const engine=new RushEngine([unit('a','a'),unit('b','b')],()=>0);const last=engine.completeCurrent().unit;const end=engine.completeCurrent().unit;expect(engine.current.contentId).not.toBe(end.contentId);expect(last.key).not.toBe(end.key)});
  it('keeps working when only one content exists',()=>{const engine=new RushEngine([unit('a1','a'),unit('a2','a')],()=>0);for(let i=0;i<5;i++)expect(engine.completeCurrent().unit.contentId).toBe('a');expect(engine.cyclesCompleted).toBe(2)});
});

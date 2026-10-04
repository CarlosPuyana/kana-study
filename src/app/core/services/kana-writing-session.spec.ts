import { ALL_KANA } from '../../data/kana';
import { KanaWritingSession, writingPool } from './kana-writing-session';

describe('Kana writing practice',()=>{
  it('uses existing script and variant metadata',()=>{
    const pool=writingPool(ALL_KANA,{type:'katakana',variants:['dakuten','combination'],guide:false});
    expect(pool.length).toBeGreaterThan(0);expect(pool.every(k=>k.type==='katakana'&&['dakuten','combination'].includes(k.variant))).toBe(true);
    expect(writingPool(ALL_KANA,{type:'both',variants:[],guide:true})).toEqual([]);
  });
  it('includes both scripts when selected',()=>{
    const pool=writingPool(ALL_KANA,{type:'both',variants:['basic'],guide:true});
    expect(new Set(pool.map(k=>k.type)).size).toBe(2);
  });
  it('shuffles and visits every initial kana once without modifying source data',()=>{
    const pool=ALL_KANA.slice(0,5),session=new KanaWritingSession(pool,()=>0),seen:string[]=[];
    while(session.current){seen.push(session.current.id);session.answer(true);}
    expect(new Set(seen).size).toBe(5);expect(seen).not.toEqual(pool.map(k=>k.id));expect(session.resolved).toBe(5);expect(session.total).toBe(5);
  });
  it('queues Repeat after remaining kana and counts only Correct as resolved',()=>{
    const session=new KanaWritingSession(ALL_KANA.slice(0,3));const first=session.current!.id;
    session.answer(false);expect(session.current!.id).not.toBe(first);expect(session.resolved).toBe(0);
    session.answer(true);session.answer(true);expect(session.current!.id).toBe(first);
    session.answer(true);expect(session.current).toBeNull();expect(session.resolved).toBe(session.total);
  });
  it('allows repeating the last remaining kana and deduplicates input IDs',()=>{
    const session=new KanaWritingSession([ALL_KANA[0],ALL_KANA[0]]);session.answer(false);
    expect(session.total).toBe(1);expect(session.current?.id).toBe(ALL_KANA[0].id);session.answer(true);session.answer(true);expect(session.resolved).toBe(1);
  });
});

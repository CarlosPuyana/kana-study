import { LexicalCoverageAnalysis, LexicalKnowledgeSnapshot } from '../models/lexical-knowledge.model';
import { classifyLexicalCard, projectLexicalKnowledge } from './lexical-knowledge';
import { calculateLexicalCoverage } from './lexical-coverage';
import { lexicalCard, provenIdentity, verification } from './lexical-knowledge.fixture';

describe('Lexical knowledge: effective independent memory and demonstrated identities',()=>{
  it.each([[0,20,'pending'],[1,20,'learning'],[2,13.999,'learning'],[2,14,'known'],[2,20,'known'],[3,20,'learning']] as const)
  ('classifies state %s stability %s as %s',(state,stability,expected)=>{
    expect(classifyLexicalCard(lexicalCard('key',state,stability)).state).toBe(expected);
  });
  it('a missing New snapshot without history remains pending',()=>{
    expect(classifyLexicalCard(lexicalCard('key',null)).state).toBe('pending');
  });
  it('matches the FSRS scheduling instant when the user rates after revealing the answer',()=>{
    const c=lexicalCard('key'),event={...c.events[0],reviewedAt:c.events[0].reviewedAt+2500};
    expect(classifyLexicalCard({...c,events:[event]}).state).toBe('known');
    expect(classifyLexicalCard({...c,events:[{...event,fsrsLog:{...event.fsrsLog,review:event.fsrsLog.review+1}}]}).state).toBe('indeterminate');
    expect(classifyLexicalCard({...c,events:[{...event,reviewedAt:event.fsrsLog.review-1}]}).state).toBe('indeterminate');
  });
  it('due dates do not downgrade mature Review',()=>{
    const c=lexicalCard('key'),p=c.progress!;
    expect(classifyLexicalCard({...c,progress:{...p,due:1,card:{...p.card,due:1}},events:[{...c.events[0],dueAfter:1}]}).state).toBe('known');
  });
  it.each([NaN,Infinity,-1])('invalid stability %s is indeterminate',stability=>{
    expect(classifyLexicalCard(lexicalCard('key',2,stability)).state).toBe('indeterminate');
  });
  it('requires a coherent effective head, not a snapshot or a New state alone',()=>{
    const c=lexicalCard('key');
    expect(classifyLexicalCard({...c,events:[]}).state).toBe('indeterminate');
    expect(classifyLexicalCard({...c,events:[null as unknown as (typeof c.events)[number]]}).state).toBe('indeterminate');
    expect(classifyLexicalCard({...c,events:[{...c.events[0],stabilityAfter:1}]}).state).toBe('indeterminate');
    expect(classifyLexicalCard({...c,events:[{...c.events[0],dueBefore:1}]}).state).toBe('indeterminate');
    expect(classifyLexicalCard({...c,events:[c.events[0],{...c.events[0],id:'other-head'}]}).state).toBe('indeterminate');
    expect(classifyLexicalCard({...lexicalCard('key',0),events:c.events}).state).toBe('indeterminate');
  });
  it('residual effective history without a snapshot proves learning, never invented stability',()=>{
    const c=lexicalCard('key');const result=classifyLexicalCard({...c,progress:null});
    expect(result.state).toBe('learning');expect(result.stability).toBeNull();
  });
  it('verified equivalence aggregates mature + Learning without merging or mutating memory',async()=>{
    const a=await provenIdentity(),b=await provenIdentity('2');
    const cards=[lexicalCard(a.identity.key,2,20,'builtin'),lexicalCard(b.identity.key,1,1)];
    const before=structuredClone(cards),edge={id:'verified-link',left:a.identity.key,right:b.identity.key,evidence:verification,revoked:false};
    const units=projectLexicalKnowledge([a,b],cards,[edge],true);
    expect(units.map(u=>u.state)).toEqual(['known','known']);expect(units[0].cards).toHaveLength(2);
    expect(units[0].equivalenceIds).toEqual(['verified-link']);expect(cards).toEqual(before);
    expect(projectLexicalKnowledge([a,b],cards,[{...edge,revoked:true}],true).find(u=>u.identityKey===b.identity.key)?.state).toBe('learning');
  });
  it('homophones, homographs and matching glosses do not link identities',async()=>{
    const a=await provenIdentity('1','橋','はし'),b=await provenIdentity('2','箸','はし'),c=await provenIdentity('3','生','せい'),d=await provenIdentity('4','生','なま');
    const units=projectLexicalKnowledge([a,b,c,d],[lexicalCard(a.identity.key)],[],true);
    expect(units.find(u=>u.identityKey===a.identity.key)?.state).toBe('known');
    expect(units.filter(u=>u.state==='unknown')).toHaveLength(3);
  });
  it('partial inventory forbids unknown; archived evidence counts and invalid data does not become pending',async()=>{
    const a=await provenIdentity();expect(projectLexicalKnowledge([a],[],[],false)[0].state).toBe('indeterminate');
    const archived={...lexicalCard(a.identity.key),archived:true};
    expect(projectLexicalKnowledge([a],[archived],[],false)[0].cards[0].archived).toBe(true);
    expect(projectLexicalKnowledge([a],[archived],[],false)[0].state).toBe('known');
    expect(projectLexicalKnowledge([a],[{...archived,readable:false}],[],true)[0].state).toBe('indeterminate');
  });
  it('undo of the last introduction returns pending; removing the last mature evidence can return learning',async()=>{
    const a=await provenIdentity(),mature=lexicalCard(a.identity.key),young=lexicalCard(a.identity.key,1,1,'md-b','b');
    expect(projectLexicalKnowledge([a],[mature,young],[],true)[0].state).toBe('known');
    expect(projectLexicalKnowledge([a],[young],[],true)[0].state).toBe('learning');
    expect(projectLexicalKnowledge([a],[lexicalCard(a.identity.key,null)],[],true)[0].state).toBe('pending');
  });
});

describe('Verified resolved-subset coverage: types, appearances and hypotheses',()=>{
  async function fixture(){
    const identities=await Promise.all(['1','2','3','4'].map(id=>provenIdentity(id)));
    const keys=identities.map(i=>i.identity.key);
    const snapshot:LexicalKnowledgeSnapshot={workspace:'guest',cacheKey:'test',manifestRevision:'fixture',inventoryComplete:true,unmappedCards:0,issues:[],
      units:projectLexicalKnowledge(identities,[lexicalCard(keys[0]),lexicalCard(keys[1],1,1),lexicalCard(keys[2],null)],[],true)};
    const analysis:LexicalCoverageAnalysis={version:'fixture',completeVolume:true,segmentation:'non-overlapping-verified',unresolvedSpans:0,excludedSpans:0,
      occurrences:[keys[0],keys[0],keys[1],keys[2],keys[3]].map((identityKey,i)=>({id:String(i),page:1,block:0,start:i*2,end:i*2+1,identityKey}))};
    return {keys,snapshot,analysis};
  }
  it('separates type/appearance denominators, strict/familiarity and hypothetical results',async()=>{
    const {keys,snapshot,analysis}=await fixture(),before=structuredClone(snapshot);
    const c=calculateLexicalCoverage(analysis,snapshot,[keys[2]]);
    expect(c.types).toMatchObject({resolved:4,known:1,learning:1,pending:1,unknown:1,strict:.25,familiarity:.5,hypotheticalStrict:.5});
    expect(c.occurrences).toMatchObject({resolved:5,known:2,strict:.4,familiarity:.6,hypotheticalStrict:.6});
    expect(c.fullVolumeCalculable).toBe(true);expect(snapshot).toEqual(before);
    expect(calculateLexicalCoverage(analysis,snapshot).types.strict).toBe(.25);
  });
  it('zero denominator is no data and unresolved/excluded OCR is never unknown',async()=>{
    const {snapshot,analysis}=await fixture();
    const c=calculateLexicalCoverage({...analysis,completeVolume:false,unresolvedSpans:3,excludedSpans:2,
      occurrences:[{id:'x',page:1,block:0,start:0,end:1,identityKey:null}]},snapshot);
    expect(c.types.strict).toBeNull();expect(c.occurrences.familiarity).toBeNull();expect(c.occurrences.unknown).toBe(0);
    expect(c.unlinkedOccurrences).toBe(1);expect(c.unresolvedSpans).toBe(3);expect(c.excludedSpans).toBe(2);expect(c.fullVolumeCalculable).toBe(false);
    expect(c.types.unlinked).toBeNull();expect(c.occurrences.unlinked).toBe(1);
  });
  it('overlapping compounds/subwords, duplicate occurrence IDs and unspecified segmentation block metrics',async()=>{
    const {snapshot,analysis}=await fixture();
    expect(calculateLexicalCoverage({...analysis,segmentation:'unresolved'},snapshot).status).toBe('invalid-segmentation');
    expect(calculateLexicalCoverage({...analysis,occurrences:[analysis.occurrences[0],{...analysis.occurrences[1],start:0}]},snapshot).types.strict).toBeNull();
    expect(calculateLexicalCoverage({...analysis,occurrences:[analysis.occurrences[0],{...analysis.occurrences[1],id:'0'}]},snapshot).status).toBe('invalid-segmentation');
  });
  it('equivalent aliases count once by type, not once per deck or identity',async()=>{
    const {snapshot,analysis,keys}=await fixture();
    const first=snapshot.units.find(u=>u.identityKey===keys[0])!,alias={...snapshot.units.find(u=>u.identityKey===keys[1])!,state:first.state,groupKey:first.groupKey};
    const c=calculateLexicalCoverage({...analysis,occurrences:analysis.occurrences.filter(o=>o.identityKey===keys[0]||o.identityKey===keys[1])},
      {...snapshot,units:[first,alias,...snapshot.units.filter(u=>u.identityKey!==keys[0]&&u.identityKey!==keys[1])]});
    expect(c.types.resolved).toBe(1);expect(c.occurrences.resolved).toBe(3);
  });
  it('pending creation never increases real coverage, incomplete inventories are labelled',async()=>{
    const {snapshot,analysis,keys}=await fixture();
    const c=calculateLexicalCoverage(analysis,{...snapshot,inventoryComplete:false},[keys[3]]);
    expect(c.types.strict).toBe(.25);expect(c.fullVolumeCalculable).toBe(false);
  });
});

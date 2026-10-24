import { LexicalCoverage, LexicalCoverageAnalysis, LexicalCoverageCounts, LexicalKnowledge, LexicalKnowledgeSnapshot } from '../models/lexical-knowledge.model';

/** Ratios describe demonstrated lexical units only. They are never reading comprehension. */
export function calculateLexicalCoverage(analysis:LexicalCoverageAnalysis, snapshot:LexicalKnowledgeSnapshot,
  hypotheticalLearned:readonly string[]=[]):LexicalCoverage {
  const byKey=new Map(snapshot.units.map(u=>[u.identityKey,u]));
  const hypotheticalGroups=new Set(hypotheticalLearned.flatMap(k=>byKey.get(k)?.groupKey?[byKey.get(k)!.groupKey!]:[]));
  const ids=new Set<string>(), spans=new Map<string,number>();
  const ordered=[...analysis.occurrences].sort((a,b)=>a.page-b.page||a.block-b.block||a.start-b.start||a.end-b.end);
  let valid=analysis.segmentation==='non-overlapping-verified'&&Number.isSafeInteger(analysis.unresolvedSpans)&&analysis.unresolvedSpans>=0&&
    Number.isSafeInteger(analysis.excludedSpans)&&analysis.excludedSpans>=0;
  for(const o of ordered){
    const block=JSON.stringify([o.page,o.block]);
    if(!o.id||ids.has(o.id)||![o.page,o.block,o.start,o.end].every(Number.isSafeInteger)||o.page<1||o.block<0||o.start<0||o.end<=o.start||
      o.start<(spans.get(block)??0))valid=false;
    ids.add(o.id);spans.set(block,o.end);
  }
  const empty=():LexicalCoverageCounts=>({resolved:0,known:0,learning:0,pending:0,unknown:0,unlinked:0,indeterminate:0,
    strict:null,familiarity:null,hypotheticalStrict:null});
  if(!valid)return {status:'invalid-segmentation',fullVolumeCalculable:false,knowledgeComplete:false,types:empty(),occurrences:empty(),
    unlinkedOccurrences:0,unresolvedSpans:analysis.unresolvedSpans,excludedSpans:analysis.excludedSpans};
  const occurrences:LexicalKnowledge[]=[],types=new Map<string,LexicalKnowledge>();let unlinked=0;
  for(const o of ordered){
    const unit=o.identityKey?byKey.get(o.identityKey):undefined;
    if(!unit||!unit.groupKey){unlinked++;continue;}
    occurrences.push(unit);types.set(unit.groupKey,unit);
  }
  const count=(rows:readonly LexicalKnowledge[]):LexicalCoverageCounts=>{
    const c=empty();const values={...c,resolved:rows.length};let projected=0;
    for(const row of rows){
      if(row.state==='unlinked')values.unlinked=(values.unlinked??0)+1;else values[row.state]++;
      if(row.state==='known'||hypotheticalGroups.has(row.groupKey!))projected++;
    }
    return {...values,strict:rows.length?values.known/rows.length:null,
      familiarity:rows.length?(values.known+values.learning)/rows.length:null,
      hypotheticalStrict:rows.length?projected/rows.length:null};
  };
  const typeCounts={...count([...types.values()]),unlinked:unlinked?null:0},occurrenceCounts={...count(occurrences),unlinked};
  const knowledgeComplete=snapshot.inventoryComplete&&occurrenceCounts.indeterminate===0;
  return {status:'resolved-subset',fullVolumeCalculable:analysis.completeVolume&&snapshot.inventoryComplete&&
    analysis.unresolvedSpans===0&&analysis.excludedSpans===0&&unlinked===0&&occurrenceCounts.indeterminate===0,
    knowledgeComplete,types:typeCounts,occurrences:occurrenceCounts,unlinkedOccurrences:unlinked,
    unresolvedSpans:analysis.unresolvedSpans,excludedSpans:analysis.excludedSpans};
}

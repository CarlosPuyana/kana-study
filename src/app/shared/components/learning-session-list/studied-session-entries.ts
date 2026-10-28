import type { SessionItem } from '../../../core/models/learning-session.model';

interface FinishedSession<Unit> {
  readonly completedAt: string | null;
  readonly units: readonly Unit[];
  readonly items: readonly SessionItem[];
}

/**
 * These two session engines seed the queue in units order and only insert repeats.
 * Filtering by appearances therefore preserves first presentation order without
 * claiming to reconstruct individual attempt timestamps or exposing planned targets.
 */
export function studiedSessionEntries<Unit extends {readonly key:string}, Entry extends {readonly id:string}>(
  session:FinishedSession<Unit>|null, catalog:readonly Entry[], id:(unit:Unit)=>string,
):readonly Entry[] {
  if(!session?.completedAt)return [];
  const presented=new Set(session.items.filter(item=>item.appearances>0).map(item=>item.studyKey));
  const byId=new Map(catalog.map(entry=>[entry.id,entry]));
  const seen=new Set<string>(),entries:Entry[]=[];
  for(const unit of session.units){
    const entryId=id(unit),entry=byId.get(entryId);
    if(presented.has(unit.key)&&entry&&!seen.has(entryId)){seen.add(entryId);entries.push(entry);}
  }
  return entries;
}

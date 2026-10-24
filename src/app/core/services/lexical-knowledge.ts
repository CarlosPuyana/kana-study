import { State } from 'ts-fsrs';
import { LexicalCardClassification, LexicalCardEvidence, LexicalKnowledge, ProvenLexicalIdentity, VerifiedLexicalEquivalence } from '../models/lexical-knowledge.model';
import { eventValid, progressValid } from './custom-deck-validation';

/** Validate current memory against effective history; never derive stability from residual events. */
export function classifyLexicalCard(card: LexicalCardEvidence): LexicalCardClassification {
  const result = (state: LexicalCardClassification['state'], reasons: readonly string[] = [], stability: number|null = null): LexicalCardClassification =>
    ({deckId:card.deckId,cardId:card.cardId,archived:card.archived,state,eventIds:card.events.flatMap(e=>typeof e?.id==='string'?[e.id]:[]),stability,reasons});
  const events = card.events;
  if (!card.readable || events.some(e => !eventValid(e) || e.deckId !== card.deckId || e.entryId !== card.cardId) ||
    new Set(events.map(e=>e.id)).size !== events.length) return result('indeterminate',['invalid-history']);
  const p = card.progress;
  if (!p) return events.length ? result('learning',['missing-snapshot']) : result('pending');
  if (!progressValid(p) || p.deckId !== card.deckId || p.entryId !== card.cardId) return result('indeterminate',['invalid-snapshot']);
  if (p.state === State.New) return p.card.reps === 0 && p.card.lastReview === null && !events.length
    ? result('pending') : result('indeterminate',['new-with-history']);
  if (!p.card.reps || p.card.lastReview === null || !Number.isFinite(p.card.lastReview) || p.card.lastReview < 0 ||
    p.card.lapses > p.card.reps) return result('indeterminate',['invalid-memory-history']);
  const lastTime = Math.max(...events.map(e=>e.reviewedAt));
  const latest = events.filter(e=>e.reviewedAt === lastTime);
  if (latest.length !== 1) return result('indeterminate',['missing-or-ambiguous-head']);
  const head = latest[0];
  // Scheduling happens when the answer is revealed; reviewedAt records the later rating.
  // The immutable FSRS log, rather than the button timestamp, anchors the snapshot.
  if(head.fsrsLog.review!==p.card.lastReview || head.fsrsLog.review>head.reviewedAt)
    return result('indeterminate',['missing-or-ambiguous-head']);
  const before = head.cardBefore;
  if (before ? head.stateBefore !== before.state || head.dueBefore !== before.due ||
    head.stabilityBefore !== before.stability || head.difficultyBefore !== before.difficulty ||
    (before.lastReview !== null && before.lastReview > head.fsrsLog.review) : head.stateBefore !== State.New)
    return result('indeterminate',['inconsistent-head-origin']);
  if (head.stateAfter !== p.state || head.dueAfter !== p.due || head.stabilityAfter !== p.card.stability ||
    head.difficultyAfter !== p.card.difficulty ||
    (head.cardBefore?.reps ?? 0)+1 !== p.card.reps) return result('indeterminate',['snapshot-head-mismatch']);
  return result(p.state === State.Review && p.card.stability >= 14 ? 'known' : 'learning',[],p.card.stability);
}

/** Only demonstrated, active edges participate. No string matching or historical rekeying. */
export function projectLexicalKnowledge(identities: readonly ProvenLexicalIdentity[], cards: readonly LexicalCardEvidence[],
  equivalences: readonly VerifiedLexicalEquivalence[], inventoryComplete: boolean): readonly LexicalKnowledge[] {
  const nodes = new Map(identities.map(i=>[i.identity.key,i]));
  const adjacency = new Map([...nodes.keys()].map(k=>[k,new Set<string>()]));
  for (const edge of equivalences) if (!edge.revoked && nodes.has(edge.left) && nodes.has(edge.right)) {
    adjacency.get(edge.left)!.add(edge.right); adjacency.get(edge.right)!.add(edge.left);
  }
  const visited = new Set<string>(), output: LexicalKnowledge[] = [];
  for (const key of [...nodes.keys()].sort()) {
    if (visited.has(key)) continue;
    const group = new Set<string>(), todo=[key];
    while (todo.length) { const next=todo.pop()!; if(group.has(next))continue; group.add(next); visited.add(next); todo.push(...adjacency.get(next)!); }
    const evidence = cards.filter(c=>group.has(c.identityKey)).map(classifyLexicalCard);
    const state = evidence.some(c=>c.state==='known') ? 'known' : evidence.some(c=>c.state==='learning') ? 'learning' :
      evidence.some(c=>c.state==='indeterminate') ? 'indeterminate' : evidence.length ? 'pending' : inventoryComplete ? 'unknown' : 'indeterminate';
    const members=[...group].sort().map(k=>nodes.get(k)!);
    const links=equivalences.filter(e=>!e.revoked&&group.has(e.left)&&group.has(e.right)).map(e=>e.id).sort();
    for (const member of members) output.push({state,identityKey:member.identity.key,groupKey:members[0].identity.key,
      identities:members,equivalenceIds:links,cards:evidence,inventoryComplete,
      reasons:inventoryComplete?[]:['incomplete-inventory']});
  }
  return output;
}

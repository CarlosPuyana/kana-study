import { computed, inject, Injectable, InjectionToken, Signal, signal } from '@angular/core';
import { LexicalEvidenceManifest, LexicalVerification } from '../models/lexical-knowledge.model';
import { canonical, lexicalIdentity, requireValid, text } from './custom-deck-validation';

/** No real lexical links have been certified. In particular this does not map 1500 entries. */
export const LEXICAL_EVIDENCE_MANIFEST = new InjectionToken<Signal<LexicalEvidenceManifest>>('reviewed lexical evidence', {
  providedIn: 'root', factory: () => signal<LexicalEvidenceManifest>({schemaVersion:1,revision:'h3a-unmapped-1',identities:[],mappings:[],equivalences:[]}).asReadonly(),
});
const proofValid = (p: LexicalVerification) => !!p &&
  [p.source,p.version,p.reference,p.restrictions,p.review].every(s => text(s,8192)) && /^[a-f0-9]{64}$/u.test(p.sha256);
@Injectable({providedIn:'root'})
export class LexicalEvidenceService {
  private readonly manifest = inject(LEXICAL_EVIDENCE_MANIFEST);
  readonly revision = computed(() => this.manifest().revision);
  /** A manifest is shipped/reviewed code, not user-importable JSON or a claim of expert review. */
  async load(): Promise<LexicalEvidenceManifest> {
    const m = structuredClone(this.manifest());
    requireValid(m.schemaVersion === 1 && text(m.revision,256));
    const keys = new Set<string>();
    for (const row of m.identities) {
      const i = row.identity;
      requireValid(i.schemaVersion === 1 && i.spellings.length > 0 && i.spellings.every(s => text(s,1024)) &&
        text(i.evidenceVersion,256) && proofValid(row.evidence) && !keys.has(i.key));
      requireValid(canonical(i) === canonical(await lexicalIdentity(i.anchor,i.spellings,i.evidenceVersion)));
      keys.add(i.key);
    }
    const mappings = new Set<string>();
    for (const row of m.mappings) {
      const id = canonical([row.deckId,row.entryId]);
      requireValid(text(row.deckId,256) && text(row.entryId,256) && keys.has(row.identityKey) &&
        /^entry-[a-f0-9]{64}$/u.test(row.contentDigest) && proofValid(row.evidence) &&
        typeof row.revoked === 'boolean' && !mappings.has(id));
      mappings.add(id);
    }
    const links = new Set<string>();
    for (const row of m.equivalences) {
      requireValid(text(row.id,256) && !links.has(row.id) && row.left !== row.right &&
        keys.has(row.left) && keys.has(row.right) && proofValid(row.evidence) && typeof row.revoked === 'boolean');
      links.add(row.id);
    }
    return m;
  }
}

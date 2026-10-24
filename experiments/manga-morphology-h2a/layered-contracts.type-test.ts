import type { LexicalIdentity } from '../../src/app/core/models/deck-catalog.model';
import type { LexicalReference, CardEligibility, SenseResolution } from './layered-contracts';

declare const provisional: Extract<LexicalReference, {kind: 'provisional'}>;
declare const documented: SenseResolution;
// Negative type checks prove that proposal/meaning/automatic acceptance are separate.
// @ts-expect-error A revision-bound proposal is not a verified H1 identity.
const identity: LexicalIdentity = provisional;
// @ts-expect-error Contextual interpretation remains explicitly uncertified.
const senseCertified: true = documented.contextualInterpretationCertified;
// @ts-expect-error Nothing in this experiment authorizes automatic acceptance.
const accepted: CardEligibility['automaticAcceptance'] = true;
void identity; void senseCertified; void accepted;

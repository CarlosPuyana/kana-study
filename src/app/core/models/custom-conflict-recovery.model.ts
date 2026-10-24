import {CustomRemoteOperation} from './custom-deck-sync.model';
import {CustomRemoteStoredReceipt} from './custom-deck-sync.model';
import {CustomDeckCard} from './deck-catalog.model';
import {DeckReviewEvent,DeckCardProgress} from './deck-study.model';
export interface CustomRemoteConflictEvidence {user_id:string;operation_id:string;reason:string;evidence:CustomRemoteOperation;}
export interface RecoveredCustomConflict {
 operation:CustomRemoteOperation;receipt:CustomRemoteStoredReceipt;reason:string;
 provenance:CustomDeckCard;deleted:boolean;events:readonly DeckReviewEvent[];
 ancestors:readonly DeckReviewEvent[];canonicalProgress:DeckCardProgress|null;canonicalHead:string|null;missingParents:readonly string[];resolutions:readonly CustomRemoteStoredReceipt[];
 /** Exact submitted proposal, never an accepted/replayed FSRS branch. Unsent tail is unknowable. */
 provenanceScope:'current-or-tombstoned-confirmed-card';applied:false;localTail:'unknown';
}
export interface CustomConflictRecovery {owner:string;coverage:'observed-submitted-operations';consistentSnapshot:false;conflicts:readonly RecoveredCustomConflict[];}

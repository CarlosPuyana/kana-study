import {CustomImportStep,CustomImportLimit} from '../models/custom-guest-import.model';
import {CustomRemoteOperation} from '../models/custom-deck-sync.model';
import {customSyncJsonBytes,CUSTOM_SYNC_REQUEST_BYTES} from './custom-deck-sync-contract';
export class CustomImportLimitError extends Error {
 constructor(readonly limit:CustomImportLimit){super('Custom import exceeds a supported protocol limit');}
}
export function assertCustomImportSize(operation:CustomRemoteOperation,index:number,kind:CustomImportStep['kind']):void{
 const bytes=customSyncJsonBytes(operation),changes=operation.changes.length;
 if(changes>64||bytes>CUSTOM_SYNC_REQUEST_BYTES)throw new CustomImportLimitError({step:index+1,kind,changes,bytes,reason:changes>64?'changes':'bytes'});
}

import {inject,Injectable} from '@angular/core';
import {CustomDeckRepository} from './custom-deck.repository';
import {guestFingerprint,guestHasData} from './custom-guest-import-helpers';
/** Loaded only after all development gates allow the explicit account workflow. */
@Injectable({providedIn:'root'})
export class CustomGuestWorkspaceMigration {
 private readonly custom=inject(CustomDeckRepository);
 async hasGuestData(){return guestHasData(await this.custom.guestInventory());}
 async complete(userId:string){
  const fingerprint=await guestFingerprint(await this.custom.guestInventory()),snapshot=await this.custom.syncSnapshot(`user:${userId}`),state=snapshot.state;
  return !Object.keys(state.conflicts).length&&snapshot.journal.every(o=>state.suppressed?.[o.id]||state.prepared[o.id]?.receipt?.status==='accepted')&&Object.values(state.imports??{}).some(p=>p.status==='complete'&&p.published&&!p.sourceChanged&&p.fingerprint===fingerprint);
 }
}
